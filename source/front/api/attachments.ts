/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Application attachments                                                      ║
║ Chooses, places, and opens attachments through document store contracts.     ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Places every attachment the application stores. Choosing a file mints its
document id and starts its upload task; the draft holds the document's staged
address until Save. At Save the topic gives each staged reference its placed
address, built from the topic's placement and the minted id, and records where
the task will place it. The editor releases the tasks after a successful write; each
then places its staged document, and the drain delivers it. Uploads owns
document mechanics; the catalog is private to this module.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
LIBRARY_TOPICS   The Library namespace's topics.
LibraryTopic     One Library topic.
Attachments      Attachment recognition, catalog placement, and references.
├ constructor    Bind Uploads and the inbox catalog.
├ namespaces     Read-only provisioned namespace catalog.
├ stage          Recognize a file, start its upload task, return its staged row.
├ reset          Forget recorded destinations before a write attempt.
├ release        After a successful write: place the tasks' documents.
├ abandon        End tasks without placing, discarding staging when asked.
├ link           Mint a link from the inbox or the server.
├ size           Read a document's size from its store.
├ file           Read a document's bytes as a File, reporting progress.
├ accept         Picker filter for the allowed kinds.
├ Customers      Place customer and site notes.
├ Users          Place user notes.
├ Jobs           Place job notes.
├ Chemicals      Place library chemical notes.
├ Assets         Place library asset notes.
└ Services       Place library service notes.
AttachmentTopic  Placement for one topic's notes.
├ constructor    Bind Uploads, the inbox, the upload tasks, and a destination.
└ address        Give staged references their placed addresses.
*/

import type { Uploads } from '@core/cli/docstore-uploads.ts'
import { immutable, notValid, toId, when } from '@core/std'
import type { Id } from '@core/std'
import { ApiError, DocumentAddresses } from '@core/stdx'
import type { ApiDocumentStoreContract, BucketId, DocumentLink } from '@core/stdx'
import type { Attachment, AttachmentKind, Note } from '@domain/abstractions/common.ts'
import { AttachmentFormats } from './attachment-formats.ts'
import { UploadTask } from './upload-task.ts'

/** The Library namespace's topics. */
export const LIBRARY_TOPICS = ['Chemicals', 'Assets', 'Services'] as const
export type LibraryTopic = (typeof LIBRARY_TOPICS)[number]

// ────────────────────────────────────────────────────────────────────────────
// CATALOG
// ────────────────────────────────────────────────────────────────────────────

// Fixed ids that every store on every device shares, so a placed document has one address in the
// inbox and on the server, computed from the catalog and its owner's id.

/** Namespaces whose buckets are their owners' ids. */
const CUSTOMERS = toId('019a6000-0000-7000-8000-000000000003')
const USERS = toId('019a6000-0000-7000-8000-000000000004')
const JOBS = toId('019a6000-0000-7000-8000-000000000005')

/** The Library namespace and its fixed company-wide buckets. */
const LIBRARY = toId('019a6000-0000-7000-8000-000000000006')
const CHEMICALS = toId('019a6000-0000-7000-8000-000000000007')
const ASSETS = toId('019a6000-0000-7000-8000-000000000008')
const SERVICES = toId('019a6000-0000-7000-8000-000000000009')

/** An upload task, and the bucket it places into once a Save has given it a placed address. */
type ChosenUpload = { task: UploadTask; into?: () => Promise<BucketId> }

// ────────────────────────────────────────────────────────────────────────────
// ATTACHMENTS
// ────────────────────────────────────────────────────────────────────────────

/** Attachment operations bound to Uploads and the inbox catalog, composed once in api.ts. */
export class Attachments {
  /** The four placed namespaces, shared read-only with storage provisioning. */
  static readonly namespaces = immutable([
    immutable({ id: CUSTOMERS, name: 'Customers' }),
    immutable({ id: USERS, name: 'Users' }),
    immutable({ id: JOBS, name: 'Jobs' }),
    immutable({ id: LIBRARY, name: 'Library' })
  ])

