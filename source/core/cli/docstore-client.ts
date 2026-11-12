/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Document store client kernal implementation                                  ║
║ Boundary validation and address resolution over a provider.                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Composes the hierarchy over an injected provider. Applications use the shared
contract and address grammar; providers own persistence.
Supplied Id values are already canonical; only raw address text is parsed.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
DocumentStore                            Storage-neutral document kernel.
├ constructor(provider, settings)        Fix provider and link lifetime.
├ namespace                              Namespace operations.
├ bucket                                 Bucket operations.
└ document                               Document operations.
*/

import { id, toWhen, ValidatorError } from '@core/std'
import type { Id } from '@core/std'
import {
  ApiError,
  bucketIdentity,
  DocumentAddresses,
  documentIdentity,
  namespaceIdentity
} from '@core/stdx'
import type {
  ApiDocumentStoreContract,
  BucketId,
  DeleteResult,
  DocumentAddress,
  DocumentId,
  DocumentLink,
  DocumentProviderContract,
  Lineage,
  LineageMetadata,
  NamespaceId,
  NodeId,
  NodeMetadata,
  StoreNodeContract
} from '@core/stdx'

/** Document hierarchy over a provider; link lifetime is in milliseconds. */
export class DocumentStore implements ApiDocumentStoreContract {
  readonly namespace: ApiDocumentStoreContract['namespace']
  readonly bucket: ApiDocumentStoreContract['bucket']
  readonly document: ApiDocumentStoreContract['document']

  constructor(provider: DocumentProviderContract, settings: { linkLifetime: number }) {
    const { linkLifetime } = settings

    /** A provider's metadata with its lineage produced as this level's nominal identity. */
    const metadata = <I extends NodeId>(
      row: LineageMetadata,
      produce: (node: Lineage) => I
    ): NodeMetadata<I> => ({
      id: produce(row.lineage),
      name: row.name,
      createdAt: row.createdAt,
      count: row.count
    })

    /** The operations every level shares, at its depth and producing its identity. */
    const common = <I extends NodeId, P extends Lineage | void>(
      depth: number,
      produce: (node: Lineage) => I
    ): StoreNodeContract<I, P> => {
      return {
        async get(node: I): Promise<NodeMetadata<I>> {
          return metadata(await provider.get(node), produce)
        },
        async find(parent: P, name: string): Promise<readonly NodeMetadata<I>[]> {
          readDocumentStoreName(name)
          return (await provider.find(depth === 1 ? null : parent as Lineage, name)).map(row =>
            metadata(row, produce)
          )
        },
        async list(parent: P): Promise<readonly NodeMetadata<I>[]> {
          return (await provider.list(depth === 1 ? null : parent as Lineage)).map(row =>
            metadata(row, produce)
          )
        },
        async resolve(address: string | DocumentAddress): Promise<NodeMetadata<I>> {
          const segments = readDocumentStoreAddress(address)
          if (segments.length !== depth) throw new ApiError('Address has the wrong node depth', 400)
          let parent: Lineage | null = null
          let found: LineageMetadata | undefined
          for (const segment of segments) {
            if (typeof segment === 'string') {
              const matches = await provider.find(parent, segment)
              if (matches.length === 0) throw new ApiError('Document store node not found', 404)
              if (matches.length > 1) throw new ApiError('Document store name is ambiguous', 409)
              found = matches[0]
            } else {
              found = await provider.get(childLineage(parent, segment.id))
            }
            parent = found.lineage
          }
          return metadata(found!, produce)
        },
        async update(node: I, name: string): Promise<NodeMetadata<I>> {
          readDocumentStoreName(name)
          return metadata(await provider.update(node, name), produce)
        },
        async delete(node: I): Promise<DeleteResult> {
          return await provider.delete(node)
        }
      }
    }

    this.namespace = {
      ...common<NamespaceId, void>(1, namespaceIdentity),
      async create(name: string, suppliedId?: Id): Promise<NodeMetadata<NamespaceId>> {
        readDocumentStoreName(name)
        return metadata(
          await provider.create({ namespace: suppliedId ?? id() }, name),
          namespaceIdentity
        )
      }
    }
    this.bucket = {
      ...common<BucketId, NamespaceId>(2, bucketIdentity),
      async create(parent: NamespaceId, name: string, suppliedId?: Id): Promise<NodeMetadata<BucketId>> {
        readDocumentStoreName(name)
        return metadata(
          await provider.create(childLineage(parent, suppliedId ?? id()), name),
          bucketIdentity
        )
      }
    }
    this.document = {
      ...common<DocumentId, BucketId>(3, documentIdentity),
      async create(
        parent: BucketId,
        name: string,
        body: Blob,
        suppliedId?: Id
      ): Promise<NodeMetadata<DocumentId>> {
        readDocumentStoreName(name)
        const node = childLineage(parent, suppliedId ?? id())
        return metadata(await provider.create(node, name, body), documentIdentity)
      },
      async read(node: DocumentId): Promise<Blob> {
        return await provider.read(node)
      },
      async link(node: DocumentId): Promise<DocumentLink> {
        const expiresAt = toWhen(new Date(Date.now() + linkLifetime))
        return { url: await provider.link(node, expiresAt), expiresAt }
      }
    }
  }
}

/** Validate a node name by the address grammar, failing as a 422 ApiError. */
const readDocumentStoreName = (name: string): void => {
  try {
    DocumentAddresses.build(name)
  } catch (error) {
    if (error instanceof ValidatorError) throw new ApiError(error.message, 422)
    throw error
  }
}

/** A child's lineage: its parent's lineage extended by its own id. */
const childLineage = (parent: Lineage | null, child: Id): Lineage => {
  if (parent === null) return { namespace: child }
  if (parent.bucket === undefined) return { namespace: parent.namespace, bucket: child }
  return { namespace: parent.namespace, bucket: parent.bucket, document: child }
}

/** Parse raw text or check segmented address grammar, trusting typed ids; failures are 422. */
const readDocumentStoreAddress = (address: string | DocumentAddress): DocumentAddress => {
  try {
    if (typeof address === 'string') return DocumentAddresses.parse(address)
    DocumentAddresses.format(address)
    return address
  } catch (error) {
    if (error instanceof ValidatorError) throw new ApiError(error.message, 422)
    throw error
  }
}
