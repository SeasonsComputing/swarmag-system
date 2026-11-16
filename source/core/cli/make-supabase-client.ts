/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Make client implementation for API contracts over Supabase                   ║
║ Supabase transport bindings for CRUD, list & business-rule API contracts     ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Builds transport-agnostic CRUD/list and junction API contracts over Supabase PostgREST
with domain-layer serialization hooks and uniform ApiError mapping.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
CrudSupabaseSpecification                CRUD Supabase configuration, including validator.
JunctionSupabaseSpecification<J>         Unordered junction configuration and key fields.
├ table                                  Junction table.
├ adapter                                Domain-to-column mapping.
├ validator                              Create validation.
├ owner                                  Owner identifier field.
├ partner                                Partner identifier field.
└ sequence                               Omitted for unordered membership.
OrderedJunctionSupabaseSpecification<J>  Ordered junction configuration and sequence field.
├ JunctionSupabaseSpecification          Extends its table, adapter, and identifier settings.
├ validator                              Create and update validation.
└ sequence                               Numeric ordering field.
BusRuleSupabaseSpecification             RPC or Edge Function configuration.
SupabaseBaseFilter                       Common SDK filter discriminant.
SupabaseScalarFilter                     Scalar equality and ordered comparisons.
SupabaseInFilter                         Membership filter.
SupabaseContainsFilter                   JSONB containment filter.
SupabaseOrFilter                         Generated alternatives.
SupabaseListFilter                       Ordered SDK filter operation union.
SupabaseListRequest<T>                   Constructed list request and paging context.
makeCrudSupabaseClient(spec)             Build CRUD/list client over Supabase.
makeJunctionSupabaseClient(spec)         Build unordered or ordered owner-side junction client.
makeSupabaseListRequest(spec, options)   Construct list operations without dispatch.
makeBusRuleSupabaseRpcClient(spec)       Build business-rule client over Supabase RPC.
makeBusRuleSupabaseEdgeClient(spec)      Build business-rule client over Edge Functions.
*/

import { Supabase } from '@core/db/supabase.ts'
import { instantiable, when } from '@core/std'
import type {
  CreateFromInstantiable,
  Dictionary,
  FromInstantiable,
  Id,
  Instantiable,
  JunctionValidator,
  OrderedJunctionValidator,
  ScopedUpdate,
  StringSet,
  UpdateFromInstantiable,
  Validator,
  When
} from '@core/std'
import type {
  ApiBusRuleContract,
  ApiCrudContract,
  ApiErrorDetail,
  ApiJunctionContract,
  ApiOrderedJunctionContract,
  DeleteResult,
  JunctionListContract,
  ListOptions,
  ListQuery,
  ListResult,
  QueryOperator,
  QueryScalar
} from '@core/stdx'
import {
  ApiError,
  checkApiError,
  checkValidatorError,
  listPage,
  listPageLimit,
  listQuery,
  MAX_LIMIT,
  readListCursor,
  resolveQueryFields,
  throwApiError
} from '@core/stdx'
import type { Adapter, AdapterPatch, ScopedUpdateAdapter } from '@core/stdx'

// ────────────────────────────────────────────────────────────────────────────
// SPECIFICATIONS
// ────────────────────────────────────────────────────────────────────────────

/** Configuration for a CRUD Supabase API client. */
export type CrudSupabaseSpecification<T extends Instantiable> = {
  table: string
  adapter: Adapter<T>
  validator: Validator<T>
}

/** Configuration for an unordered junction Supabase API client. */
export type JunctionSupabaseSpecification<J> = {
  table: string
  adapter: Adapter<J>
  validator: JunctionValidator<J>
  owner: IdKey<J>
  partner: IdKey<J>
  sequence?: never
}

/** Ordered junction settings; sequence names a numeric domain field. */
export type OrderedJunctionSupabaseSpecification<J> =
  & Omit<JunctionSupabaseSpecification<J>, 'validator' | 'sequence'>
  & {
    validator: OrderedJunctionValidator<J>
    sequence: { [K in keyof J]-?: J[K] extends number ? K : never }[keyof J]
  }

