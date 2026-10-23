/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ List client API tests                                                        ║
║ Verify database-free Supabase, HTTP, and IndexedDB list contracts.           ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Database-free list clients: real SDK request construction, HTTP forwarding,
and IndexedDB paging over a test connection's records.
*/

import { makeCrudHttpClient } from '@core/cli/make-http-client.ts'
import { makeCrudIndexedDbClient } from '@core/cli/make-indexeddb-client.ts'
import { makeCrudSupabaseClient, makeSupabaseListRequest } from '@core/cli/make-supabase-client.ts'
import { IndexedDb } from '@core/db/indexeddb.ts'
import { Supabase } from '@core/db/supabase.ts'
import { id } from '@core/std'
import type { Dictionary, Instantiable, Validator } from '@core/std'
import { ApiError, listQuery, makeQuery, readListCursor, writeListCursor } from '@core/stdx'
import type { Adapter, CrudListContract, ListOptions, Query } from '@core/stdx'
import type { Facet } from '@domain/abstractions/common.ts'
import type { JobPlan } from '@domain/abstractions/job.ts'
import type { User } from '@domain/abstractions/user.ts'
import { FacetAdapter } from '@domain/adapters/common-adapter.ts'
import { JobPlanAdapter } from '@domain/adapters/job-adapter.ts'
import { UserAdapter } from '@domain/adapters/user-adapter.ts'
import { queries } from '@front/api/queries.ts'
import { assert, assertEquals, assertRejects, assertThrows } from '@std/assert'
import { createClient } from '@supabase/client'
import { UserSamples } from '@tests/fixtures/user-samples.ts'

/** Users table spec shared by the Supabase translation tests. */
const Spec = { table: 'users', adapter: UserAdapter }
/** Validator that accepts everything; validation is not under test. */
const AcceptAllValidator: Validator<User> = { validateCreate: () => null, validateUpdate: () => null }
// A sales User sample with a fresh id, the given name, and the given changes.
const sample = (displayName: string, changes: Partial<User> = {}): User => ({
  ...UserSamples.sales,
  id: id(),
  displayName,
  ...changes
})

Deno.test('Supabase translation combines roles, search, and both keyset directions', () => {
  for (const direction of ['asc', 'desc'] as const) {
    const query = queries.Users.byRole.build({
      where: { roles: { hasAny: ['sales', 'operations'], hasAll: ['sales'] }, status: { eq: 'active' } },
      search: 'Ada',
      order: { field: 'displayName', direction }
    })
    const rowId = id()
    const cursor = writeListCursor('supabase:users', query, 'Ada', rowId)
    const request = makeSupabaseListRequest(Spec, { query, cursor, limit: 2 })
    const comparison = direction === 'asc' ? 'gt' : 'lt'
    assertEquals(request.column, 'display_name')
    assertEquals(request.limit, 2)
    assertEquals(request.filters, [
      { method: 'or', expression: 'roles.cs."[\\"sales\\"]",roles.cs."[\\"operations\\"]"' },
      { method: 'contains', column: 'roles', value: '["sales"]' },
      { method: 'eq', column: 'status', value: 'active' },
      {
        method: 'or',
        expression: 'display_name.ilike."%Ada%",primary_email.ilike."%Ada%",phone_number.ilike."%Ada%"'
      },
      {
        method: 'or',
        expression:
          `display_name.${comparison}."Ada",and(display_name.eq."Ada",id.${comparison}."${rowId}")`
      }
    ])
  }
})

Deno.test('Supabase range and in operands use native columns and fully quoted values', () => {
  const declaration = makeQuery({
    filter: [UserAdapter.createdAt, UserAdapter.primaryEmail, UserAdapter.status],
    order: [UserAdapter.createdAt]
  })
  const query = declaration.build({
    where: {
      createdAt: { gte: '2026-10-07T03:30:32.719719+00:00', lt: '2026-10-08T00:00:00Z' },
      primaryEmail: { in: ['a,b@example.com', 'quote"@example.com'] },
      status: { eq: 'active' }
    }
  })
  assertEquals(makeSupabaseListRequest(Spec, { query }).filters, [
    { method: 'gte', column: 'created_at', value: '2026-10-07T03:30:32.719719+00:00' },
    { method: 'lt', column: 'created_at', value: '2026-10-08T00:00:00Z' },
    { method: 'in', column: 'primary_email', value: ['a,b@example.com', 'quote"@example.com'] },
    { method: 'eq', column: 'status', value: 'active' }
  ])
})

