/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ List query API tests                                                         ║
║ Verify query declarations, type constraints, and cursor boundaries.          ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Query declarations, compile-time constraints, and store-local cursor boundaries.
*/

import { id } from '@core/std'
import type { Instantiable } from '@core/std'
import {
  ApiError,
  DEFAULT_LIMIT,
  InstantiableAdapt,
  listAll,
  listFingerprint,
  listPage,
  listPageLimit,
  listQuery,
  makeAdapter,
  makeQuery,
  MAX_LIMIT,
  readListCursor,
  writeListCursor
} from '@core/stdx'
import type { CrudListContract, ListOptions, Query, QuerySet } from '@core/stdx'
import type { Customer } from '@domain/abstractions/customer.ts'
import type { User } from '@domain/abstractions/user.ts'
import { UserAdapter } from '@domain/adapters/user-adapter.ts'
import { queries } from '@front/api/queries.ts'
import { assert, assertEquals, assertThrows } from '@std/assert'
import { UserSamples } from '@tests/fixtures/user-samples.ts'

/** Test-only scalar field inventory, including names forbidden in declarations. */
export type QueryProbe = Instantiable & {
  title: string
  count: number
  active: boolean
  optional?: string
  nullable: string | null
  items: readonly string[]
  objects: readonly { text: string }[]
  and: string
  or: string
  not: string
  search: string
}

/** Adapter over a probe type covering every field kind and reserved name. */
const ProbeAdapter = makeAdapter<QueryProbe>({
  ...InstantiableAdapt,
  title: ['title'],
  count: ['count'],
  active: ['active'],
  optional: ['optional'],
  nullable: ['nullable'],
  items: ['items'],
  objects: ['objects'],
  and: ['and'],
  or: ['or'],
  not: ['not'],
  search: ['search']
})
/** The User role query under test. */
const Declaration = queries.Users.byRole

Deno.test('build copies declared fields, criteria arrays, defaults, and normalized search', () => {
  const roles: QuerySet<'sales' | 'operations'> = ['sales', 'operations']
  const input = { roles: { hasAny: roles }, status: { eq: 'active' as const } }
  const query = Declaration.build({ where: input, search: ' *Jose\u0301* ' })
  assertEquals(query.where, input)
  assert(query.where.roles?.hasAny !== roles)
  assertEquals(query.search, {
    term: 'José',
    fields: ['displayName', 'primaryEmail', 'phoneNumber']
  })
  assertEquals(query.order, { field: 'displayName', direction: 'asc' })
  assertEquals(Object.getOwnPropertySymbols(query), [])
  assertEquals(JSON.parse(JSON.stringify(query)).search.term, 'José')
  for (const search of ['', ' ', '*', '* *']) {
    assertEquals(Declaration.build({ search }).search, undefined)
  }
})

Deno.test('build omits absent operators and allows numeric, boolean, and optional criteria', () => {
  const probe = makeQuery({
    filter: [ProbeAdapter.title, ProbeAdapter.count, ProbeAdapter.active, ProbeAdapter.optional],
    order: [ProbeAdapter.count]
  })
  assertEquals(
    probe.build({
      where: { count: { gte: 2, lt: 8 }, active: { eq: false }, optional: { eq: undefined } }
    }).where,
    { count: { gte: 2, lt: 8 }, active: { eq: false }, optional: {} }
  )
})