/** Configuration for a Supabase business-rule client. */
export type BusRuleSupabaseSpecification = {
  fn: string
}

// ────────────────────────────────────────────────────────────────────────────
// MAKERS
// ────────────────────────────────────────────────────────────────────────────

/**
 * Build owner-side junction access; a sequence specification enables ordered mutation.
 * @param spec Table, adapter, validators, identifier fields, and optional sequence field.
 * @returns Complete reads and non-atomic replacement; ordered clients also open bound lists.
 */
export function makeJunctionSupabaseClient<J>(
  spec: OrderedJunctionSupabaseSpecification<J>
): ApiOrderedJunctionContract
export function makeJunctionSupabaseClient<J>(
  spec: JunctionSupabaseSpecification<J>
): ApiJunctionContract
export function makeJunctionSupabaseClient<J>(
  spec: JunctionSupabaseSpecification<J> | OrderedJunctionSupabaseSpecification<J>
): ApiJunctionContract | ApiOrderedJunctionContract {
  if (isOrderedJunctionSpecification(spec)) return makeOrderedJunctionClient(spec)
  const { table, adapter, validator, owner, partner } = spec
  const ownerColumn = adapter[owner].column
  const partnerColumn = adapter[partner].column

  const readRows = makeJunctionReader(table, ownerColumn, partnerColumn)
  const partnersOf = async (ownerIds: readonly Id[]): Promise<ReadonlyMap<Id, readonly Id[]>> => {
    const grouped = await readRows(ownerIds)
    return new Map([...grouped].map(([ownerId, rows]) => [
      ownerId,
      rows.map(row => row[partnerColumn] as Id)
    ]))
  }
  const partners = async (ownerId: Id): Promise<readonly Id[]> =>
    (await partnersOf([ownerId])).get(ownerId)!

  const replace = async (ownerId: Id, partnerIds: readonly Id[]): Promise<void> => {
    const requested: StringSet = new Set(partnerIds)
    const current: StringSet = new Set(await partners(ownerId))
    const added = [...requested].filter(partnerId => !current.has(partnerId)).map(partnerId => {
      const pair = { [owner]: ownerId, [partner]: partnerId } as J
      checkValidatorError(validator.validateCreate(pair))
      return adapter.fromDomain(pair as AdapterPatch<J>)
    })
    const removed = [...current].filter(partnerId => !requested.has(partnerId))
    if (removed.length > 0) {
      const { error } = await Supabase.client().from(table).delete()
        .eq(ownerColumn, ownerId).in(partnerColumn, removed)
      checkApiError(error, 'Failed to delete junction partners', Supabase.errorToStatus)
    }
    if (added.length > 0) {
      const { error } = await Supabase.client().from(table).insert(added)
      checkApiError(error, 'Failed to insert junction partners', Supabase.errorToStatus)
    }
  }

  return { partners, partnersOf, replace }
}

/**
 * Maker to produce a CRUD/list API client over Supabase.
 * @param spec API specification with table and domain mappers.
 * @returns API client object with CRUD/list methods.
 */
