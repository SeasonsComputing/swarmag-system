/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ IndexedDB document store                                                     ║
║ Transactional local document nodes, bytes, and temporary Blob links.         ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Provides browser-owned persistence for a composed document kernel. Nodes and
bytes are keyed by full lineage. Each operation uses one transaction; all participating
writes include both stores to serialize parent deletion against child creation.
Storage persistence is requested once on first use without delaying operations;
refusal leaves best-effort storage available. No server authorization or
cross-device sharing is implied.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
IndexedDbDocumentProvider               Browser persistence over validated lineage.
├ constructor(dbKey)                    Register Nodes and Content by config key.
├ get                                  Read node metadata.
├ find                                 Match children by name.
├ list                                 Read direct children.
├ create                                Create or return the existing node.
├ update                                Rename a node.
├ delete                                Delete documents or empty containers.
├ read                                  Read document bytes.
└ link                                  Mint a temporary Blob URL.
*/

import { IndexedDb } from '@core/db/indexeddb.ts'
import { when } from '@core/std'
import type { Id, When } from '@core/std'
import { ApiError } from '@core/stdx'
import type { DocumentProviderContract, Lineage, LineageMetadata } from '@core/stdx'
import type { DBSchema, IDBPDatabase, IDBPTransaction } from '@idb'

/** Provider over the browser's IndexedDB; every operation is one transaction over both stores. */
export class IndexedDbDocumentProvider implements DocumentProviderContract {
  constructor(private readonly dbKey: string) {
    IndexedDb.registerStore('Nodes', {
      keyPath: 'lineage',
      indexes: { parent: { keyPath: 'parent' }, parentName: { keyPath: ['parent', 'name'] } }
    }, dbKey)
    IndexedDb.registerStore('Content', { keyPath: 'lineage' }, dbKey)
  }

  /** Persistent storage, requested once and never awaited; a refusal leaves best-effort storage. */
  #persistence: Promise<boolean> | undefined