Deno.test('query constraints reject invalid declarations and inputs, including typed variables', () => {
  // Compile these examples without executing invalid application calls.
  const invalidUsage = (users: CrudListContract<User>, customers: CrudListContract<Customer>) => {
    const good = Declaration.build({ where: { roles: { hasAll: ['sales', 'operations'] } } })
    // @ts-expect-error Queries remain typed by their domain abstraction.
    customers.list({ query: good })
    users.list({ query: good })
    // @ts-expect-error A plain value lacks the private query brand.
    const plain: Query<User> = { where: {}, order: { field: 'displayName', direction: 'asc' } }
    // @ts-expect-error Order objects are readonly.
    good.order.field = 'primaryEmail'
    // @ts-expect-error Criteria fields are readonly.
    good.where.roles = { hasAny: ['sales'] }
    // @ts-expect-error Operator values are readonly.
    good.where.roles!.hasAll = ['sales']
    // @ts-expect-error Set members are readonly.
    good.where.roles!.hasAll![0] = 'operations'
    // @ts-expect-error Search fields are readonly.
    Declaration.build({ search: 'a' }).search!.fields[0] = 'status'
    // @ts-expect-error Undeclared filter field inline.
    Declaration.build({ where: { primaryEmail: { eq: 'a' } } })
    const badField = { status: { eq: 'active' as const }, primaryEmail: { eq: 'a' } }
    // @ts-expect-error Undeclared filter field through a structurally compatible variable.
    Declaration.build({ where: badField })
    // @ts-expect-error Undeclared order field inline.
    Declaration.build({ order: { field: 'primaryEmail', direction: 'asc' } })
    const badOrder = { field: 'primaryEmail' as const, direction: 'asc' as const }
    // @ts-expect-error Undeclared order field through a variable.
    Declaration.build({ order: badOrder })
    // @ts-expect-error Unsupported operator inline.
    Declaration.build({ where: { status: { eq: 'active', contains: 'a' } } })
    const badOperator = { status: { eq: 'active' as const, contains: 'a' } }
    // @ts-expect-error Unsupported operator through a compatible variable.
    Declaration.build({ where: badOperator })
    // @ts-expect-error Wrong role item values.
    Declaration.build({ where: { roles: { hasAny: ['unknown'] } } })
    // @ts-expect-error Empty hasAny inline.
    Declaration.build({ where: { roles: { hasAny: [] } } })
    // @ts-expect-error Empty hasAll inline.
    Declaration.build({ where: { roles: { hasAll: [] } } })
    // @ts-expect-error Empty in inline.
    Declaration.build({ where: { status: { in: [] } } })
    const empty: readonly [] = []
    // @ts-expect-error Empty hasAny through a variable.
    Declaration.build({ where: { roles: { hasAny: empty } } })
    // @ts-expect-error Empty hasAll through a variable.
    Declaration.build({ where: { roles: { hasAll: empty } } })
    // @ts-expect-error Empty in through a variable.
    Declaration.build({ where: { status: { in: empty } } })
    const unproven: ('sales' | 'operations')[] = ['sales']
    // @ts-expect-error An ordinary array is not proof of non-emptiness.
    Declaration.build({ where: { roles: { hasAny: unproven } } })
    // @ts-expect-error Object compositions cannot be filter declarations inline.
    makeQuery({ filter: [UserAdapter.notes], order: [UserAdapter.displayName] })
    const objectFields = [UserAdapter.notes]
    // @ts-expect-error Object compositions cannot be declared through a variable.
    makeQuery({ filter: objectFields, order: [UserAdapter.displayName] })
    // @ts-expect-error Optional order fields inline.
    makeQuery({ filter: [], order: [UserAdapter.avatarUrl] })
    const optionalOrder = [UserAdapter.avatarUrl] as const
    // @ts-expect-error Optional order fields through a tuple variable.
    makeQuery({ filter: [], order: optionalOrder })
    // @ts-expect-error Nullable order fields.
    makeQuery({ filter: [], order: [ProbeAdapter.nullable] })
    // @ts-expect-error Empty order inline.
    makeQuery({ filter: [], order: [] })
    // @ts-expect-error Empty order through a variable.
    makeQuery({ filter: [], order: empty })
    for (const field of [ProbeAdapter.and, ProbeAdapter.or, ProbeAdapter.not, ProbeAdapter.search]) {
      // @ts-expect-error Every reserved key is rejected through a variable.
      makeQuery({ filter: [field], order: [ProbeAdapter.title] })
    }
    // @ts-expect-error Reserved and inline.
    makeQuery({ filter: [ProbeAdapter.and], order: [ProbeAdapter.title] })
    // @ts-expect-error Reserved or inline.
    makeQuery({ filter: [ProbeAdapter.or], order: [ProbeAdapter.title] })
    // @ts-expect-error Reserved not inline.
    makeQuery({ filter: [ProbeAdapter.not], order: [ProbeAdapter.title] })
    // @ts-expect-error Reserved search inline.
    makeQuery({ filter: [ProbeAdapter.search], order: [ProbeAdapter.title] })
    const withoutSearch = makeQuery({ filter: [UserAdapter.status], order: [UserAdapter.displayName] })
    // @ts-expect-error A declaration without search cannot accept a term.
    withoutSearch.build({ search: 'ada' })
    const booleanQuery = makeQuery({ filter: [ProbeAdapter.active], order: [ProbeAdapter.title] })
    // @ts-expect-error Boolean comparisons are unavailable.
    booleanQuery.build({ where: { active: { gt: true } } })
    return plain
  }
  assertEquals(typeof invalidUsage, 'function')
})