export const makeCrudSupabaseClient = <T extends Instantiable>(
  { table, adapter, validator }: CrudSupabaseSpecification<T>
): ApiCrudContract<T> => ({
  /** Create record in Supabase from create payload and return mapped entity. */
  async create(input: CreateFromInstantiable<T>): Promise<T> {
    checkValidatorError(validator.validateCreate(input))
    const record = adapter.fromDomain(instantiable<T>(input) as AdapterPatch<T>)
    const { data, error } = await Supabase.client()
      .from(table)
      .insert(record)
      .select()
      .single()
    checkApiError(error, 'Failed to create record', Supabase.errorToStatus)
    return adapter.toDomain(data)
  },

  /** Get record by id from Supabase, including soft-deleted reference targets. */
  async get(id: Id): Promise<T> {
    const { data, error } = await Supabase.client()
      .from(table)
      .select('*')
      .eq('id', id)
      .single()
    checkApiError(error, 'Failed to get record', Supabase.errorToStatus)
    return adapter.toDomain(data)
  },

  /** Apply a declared-scope update patch to an existing non-deleted Supabase record. */
  async update<K extends keyof FromInstantiable<T>>(
    scoped: ScopedUpdateAdapter<T, K>,
    source: ScopedUpdate<T, K>
  ): Promise<T> {
    checkValidatorError(validator.validateUpdate(source as UpdateFromInstantiable<T>))
    const { id, ...patch } = source
    const record = scoped.fromDomain(patch as Pick<AdapterPatch<T>, K>)
    const { data, error } = await Supabase.client()
      .from(table)
      .update({ ...record, updated_at: when() })
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single()
    checkApiError(error, 'Failed to update record', Supabase.errorToStatus)
    return adapter.toDomain(data)
  },

  /** Soft-delete record in Supabase and return delete contract payload. */
  async delete(id: Id): Promise<DeleteResult> {
    const now = when()
    const del: Dictionary = { deleted_at: now, updated_at: now }
    const { data, error } = await Supabase.client()
      .from(table)
      .update(del)
      .eq('id', id)
      .is('deleted_at', null)
      .select('id, deleted_at')
      .single()
    checkApiError(error, 'Failed to delete record', Supabase.errorToStatus)
    const row = data as Dictionary
    return { id: row['id'] as Id, deletedAt: row['deleted_at'] as When }
  },

  /** List non-deleted records through typed criteria and a store-local keyset cursor. */
  async list(options?: ListOptions<T>): Promise<ListResult<T>> {
    const request = makeSupabaseListRequest({ table, adapter }, options)
    let builder = Supabase.client().from(table).select('*').is('deleted_at', null)
      .order(request.column, { ascending: request.query.order.direction === 'asc' })
    if (request.column !== adapter.id.column) {
      builder = builder.order(adapter.id.column, {
        ascending: request.query.order.direction === 'asc'
      })
    }
    for (const filter of request.filters) {
      switch (filter.method) {
        case 'eq':
          builder = builder.eq(filter.column, filter.value)
          break
        case 'in':
          builder = builder.in(filter.column, filter.value)
          break
        case 'gt':
          builder = builder.gt(filter.column, filter.value)
          break
        case 'gte':
          builder = builder.gte(filter.column, filter.value)
          break
        case 'lt':
          builder = builder.lt(filter.column, filter.value)
          break
        case 'lte':
          builder = builder.lte(filter.column, filter.value)
          break
        case 'contains':
          builder = builder.contains(filter.column, filter.value)
          break
        case 'or':
          builder = builder.or(filter.expression)
          break
        default:
          filter satisfies never
      }
    }
    const { data, error } = await builder.limit(request.limit + 1)
    checkApiError(error, 'Failed to list records', Supabase.errorToStatus)
    const page = listPage(
      (data ?? []) as Dictionary[],
      request.limit,
      request.issuer,
      request.query,
      row => row[request.column] as string | number,
      row => row[adapter.id.column] as Id
    )
    return { ...page, data: page.data.map(row => adapter.toDomain(row)) }
  }
})

/** Common discriminant for targeted SDK filters and generated alternatives. */
export type SupabaseBaseFilter = {
  method: Exclude<QueryOperator, 'hasAny' | 'hasAll'> | 'contains' | 'or'
}

/** Targeted scalar equality or ordered comparison. */
export type SupabaseScalarFilter = SupabaseBaseFilter & {
  method: Exclude<QueryOperator, 'in' | 'hasAny' | 'hasAll'>
  column: string
  value: QueryScalar
}

/** Targeted membership filter. */
export type SupabaseInFilter = SupabaseBaseFilter & {
  method: 'in'
  column: string
  value: readonly QueryScalar[]
}

/** JSONB containment; the SDK must receive a JSON string, not a Postgres array. */
export type SupabaseContainsFilter = SupabaseBaseFilter & {
  method: 'contains'
  column: string
  value: string
}

/** Generated alternatives preserving complete PostgREST operands. */
export type SupabaseOrFilter = SupabaseBaseFilter & {
  method: 'or'
  expression: string
}

/** Ordered SDK filter operations, exposed only to test request construction. */
export type SupabaseListFilter =
  | SupabaseScalarFilter
  | SupabaseInFilter
  | SupabaseContainsFilter
  | SupabaseOrFilter