  /** Run one operation in a transaction, aborting it on any failure so no partial write commits. */
  async #run<T, Mode extends 'readonly' | 'readwrite'>(
    mode: Mode,
    operation: (tx: DocumentTransaction<Mode>) => Promise<T>
  ): Promise<T> {
    let tx: DocumentTransaction<Mode> | undefined
    try {
      this.#persistence ??= navigator.storage.persist()
      const db = await IndexedDb.connection(this.dbKey) as IDBPDatabase<DocumentDatabase>
      tx = db.transaction(['Nodes', 'Content'], mode)
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

  /** Read a node's metadata. */
  async get(node: Lineage): Promise<LineageMetadata> {
    return await this.#run('readonly', async tx => this.#metadata(tx, await this.#node(tx, keyOf(node))))
  }

  /** Match a parent's children by name; names need not be unique, so several may match. */
  async find(parent: Lineage | null, name: string): Promise<readonly LineageMetadata[]> {
    return await this.#children(parent, name)
  }

  /** Read a parent's children. */
  async list(parent: Lineage | null): Promise<readonly LineageMetadata[]> {
    return await this.#children(parent)
  }

  /**
   * Create a node under an existing parent. Any node already at that lineage is returned
   * unchanged, preserving its name, timestamp, and bytes.
   */
  async create(node: Lineage, name: string, body?: Blob): Promise<LineageMetadata> {
    return await this.#run('readwrite', async tx => {
      const lineage = keyOf(node)
      const nodes = tx.objectStore('Nodes')
      if (lineage.length > 1) await this.#node(tx, lineage.slice(0, -1))
      const existing = await nodes.get(lineage)
      if (existing !== undefined) {
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
        await tx.objectStore('Content').add({ lineage, body: body! })
      }
      return await this.#metadata(tx, row)
    })
  }

  /** Rename a node; only its name changes. */
  async update(node: Lineage, name: string): Promise<LineageMetadata> {
    return await this.#run('readwrite', async tx => {
      const row = await this.#node(tx, keyOf(node))
      row.name = name
      await tx.objectStore('Nodes').put(row)
      return await this.#metadata(tx, row)
    })
  }

  /**
   * Delete a node; a container only when empty, counted in the same transaction so no child can
   * arrive between the check and the delete.
   */
  async delete(node: Lineage) {
    return await this.#run('readwrite', async tx => {
      const lineage = keyOf(node)
      const row = await this.#node(tx, lineage)
      if (row.level < 3 && await tx.objectStore('Nodes').index('parent').count(lineage) > 0) {
        throw new ApiError('Only empty document containers can be deleted', 409)
      }
      if (row.level === 3) await tx.objectStore('Content').delete(lineage)
      await tx.objectStore('Nodes').delete(lineage)
      return { id: lineage[lineage.length - 1], deletedAt: when() }
    })
  }

  /** Read a document's bytes. */
  async read(node: Lineage): Promise<Blob> {
    return await this.#run('readonly', async tx => {
      await this.#node(tx, keyOf(node))
      return await this.#body(tx, keyOf(node))
    })
  }

  /** Mint a `blob:` URL for a document, revoked when the kernel's expiry passes. */
  async link(node: Lineage, expiresAt: When): Promise<string> {
    const body = await this.read(node)
    const remaining = new Date(expiresAt).getTime() - Date.now()
    if (remaining <= 0) throw new ApiError('Document link expired before issuance completed', 410)
    const url = URL.createObjectURL(body)
    setTimeout(() => URL.revokeObjectURL(url), remaining)
    return url
  }

  /** Read a parent's children, all or those with one name; a null parent lists namespaces. */
  async #children(parent: Lineage | null, name?: string): Promise<readonly LineageMetadata[]> {
    return await this.#run('readonly', async tx => {
      const parentKey = parent === null ? [] : keyOf(parent)
      if (parent !== null) await this.#node(tx, parentKey)
      const nodes = tx.objectStore('Nodes')
      const rows = name === undefined
        ? await nodes.index('parent').getAll(parentKey)
        : await nodes.index('parentName').getAll([parentKey, name])
      return await Promise.all(rows.map(row => this.#metadata(tx, row)))
    })
  }

  /** Read a node in the transaction; a missing node is not found. */
  async #node(tx: DocumentTransaction, lineage: Id[]): Promise<StoredNode> {
    const row = await tx.objectStore('Nodes').get(lineage)
    if (row === undefined) throw new ApiError('Document store node not found', 404)
    return row
  }

  /** Read a document's bytes in the transaction; a node without its bytes is a store fault. */
  async #body(tx: DocumentTransaction, lineage: Id[]): Promise<Blob> {
    const content = await tx.objectStore('Content').get(lineage)
    if (content === undefined) throw new ApiError('Document content is missing', 500)
    return content.body
  }

  /** A node's metadata; its count is a document's size or a container's number of children. */
  async #metadata(tx: DocumentTransaction, row: StoredNode): Promise<LineageMetadata> {
    const count = row.level === 3
      ? (await this.#body(tx, row.lineage)).size
      : await tx.objectStore('Nodes').index('parent').count(row.lineage)
    return { lineage: lineageOf(row.lineage), name: row.name, createdAt: row.createdAt, count }
  }
}

/** A stored node: its lineage key, its parent's lineage, depth, name, and creation time. */
type StoredNode = { lineage: Id[]; parent: Id[]; level: number; name: string; createdAt: When }

/** A document's bytes, keyed by the document's lineage. */
type StoredContent = { lineage: Id[]; body: Blob }

/** The two object stores: nodes, indexed by parent and by parent and name; content, by lineage. */
interface DocumentDatabase extends DBSchema {
  Nodes: {
    key: Id[]
    value: StoredNode
    indexes: { parent: Id[]; parentName: [Id[], string] }
  }
  Content: { key: Id[]; value: StoredContent }
}

/** A transaction spanning both stores, so a node and its bytes commit or fail together. */
type DocumentTransaction<Mode extends 'readonly' | 'readwrite' = 'readonly' | 'readwrite'> =
  IDBPTransaction<
    DocumentDatabase,
    ['Nodes', 'Content'],
    Mode
  >

/** A lineage as its array key, one id per level. */
const keyOf = (node: Lineage): Id[] => {
  if (node.document !== undefined) return [node.namespace, node.bucket!, node.document]
  if (node.bucket !== undefined) return [node.namespace, node.bucket]
  return [node.namespace]
}

/** An array key as a lineage, the inverse of keyOf. */
const lineageOf = (key: Id[]): Lineage => {
  if (key.length === 3) return { namespace: key[0], bucket: key[1], document: key[2] }
  if (key.length === 2) return { namespace: key[0], bucket: key[1] }
  return { namespace: key[0] }
}
