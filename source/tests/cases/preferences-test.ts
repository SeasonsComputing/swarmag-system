/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Preferences identity tests                                                   ║
║ Verify explicit row identity, persistence, and legacy-key separation.        ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import { Preferences } from '@core/cli/preferences.ts'
import { IndexedDb } from '@core/db/indexeddb.ts'
import { id } from '@core/std'
import type { Dictionary } from '@core/std'
import { assertEquals } from '@std/assert'

Deno.test('Preferences uses explicit identity and preserves the legacy name-keyed row', async () => {
  const STORE = 'preferences-test'
  const identity = id()
  const REGISTERED: string[] = []
  const stored = new Map<string, Dictionary>([
    [STORE, { id: STORE, state: { theme: 'legacy' } }]
  ])
  const originalRegister = IndexedDb.registerStore
  const originalConnection = IndexedDb.connection
  const store = {
    get: (key: string) => Promise.resolve(structuredClone(stored.get(key))),
    put: (row: Dictionary) => {
      stored.set(row['id'] as string, structuredClone(row))
      return Promise.resolve(row['id'])
    }
  }
  IndexedDb.registerStore = name => {
    REGISTERED.push(name)
  }
  IndexedDb.connection = () =>
    Promise.resolve({
      get: (name: string, key: string) => {
        assertEquals(name, STORE)
        return store.get(key)
      },
      put: (name: string, row: Dictionary) => {
        assertEquals(name, STORE)
        return store.put(row)
      },
      transaction: (name: string, mode: string) => {
        assertEquals(name, STORE)
        assertEquals(mode, 'readwrite')
        return { store, done: Promise.resolve() }
      }
    } as unknown as Awaited<ReturnType<typeof IndexedDb.connection>>)
  try {
    const prefs = new Preferences(STORE, identity)
    assertEquals(await prefs.state(), {})
    assertEquals(await prefs.get('theme'), undefined)
    assertEquals(stored.get(identity), { id: identity, state: {} })
    await prefs.set('theme', 'dark')

    const reopened = new Preferences(STORE, identity)
    assertEquals(await reopened.state(), { theme: 'dark' })
    await reopened.set('panels', 'collapsed')
    assertEquals(await prefs.state(), { theme: 'dark', panels: 'collapsed' })

    const separate = new Preferences(STORE, id())
    assertEquals(await separate.state(), {})
    await separate.set('theme', 'light')
    assertEquals(await separate.get('theme'), 'light')
    assertEquals(await reopened.get('theme'), 'dark')
    assertEquals(stored.get(STORE), { id: STORE, state: { theme: 'legacy' } })
    assertEquals(REGISTERED, [STORE, STORE, STORE])
  } finally {
    IndexedDb.registerStore = originalRegister
    IndexedDb.connection = originalConnection
  }
})
