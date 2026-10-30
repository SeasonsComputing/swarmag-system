/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Document store kernel                                                        ║
║ Boundary validation and address resolution over a provider.                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Builds the hierarchy over a provider. This module is internal to core/cli;
applications use a concrete provider maker and the shared contract/grammar.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
makeDocumentStore(provider, lifetime)     Compose nodes over a provider.
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

/** Compose the internal kernel; lifetime is a duration in milliseconds. */
export const makeDocumentStore = (
  provider: DocumentProviderContract,
  linkLifetime: number
): ApiDocumentStoreContract => {
  const metadata = <I extends NodeId>(
    row: LineageMetadata,
    produce: (node: Lineage) => I
  ): NodeMetadata<I> => ({
    id: produce(row.lineage),
    name: row.name,
    createdAt: row.createdAt,
    count: row.count
  })

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

  return {
    namespace: {
      ...common<NamespaceId, void>(1, namespaceIdentity),
      async create(name) {
        readDocumentStoreName(name)
        return metadata(await provider.create({ namespace: id() }, name), namespaceIdentity)
      }
    },
    bucket: {
      ...common<BucketId, NamespaceId>(2, bucketIdentity),
      async create(parent, name) {
        readDocumentStoreName(name)
        return metadata(await provider.create(childLineage(parent, id()), name), bucketIdentity)
      }
    },
    document: {
      ...common<DocumentId, BucketId>(3, documentIdentity),
      async create(parent, name, body, suppliedId) {
        readDocumentStoreName(name)
        if (suppliedId !== undefined && !isId(suppliedId)) {
          throw new ApiError('Document id must be a UUID v7', 422)
        }
        const node = childLineage(parent, suppliedId ?? id())
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

const readDocumentStoreName = (name: string): void => {
  try {
    DocumentAddresses.build(name)
  } catch (error) {
    if (error instanceof ValidatorError) throw new ApiError(error.message, 422)
    throw error
  }
}

const childLineage = (parent: Lineage | null, child: Id): Lineage => {
  if (parent === null) return { namespace: child }
  if (parent.bucket === undefined) return { namespace: parent.namespace, bucket: child }
  return { namespace: parent.namespace, bucket: parent.bucket, document: child }
}

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