Deno.test('keyset cursor preserves raw precision, Unicode, issuer, and query fingerprint', () => {
  const query = listQuery<User>()
  const rowId = id()
  const value = '2026-10-07T03:30:32.719719+00:00'
  const token = writeListCursor('supabase:users', query, value, rowId)
  assertEquals(readListCursor(token, 'supabase:users', query)?.value, value)
  assertEquals(readListCursor(token, 'supabase:users', query)?.id, rowId)
  assertEquals(readListCursor(undefined, 'supabase:users', query), undefined)
  const nameQuery = Declaration.build({
    search: 'José',
    order: { field: 'displayName', direction: 'desc' }
  })
  const nameToken = writeListCursor('indexeddb:local:users', nameQuery, 'Peña', rowId)
  assertEquals(readListCursor(nameToken, 'indexeddb:local:users', nameQuery)?.value, 'Peña')
  assertThrows(() => readListCursor(token, 'indexeddb:local:users', query), ApiError)
  assertThrows(() => readListCursor(token, 'supabase:customers', query), ApiError)
  assertThrows(() => readListCursor(token, 'supabase:users', nameQuery), ApiError)
  const changedSearch = Declaration.build({
    search: 'Reese',
    order: { field: 'displayName', direction: 'desc' }
  })
  assertThrows(() => readListCursor(nameToken, 'indexeddb:local:users', changedSearch), ApiError)
  const changedDirection = Declaration.build({ search: 'José' })
  assertThrows(() => readListCursor(nameToken, 'indexeddb:local:users', changedDirection), ApiError)
  const filtered = Declaration.build({ where: { status: { eq: 'active' } } })
  const filteredToken = writeListCursor('supabase:users', filtered, 'Ada', rowId)
  assertThrows(() => readListCursor(filteredToken, 'supabase:users', Declaration.build()), ApiError)
})

Deno.test('cursor fingerprints are stable across criteria and operator key insertion order', () => {
  const first = Declaration.build({ where: { status: { eq: 'active' }, roles: { hasAny: ['sales'] } } })
  const second = Declaration.build({ where: { roles: { hasAny: ['sales'] }, status: { eq: 'active' } } })
  assertEquals(listFingerprint(first), listFingerprint(second))
  assertEquals(listFingerprint(listQuery<User>()), '{"where":{}}')
  const probe = makeQuery({ filter: [ProbeAdapter.count], order: [ProbeAdapter.title] })
  assertEquals(
    listFingerprint(probe.build({ where: { count: { gt: 1, lt: 3 } } })),
    listFingerprint(probe.build({ where: { count: { lt: 3, gt: 1 } } }))
  )
})

Deno.test('malformed cursors fail with 400 instead of starting a new list', () => {
  const query = listQuery<User>()
  for (const token of ['', '!', 'bm90LWpzb24', btoa('null'), btoa('{}'), btoa('[]')]) {
    const error = assertThrows(() => readListCursor(token, 'supabase:users', query), ApiError)
    assertEquals(error.status, 400)
  }
})

Deno.test('listAll owns page size and cursors, forwards queries, and stops at null', async () => {
  const query = Declaration.build({ where: { status: { eq: 'active' } } })
  const options: ListOptions<User>[] = []
  const first: User = { ...UserSamples.sales, id: id() }
  const second: User = { ...UserSamples.sales, id: id() }
  const client: CrudListContract<User> = {
    list(input) {
      options.push(input!)
      return Promise.resolve(
        options.length === 1
          ? { data: [first], cursor: 'next', hasMore: true }
          : { data: [second], cursor: null, hasMore: false }
      )
    }
  }
  assertEquals(await Array.fromAsync(listAll(client, query)), [first, second])
  assertEquals(options, [
    { query, limit: MAX_LIMIT, cursor: undefined },
    { query, limit: MAX_LIMIT, cursor: 'next' }
  ])
  options.length = 0
  for await (const user of listAll(client)) {
    assertEquals(user, first)
    break
  }
  assertEquals(options.length, 1)
  assertEquals(options[0].query, undefined)
})

Deno.test('numeric page limits default, floor fractions, and clamp both bounds', () => {
  assertEquals(listPageLimit(), DEFAULT_LIMIT)
  assertEquals(listPageLimit(0), 1)
  assertEquals(listPageLimit(-3), 1)
  assertEquals(listPageLimit(3.8), 3)
  assertEquals(listPageLimit(1000), MAX_LIMIT)
  assertEquals(listPageLimit(NaN), DEFAULT_LIMIT)
})

Deno.test('shared page assembly preserves values and never reads an empty terminal row', () => {
  const query = listQuery<User>()
  const row = { id: id(), value: '2026-10-07T03:30:32.719719+00:00' }
  const page = listPage(
    [row, { ...row, id: id() }],
    1,
    'supabase:users',
    query,
    entry => entry.value,
    entry => entry.id
  )
  assertEquals(page.data, [row])
  assert(page.cursor)
  assertEquals(readListCursor(page.cursor, 'supabase:users', query)?.value, row.value)
  assertEquals(
    listPage([], 1, 'supabase:users', query, () => {
      throw new Error('Terminal pages must not read sort values')
    }, () => {
      throw new Error('Terminal pages must not read ids')
    }),
    { data: [], cursor: null, hasMore: false }
  )
})
