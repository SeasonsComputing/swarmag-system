/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Field Binder source                                                          ║
║ Published inventory over an independently bound existing Uploads pair.       ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Consumes Uploads for capture, placement, access and delivery. This service owns
only Binder metadata and publication ordering. Save verifies its referenced
file before publishing; unrelated aggregate delivery failures do not invalidate
that verification. References, not directory presence, define membership.
Known stale edits fail; no CAS, transaction engine, or durable draft is added.
Cleanup failure is observable without undoing a confirmed publication, and
superseded source files remain available to preparations already in progress.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
FieldBinderSource        Source operations over injected Uploads/inbox/server.
├ constructor            Bind the independent upload pair.
├ read                   Capture the latest publication or report no inventory.
├ stage                  Capture using existing AttachmentFormats policy.
├ discard                Delegate staging discard to Uploads.
├ save                   Place/deliver a file and publish one entry.
├ remove                 Publish removal without reclaiming source files.
├ link                   Open a published source file.
└ warning                Reactive copy of post-publication cleanup failures.
*/

import type { Uploads } from '@core/cli/docstore-uploads.ts'
import { notValid } from '@core/std'
import type { Id } from '@core/std'
import { ApiError, DocumentAddresses } from '@core/stdx'
import type {
  ApiDocumentStoreContract,
  BucketId,
  DocumentId,
  DocumentLink,
  NodeMetadata
} from '@core/stdx'
import { createSignal } from '@solid-js'
import { AttachmentFormats } from './attachment-formats.ts'
import { FieldBinderMetadata } from './field-binder-inventory.ts'
import type {
  FieldBinderEntry,
  FieldBinderInventory,
  FieldBinderPublication
} from './field-binder-inventory.ts'

/** Binder source metadata; Uploads supplies all chosen-file lifecycle mechanics. */
export class FieldBinderSource {
  readonly #uploads: Uploads
  readonly #inbox: ApiDocumentStoreContract
  readonly #server: ApiDocumentStoreContract
  readonly #warning = createSignal<string | undefined>()

  constructor(uploads: Uploads, inbox: ApiDocumentStoreContract, server: ApiDocumentStoreContract) {
    this.#uploads = uploads
    this.#inbox = inbox
    this.#server = server
  }

