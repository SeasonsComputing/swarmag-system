/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Field Binder inventory                                                       ║
║ Validated immutable publications and local snapshot selection metadata.      ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Validates feature JSON at its boundary. An entry's document is never replaced,
and its name lives only on the document; the entry records how the document
arrived. References are complete id-form document addresses, never names or
links; a minted id gives the placed address before the document exists.
Publication and status candidates use creation time and UUID ordering rather
than ambiguous name resolution or local-copy timestamps.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
FIELD_BINDER_SOURCES    How a Binder document arrives.
FieldBinderUploadSource One arrival source.
FieldBinderUpload       How the entry's document arrived.
├ source                Upload, Library, or URL.
├ kind                  The document's attachment kind.
├ url                   Source URL, for source 'url'.
└ record                Library topic and record, for source 'library'.
FieldBinderEntry        Inventory entry; extends Instance identity.
├ description           Required display title.
├ documentAddress       Complete id-form placed reference.
└ upload                How the document arrived.
FieldBinderInventory    Published membership.
├ schemaVersion         Supported inventory version.
└ entries               Published entry references.
FieldBinderStatus       Local snapshot selector.
├ schemaVersion         Supported status version.
├ inventoryAddress      Local copied inventory reference.
├ sourcePublication     Preserved source publication identity.
└ syncedAt              Successful local preparation time.
FieldBinderPublication  Captured source/local publication.
├ document              Inventory metadata and store identity.
├ inventory             Validated membership.
└ body                  Original inventory bytes.
FieldBinderMetadata     Inventory, status, and reference operations for the Binder.
├ catalog               Fixed namespace, collection bucket, and reserved filenames.
├ id                    Reference to identity, required to be in the collection.
├ address               Store-produced identity to its id-form reference.
├ placed                Minted document id to its placed reference.
├ collection            The collection's own id-form address.
├ readEntry             Validate one entry's metadata.
├ readInventory         Validate schema, published references, and unique ids.
├ readStatus            Validate local snapshot selection.
├ readJson              Parse named JSON with actionable malformed copy.
└ compare               Order documents by creation time, then UUID.
*/

import {
  isConstEnum,
  isDictionary,
  isId,
  isNonEmptyString,
  isUrl,
  isWhen,
  notValid,
  StringSet,
  toId
} from '@core/std'
import type { Id, Instance, When } from '@core/std'
import { DocumentAddresses } from '@core/stdx'
import type { DocumentId, NodeMetadata } from '@core/stdx'
import { ATTACHMENT_KINDS } from '@domain/abstractions/common.ts'
import type { AttachmentKind } from '@domain/abstractions/common.ts'
import { LIBRARY_TOPICS } from './attachments.ts'
import type { LibraryTopic } from './attachments.ts'

/** Feature-owned logical organization, independent of native storage roots. */
const catalog = {
  namespace: { id: toId('019a6000-0000-7000-8000-000000000020'), name: 'Field Binder' },
  bucket: { id: toId('019a6000-0000-7000-8000-000000000021'), name: 'Collection' },
  inventoryName: '.inventory.json',
  statusName: '.status.json'
} as const

/** Require the fixed Binder lineage without manufacturing store identities. */
const id = (reference: string): DocumentId => {
  const document = DocumentAddresses.id(reference)
  if (
    document.namespace !== catalog.namespace.id
    || document.bucket !== catalog.bucket.id
  ) {
    return notValid('Field Binder reference must belong to its collection.')
  }
  return document
}

/** How a Binder document arrives. */
export const FIELD_BINDER_SOURCES = ['upload', 'library', 'url'] as const
export type FieldBinderUploadSource = (typeof FIELD_BINDER_SOURCES)[number]

/** How the entry's document arrived; read-only once the document is delivered. */
export type FieldBinderUpload = {
  source: FieldBinderUploadSource
  kind: AttachmentKind
  url?: string
  record?: { topic: LibraryTopic; id: Id }
}

/** Metadata references a document without owning its upload lifecycle. */
export type FieldBinderEntry = Instance & {
  description: string
  documentAddress: string
  upload: FieldBinderUpload
}

/** One immutable source publication; references define membership. */
export type FieldBinderInventory = { schemaVersion: 1; entries: readonly FieldBinderEntry[] }

/** Local-only commit point; inventory copies retain the source identity. */
export type FieldBinderStatus = {
  schemaVersion: 1
  inventoryAddress: string
  sourcePublication: string
  syncedAt: When
}

/** Capture metadata and bytes together before a preparation copies any file. */
export type FieldBinderPublication = {
  document: NodeMetadata<DocumentId>
  inventory: FieldBinderInventory
  body: Blob
}

