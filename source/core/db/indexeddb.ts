/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ IndexedDB connection manager                                                 ║
║ Singleton browser database connections with registered object stores.        ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Manages IndexedDB connections for the active local database name, upgrades the
database when registered stores or indexes are missing. Maps storage errors
to status.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
IndexedDbStore         Optional store configuration.
├ keyPath              Stored key path; defaults to id.
└ indexes              Named index declarations.
IndexedDbIndex         Index configuration.
├ keyPath              Indexed field or compound fields.
├ unique               Reject duplicate index keys when true.
└ multiEntry           Index each array member when true.
IndexedDb              IndexedDB connection manager.
├ registerStore(...)   Register a store, optional key path, and indexes.
├ connection()         Return the singleton connection for the active database.
└ errorToStatus(error) Map standard DOMExceptions to HTTP-style status codes.
*/

import { Config } from '@core/cfg/config.ts'
import type { Dictionary } from '@core/std'
import { type IDBPDatabase, openDB } from '@idb'

/** Index declaration applied during database upgrade. */
export type IndexedDbIndex = {
  keyPath: string | string[]
  unique?: boolean
  multiEntry?: boolean
}

/** Optional store configuration; absent key paths retain the legacy id key. */
export type IndexedDbStore = {
  keyPath?: string | string[]
  indexes?: Dictionary<IndexedDbIndex>
}

/** Internal cache type for named database connections. */
type ConnectionCache = Dictionary<Promise<IDBPDatabase>>

/** Internal registry type for tracking stores per database namespace. */
type StoreRegistry = Dictionary<Dictionary<IndexedDbStore>>

/** IndexedDB connection manager for the active local database. */
export class IndexedDb {
  /** Internal registry of store names. */
  static #registry: StoreRegistry = {}

  /** Singleton connection instance cache indexed by database name. */
  static #cache: ConnectionCache = {}

  /** Internal helper to resolve the physical database name from Config. */
  static get #activeDbName(): string {
    return Config.get('LOCAL_DB_NAME')
  }

  /**
   * Register a store name for the current deployment's database.
   * MUST be called by makeCrudIndexedDbClient during module evaluation.
   */
  static registerStore(storeName: string, specification: IndexedDbStore = {}): void {
    const dbName = this.#activeDbName
    const stores = this.#registry[dbName] ??= {}
    const declared = structuredClone(specification)
    const previous = stores[storeName]
    if (previous !== undefined) {
      if (JSON.stringify(previous) !== JSON.stringify(declared)) {
        Config.fail(`IndexedDB store already registered with another specification: ${storeName}`)
      }
      return
    }
    stores[storeName] = declared
  }

  /** Return the singleton connection for the active database. */
  static connection(): Promise<IDBPDatabase> {
    const name = this.#activeDbName

    // 1. If the Promise exists in the Dictionary, return it immediately.
    // Use an explicit undefined check to satisfy the linter.
    if (this.#cache[name] !== undefined) return this.#cache[name]

    // 2. Initialize the Promise and store it in the Dictionary.
    // This "locks" the slot so concurrent calls await the same instance.
    const stores = this.#registry[name] ?? {}
    const connectionPromise = this.#openConnection(name, stores)

    // Cache connection
    this.#cache[name] = connectionPromise
    return connectionPromise
  }

  /** Add missing stores and indexes without replacing existing stores or records. */
  static async #openConnection(
    name: string,
    stores: Dictionary<IndexedDbStore>
  ): Promise<IDBPDatabase> {
    const db = await openDB(name, undefined, {
      blocking: () => {
        db.close()
        delete this.#cache[name]
      }
    })
    let needsUpgrade = false
    try {
      for (const [storeName, specification] of Object.entries(stores)) {
        if (!db.objectStoreNames.contains(storeName)) {
          needsUpgrade = true
          continue
        }
        const tx = db.transaction(storeName)
        const store = tx.objectStore(storeName)
        if (JSON.stringify(store.keyPath) !== JSON.stringify(specification.keyPath ?? 'id')) {
          Config.fail(`IndexedDB key path differs from its declaration: ${storeName}`)
        }
        for (const [indexName, declaration] of Object.entries(specification.indexes ?? {})) {
          if (!store.indexNames.contains(indexName)) {
            needsUpgrade = true
            continue
          }
          const index = store.index(indexName)
          if (
            JSON.stringify(index.keyPath) !== JSON.stringify(declaration.keyPath)
            || index.unique !== (declaration.unique ?? false)
            || index.multiEntry !== (declaration.multiEntry ?? false)
          ) {
            Config.fail(`IndexedDB index differs from its declaration: ${storeName}.${indexName}`)
          }
        }
        await tx.done
      }
    } catch (error) {
      db.close()
      throw error
    }
    if (!needsUpgrade) return db
    const nextVersion = db.version + 1
    db.close()

    const upgraded = await openDB(name, nextVersion, {
      upgrade(upgradeDb, _oldVersion, _newVersion, tx) {
        for (const [storeName, specification] of Object.entries(stores)) {
          const store = upgradeDb.objectStoreNames.contains(storeName)
            ? tx.objectStore(storeName)
            : upgradeDb.createObjectStore(storeName, { keyPath: specification.keyPath ?? 'id' })
          for (const [indexName, declaration] of Object.entries(specification.indexes ?? {})) {
            if (!store.indexNames.contains(indexName)) {
              store.createIndex(indexName, declaration.keyPath, {
                unique: declaration.unique ?? false,
                multiEntry: declaration.multiEntry ?? false
              })
            }
          }
        }
      },
      blocking: () => {
        upgraded.close()
        delete this.#cache[name]
      }
    })
    return upgraded
  }

  /** Utility to map standard DOMExceptions to HTTP-style status codes.  */
  static errorToStatus(error: unknown): number {
    if (error instanceof Error) {
      if (error.name === 'NotFoundError') return 404
      if (error.name === 'ConstraintError') return 409
      if (error.name === 'VersionError') return 500
      if (error.name === 'QuotaExceededError') return 507
    }
    return 500
  }
}