  readonly Customers: AttachmentTopic
  readonly Users: AttachmentTopic
  readonly Jobs: AttachmentTopic
  readonly Chemicals: AttachmentTopic
  readonly Assets: AttachmentTopic
  readonly Services: AttachmentTopic
  readonly #uploads: Uploads
  readonly #chosen = new Map<Id, ChosenUpload>()

  /** Bind upload mechanics and the inbox catalog to the attachment topics. */
  constructor(uploads: Uploads, inbox: ApiDocumentStoreContract) {
    this.#uploads = uploads
    const topic = (placement: TopicPlacement) =>
      new AttachmentTopic(uploads, inbox, this.#chosen, placement)
    this.Customers = topic(owner(CUSTOMERS, 'Customers'))
    this.Users = topic(owner(USERS, 'Users'))
    this.Jobs = topic(owner(JOBS, 'Jobs'))
    this.Chemicals = topic(library(CHEMICALS, 'Chemicals'))
    this.Assets = topic(library(ASSETS, 'Assets'))
    this.Services = topic(library(SERVICES, 'Services'))
  }

  /**
   * Recognize a chosen file by its extension, mint its document id, and start its upload task.
   * @param kinds The kinds the host accepts; any kind when omitted.
   * @returns The draft row, its reference staged until Save, its uploadedAt the moment of choice.
   */
  stage(file: File, kinds?: readonly AttachmentKind[]): Attachment {
    const uploadedAt = when()
    const recognized = AttachmentFormats.recognize(file)
    if (kinds && !kinds.includes(recognized.kind)) notValid('This attachment kind is not accepted.')
    const normalized = new File([file], file.name, { type: recognized.contentType })
    const task = new UploadTask(this.#uploads, file.name, UploadTask.fromFile(normalized))
    this.#chosen.set(task.id, { task })
    return {
      filename: file.name,
      documentAddress: this.#uploads.stagedAddress(task.id),
      ...recognized,
      uploadedAt
    }
  }

  /** Forget the destinations an earlier write attempt recorded; the next placement records anew. */
  reset(documents: readonly Id[]): void {
    for (const document of documents) {
      const chosen = this.#chosen.get(document)
      if (chosen) this.#chosen.set(document, { task: chosen.task })
    }
  }

  /**
   * After a successful write, hand each task its destination; it places once staged. A task the
   * write did not reference ends, keeping its staging.
   */
  release(documents: readonly Id[]): void {
    for (const document of documents) {
      const chosen = this.#chosen.get(document)
      if (!chosen) continue
      this.#chosen.delete(document)
      void (chosen.into ? chosen.task.place(chosen.into) : chosen.task.abandon(false))
    }
  }

  /**
   * End tasks at once without placing; each discards its staging when its read completes.
   * @param discard Remove their staging; only before any write attempt.
   */
  async abandon(documents: readonly Id[], discard: boolean): Promise<void> {
    const ending: Promise<void>[] = []
    for (const document of documents) {
      const chosen = this.#chosen.get(document)
      if (!chosen) continue
      this.#chosen.delete(document)
      ending.push(chosen.task.abandon(discard))
    }
    await Promise.all(ending)
  }

  /** Mint a link to an attachment from whichever store holds it. */
  async link(attachment: Attachment): Promise<DocumentLink> {
    const node = DocumentAddresses.id(attachment.documentAddress)
    return await this.#uploads.link(node)
  }

  /** An attachment's size in bytes, from its store's metadata. */
  async size(attachment: Attachment): Promise<number> {
    const node = DocumentAddresses.id(attachment.documentAddress)
    return (await this.#uploads.get(node)).count
  }

  /**
   * Read an attachment's bytes through its link, reporting bytes read from the response body.
   * @returns A File named and typed from the attachment.
   */
  async file(
    attachment: Attachment,
    report?: (completed: number, total: number) => void
  ): Promise<File> {
    const response = await fetch((await this.link(attachment)).url)
    if (!response.ok || !response.body) {
      throw new ApiError(`Unable to read ${attachment.filename}.`, response.status)
    }
    const total = Number(response.headers.get('content-length') ?? 0)
    const reader = response.body.getReader()
    // Each chunk is copied into its own ArrayBuffer, which a File part requires.
    const chunks: Uint8Array<ArrayBuffer>[] = []
    let completed = 0
    report?.(completed, total)
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value.slice())
      completed += value.byteLength
      report?.(completed, total)
    }
    return new File(chunks, attachment.filename, { type: attachment.contentType })
  }

  /** The picker's accept string for the host's kinds. */
  accept(kinds: readonly AttachmentKind[]): string {
    return AttachmentFormats.accept(kinds)
  }
}

// ────────────────────────────────────────────────────────────────────────────
// TOPICS
// ────────────────────────────────────────────────────────────────────────────

/** Where one topic's documents are placed: its namespace, and a fixed bucket or the owner's. */
type TopicPlacement = {
  namespace: { id: Id; name: string }
  bucket?: { id: Id; name: string }
}

/** Placement for one topic's notes. */
export class AttachmentTopic {
  readonly #uploads: Uploads
  readonly #inbox: ApiDocumentStoreContract
  readonly #chosen: Map<Id, ChosenUpload>
  readonly #placement: TopicPlacement