/** Validate entry metadata and complete id-form references. */
const readEntry = (value: unknown): FieldBinderEntry => {
  if (!isDictionary(value)) return notValid('Field Binder entry must be an object.')
  if (!isId(value.id)) return notValid('Field Binder entry id must be a UUID v7.')
  if (!isNonEmptyString(value.description)) return notValid('Field Binder description is required.')
  if (!isNonEmptyString(value.documentAddress)) return notValid('Field Binder document is required.')
  DocumentAddresses.id(value.documentAddress)
  return {
    id: value.id,
    description: value.description,
    documentAddress: value.documentAddress,
    upload: readFieldBinderUpload(value.upload)
  }
}

/** Validate how a document arrived: a URL only from a URL, a record only from the Library. */
const readFieldBinderUpload = (value: unknown): FieldBinderUpload => {
  if (!isDictionary(value)) return notValid('Field Binder upload must be an object.')
  if (!isConstEnum(value.source, FIELD_BINDER_SOURCES)) {
    return notValid('Field Binder upload source must be upload, library, or url.')
  }
  if (!isConstEnum(value.kind, ATTACHMENT_KINDS)) return notValid('Field Binder upload kind is unknown.')
  const upload: FieldBinderUpload = { source: value.source, kind: value.kind }
  if (value.source === 'url') {
    if (!isUrl(value.url, ['http', 'https'])) {
      return notValid('Field Binder source URL must use HTTP or HTTPS.')
    }
    return { ...upload, url: value.url }
  }
  if (value.url !== undefined) return notValid('Only a URL upload has a source URL.')
  if (value.source === 'library') {
    const record = value.record
    if (!isDictionary(record) || !isConstEnum(record.topic, LIBRARY_TOPICS) || !isId(record.id)) {
      return notValid('A Library upload requires its topic and record.')
    }
    return { ...upload, record: { topic: record.topic, id: record.id } }
  }
  if (value.record !== undefined) return notValid('Only a Library upload has a record.')
  return upload
}

/** Validate schema and membership independently of document-directory presence. */
const readInventory = (value: unknown): FieldBinderInventory => {
  if (!isDictionary(value)) return notValid('Field Binder inventory must be an object.')
  if (value.schemaVersion !== 1) return notValid('Unsupported Field Binder inventory schema version.')
  if (!Array.isArray(value.entries)) return notValid('Field Binder inventory entries must be an array.')
  const ids = new StringSet()
  const entries = value.entries.map(value => {
    const entry = readEntry(value)
    id(entry.documentAddress)
    return entry
  })
  for (const entry of entries) {
    if (ids.has(entry.id)) notValid('Field Binder inventory has duplicate entry ids.')
    ids.add(entry.id)
  }
  return { schemaVersion: 1, entries }
}

/** Validate the local snapshot selector, which is never uploaded. */
const readStatus = (value: unknown): FieldBinderStatus => {
  if (!isDictionary(value) || value.schemaVersion !== 1) {
    return notValid('Unsupported Field Binder status schema.')
  }
  if (!isNonEmptyString(value.inventoryAddress) || !isNonEmptyString(value.sourcePublication)) {
    return notValid('Field Binder status requires inventory and source references.')
  }
  id(value.inventoryAddress)
  id(value.sourcePublication)
  if (value.inventoryAddress !== value.sourcePublication) {
    return notValid('Field Binder local inventory must preserve its source identity.')
  }
  if (!isWhen(value.syncedAt)) return notValid('Field Binder status requires a valid sync timestamp.')
  return {
    schemaVersion: 1,
    inventoryAddress: value.inventoryAddress,
    sourcePublication: value.sourcePublication,
    syncedAt: value.syncedAt
  }
}

/** Parse feature metadata; distinguish malformed JSON from unsupported schemas. */
const readJson = (text: string, name: string): unknown => {
  try {
    return JSON.parse(text)
  } catch (error) {
    if (error instanceof SyntaxError) return notValid(`Field Binder ${name} JSON is malformed.`)
    throw error
  }
}

/** Persist an id-form reference, never a temporary link or name address. */
const address = (document: DocumentId): string =>
  DocumentAddresses.format([
    { id: document.namespace },
    { id: document.bucket },
    { id: document.document }
  ])

/** Ascending deterministic order; callers select the last candidate. */
const compare = (
  left: NodeMetadata<DocumentId>,
  right: NodeMetadata<DocumentId>
): number => {
  const time = Date.parse(left.createdAt) - Date.parse(right.createdAt)
  if (time !== 0) return time
  return left.id.document < right.id.document ? -1 : left.id.document > right.id.document ? 1 : 0
}

/** The placed reference a minted document id will have in the collection. */
const placed = (document: Id): string =>
  DocumentAddresses.format([
    { id: catalog.namespace.id },
    { id: catalog.bucket.id },
    { id: document }
  ])

/** The collection's own id-form address, for resolving its bucket. */
const collection = (): string =>
  DocumentAddresses.format([{ id: catalog.namespace.id }, { id: catalog.bucket.id }])

/** Inventory, status, and reference operations for the Field Binder. */
export const FieldBinderMetadata = {
  catalog,
  id,
  address,
  placed,
  collection,
  readEntry,
  readInventory,
  readStatus,
  readJson,
  compare
}
