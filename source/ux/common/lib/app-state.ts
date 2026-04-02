/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ App state store                                                              ║
║ Per-app IndexedDB preference store factory.                                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Creates a per-app preference store bound to a named IndexedDB store. Each app
constructs one instance using its canonical store name. IDB operations are
stubbed pending makeCrudIndexedDbClient implementation.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AppState  Singleton API for reading and writing persisted app state values.
*/

import type { Dictionary, Instance } from '@core/std'
import { type ApiErrorDetail, apiError, throwApiError } from '@core/api/api-contract.ts'
import { IndexedDb } from '@core/db/indexeddb.ts'

/** Persisted app-state record shape stored in IndexedDB. */
type AppStateStore = Instance & { state: Dictionary }

/** IndexedDB-backed app-state provider. */
class AppStateProvider {
  /** */
  #schema = 'AppStateStore'
  #id = 'AppStateId'

  /** Registers the app-state object store schema. */
  constructor() { IndexedDb.registerStore(this.#schema) }

  /** Loads the persisted app-state dictionary. */
  async #getAppState(): Promise<Dictionary> {
    let state: Dictionary
    try {
      const db = await IndexedDb.connection()
      const record = await db.get(this.#schema, this.#id)
      state = record?.state ?? {}
    } catch (error) {
      if (apiError(error)) throw error
      throwApiError(error as ApiErrorDetail, 'Read Failure', IndexedDb.errorToStatus(error))
    }
    return state
  }

  /** Persists the full app-state dictionary. */
  async #setAppState(state: Dictionary): Promise<void> {
    try {
      const record: AppStateStore = { id: this.#id, state }
      const db = await IndexedDb.connection()
      await db.put(this.#schema, record)
    } catch (error) {
      if (apiError(error)) throw error
      throwApiError(error as ApiErrorDetail, 'Read Failure', IndexedDb.errorToStatus(error))
    }
  }

  /** */
  async get(key: string): Promise<string | unknown> {
    const state = await this.#getAppState()
    return state[key]
  }

  /** */
  async set(key: string, value: string): Promise<void> {
    const state = await this.#getAppState()
    state[key] = value
    await this.#setAppState(state)
  }
}

// Singleton AppState
const AppState = new AppStateProvider()

export { AppState }