Deno.test('Supabase requests encode search once and preserve raw cursors', async () => {
  const original = Supabase.client
  const urls: URL[] = []
  const records = [sample('A'), sample('B')].map(user => ({
    ...UserAdapter.fromDomain(user),
    created_at: '2026-10-07T03:30:32.719719+00:00'
  }))
  const sdk = createClient('http://list.test', 'public-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: (input, _init) => {
        urls.push(new URL(String(input)))
        return Promise.resolve(
          new Response(JSON.stringify(records), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          })
        )
      }
    }
  })
  Supabase.client = () => sdk
  try {
    const client = makeCrudSupabaseClient({ ...Spec, validator: AcceptAllValidator })
    const term = '%_\\"(),*'
    const query = queries.Users.byRole.build({ search: term })
    await client.list({ query, limit: 1 })
    const pattern = '%\\%\\_\\\\"(),%'
    assertEquals(
      urls[0].searchParams.get('or'),
      `(display_name.ilike.${JSON.stringify(pattern)},`
        + `primary_email.ilike.${JSON.stringify(pattern)},phone_number.ilike.${JSON.stringify(pattern)})`
    )
    assertEquals(urls[0].searchParams.get('limit'), '2')
    assertEquals(urls[0].searchParams.get('order'), 'display_name.asc,id.asc')
    assertEquals(urls[0].searchParams.get('deleted_at'), 'is.null')
    for (const term of ['%', '_', '\\', '"', ',', '(', ')', '*', '* *']) {
      const query = queries.Users.byRole.build({ search: term })
      await client.list({ query, limit: 1 })
      const url = urls[urls.length - 1]
      const request = makeSupabaseListRequest(Spec, { query, limit: 1 })
      assertEquals(
        url.searchParams.getAll('or'),
        request.filters.flatMap(filter => filter.method === 'or' ? [`(${filter.expression})`] : [])
      )
    }
    const control = 'Ada\n\tLovelace'
    const controlQuery = queries.Users.byRole.build({
      where: { roles: { hasAny: ['sales'], hasAll: ['sales', 'operations'] }, status: { eq: 'active' } },
      search: control
    })
    const controlCursor = writeListCursor('supabase:users', controlQuery, control, id())
    await client.list({ query: controlQuery, cursor: controlCursor })
    const controlUrl = urls[urls.length - 1]
    const groups = controlUrl.searchParams.getAll('or')
    assertEquals(groups.length, 3)
    assertEquals(groups[0], '(roles.cs."[\\"sales\\"]")')
    assert(groups[1].includes(control))
    assert(groups[2].includes(control))
    assert(!groups[1].includes('\\n'))
    assert(!groups[2].includes('\\t'))
    assertEquals(controlUrl.searchParams.get('roles'), 'cs.["sales","operations"]')
    assertEquals(controlUrl.searchParams.get('status'), 'eq.active')
    const first = await client.list({ limit: 1 })
    assert(first.cursor)
    assert(first.hasMore)
    assertEquals(
      readListCursor(first.cursor, 'supabase:users', listQuery<User>())?.value,
      '2026-10-07T03:30:32.719719+00:00'
    )
    await client.list({ limit: 1, cursor: first.cursor })
    assert(
      urls[urls.length - 1].searchParams.get('or')?.includes(
        'created_at.gt."2026-10-07T03:30:32.719719+00:00"'
      )
    )
    const calls = urls.length
    await assertRejects(() => client.list({ cursor: 'bad!' }), ApiError)
    await assertRejects(() => client.list({ query, cursor: first.cursor! }), ApiError)
    assertEquals(urls.length, calls)
    const last = await client.list({ limit: 100 })
    assertEquals(last.cursor, null)
    assertEquals(last.hasMore, false)
  } finally {
    Supabase.client = original
  }
})

Deno.test('Supabase translation fails fast for unknown filter, search, or order fields', () => {
  for (
    const query of [
      { where: { unknown: { eq: 'x' } }, order: { field: 'displayName', direction: 'asc' } },
      {
        where: {},
        search: { term: 'x', fields: ['unknown'] },
        order: { field: 'displayName', direction: 'asc' }
      },
      { where: {}, order: { field: 'unknown', direction: 'asc' } }
    ]
  ) {
    const error = assertThrows(() =>
      makeSupabaseListRequest(Spec, {
        query: query as unknown as Query<User>
      }), ApiError)
    assertEquals(error.status, 400)
  }
})

