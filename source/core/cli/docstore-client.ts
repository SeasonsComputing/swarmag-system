/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Document store kernel                                                        ║
║ Boundary validation and address resolution over a provider.                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Composes the hierarchy over an injected provider. Applications use the shared
contract and address grammar; providers own persistence.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
DocumentStore                            Storage-neutral document kernel.
├ constructor(provider, settings)        Fix provider and link lifetime.
├ namespace                              Namespace operations.
├ bucket                                 Bucket operations.
└ document                               Document operations.
*/

import { id, isId, toWhen, ValidatorError } from '@core/std'
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
  DocumentAddress,
  DocumentId,
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
        async get(node) {
          return metadata(await provider.get(node), produce)
        },
        async find(parent, name) {
          readDocumentStoreName(name)
          return (await provider.find(depth === 1 ? null : parent as Lineage, name)).map(row =>
            metadata(row, produce)
          )
        },
        async list(parent) {
          return (await provider.list(depth === 1 ? null : parent as Lineage)).map(row =>
            metadata(row, produce)
          )
        },
        async resolve(address) {
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
        async update(node, name) {
          readDocumentStoreName(name)
          return metadata(await provider.update(node, name), produce)
        },
        async delete(node) {
          return await provider.delete(node)
        }
      }
    }

    this.namespace = {
      ...common<NamespaceId, void>(1, namespaceIdentity),
      async create(name, suppliedId) {
        readDocumentStoreName(name)
        return metadata(
          await provider.create({ namespace: readDocumentStoreId(suppliedId) }, name),
          namespaceIdentity
        )
      }
    }
    this.bucket = {
      ...common<BucketId, NamespaceId>(2, bucketIdentity),
      async create(parent, name, suppliedId) {
        readDocumentStoreName(name)
        return metadata(
          await provider.create(childLineage(parent, readDocumentStoreId(suppliedId)), name),
          bucketIdentity
        )
      }
    }
    this.document = {
      ...common<DocumentId, BucketId>(3, documentIdentity),
      async create(parent, name, body, suppliedId) {
        readDocumentStoreName(name)
        const node = childLineage(parent, readDocumentStoreId(suppliedId))
        return metadata(await provider.create(node, name, body), documentIdentity)
      },
      async read(node) {
        return await provider.read(node)
      },
      async link(node) {
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

/** Parse an address, text or segments, by the grammar, failing as a 422 ApiError. */
const readDocumentStoreAddress = (address: string | DocumentAddress): DocumentAddress => {
  try {
    return typeof address === 'string'
      ? DocumentAddresses.parse(address)
      : DocumentAddresses.parse(DocumentAddresses.format(address))
  } catch (error) {
    if (error instanceof ValidatorError) throw new ApiError(error.message, 422)
    throw error
  }
}

/** Validate a supplied id or mint one when absent. */
const readDocumentStoreId = (suppliedId?: Id): Id => {
  if (suppliedId !== undefined && !isId(suppliedId)) {
    throw new ApiError('Document store id must be a UUID v7', 422)
  }
  return suppliedId ?? id()
}
