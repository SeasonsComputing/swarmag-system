/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Document store contracts                                                     ║
║ Node operations, nominal identities, and provider lineage.                   ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines the document hierarchy independently of storage. DocumentAddresses
(docstore-document-addresses.ts) builds, parses, and formats addresses. Provider support
and identity producers serve the document store makers in core/cli.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
NamespaceId, BucketId, DocumentId, NodeId  Exact-level nominal identities.
NodeMetadata                             Metadata shared by all levels.
├ id                                     Exact-level nominal identity.
├ name                                   Human name, not necessarily unique.
├ createdAt                              Creation timestamp.
└ count                                  Children or document bytes.
DocumentLink                             Temporary document access.
├ url                                    URL for browser display.
└ expiresAt                              Fixed issuance-time expiry.
AddressSegment                           A name or an explicit UUID segment.
DocumentAddress                          One to three validated segments.
StoreNodeContract                        Common node operations.
├ get                                    Read metadata.
├ find                                   Match names within a parent.
├ list                                   Read direct children.
├ resolve                                Resolve an address at this level.
├ update                                 Rename a node.
└ delete                                 Remove nodes; empty containers only.
NamespaceContract                        Extends StoreNodeContract.
└ create                                 Create a named namespace.
BucketContract                           Extends StoreNodeContract.
└ create                                 Create within a namespace.
DocumentContract                         Extends StoreNodeContract.
├ create                                 Create immutable content in a bucket.
├ read                                   Read document bytes.
└ link                                   Mint a temporary browser URL.
ApiDocumentStoreContract                 The three node levels.
├ namespace                              Namespace operations.
├ bucket                                 Bucket operations.
└ document                               Document operations.
namespaceIdentity(lineage)               Construct a namespace identity.
bucketIdentity(lineage)                  Construct a bucket identity.
documentIdentity(lineage)                Construct a document identity.
Lineage                                  Unbranded UUID lineage.
├ namespace                              Namespace UUID.
├ bucket                                 Bucket UUID, when present.
└ document                               Document UUID, when present.
LineageMetadata                          Provider metadata.
├ lineage                                Unbranded identity.
├ name                                   Human name.
├ createdAt                              Creation timestamp.
└ count                                  Children or document bytes.
DocumentProviderContract                 Storage over validated lineage.
├ get                                    Read metadata.
├ find                                   Match child names.
├ list                                   Read children.
├ create                                 Store a node and optional bytes.
├ update                                 Rename a node.
├ delete                                 Remove a node.
├ read                                   Read document bytes.
└ link                                   Implement a kernel-supplied expiry.
*/

import type { DeleteResult } from './api-contracts.ts'
import type { When } from './datetime.ts'
import type { Id } from './identifier.ts'
import type { NominalType } from './nominal-type.ts'

/** Namespace identity; produced only by the store. */
declare const namespaceBrand: unique symbol
export type NamespaceId = NominalType<{ readonly namespace: Id }, typeof namespaceBrand>

/** Bucket identity; produced only by the store. */
declare const bucketBrand: unique symbol
export type BucketId = NominalType<
  { readonly namespace: Id; readonly bucket: Id },
  typeof bucketBrand
>

/** Document identity; produced only by the store or its reference grammar. */
declare const documentBrand: unique symbol
export type DocumentId = NominalType<
  { readonly namespace: Id; readonly bucket: Id; readonly document: Id },
  typeof documentBrand
>

/** Identities of the three node levels. */
export type NodeId = NamespaceId | BucketId | DocumentId

/** Construct a namespace identity from provider lineage; for the core/cli makers. */
export const namespaceIdentity = (node: Lineage): NamespaceId =>
  ({ namespace: node.namespace }) as NamespaceId

/** Construct a bucket identity from provider lineage; for the core/cli makers. */
export const bucketIdentity = (node: Lineage): BucketId =>
  ({ namespace: node.namespace, bucket: node.bucket }) as BucketId

/** Construct a document identity from validated lineage; for the core/cli makers. */
export const documentIdentity = (node: Lineage): DocumentId =>
  ({ namespace: node.namespace, bucket: node.bucket, document: node.document }) as DocumentId

/** Metadata shared by every level; count denotes children or document bytes. */
export type NodeMetadata<I extends NodeId = NodeId> = {
  id: I
  name: string
  createdAt: When
  count: number
}

/** A temporary document URL with its issuance-time expiry. */
export type DocumentLink = { url: string; expiresAt: When }

/** A human name or an explicit UUID; text form is name or id:{uuid}. */
export type AddressSegment = string | { id: Id }

/** A namespace, bucket, or document address, validated by the grammar. */
export type DocumentAddress = readonly AddressSegment[]

/** Common operations for one exact node level. */
export interface StoreNodeContract<Self extends NodeId, Parent = void> {
  get(id: Self): Promise<NodeMetadata<Self>>
  find(parent: Parent, name: string): Promise<readonly NodeMetadata<Self>[]>
  list(parent: Parent): Promise<readonly NodeMetadata<Self>[]>
  resolve(address: string | DocumentAddress): Promise<NodeMetadata<Self>>
  update(id: Self, name: string): Promise<NodeMetadata<Self>>
  delete(id: Self): Promise<DeleteResult>
}

/** Namespace operations; extends the common node contract. */
export interface NamespaceContract extends StoreNodeContract<NamespaceId> {
  create(name: string): Promise<NodeMetadata<NamespaceId>>
}

/** Bucket operations within an existing namespace. */
export interface BucketContract extends StoreNodeContract<BucketId, NamespaceId> {
  create(parent: NamespaceId, name: string): Promise<NodeMetadata<BucketId>>
}

/** Immutable document bytes, renameable metadata, and temporary links. */
export interface DocumentContract extends StoreNodeContract<DocumentId, BucketId> {
  create(parent: BucketId, name: string, body: Blob, id?: Id): Promise<NodeMetadata<DocumentId>>
  read(id: DocumentId): Promise<Blob>
  link(id: DocumentId): Promise<DocumentLink>
}

/** One storage-neutral contract for the three-level hierarchy. */
export interface ApiDocumentStoreContract {
  namespace: NamespaceContract
  bucket: BucketContract
  document: DocumentContract
}

/** Validated lineage passed between the kernel and its provider. */
export type Lineage = { readonly namespace: Id; readonly bucket?: Id; readonly document?: Id }

/** Provider metadata; identities acquire their brands in the kernel. */
export type LineageMetadata = { lineage: Lineage; name: string; createdAt: When; count: number }

/** Internal storage operations; providers never parse addresses or mint identities. */
export interface DocumentProviderContract {
  get(node: Lineage): Promise<LineageMetadata>
  find(parent: Lineage | null, name: string): Promise<readonly LineageMetadata[]>
  list(parent: Lineage | null): Promise<readonly LineageMetadata[]>
  create(node: Lineage, name: string, body?: Blob): Promise<LineageMetadata>
  update(node: Lineage, name: string): Promise<LineageMetadata>
  delete(node: Lineage): Promise<DeleteResult>
  read(node: Lineage): Promise<Blob>
  link(node: Lineage, expiresAt: When): Promise<string>
}