Deno.test('IndexedDB pages all records in both directions including collator ties', async () => {
  const users = [
    sample('Zoe'),
    sample('José'),
    sample('Jose\u0301'),
    sample('Ana'),
    sample('Deleted', {
      deletedAt: '2026-10-11T00:00:00Z'
    })
  ]
  await withRecords(UserAdapter, users, async client => {
    const collator = new Intl.Collator('en-US')
    assertEquals(collator.compare('José', 'Jose\u0301'), 0)
    for (const direction of ['asc', 'desc'] as const) {
      const query = queries.Users.byRole.build({ order: { field: 'displayName', direction } })
      const visible = users.filter(user => !user.deletedAt).sort((a, b) => {
        const comparison = collator.compare(a.displayName, b.displayName)
          || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
        return direction === 'asc' ? comparison : -comparison
      })
      const actual = await allPages(client, { query, limit: 1 })
      assertEquals(actual.map(user => user.id), visible.map(user => user.id))
    }
    const queryless = await allPages(client, { limit: 1 })
    assertEquals(
      queryless.map(user => user.id),
      users.filter(user => !user.deletedAt)
        .sort((a, b) => a.id < b.id ? -1 : 1).map(user => user.id)
    )
    const first = await client.list({ limit: 1 })
    assert(first.cursor)
    const changed = queries.Users.byRole.build({ where: { status: { eq: 'inactive' } } })
    await assertRejects(() => client.list({ query: changed, cursor: first.cursor! }), ApiError)
    await assertRejects(() => client.list({ cursor: 'bad!' }), ApiError)
    const foreign = writeListCursor('supabase:users', listQuery<User>(), users[0].createdAt, users[0].id)
    await assertRejects(() => client.list({ cursor: foreign }), ApiError)
    const empty = await client.list({ query: changed })
    assertEquals(empty, { data: [], cursor: null, hasMore: false })
  })
})

Deno.test('IndexedDB ANDs criteria, set predicates, and accent-sensitive search', async () => {
  const users = [
    sample('José Peña', { roles: ['sales', 'operations'], primaryEmail: 'jose@example.com' }),
    sample('Jose Pena', { roles: ['sales'], primaryEmail: 'plain@example.com' }),
    sample('José Other', { roles: ['operations'], primaryEmail: 'other@example.com' }),
    sample('José Inactive', { status: 'inactive', primaryEmail: 'inactive@example.com' })
  ]
  await withRecords(UserAdapter, users, async client => {
    const query = queries.Users.byRole.build({
      where: {
        status: { eq: 'active', in: ['active'] },
        roles: { hasAny: ['sales'], hasAll: ['sales', 'operations'] }
      },
      search: ' JOSÉ '
    })
    assertEquals((await client.list({ query })).data.map(user => user.id), [users[0].id])
    const optional = makeQuery({ filter: [UserAdapter.avatarUrl], order: [UserAdapter.displayName] })
    const absentUsers = users.map(user => ({ ...user, avatarUrl: undefined }))
    await withRecords(UserAdapter, absentUsers, async local => {
      assertEquals(
        (await local.list({ query: optional.build({ where: { avatarUrl: { eq: 'x' } } }) })).data,
        []
      )
    })
    const range = makeQuery({ filter: [UserAdapter.displayName], order: [UserAdapter.displayName] })
    assertEquals(
      (await client.list({
        query: range.build({
          where: {
            displayName: {
              gte: 'Jose Pena',
              lte: 'José Peña'
            }
          }
        })
      })).data.length,
      2
    )
  })
})

Deno.test('HTTP lists forward queries and preserve cursors', async () => {
  const original = globalThis.fetch
  const sent: Dictionary[] = []
  let cursor: string | null = 'opaque-token'
  globalThis.fetch = (_input, init) => {
    sent.push(JSON.parse(String(init?.body)))
    return Promise.resolve(
      new Response(JSON.stringify({ data: [], cursor, hasMore: cursor !== null }), {
        headers: { 'Content-Type': 'application/json' }
      })
    )
  }
  try {
    const client = makeCrudHttpClient<User>({
      basePath: 'http://list.test/users',
      validator: AcceptAllValidator
    })
    const query = queries.Users.byRole.build({ search: 'a' })
    assertEquals((await client.list({ query, cursor: 'incoming', limit: 50 })).cursor, cursor)
    assertEquals(sent[0], { query, cursor: 'incoming', limit: 50 })
    cursor = null
    assertEquals(await client.list(), { data: [], cursor: null, hasMore: false })
    assertEquals(sent[1], {})
  } finally {
    globalThis.fetch = original
  }
})