/** Constructed Supabase request and paging context. */
export type SupabaseListRequest<T> = {
  query: ListQuery<T>
  issuer: string
  column: string
  filters: SupabaseListFilter[]
  limit: number
}

/**
 * Translate a list request without dispatching it to Supabase.
 * @param spec Table identity and field-column metadata.
 * @param options Typed query and optional paging token.
 * @returns Ordered SDK filters, ordering, limit, and cursor context.
 */
export const makeSupabaseListRequest = <T extends Instantiable>(
  spec: Pick<CrudSupabaseSpecification<T>, 'table' | 'adapter'>,
  options?: ListOptions<T>
): SupabaseListRequest<T> => {
  const query = listQuery(options)
  const issuer = `supabase:${spec.table}`
  const fields = resolveQueryFields(spec.adapter, query)
  const cursor = readListCursor(options?.cursor, issuer, query)
  const column = fields[query.order.field as string].column
  const filters: SupabaseListFilter[] = []
  for (const [field, input] of Object.entries(query.where)) {
    const mapped = fields[field].column
    for (const [operator, value] of Object.entries(input as Dictionary) as [QueryOperator, unknown][]) {
      filters.push(translateOperator(mapped, operator, value))
    }
  }
  if (query.search) {
    const pattern = `%${query.search.term.replace(/[\\%_]/g, char => `\\${char}`)}%`
    filters.push({
      method: 'or',
      expression: query.search.fields.map(field =>
        `${fields[field as string].column}.ilike.${filterValue(pattern)}`
      ).join(',')
    })
  }
  if (cursor) {
    const comparison = query.order.direction === 'asc' ? 'gt' : 'lt'
    const value = filterValue(cursor.value)
    const idColumn = fields.id.column
    filters.push({
      method: 'or',
      expression: `${column}.${comparison}.${value},and(${column}.eq.${value},`
        + `${idColumn}.${comparison}.${filterValue(cursor.id)})`
    })
  }
  return { query, issuer, column, filters, limit: listPageLimit(options?.limit) }
}

/**
 * Maker to produce a business-rule client over a Supabase RPC function.
 * @param spec RPC specification with the Postgres function name.
 * @returns Business-rule client with typed params and result.
 */
export const makeBusRuleSupabaseRpcClient = <
  TParams extends Dictionary = Dictionary,
  TResult = Dictionary
>({ fn }: BusRuleSupabaseSpecification): ApiBusRuleContract<TParams, TResult> => ({
  async run(params: TParams): Promise<TResult> {
    const { data, error } = await Supabase.client().rpc(fn, params)
    checkApiError(error, `RPC '${fn}' failed`, Supabase.errorToStatus)
    return data as TResult
  }
})

/**
 * Maker to produce a business-rule client over a Supabase Edge Function.
 * @param spec Edge Function specification with the function name.
 * @returns Business-rule client with typed params and result.
 */
export const makeBusRuleSupabaseEdgeClient = <
  TParams extends Dictionary = Dictionary,
  TResult = Dictionary
>({ fn }: BusRuleSupabaseSpecification): ApiBusRuleContract<TParams, TResult> => ({
  async run(params: TParams): Promise<TResult> {
    const { data, error } = await Supabase.client().functions.invoke(fn, { body: params })
    if (error) {
      throwApiError(
        await edgeErrorDetail(error),
        `Edge Function '${fn}' failed`,
        edgeErrorStatus(error)
      )
    }
    return unwrapEdgeData<TResult>(data)
  }
})

// ────────────────────────────────────────────────────────────────────────────
// INTERNALS
// ────────────────────────────────────────────────────────────────────────────

/** Return an edge response's data, or throw the error it carries. */
const unwrapEdgeData = <TResult>(data: unknown): TResult => {
  const body = data as Dictionary
  if (body['error']) {
    throwApiError(
      {
        message: body['error'] as string,
        details: body['details'] as string | undefined
      },
      'Edge Function failed',
      500
    )
  }
  return body['data'] as TResult
}

