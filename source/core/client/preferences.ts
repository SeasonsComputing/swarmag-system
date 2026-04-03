/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Preferences persistence library                                              ║
║ IndexedDB-backed preference get/set with serialized writes.                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Provides a small persistence wrapper for app preference state in IndexedDB.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
Preferences - Persistent preferences backed by IndexedDB.
├ state()          Return the full persisted preferences dictionary.
├ get(key)         Return one preference value by key.
└ set(key, value)  Persist one preference value by key.
*/

import { apiError, type ApiErrorDetail, throwApiError } from '@core/api/api-contract.ts'
import { IndexedDb } from '@core/db/indexeddb.ts'
import type { Instance, StringDictionary } from '@core/std'

/** Preference store must have an id for the db. */
type PreferencesStore = Instance & { state: StringDictionary }

/** IndexedDB-backed app-state provider. */
export class Preferences {
  /** Registers the app-state object store schema. */
  constructor(
    protected readonly schema: string,
    protected readonly id: string = schema
  ) {
    IndexedDb.registerStore(schema)
  }

  /** Loads the persisted app-state StringDictionary. */
  protected async getAppState(): Promise<StringDictionary> {
    try {
      let state: StringDictionary = {}
      const db = await IndexedDb.connection()
      const record = await db.get(this.schema, this.id) as PreferencesStore
      record === undefined
        ? await this.setAppState(state) // initial create
        : state = record.state
      return state
    } catch (error) {
      if (apiError(error)) throw error
      throwApiError(error as ApiErrorDetail, 'Read Failure', IndexedDb.errorToStatus(error))
    }
  }

  /** Persists the full app-state StringDictionary. */
  protected async setAppState(state: StringDictionary): Promise<void> {
    try {
      const record: PreferencesStore = { id: this.id, state }
      const db = await IndexedDb.connection()
      await db.put(this.schema, record)
    } catch (error) {
      if (apiError(error)) throw error
      throwApiError(error as ApiErrorDetail, 'Update Failure', IndexedDb.errorToStatus(error))
    }
  }

  /** Fetch the full preference StringDictionary */
  async state(): Promise<StringDictionary> {
    return await this.getAppState()
  }

  /** Get a preference value. */
  async get(key: string): Promise<string | unknown> {
    const state = await this.getAppState()
    return state[key]
  }

  /** Set a preference value. */
  async set(key: string, value: string): Promise<void> {
    try {
      const db = await IndexedDb.connection()
      const tx = db.transaction(this.schema, 'readwrite')
      const record = await tx.store.get(this.id)
      const state: StringDictionary = record ? record.state : {}
      state[key] = value
      await tx.store.put({ id: this.id, state })
      await tx.done
    } catch (error) {
      if (apiError(error)) throw error
      throwApiError(error as ApiErrorDetail, 'Update Failure', IndexedDb.errorToStatus(error))
    }
  }
}