  /** Select by metadata time/UUID and capture bytes before returning a publication. */
  async read(): Promise<FieldBinderPublication | undefined> {
    let bucket: NodeMetadata<BucketId>
    try {
      bucket = await this.#server.bucket.resolve(FieldBinderMetadata.collection())
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return undefined
      throw error
    }
    const candidates = await this.#server.document.find(
      bucket.id,
      FieldBinderMetadata.catalog.inventoryName
    )
    const document = [...candidates].sort(FieldBinderMetadata.compare).at(-1)
    if (document === undefined) return undefined
    const body = await this.#server.document.read(document.id)
    const inventory = FieldBinderMetadata.readInventory(
      FieldBinderMetadata.readJson(await body.text(), 'inventory')
    )
    return { document, inventory, body }
  }

  /** Preserve existing format handling; Binder reserves dot-prefixed metadata names. */
  async stage(file: File): Promise<NodeMetadata<DocumentId>> {
    if (file.name.startsWith('.')) {
      notValid('Names beginning with a dot are reserved for Binder metadata.')
    }
    const { contentType } = AttachmentFormats.recognize(file)
    return await this.#uploads.stage(
      new File([file], file.name, {
        type: contentType,
        lastModified: file.lastModified
      })
    )
  }

  /** The editor decides whether its staged files are still safe to discard. */
  async discard(documents: readonly DocumentId[]): Promise<void> {
    await this.#uploads.discard(documents)
  }

  /** Confirm delivery, then publish one stable entry identity against the editor baseline. */
  async save(
    input: FieldBinderEntry,
    baseline?: string
  ): Promise<{ entry: FieldBinderEntry; publication: FieldBinderPublication }> {
    this.#warning[1](undefined)
    const entry = FieldBinderMetadata.readEntry(input)
    let document = DocumentAddresses.id(entry.documentAddress)
    if (this.#uploads.isStaged(document)) {
      const namespace = await this.#inbox.namespace.create(
        FieldBinderMetadata.catalog.namespace.name,
        FieldBinderMetadata.catalog.namespace.id
      )
      const bucket = await this.#inbox.bucket.create(
        namespace.id,
        FieldBinderMetadata.catalog.bucket.name,
        FieldBinderMetadata.catalog.bucket.id
      )
      document = (await this.#uploads.place(document, bucket.id)).id
      try {
        await this.#uploads.drain()
      } catch (error) {
        if (!(error instanceof AggregateError)) throw error
        this.#warning[1](`Other pending Binder delivery failed: ${errorCopy(error)}`)
        // The required file below must still be verified independently.
      }
    } else FieldBinderMetadata.id(entry.documentAddress)
    const stored = await this.#server.document.get(document)
    if (stored.name.startsWith('.')) notValid('Binder entries cannot reference reserved metadata.')
    await this.#server.document.read(document)
    const placed = { ...entry, documentAddress: FieldBinderMetadata.address(document) }
    const current = await this.read()
    checkBaseline(current, baseline)
    const entries = [...(current?.inventory.entries ?? [])]
    const index = entries.findIndex(item => item.id === placed.id)
    if (index === -1) entries.push(placed)
    else entries[index] = placed
    const publication = await this.#publish({ schemaVersion: 1, entries })
    return { entry: placed, publication }
  }

  /** Removal changes source membership and leaves captured preparations' files intact. */
  async remove(entryId: Id, baseline?: string): Promise<void> {
    this.#warning[1](undefined)
    const current = await this.read()
    checkBaseline(current, baseline)
    if (!current?.inventory.entries.some(entry => entry.id === entryId)) {
      throw new ApiError('This Binder entry is no longer in the source collection.', 404)
    }
    await this.#publish({
      schemaVersion: 1,
      entries: current.inventory.entries.filter(entry => entry.id !== entryId)
    })
  }

  /** Source Open has no effect on the prepared local reader. */
  async link(entry: FieldBinderEntry): Promise<DocumentLink> {
    const document = FieldBinderMetadata.id(entry.documentAddress)
    const metadata = await this.#server.document.get(document)
    if (metadata.name.startsWith('.')) notValid('Binder entries cannot open reserved metadata.')
    return await this.#server.document.link(document)
  }

  /** Cleanup is distinct from whether a new publication was committed. */
  warning(): string | undefined {
    return this.#warning[0]()
  }

  /** Publish Field Binder changes. */
  async #publish(value: FieldBinderInventory): Promise<FieldBinderPublication> {
    const inventory = FieldBinderMetadata.readInventory(value)
    const namespace = await this.#server.namespace.create(
      FieldBinderMetadata.catalog.namespace.name,
      FieldBinderMetadata.catalog.namespace.id
    )
    const bucket = await this.#server.bucket.create(
      namespace.id,
      FieldBinderMetadata.catalog.bucket.name,
      FieldBinderMetadata.catalog.bucket.id
    )
    const body = new Blob([JSON.stringify(inventory)], { type: 'application/json' })
    const document = await this.#server.document.create(
      bucket.id,
      FieldBinderMetadata.catalog.inventoryName,
      body
    )
    try {
      const candidates = await this.#server.document.find(
        bucket.id,
        FieldBinderMetadata.catalog.inventoryName
      )
      for (const old of candidates) {
        if (FieldBinderMetadata.compare(old, document) < 0) await this.#server.document.delete(old.id)
      }
    } catch (error) {
      this.#warning[1](`Inventory published; older inventory cleanup failed: ${errorCopy(error)}`)
    }
    return { document, inventory, body }
  }
}

// ────────────────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────────────────

/** Refuse a save whose baseline is no longer the current publication. */
const checkBaseline = (current: FieldBinderPublication | undefined, baseline?: string): void => {
  const actual = current === undefined ? undefined : FieldBinderMetadata.address(current.document.id)
  if (actual !== baseline) {
    throw new ApiError('The Binder source changed. Reload before saving this edit.', 409)
  }
}

/** A failure's message, for display copy. */
const errorCopy = (error: unknown): string => error instanceof Error ? error.message : String(error)
