/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Application attachments                                                      ║
║ Stages, places, and opens attachments through document store contracts.      ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Places every attachment the application stores. A chosen file is staged in the
inbox; when its record saves, its topic places it in the owner's bucket. A drain
copies placed documents to the server before deleting their inbox copies. The
catalog of namespaces and buckets is private to this module.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
Attachments      Attachment operations over the inbox and the server.
├ namespaces     Read-only provisioned namespace catalog.
├ stage          Store a recognized file in staging.
├ discard        Remove staged documents only.
├ link           Mint a link from the inbox or the server.
├ size           Read a document's size from its store.
├ drain          Copy placed documents to the server, then clear their inbox copies.
├ accept         Picker filter for the allowed kinds.
├ Customers      Place customer and site notes.
├ Users          Place user notes.
├ Jobs           Place job notes.
├ Chemicals      Place library chemical notes.
├ Assets         Place library asset notes.
└ Services       Place library service notes.
AttachmentTopic  Placement for one topic's notes.
└ place          Place a record's staged documents in its topic's bucket.
*/

import { immutable, notValid, toId, when } from '@core/std'
import type { Id } from '@core/std'
import { ApiError, DocumentAddresses } from '@core/stdx'
import type {
  ApiDocumentStoreContract,
  BucketId,
  DocumentId,
  DocumentLink,
  NamespaceId,
  NodeMetadata
} from '@core/stdx'
import type { Attachment, AttachmentKind, Note } from '@domain/abstractions/common.ts'
import { AttachmentFormats } from './attachment-formats.ts'

/** One placed document captured with its source containers for a drain pass. */
type PendingDocument = {
  namespace: NodeMetadata<NamespaceId>
  bucket: NodeMetadata<BucketId>
  document: NodeMetadata<DocumentId>
}

// ────────────────────────────────────────────────────────────────────────────
// CATALOG
// ────────────────────────────────────────────────────────────────────────────

// Fixed ids that every store on every device shares, so a placed document has one address in the
// inbox and on the server, computed from the catalog and its owner's id.

/** The staging namespace and its one bucket: chosen files whose record is not yet saved. */
const STAGING = toId('019a6000-0000-7000-8000-000000000001')
const STAGING_BUCKET = toId('019a6000-0000-7000-8000-000000000002')

/** Namespaces whose buckets are their owners' ids. */
const CUSTOMERS = toId('019a6000-0000-7000-8000-000000000003')
const USERS = toId('019a6000-0000-7000-8000-000000000004')
const JOBS = toId('019a6000-0000-7000-8000-000000000005')

/** The Library namespace and its fixed company-wide buckets. */
const LIBRARY = toId('019a6000-0000-7000-8000-000000000006')
const CHEMICALS = toId('019a6000-0000-7000-8000-000000000007')
const ASSETS = toId('019a6000-0000-7000-8000-000000000008')
const SERVICES = toId('019a6000-0000-7000-8000-000000000009')

// ────────────────────────────────────────────────────────────────────────────
// ATTACHMENTS
// ────────────────────────────────────────────────────────────────────────────