Deno.test('IndexedDB numeric ranges and numeric cursors page ties in both directions', async () => {
  const plans: JobPlan[] = [2, 0, 4, 2].map(durationEstimate => ({
    id: id(),
    jobId: id(),
    plannerId: id(),
    notes: [],
    durationEstimate,
    scheduledStart: UserSamples.sales.createdAt,
    createdAt: UserSamples.sales.createdAt,
    updatedAt: UserSamples.sales.updatedAt
  }))
  const declaration = makeQuery({
    filter: [JobPlanAdapter.durationEstimate],
    order: [JobPlanAdapter.durationEstimate]
  })
  await withRecords(JobPlanAdapter, plans, async client => {
    for (const direction of ['asc', 'desc'] as const) {
      const query = declaration.build({
        where: { durationEstimate: { gte: 1, lt: 4 } },
        order: { field: 'durationEstimate', direction }
      })
      const expected = plans.filter(plan => plan.durationEstimate === 2)
        .sort((a, b) => direction === 'asc' ? (a.id < b.id ? -1 : 1) : (a.id < b.id ? 1 : -1))
      assertEquals(
        (await allPages(client, { query, limit: 1 })).map(plan => plan.id),
        expected.map(plan => plan.id)
      )
      const first = await client.list({ query, limit: 1 })
      assert(first.cursor)
      assertEquals(readListCursor(first.cursor, 'indexeddb:test-local:users', query)?.value, 2)
    }
    const boundary = declaration.build({ where: { durationEstimate: { gt: 2, lte: 4 } } })
    assertEquals((await client.list({ query: boundary })).data.map(plan => plan.durationEstimate), [4])
  })
})

Deno.test('IndexedDB boolean equality and in retain false as a scalar value', async () => {
  const facets: Facet[] = [true, false].map(active => ({
    id: id(),
    scheme: 'service',
    code: active ? 'active' : 'retired',
    label: 'Example',
    active,
    createdAt: UserSamples.sales.createdAt,
    updatedAt: UserSamples.sales.updatedAt
  }))
  const declaration = makeQuery({ filter: [FacetAdapter.active], order: [FacetAdapter.code] })
  await withRecords(FacetAdapter, facets, async client => {
    const query = declaration.build({ where: { active: { eq: false, in: [false] } } })
    assertEquals((await client.list({ query })).data.map(facet => facet.active), [false])
  })
})

// Run a test against an IndexedDB client stubbed to hold the given records.
const withRecords = async <T extends Instantiable>(
  adapter: Adapter<T>,
  entities: T[],
  run: (client: CrudListContract<T>) => Promise<void>
): Promise<void> => {
  const originalRegister = IndexedDb.registerStore
  const originalConnection = IndexedDb.connection
  IndexedDb.registerStore = () => {}
  IndexedDb.connection = () =>
    Promise.resolve({
      name: 'test-local',
      getAll: () => Promise.resolve(entities.map(entity => adapter.fromDomain(entity)))
    } as unknown as Awaited<ReturnType<typeof IndexedDb.connection>>)
  try {
    await run(makeCrudIndexedDbClient({
      store: 'users',
      adapter,
      validator: { validateCreate: () => null, validateUpdate: () => null }
    }))
  } finally {
    IndexedDb.registerStore = originalRegister
    IndexedDb.connection = originalConnection
  }
}

// Follow cursors to the last page, collecting every record and checking termination.
const allPages = async <T extends Instantiable>(
  client: CrudListContract<T>,
  options: ListOptions<T>
): Promise<T[]> => {
  const users: T[] = []
  let cursor: string | undefined
  for (let pageCount = 0; pageCount < 20; pageCount++) {
    const page = await client.list({ ...options, cursor })
    users.push(...page.data)
    if (!page.hasMore) {
      assertEquals(page.cursor, null)
      return users
    }
    assert(page.cursor)
    cursor = page.cursor
  }
  throw new Error('Paging failed to terminate')
}
