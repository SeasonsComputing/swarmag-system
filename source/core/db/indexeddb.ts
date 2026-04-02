/**
 * Provides a managed, singleton connection to IndexedDB.
 */

import { Config } from '@core/cfg/config.ts'
import { type Dictionary, StringSet } from '@core/std'
import { type IDBPDatabase, openDB } from '@idb'

/** Internal cache type for named database connections. */
type ConnectionCache = Dictionary<Promise<IDBPDatabase>>

/** Internal registry type for tracking stores per database namespace. */
type StoreRegistry = Dictionary<StringSet>

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
  static registerStore(storeName: string): void {
    const dbName = this.#activeDbName
    if (!this.#registry[dbName]) this.#registry[dbName] = new StringSet()
    this.#registry[dbName].add(storeName)
  }

  /** Return the singleton connection for the active database. */
  static connection(): Promise<IDBPDatabase> {
    const name = this.#activeDbName

    // 1. If the Promise exists in the Dictionary, return it immediately.
    // Use an explicit undefined check to satisfy the linter.
    if (this.#cache[name] !== undefined) return this.#cache[name]

    // 2. Initialize the Promise and store it in the Dictionary.
    // This "locks" the slot so concurrent calls await the same instance.
    const connectionPromise = openDB(name, 1, {
      upgrade(db) {
        const stores = IndexedDb.#registry[name]
        if (!stores) return
        stores.forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'id' })
          }
        })
      }
    })

    // Cache connection
    this.#cache[name] = connectionPromise
    return connectionPromise
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
