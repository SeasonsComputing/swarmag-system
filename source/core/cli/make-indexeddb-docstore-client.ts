/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ IndexedDB document store                                                     ║
║ Transactional local document nodes, bytes, and temporary Blob links.         ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Makes the document kernel over browser-owned persistence. Nodes and bytes are
keyed by full lineage. Each operation uses one transaction; all participating
writes include both stores to serialize parent deletion against child creation.
Storage persistence is requested once on first use without delaying operations;
refusal leaves best-effort storage available. No server authorization or
cross-device sharing is implied.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
DocumentStoreIndexedDbSpecification     Store configuration.
└ linkLifetime                          Link lifetime in milliseconds.
makeDocumentStoreIndexedDbClient(spec)  Build the browser document store.
*/

import { IndexedDb } from '@core/db/indexeddb.ts'
import { when } from '@core/std'
import type { Id, When } from '@core/std'
import { ApiError } from '@core/stdx'
import type {
  ApiDocumentStoreContract,
  DocumentProviderContract,
  Lineage,
  LineageMetadata
} from '@core/stdx'
import type { DBSchema, IDBPDatabase, IDBPTransaction } from '@idb'
import { makeDocumentStore } from './make-docstore-client.ts'

/** Browser document store configuration; link lifetime is in milliseconds. */
export type DocumentStoreIndexedDbSpecification = { linkLifetime: number }

/** Make a document store; configuration must be initialized before composition. */
export const makeDocumentStoreIndexedDbClient = (
  specification: DocumentStoreIndexedDbSpecification
): ApiDocumentStoreContract => {
  const store = makeDocumentStore(new IndexedDbDocumentProvider(), specification.linkLifetime)
  IndexedDb.registerStore('DocumentNodes', {
    keyPath: 'lineage',
    indexes: { parent: { keyPath: 'parent' }, parentName: { keyPath: ['parent', 'name'] } }
  })
  IndexedDb.registerStore('DocumentContent', { keyPath: 'lineage' })
  return store
}

type StoredNode = { lineage: Id[]; parent: Id[]; level: number; name: string; createdAt: When }
type StoredContent = { lineage: Id[]; body: Blob }

interface DocumentDatabase extends DBSchema {
  DocumentNodes: {
    key: Id[]
    value: StoredNode
    indexes: { parent: Id[]; parentName: [Id[], string] }
  }
  DocumentContent: { key: Id[]; value: StoredContent }
}

type DocumentTransaction<Mode extends 'readonly' | 'readwrite' = 'readonly' | 'readwrite'> =
  IDBPTransaction<
    DocumentDatabase,
    ['DocumentNodes', 'DocumentContent'],
    Mode
  >

class IndexedDbDocumentProvider implements DocumentProviderContract {
  #persistence: Promise<boolean> | undefined

