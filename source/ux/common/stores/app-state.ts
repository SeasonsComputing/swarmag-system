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
AppStateStore - Application state store structure (StringDictionary)
AppState      - Singleton API for reading and writing persisted app state values.
├ store            Reactive app-state preference snapshot.
├ init()           Load all preferences from persistent storage.
├ set(key, value)  Persist a preference and refresh reactive cache.
└ clear()          Clear reactive app-state cache.
*/

import { Preferences } from '@core/client/preferences.ts'
import type { StringDictionary } from '@core/std'
import { createStore } from '@solid-js/store'

/** Per application preferences state. */
export type AppStateStore = StringDictionary

/** Reactive storage */
const [appStateStore, setAppStateStore] = createStore<AppStateStore>({})

/** Persistent storage */
const appStatePrefs = new Preferences('AppStateStore')

/** Load application state from preferences into store */
async function initAppState() {
  setAppStateStore(await appStatePrefs.state())
}

/** Set preference and persist */
async function setAppStatePreference(key: string, value: string) {
  setAppStateStore(key, value)
  await appStatePrefs.set(key, value)
}

/** Reset cache */
const clearAppState = () => setAppStateStore({})

/** AppState store singleton */
const AppState = {
  store: appStateStore,
  init: initAppState,
  set: setAppStatePreference,
  clear: clearAppState
}

export { AppState }
