/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Soft-deleted reference API tests                                             ║
║ Verify read, list, and write contracts for deleted references.               ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Soft-delete read, list, and write contracts across Supabase and IndexedDB clients.
*/

import { makeCrudIndexedDbClient } from '@core/cli/make-indexeddb-client.ts'
import { makeCrudSupabaseClient } from '@core/cli/make-supabase-client.ts'
import { IndexedDb } from '@core/db/indexeddb.ts'
import { Supabase } from '@core/db/supabase.ts'
import { id, toWhen } from '@core/std'
import type { Dictionary, Id, Validator } from '@core/std'
import { ApiError, makeScopedUpdate } from '@core/stdx'
import type { ApiCrudContract } from '@core/stdx'
import type { User } from '@domain/abstractions/user.ts'
import { UserAdapter } from '@domain/adapters/user-adapter.ts'
import { assertEquals, assertRejects } from '@std/assert'
import { createClient } from '@supabase/client'
import { UserSamples } from '@tests/fixtures/user-samples.ts'

const AcceptAllValidator: Validator<User> = { validateCreate: () => null, validateUpdate: () => null }
const DisplayNameUpdate = makeScopedUpdate([UserAdapter.displayName])

Deno.test('IndexedDB resolves deleted references and refuses subsequent writes', async () => {
  const originalRegister = IndexedDb.registerStore
  const originalConnection = IndexedDb.connection
  const users = records()
  const stored = new Map(users.map(user => [user.id, UserAdapter.fromDomain(user)]))
  const store = {
    get: (key: Id) => Promise.resolve(structuredClone(stored.get(key))),
    put: (row: Dictionary) => {
      stored.set(row['id'] as Id, structuredClone(row))
      return Promise.resolve(row['id'])
    }
  }
  IndexedDb.registerStore = () => {}
  IndexedDb.connection = () =>
    Promise.resolve({
      name: 'soft-delete-test',
      get: (_store: string, key: Id) => store.get(key),
      getAll: () => Promise.resolve([...stored.values()].map(row => structuredClone(row))),
      transaction: () => ({ store, done: Promise.resolve() })
    } as unknown as Awaited<ReturnType<typeof IndexedDb.connection>>)
  try {
    await verifyContract(
      makeCrudIndexedDbClient({ store: 'users', adapter: UserAdapter, validator: AcceptAllValidator }),
      users
    )
  } finally {
    IndexedDb.registerStore = originalRegister
    IndexedDb.connection = originalConnection
  }
})

Deno.test('Supabase resolves deleted references and retains list and write filters', async () => {
  const original = Supabase.client
  const users = records()
  const stored = new Map(users.map(user => [user.id, UserAdapter.fromDomain(user)]))
  const sdk = createClient('http://soft-delete.test', 'public-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: (input, init) => {
        const url = new URL(String(input))
        const key = url.searchParams.get('id')?.slice(3)
        const mutation = init?.method === 'PATCH'
        const activeOnly = mutation || key === undefined
        assertEquals(url.searchParams.get('deleted_at'), activeOnly ? 'is.null' : null)
        const matches = [...stored.values()].filter(row =>
          (key === undefined || row['id'] === key) && (!activeOnly || row['deleted_at'] == null)
        )
        if (key !== undefined && matches.length === 0) {
          return Promise.resolve(jsonResponse({ code: 'PGRST116', message: 'Record not found' }, 406))
        }
        if (mutation) {
          const patch = JSON.parse(init.body as string) as Dictionary
          for (const row of matches) Object.assign(row, patch)
        }
        return Promise.resolve(jsonResponse(key === undefined ? matches : matches[0]))
      }
    }
  })
  Supabase.client = () => sdk
  try {
    await verifyContract(
      makeCrudSupabaseClient({ table: 'users', adapter: UserAdapter, validator: AcceptAllValidator }),
      users
    )
  } finally {
    Supabase.client = original
  }
})

// Independent live and deleted Users for each backing-store contract test.
const records = (): User[] => [
  { ...structuredClone(UserSamples.operations), id: id() },
  {
    ...structuredClone(UserSamples.operations),
    id: id(),
    displayName: 'Deleted reference target',
    deletedAt: toWhen('2026-10-13T12:00:00Z')
  }
]

// Verify observable behavior without depending on provider-specific error messages.
const verifyContract = async (client: ApiCrudContract<User>, [live, deleted]: User[]): Promise<void> => {
  assertEquals(await client.get(deleted.id), deleted)
  assertEquals((await client.list()).data.map(user => user.id), [live.id])
  const updateError = await assertRejects(
    () => client.update(DisplayNameUpdate, { id: deleted.id, displayName: 'Forbidden edit' }),
    ApiError
  )
  assertEquals(updateError.status, 404)
  const deleteError = await assertRejects(() => client.delete(deleted.id), ApiError)
  assertEquals(deleteError.status, 404)
  assertEquals(await client.get(deleted.id), deleted)

  const updated = await client.update(DisplayNameUpdate, { id: live.id, displayName: 'Live edit' })
  assertEquals(updated.displayName, 'Live edit')
  const removed = await client.delete(live.id)
  assertEquals((await client.get(live.id)).deletedAt, removed.deletedAt)
  assertEquals((await client.list()).data, [])
  const missingError = await assertRejects(() => client.get(id()), ApiError)
  assertEquals(missingError.status, 404)
}

// Encode the storage response consumed by the real Supabase SDK.
const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