  async #run<T, Mode extends 'readonly' | 'readwrite'>(
    mode: Mode,
    operation: (tx: DocumentTransaction<Mode>) => Promise<T>
  ): Promise<T> {
    let tx: DocumentTransaction<Mode> | undefined
    try {
      this.#persistence ??= navigator.storage.persist()
      const db = await IndexedDb.connection() as IDBPDatabase<DocumentDatabase>
      tx = db.transaction(['DocumentNodes', 'DocumentContent'], mode)
      const result = await operation(tx)
      await tx.done
      return result
    } catch (error) {
      if (tx !== undefined) {
        // A rejected operation must not commit a preceding write. Drain the
        // transaction's rejection as well as the original failing request.
        try {
          tx.abort()
        } catch (abortError) {
          if (!(abortError instanceof DOMException) || abortError.name !== 'InvalidStateError') {
            throw abortError
          }
        }
        await tx.done.catch(() => undefined)
      }
      if (error instanceof ApiError) throw error
      const message = error instanceof Error ? error.message : 'IndexedDB document operation failed'
      throw new ApiError(message, IndexedDb.errorToStatus(error))
    }
  }

  async get(node: Lineage): Promise<LineageMetadata> {
    return await this.#run('readonly', async tx => this.#metadata(tx, await this.#node(tx, keyOf(node))))
  }

  async find(parent: Lineage | null, name: string): Promise<readonly LineageMetadata[]> {
    return await this.#children(parent, name)
  }

  async list(parent: Lineage | null): Promise<readonly LineageMetadata[]> {
    return await this.#children(parent)
  }

  async create(node: Lineage, name: string, body?: Blob): Promise<LineageMetadata> {
    return await this.#run('readwrite', async tx => {
      const lineage = keyOf(node)
      const nodes = tx.objectStore('DocumentNodes')
      if (lineage.length > 1) await this.#node(tx, lineage.slice(0, -1))
      const existing = await nodes.get(lineage)
      if (existing !== undefined) {
        if (lineage.length !== 3) throw new ApiError('Document store node already exists', 409)
        return await this.#metadata(tx, existing)
      }
      const row: StoredNode = {
        lineage,
        parent: lineage.slice(0, -1),
        level: lineage.length,
        name,
        createdAt: when()
      }
      await nodes.add(row)
      if (lineage.length === 3) {
        await tx.objectStore('DocumentContent').add({ lineage, body: body! })
      }
      return await this.#metadata(tx, row)
    })
  }

  async update(node: Lineage, name: string): Promise<LineageMetadata> {
    return await this.#run('readwrite', async tx => {
      const row = await this.#node(tx, keyOf(node))
      row.name = name
      await tx.objectStore('DocumentNodes').put(row)
      return await this.#metadata(tx, row)
    })
  }

  async delete(node: Lineage) {
    return await this.#run('readwrite', async tx => {
      const lineage = keyOf(node)
      const row = await this.#node(tx, lineage)
      if (row.level < 3 && await tx.objectStore('DocumentNodes').index('parent').count(lineage) > 0) {
        throw new ApiError('Only empty document containers can be deleted', 409)
      }
      if (row.level === 3) await tx.objectStore('DocumentContent').delete(lineage)
      await tx.objectStore('DocumentNodes').delete(lineage)
      return { id: lineage[lineage.length - 1], deletedAt: when() }
    })
  }

  async read(node: Lineage): Promise<Blob> {
    return await this.#run('readonly', async tx => {
      await this.#node(tx, keyOf(node))
      return await this.#body(tx, keyOf(node))
    })
  }

  async link(node: Lineage, expiresAt: When): Promise<string> {
    const body = await this.read(node)
    const remaining = new Date(expiresAt).getTime() - Date.now()
    if (remaining <= 0) throw new ApiError('Document link expired before issuance completed', 410)
    const url = URL.createObjectURL(body)
    setTimeout(() => URL.revokeObjectURL(url), remaining)
    return url
  }

  async #children(parent: Lineage | null, name?: string): Promise<readonly LineageMetadata[]> {
    return await this.#run('readonly', async tx => {
      const parentKey = parent === null ? [] : keyOf(parent)
      if (parent !== null) await this.#node(tx, parentKey)
      const nodes = tx.objectStore('DocumentNodes')
      const rows = name === undefined
        ? await nodes.index('parent').getAll(parentKey)
        : await nodes.index('parentName').getAll([parentKey, name])
      return await Promise.all(rows.map(row => this.#metadata(tx, row)))
    })
  }

  async #node(tx: DocumentTransaction, lineage: Id[]): Promise<StoredNode> {
    const row = await tx.objectStore('DocumentNodes').get(lineage)
    if (row === undefined) throw new ApiError('Document store node not found', 404)
    return row
  }

  async #body(tx: DocumentTransaction, lineage: Id[]): Promise<Blob> {
    const content = await tx.objectStore('DocumentContent').get(lineage)
    if (content === undefined) throw new ApiError('Document content is missing', 500)
    return content.body
  }

  async #metadata(tx: DocumentTransaction, row: StoredNode): Promise<LineageMetadata> {
    const count = row.level === 3
      ? (await this.#body(tx, row.lineage)).size
      : await tx.objectStore('DocumentNodes').index('parent').count(row.lineage)
    return { lineage: lineageOf(row.lineage), name: row.name, createdAt: row.createdAt, count }
  }
}

const keyOf = (node: Lineage): Id[] => {
  if (node.document !== undefined) return [node.namespace, node.bucket!, node.document]
  if (node.bucket !== undefined) return [node.namespace, node.bucket]
  return [node.namespace]
}

const lineageOf = (key: Id[]): Lineage => {
  if (key.length === 3) return { namespace: key[0], bucket: key[1], document: key[2] }
  if (key.length === 2) return { namespace: key[0], bucket: key[1] }
  return { namespace: key[0] }
}