/** Extract message, status, and details from a failed edge invocation. */
const edgeErrorDetail = async (error: unknown): Promise<ApiErrorDetail> => {
  const detail = error as Dictionary
  const body = await edgeErrorBody(detail['context'])
  return {
    message: body?.['error'] as string | undefined ?? detail['message'] as string | undefined,
    status: edgeErrorStatus(error),
    details: body?.['details'] as string | undefined
  }
}

/**
 * Read a failed edge response's JSON body, when it has one.
 * Non-2xx edge responses carry `{ error, details? }`; gateway failures may not be JSON.
 */
const edgeErrorBody = async (context: unknown): Promise<Dictionary | undefined> => {
  if (!(context instanceof Response)) return undefined
  try {
    return await context.json() as Dictionary
  } catch {
    return undefined
  }
}

/** HTTP status of a failed edge invocation, or 500 when it has no response. */
const edgeErrorStatus = (error: unknown): number => {
  const context = (error as Dictionary)['context']
  return context instanceof Response ? context.status : 500
}

/**
 * Quote a value as a PostgREST operand: escape backslash and quote, then wrap.
 * PostgREST consumes a backslash plus its next character; JSON control escapes would alter values.
 */
const filterValue = (value: unknown): string =>
  '"' + String(value).replaceAll('\\', '\\\\').replaceAll('"', '\\"') + '"'

/** Translate one criterion operator into an SDK filter or a generated alternative. */
const translateOperator = (
  column: string,
  operator: QueryOperator,
  value: unknown
): SupabaseListFilter => {
  switch (operator) {
    case 'eq':
    case 'gt':
    case 'gte':
    case 'lt':
    case 'lte':
      return { method: operator, column, value: value as QueryScalar }
    case 'in':
      return { method: 'in', column, value: value as readonly QueryScalar[] }
    case 'hasAll':
      return { method: 'contains', column, value: JSON.stringify(value) }
    case 'hasAny':
      return {
        method: 'or',
        expression: (value as readonly QueryScalar[]).map(item =>
          `${column}.cs.${filterValue(JSON.stringify([item]))}`
        ).join(',')
      }
  }
}

// ────────────────────────────────────────────────────────────────────────────
// JUNCTIONS
// ────────────────────────────────────────────────────────────────────────────

/** Identifier fields accepted as junction sides. */
type IdKey<J> = { [K in keyof J]: J[K] extends Id ? K : never }[keyof J]

/** Bind complete membership reads to declared columns; cursors use immutable pair keys. */
const makeJunctionReader = (
  table: string,
  ownerColumn: string,
  partnerColumn: string,
  sequenceColumn?: string
) =>
async (ownerIds: readonly Id[]): Promise<Map<Id, Dictionary[]>> => {
  const grouped = new Map<Id, Dictionary[]>(ownerIds.map(ownerId => [ownerId, []]))
  const owners = [...grouped.keys()]
  const columns = [ownerColumn, partnerColumn]
  if (sequenceColumn !== undefined) columns.push(sequenceColumn)
  // Fifty UUIDs keep each owner filter below 2 KB, leaving room for paging and the endpoint.
  const OWNER_BATCH_LIMIT = 50
  for (let start = 0; start < owners.length; start += OWNER_BATCH_LIMIT) {
    const batch = owners.slice(start, start + OWNER_BATCH_LIMIT)
    let after: { owner: Id; partner: Id } | undefined
    while (true) {
      let builder = Supabase.client().from(table).select(columns.join(','), { count: 'exact' })
        .in(ownerColumn, batch).order(ownerColumn).order(partnerColumn).limit(MAX_LIMIT)
      if (after !== undefined) {
        builder = builder.or(
          `${ownerColumn}.gt.${after.owner},`
            + `and(${ownerColumn}.eq.${after.owner},${partnerColumn}.gt.${after.partner})`
        )
      }
      const { data, error, count } = await builder.returns<Dictionary[]>()
      checkApiError(error, 'Failed to read junction partners', Supabase.errorToStatus)
      const rows = data as Dictionary[]
      if (rows.length === 0) break
      for (const row of rows) grouped.get(row[ownerColumn] as Id)!.push(row)
      if (rows.length === count) break
      const last = rows[rows.length - 1]
      after = { owner: last[ownerColumn] as Id, partner: last[partnerColumn] as Id }
    }
  }
  if (sequenceColumn !== undefined) {
    for (const rows of grouped.values()) {
      rows.sort((a, b) =>
        (a[sequenceColumn] as number) - (b[sequenceColumn] as number)
        || (a[partnerColumn] as Id).localeCompare(b[partnerColumn] as Id)
      )
    }
  }
  return grouped
}

