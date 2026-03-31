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
AppStateStore         Per-app preference store type.
makeAppStateStore     Create a preference store for the given app store name.
*/

import type { Dictionary } from '@core/std'

// TODO: replace stub with makeCrudIndexedDbClient<AppState> when implemented

/** Preference value shape — opaque key/value dictionary. */
type AppState = Dictionary

/** Per-app IndexedDB preference store contract. */
export type AppStateStore = {
  storeName: string
  getPreference(key: string): Promise<AppState | undefined>
  setPreference(key: string, value: AppState): Promise<void>
}

/** Create a preference store bound to the given app IndexedDB store name. */
export const makeAppStateStore = (storeName: string): AppStateStore => ({
  storeName,
  // TODO: replace stub with makeCrudIndexedDbClient<AppState> when implemented
  getPreference: (_key: string): Promise<AppState | undefined> => Promise.resolve(undefined),
  setPreference: (_key: string, _value: AppState): Promise<void> => Promise.resolve()
})