  /** Bind Uploads, the inbox, the upload tasks, and a catalog destination. */
  constructor(
    uploads: Uploads,
    inbox: ApiDocumentStoreContract,
    chosen: Map<Id, ChosenUpload>,
    placement: TopicPlacement
  ) {
    this.#uploads = uploads
    this.#inbox = inbox
    this.#chosen = chosen
    this.#placement = placement
  }

  /**
   * Give each staged reference its placed address, from the topic's placement and the minted id,
   * and record where its task will place it. Placed references are unchanged.
   * @param owner The record's id; undefined before a create, when an owner-bucket topic leaves out
   * the staged attachments that need it.
   * @returns The notes with their staged references replaced.
   */
  address(owner: Id | undefined, notes: readonly Note[]): readonly Note[] {
    const { namespace } = this.#placement
    const bucket = this.#placement.bucket
      ?? (owner === undefined ? undefined : { id: owner, name: owner })
    return notes.map(note => ({
      ...note,
      attachments: note.attachments.flatMap(attachment => {
        const node = DocumentAddresses.id(attachment.documentAddress)
        if (!this.#uploads.isStaged(node)) return [{ ...attachment }]
        if (bucket === undefined) return []
        this.#destine(node.document, bucket)
        const documentAddress = addressOf(namespace.id, bucket.id, node.document)
        return [{ ...attachment, documentAddress }]
      })
    }))
  }

  /** Record the bucket a chosen document's task places into, creating it when the task places. */
  #destine(document: Id, bucket: { id: Id; name: string }): void {
    const chosen = this.#chosen.get(document)
    if (!chosen) return
    const { namespace } = this.#placement
    this.#chosen.set(document, {
      task: chosen.task,
      into: async () => {
        const container = await this.#inbox.namespace.create(namespace.name, namespace.id)
        return (await this.#inbox.bucket.create(container.id, bucket.name, bucket.id)).id
      }
    })
  }
}

// ────────────────────────────────────────────────────────────────────────────
// IMPLEMENTATION
// ────────────────────────────────────────────────────────────────────────────

/** An owner-bucket topic's placement: its namespace, each owner's bucket its id. */
const owner = (namespace: Id, name: string): TopicPlacement => ({ namespace: { id: namespace, name } })

/** A company-wide topic's placement: a fixed bucket in the Library namespace. */
const library = (bucket: Id, name: string): TopicPlacement => ({
  namespace: { id: LIBRARY, name: 'Library' },
  bucket: { id: bucket, name }
})

/** Format a document reference with ids so renaming a node cannot break it. */
const addressOf = (namespace: Id, bucket: Id, document: Id): string =>
  DocumentAddresses.format(DocumentAddresses.build({ id: namespace }, { id: bucket }, { id: document }))
