/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Field Binder source                                                          ║
║ Published inventory over an independently bound existing Uploads pair.       ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Consumes Uploads for capture, placement, access and delivery. This service owns
only Binder metadata and publication ordering. Choosing a document starts its
upload task; Save publishes the entry with its placed address once and waits
for no transfer, then the task places the document and the drain delivers it.
Delivery is presence on the server; the inventory stores no delivery state.
References, not directory presence, define membership. Known stale edits fail;
no CAS, transaction engine, or durable draft is added. Cleanup failure is
observable without undoing a confirmed publication, and superseded source
files remain available to preparations already in progress.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
FieldBinderSource        Source operations over injected Uploads/inbox/server.
├ constructor            Bind the independent upload pair.
├ publication            Capture the latest publication or report no inventory.
├ choose                 Start a chosen document's upload task.
├ place                  After Save: place the task's document in the collection.
├ save                   Publish one entry with its placed address.
├ document               The entry's server document, or undefined while pending.
├ rename                 Rename a delivered entry's document.
├ remove                 Publish removal without reclaiming source files.
├ link                   Open a published source file.
├ inventoryLink          Open the current inventory, for inspection.
└ warning                Reactive copy of post-publication cleanup failures.
*/

import type { Uploads } from '@core/cli/docstore-uploads.ts'
import { notValid } from '@core/std'
import type { Id } from '@core/std'
import { ApiError } from '@core/stdx'
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
import { UploadTask } from './upload-task.ts'
import type { UploadRead } from './upload-task.ts'

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
  async publication(): Promise<FieldBinderPublication | undefined> {
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

  /**
   * Start a chosen document's upload task under the existing format policy; Binder reserves
   * dot-prefixed metadata names.
   * @param name The document's name, which it keeps until renamed.
   * @param read Read the document's bytes, reporting progress.
   */
  choose(name: string, read: UploadRead): UploadTask {
    if (name.startsWith('.')) notValid('Names beginning with a dot are reserved for Binder metadata.')
    const { contentType } = AttachmentFormats.recognize(new File([], name))
    return new UploadTask(this.#uploads, name, async report => {
      const file = await read(report)
      return new File([file], name, { type: contentType, lastModified: file.lastModified })
    })
  }

  /** After a successful Save, place the task's document in the collection; the drain delivers it. */
  async place(task: UploadTask): Promise<void> {
    await task.place(async () => {
      const namespace = await this.#inbox.namespace.create(
        FieldBinderMetadata.catalog.namespace.name,
        FieldBinderMetadata.catalog.namespace.id
      )
      const bucket = await this.#inbox.bucket.create(
        namespace.id,
        FieldBinderMetadata.catalog.bucket.name,
        FieldBinderMetadata.catalog.bucket.id
      )
      return bucket.id
    })
  }

  /** Publish one entry with its placed address against the editor baseline; no transfer waits. */
  async save(
    input: FieldBinderEntry,
    baseline?: string
  ): Promise<{ entry: FieldBinderEntry; publication: FieldBinderPublication }> {
    this.#warning[1](undefined)
    const entry = FieldBinderMetadata.readEntry(input)
    FieldBinderMetadata.id(entry.documentAddress)
    const current = await this.publication()
    checkBaseline(current, baseline)
    const entries = [...(current?.inventory.entries ?? [])]
    const index = entries.findIndex(item => item.id === entry.id)
    if (index === -1) entries.push(entry)
    else entries[index] = entry
    const publication = await this.#publish({ schemaVersion: 1, entries })
    return { entry, publication }
  }

  /** The entry's document on the server; undefined while it has not arrived. */
  async document(entry: FieldBinderEntry): Promise<NodeMetadata<DocumentId> | undefined> {
    try {
      return await this.#server.document.get(FieldBinderMetadata.id(entry.documentAddress))
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return undefined
      throw error
    }
  }

  /** Rename a delivered entry's document: the store's one edit point for its name. */
  async rename(entry: FieldBinderEntry, name: string): Promise<NodeMetadata<DocumentId>> {
    if (name.startsWith('.')) notValid('Names beginning with a dot are reserved for Binder metadata.')
    return await this.#server.document.update(FieldBinderMetadata.id(entry.documentAddress), name)
  }

  /** Removal changes source membership and leaves captured preparations' files intact. */
  async remove(entryId: Id, baseline?: string): Promise<void> {
    this.#warning[1](undefined)
    const current = await this.publication()
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

  /** A temporary link to the current inventory document, for inspection. */
  async inventoryLink(): Promise<DocumentLink> {
    const publication = await this.publication()
    if (publication === undefined) throw new ApiError('No Binder inventory has been published yet.', 404)
    return await this.#server.document.link(publication.document.id)
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
