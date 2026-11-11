/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Application attachments                                                      ║
║ Stages, places, and opens attachments through document store contracts.      ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Places every attachment the application stores. A chosen file is staged in the
inbox through Uploads; when its record saves, its topic selects the owner's
bucket. Uploads owns document mechanics; the catalog is private to this module.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
Attachments      Attachment recognition, catalog placement, and references.
├ constructor    Bind Uploads and the inbox catalog.
├ namespaces     Read-only provisioned namespace catalog.
├ stage          Store a recognized file in staging.
├ discard        Remove staged documents only.
├ link           Mint a link from the inbox or the server.
├ size           Read a document's size from its store.
├ accept         Picker filter for the allowed kinds.
├ Customers      Place customer and site notes.
├ Users          Place user notes.
├ Jobs           Place job notes.
├ Chemicals      Place library chemical notes.
├ Assets         Place library asset notes.
└ Services       Place library service notes.
AttachmentTopic  Placement for one topic's notes.
├ constructor    Bind Uploads, the inbox, and a catalog destination.
└ place          Place a record's staged documents in its topic's bucket.
*/

import type { Uploads } from '@core/cli/docstore-uploads.ts'
import { immutable, notValid, toId, when } from '@core/std'
import type { Id } from '@core/std'
import { DocumentAddresses } from '@core/stdx'
import type { ApiDocumentStoreContract, DocumentId, DocumentLink } from '@core/stdx'
import type { Attachment, AttachmentKind, Note } from '@domain/abstractions/common.ts'
import { AttachmentFormats } from './attachment-formats.ts'

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

  /** Bind upload mechanics and the inbox catalog to the attachment topics. */
  constructor(uploads: Uploads, inbox: ApiDocumentStoreContract) {
    this.#uploads = uploads
    this.Customers = ownerTopic(uploads, inbox, CUSTOMERS, 'Customers')
    this.Users = ownerTopic(uploads, inbox, USERS, 'Users')
    this.Jobs = ownerTopic(uploads, inbox, JOBS, 'Jobs')
    this.Chemicals = libraryTopic(uploads, inbox, CHEMICALS, 'Chemicals')
    this.Assets = libraryTopic(uploads, inbox, ASSETS, 'Assets')
    this.Services = libraryTopic(uploads, inbox, SERVICES, 'Services')
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
    const normalized = new File([file], file.name, { type: recognized.contentType })
    const document = await this.#uploads.stage(normalized)
    return { filename: file.name, documentAddress: addressOf(document.id), ...recognized, uploadedAt }
  }

  /** Remove staged documents; a document in an owner's bucket is never deleted here. */
  async discard(attachments: readonly Attachment[]): Promise<void> {
    await this.#uploads.discard(
      attachments.map(attachment => DocumentAddresses.id(attachment.documentAddress))
    )
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
  readonly #inbox: ApiDocumentStoreContract
  readonly #placement: TopicPlacement
  readonly #uploads: Uploads

  /** Bind Uploads, the inbox, and a catalog destination. */
  constructor(uploads: Uploads, inbox: ApiDocumentStoreContract, placement: TopicPlacement) {
    this.#inbox = inbox
    this.#placement = placement
    this.#uploads = uploads
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
    if (!this.#uploads.isStaged(node)) return { ...attachment }
    const { namespace, bucket } = this.#placement
    const container = await this.#inbox.namespace.create(namespace.name, namespace.id)
    const target = await this.#inbox.bucket.create(
      container.id,
      bucket?.name ?? owner,
      bucket?.id ?? owner
    )
    const document = await this.#uploads.place(node, target.id)
    return { ...attachment, documentAddress: addressOf(document.id) }
  }
}

// ────────────────────────────────────────────────────────────────────────────
// IMPLEMENTATION
// ────────────────────────────────────────────────────────────────────────────

/** Build an owner-specific topic: Customers, Users, or Jobs. */
const ownerTopic = (
  uploads: Uploads,
  inbox: ApiDocumentStoreContract,
  namespace: Id,
  name: string
): AttachmentTopic => new AttachmentTopic(uploads, inbox, { namespace: { id: namespace, name } })

/** Build a company-wide topic with a fixed bucket in the Library namespace. */
const libraryTopic = (
  uploads: Uploads,
  inbox: ApiDocumentStoreContract,
  bucket: Id,
  name: string
): AttachmentTopic =>
  new AttachmentTopic(uploads, inbox, {
    namespace: { id: LIBRARY, name: 'Library' },
    bucket: { id: bucket, name }
  })

/** Format a document reference with ids so renaming a node cannot break it. */
const addressOf = (node: DocumentId): string =>
  DocumentAddresses.format(DocumentAddresses.build({ id: node.namespace }, { id: node.bucket }, {
    id: node.document
  }))