/** Attachment operations over the inbox and the server, composed once in api.ts. */
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
  readonly #inbox: ApiDocumentStoreContract
  readonly #server: ApiDocumentStoreContract

  /** Bind the device inbox and shared server to the attachment topics. */
  constructor(inbox: ApiDocumentStoreContract, server: ApiDocumentStoreContract) {
    this.#inbox = inbox
    this.#server = server
    this.Customers = ownerTopic(inbox, CUSTOMERS, 'Customers')
    this.Users = ownerTopic(inbox, USERS, 'Users')
    this.Jobs = ownerTopic(inbox, JOBS, 'Jobs')
    this.Chemicals = libraryTopic(inbox, CHEMICALS, 'Chemicals')
    this.Assets = libraryTopic(inbox, ASSETS, 'Assets')
    this.Services = libraryTopic(inbox, SERVICES, 'Services')
  }

  /**
   * Recognize a chosen file by its extension and store it in Staging's one bucket.
   * @param kinds The kinds the host accepts; any kind when omitted.
   * @returns The attachment, its uploadedAt the moment the file was chosen.
   */
  async stage(file: File, kinds?: readonly AttachmentKind[]): Promise<Attachment> {
    const uploadedAt = when()
    const recognized = AttachmentFormats.recognize(file)
    if (kinds && !kinds.includes(recognized.kind)) notValid('This attachment kind is not accepted.')
    const namespace = await this.#inbox.namespace.create('Staging', STAGING)
    const bucket = await this.#inbox.bucket.create(namespace.id, 'Staging', STAGING_BUCKET)
    const body = new Blob([file], { type: recognized.contentType })
    const document = await this.#inbox.document.create(bucket.id, file.name, body)
    return { filename: file.name, documentAddress: addressOf(document.id), ...recognized, uploadedAt }
  }

  /** Remove staged documents; a document in an owner's bucket is never deleted here. */
  async discard(attachments: readonly Attachment[]): Promise<void> {
    for (const attachment of attachments) {
      const node = DocumentAddresses.id(attachment.documentAddress)
      if (node.namespace !== STAGING) notValid('Only staged attachments can be discarded.')
      await this.#inbox.document.delete(node)
    }
  }

  /** Mint a link to an attachment from whichever store holds it. */
  async link(attachment: Attachment): Promise<DocumentLink> {
    const node = DocumentAddresses.id(attachment.documentAddress)
    return await this.#either(node, store => store.document.link(node))
  }

  /** An attachment's size in bytes, from its store's metadata. */
  async size(attachment: Attachment): Promise<number> {
    const node = DocumentAddresses.id(attachment.documentAddress)
    return (await this.#either(node, store => store.document.get(node))).count
  }

  /** The picker's accept string for the host's kinds. */
  accept(kinds: readonly AttachmentKind[]): string {
    return AttachmentFormats.accept(kinds)
  }

  /**
   * Copy one snapshot of placed documents to the server at the same addresses.
   * Attempts every document and rejects after the pass if any failed. Successful
   * results count completed documents and a fresh snapshot of those still pending.
   */
  async drain(): Promise<{ drained: number; remaining: number }> {
    const pending = await this.#pending()
    const failures: unknown[] = []
    let drained = 0
    for (const { namespace, bucket, document } of pending) {
      try {
        await this.#drainOne(namespace, bucket, document)
        drained++
      } catch (error) {
        failures.push(error)
      }
    }
    if (failures.length) throw new AggregateError(failures, 'Some documents could not be drained.')
    return { drained, remaining: (await this.#pending()).length }
  }

  /** Try the inbox first; fall back to the server only for a missing, placed document. */
  async #either<T>(
    node: DocumentId,
    operation: (store: ApiDocumentStoreContract) => Promise<T>
  ): Promise<T> {
    try {
      return await operation(this.#inbox)
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 404 || node.namespace === STAGING) throw error
      return await operation(this.#server)
    }
  }

  /** Snapshot placed inbox documents, excluding Staging and retaining all containers. */
  async #pending(): Promise<readonly PendingDocument[]> {
    const pending = []
    for (const namespace of await this.#inbox.namespace.list()) {
      if (namespace.id.namespace === STAGING) continue
      for (const bucket of await this.#inbox.bucket.list(namespace.id)) {
        for (const document of await this.#inbox.document.list(bucket.id)) {
          pending.push({ namespace, bucket, document })
        }
      }
    }
    return pending
  }

  /** Copy a placed document at its existing address before removing its inbox copy. */
  async #drainOne(
    namespace: NodeMetadata<NamespaceId>,
    bucket: NodeMetadata<BucketId>,
    document: NodeMetadata<DocumentId>
  ): Promise<void> {
    let body: Blob
    try {
      body = await this.#inbox.document.read(document.id)
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 404) throw error
      // Another drain may have removed it since listing; only a server copy proves completion.
      await this.#server.document.get(document.id)
      return
    }
    const targetNamespace = await this.#server.namespace.create(namespace.name, namespace.id.namespace)
    const targetBucket = await this.#server.bucket.create(
      targetNamespace.id,
      bucket.name,
      bucket.id.bucket
    )
    await this.#server.document.create(targetBucket.id, document.name, body, document.id.document)
    try {
      await this.#inbox.document.delete(document.id)
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 404) throw error
      await this.#server.document.get(document.id)
    }
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
  readonly #inbox: ApiDocumentStoreContract
  readonly #placement: TopicPlacement

  /** Bind a topic's placement to the device inbox. */
  constructor(inbox: ApiDocumentStoreContract, placement: TopicPlacement) {
    this.#inbox = inbox
    this.#placement = placement
  }

  /**
   * Place a record's staged documents in its topic's bucket, under the same document id, so a
   * retried placement finds the documents already there.
   * @returns The notes with their references rewritten to the placed addresses.
   */
  async place(owner: Id, notes: readonly Note[]): Promise<readonly Note[]> {
    const placed: Note[] = []
    for (const note of notes) {
      const attachments: Attachment[] = []
      for (const attachment of note.attachments) {
        attachments.push(await this.#placeOne(owner, attachment))
      }
      placed.push({ ...note, attachments })
    }
    return placed
  }

  /** Copy a staged attachment into its owner's placement; leave placed attachments unchanged. */
  async #placeOne(owner: Id, attachment: Attachment): Promise<Attachment> {
    const node = DocumentAddresses.id(attachment.documentAddress)
    if (node.namespace !== STAGING) return { ...attachment }
    const { namespace, bucket } = this.#placement
    const container = await this.#inbox.namespace.create(namespace.name, namespace.id)
    const target = await this.#inbox.bucket.create(
      container.id,
      bucket?.name ?? owner,
      bucket?.id ?? owner
    )
    const body = await this.#inbox.document.read(node)
    const document = await this.#inbox.document.create(
      target.id,
      attachment.filename,
      body,
      node.document
    )
    return { ...attachment, documentAddress: addressOf(document.id) }
  }
}

// ────────────────────────────────────────────────────────────────────────────
// IMPLEMENTATION
// ────────────────────────────────────────────────────────────────────────────

/** Build an owner-specific topic: Customers, Users, or Jobs. */
const ownerTopic = (inbox: ApiDocumentStoreContract, namespace: Id, name: string): AttachmentTopic =>
  new AttachmentTopic(inbox, { namespace: { id: namespace, name } })

/** Build a company-wide topic with a fixed bucket in the Library namespace. */
const libraryTopic = (inbox: ApiDocumentStoreContract, bucket: Id, name: string): AttachmentTopic =>
  new AttachmentTopic(inbox, {
    namespace: { id: LIBRARY, name: 'Library' },
    bucket: { id: bucket, name }
  })

/** Format a document reference with ids so renaming a node cannot break it. */
const addressOf = (node: DocumentId): string =>
  DocumentAddresses.format(DocumentAddresses.build({ id: node.namespace }, { id: node.bucket }, {
    id: node.document
  }))