/** Partner identity and its stored position within one owner's links. */
type JunctionLink = { partner: Id; sequence: number }

const isOrderedJunctionSpecification = <J>(
  spec: JunctionSupabaseSpecification<J> | OrderedJunctionSupabaseSpecification<J>
): spec is OrderedJunctionSupabaseSpecification<J> => spec.sequence !== undefined

/** Bind ordered reads and link writes to a declared junction. */
const makeOrderedJunctionClient = <J>(
  { table, adapter, validator, owner, partner, sequence }: OrderedJunctionSupabaseSpecification<J>
): ApiOrderedJunctionContract => {
  const ownerColumn = adapter[owner].column
  const partnerColumn = adapter[partner].column
  const sequenceColumn = adapter[sequence].column
  const pairColumns = `${ownerColumn},${partnerColumn}`

  const readRows = makeJunctionReader(table, ownerColumn, partnerColumn, sequenceColumn)
  const readLinks = async (ownerId: Id): Promise<JunctionLink[]> =>
    (await readRows([ownerId])).get(ownerId)!.map(row => ({
      partner: row[partnerColumn] as Id,
      sequence: row[sequenceColumn] as number
    }))

  const row = (ownerId: Id, link: JunctionLink, creating: boolean): Dictionary => {
    const source = { [owner]: ownerId, [partner]: link.partner, [sequence]: link.sequence } as J
    checkValidatorError(creating ? validator.validateCreate(source) : validator.validateUpdate(source))
    return adapter.fromDomain(source as AdapterPatch<J>)
  }
  const confirm = (
    requested: readonly Dictionary[],
    returned: Dictionary[] | null,
    columns: readonly string[]
  ): void => {
    const remaining = new Map(requested.map(record => [record[partnerColumn] as Id, record]))
    if (returned === null) throw new ApiError('Junction write does not confirm the requested links', 409)
    for (const record of returned) {
      const expected = remaining.get(record[partnerColumn] as Id)
      if (expected === undefined || columns.some(column => record[column] !== expected[column])) {
        throw new ApiError('Junction write does not confirm the requested links', 409)
      }
      remaining.delete(record[partnerColumn] as Id)
    }
    if (remaining.size) throw new ApiError('Junction write does not confirm the requested links', 409)
  }
  const writeColumns = `${pairColumns},${sequenceColumn}`
  const insert = async (rows: Dictionary[]): Promise<void> => {
    const { data, error } = await Supabase.client().from(table).insert(rows)
      .select(writeColumns).returns<Dictionary[]>()
    checkApiError(error, 'Failed to insert ordered junction partners', Supabase.errorToStatus)
    confirm(rows, data, [ownerColumn, partnerColumn, sequenceColumn])
  }
  const upsert = async (rows: Dictionary[]): Promise<void> => {
    const { data, error } = await Supabase.client().from(table).upsert(rows, { onConflict: pairColumns })
      .select(writeColumns).returns<Dictionary[]>()
    checkApiError(error, 'Failed to write ordered junction positions', Supabase.errorToStatus)
    confirm(rows, data, [ownerColumn, partnerColumn, sequenceColumn])
  }
  const removeLinks = async (ownerId: Id, partners: readonly Id[]): Promise<void> => {
    const { data, error } = await Supabase.client().from(table).delete()
      .eq(ownerColumn, ownerId).in(partnerColumn, partners).select(pairColumns).returns<Dictionary[]>()
    checkApiError(error, 'Failed to delete ordered junction partners', Supabase.errorToStatus)
    const requested = partners.map(partnerId => ({ [ownerColumn]: ownerId, [partnerColumn]: partnerId }))
    confirm(requested, data, [ownerColumn, partnerColumn])
  }
  const partnersOf = async (ownerIds: readonly Id[]): Promise<ReadonlyMap<Id, readonly Id[]>> => {
    const grouped = await readRows(ownerIds)
    return new Map([...grouped].map(([ownerId, rows]) => [
      ownerId,
      rows.map(row => row[partnerColumn] as Id)
    ]))
  }
  const partners = async (ownerId: Id): Promise<readonly Id[]> =>
    (await partnersOf([ownerId])).get(ownerId)!

  const replace = async (ownerId: Id, partnerIds: readonly Id[]): Promise<void> => {
    const requested: StringSet = new Set(partnerIds)
    if (requested.size !== partnerIds.length) {
      throw new ApiError('Duplicate ordered junction partner', 422)
    }
    const current = await readLinks(ownerId)
    const positions = new Map(current.map(link => [link.partner, link.sequence]))
    const changed: Dictionary[] = []
    for (const [index, partnerId] of partnerIds.entries()) {
      const position = index + 1
      if (positions.get(partnerId) === position) continue
      changed.push(row(ownerId, { partner: partnerId, sequence: position }, !positions.has(partnerId)))
    }
    const removed = current.filter(link => !requested.has(link.partner)).map(link => link.partner)
    if (removed.length) await removeLinks(ownerId, removed)
    if (changed.length) await upsert(changed)
  }

  const list = async (ownerId: Id): Promise<JunctionListContract> => {
    let links = await readLinks(ownerId)
    if (new Set(links.map(link => link.sequence)).size !== links.length) {
      throw new ApiError('Ordered junction list requires distinct sequence positions', 422)
    }
    let valid = true
    let pending = Promise.resolve()
    const requireValid = (): void => {
      if (!valid) throw new ApiError('Reopen the junction list after a failed write', 409)
    }
    const indexOf = (partnerId: Id): number => {
      const index = links.findIndex(link => link.partner === partnerId)
      if (index < 0) throw new ApiError('Partner is not linked to this owner', 404)
      return index
    }
    const commit = async (write: () => Promise<void>, next: JunctionLink[]): Promise<void> => {
      try {
        await write()
      } catch (error) {
        valid = false
        throw error
      }
      links = next
    }
    const mutate = (operation: () => Promise<void>): Promise<void> => {
      const previous = pending
      let release!: () => void
      pending = new Promise<void>(resolve => {
        release = resolve
      })
      return (async () => {
        await previous
        try {
          requireValid()
          await operation()
        } finally {
          release()
        }
      })()
    }
    const move = (partnerId: Id, step: number): Promise<void> =>
      mutate(async () => {
        const index = indexOf(partnerId)
        const adjacent = index + step
        if (adjacent < 0 || adjacent >= links.length) return
        const first = { ...links[index], sequence: links[adjacent].sequence }
        const second = { ...links[adjacent], sequence: links[index].sequence }
        const rows = [row(ownerId, first, false), row(ownerId, second, false)]
        const next = [...links]
        next[index] = second
        next[adjacent] = first
        // Both positions are written in one statement; no half-swap is published locally.
        await commit(() => upsert(rows), next)
      })
    return {
      items: () => {
        requireValid()
        return links.map(link => link.partner)
      },
      add: partnerId =>
        mutate(async () => {
          if (links.some(link => link.partner === partnerId)) {
            throw new ApiError('Partner is already linked to this owner', 409)
          }
          const link = { partner: partnerId, sequence: (links.at(-1)?.sequence ?? 0) + 1 }
          const record = row(ownerId, link, true)
          await commit(() => insert([record]), [...links, link])
        }),
      remove: partnerId =>
        mutate(async () => {
          const index = indexOf(partnerId)
          await commit(() => removeLinks(ownerId, [partnerId]), links.filter((_, at) => at !== index))
        }),
      moveBack: partnerId => move(partnerId, -1),
      moveForward: partnerId => move(partnerId, 1)
    }
  }
  return { partners, partnersOf, replace, list }
}
