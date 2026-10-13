/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Make client implementation for API contracts over Supabase                   ║
║ Supabase transport bindings for CRUD, list & business-rule API contracts     ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Builds transport-agnostic CRUD/list API contracts over Supabase PostgREST
with domain-layer serialization hooks and uniform ApiError mapping.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
CrudSupabaseSpecification              CRUD Supabase configuration, including validator.
BusRuleSupabaseSpecification           RPC or Edge Function configuration.
SupabaseBaseFilter                     Common SDK filter discriminant.
SupabaseScalarFilter                   Scalar equality and ordered comparisons.
SupabaseInFilter                       Membership filter.
SupabaseContainsFilter                 JSONB containment filter.
SupabaseOrFilter                       Generated alternatives.
SupabaseListFilter                     Ordered SDK filter operation union.
SupabaseListRequest<T>                 Constructed list request and paging context.
makeCrudSupabaseClient(spec)           Build CRUD/list client over Supabase.
makeSupabaseListRequest(spec, options) Construct list operations without dispatch.
makeBusRuleSupabaseRpcClient(spec)     Build business-rule client over Supabase RPC.
makeBusRuleSupabaseEdgeClient(spec)    Build business-rule client over Edge Functions.
*/

import { Supabase } from '@core/db/supabase.ts'
import { instantiable, when } from '@core/std'
import type {
  CreateFromInstantiable,
  Dictionary,
  FromInstantiable,
  Id,
  Instantiable,
  ScopedUpdate,
  UpdateFromInstantiable,
  Validator,
  When
} from '@core/std'
import type {
  ApiBusRuleContract,
  ApiCrudContract,
  ApiErrorDetail,
  DeleteResult,
  ListOptions,
  ListQuery,
  ListResult,
  QueryOperator,
  QueryScalar
} from '@core/stdx'
import {
  checkApiError,
  checkValidatorError,
  listPage,
  listPageLimit,
  listQuery,
  readListCursor,
  resolveQueryFields,
  throwApiError
} from '@core/stdx'
import type { Adapter, AdapterPatch, ScopedUpdateAdapter } from '@core/stdx'

// ───────────────────────────────────────────────────────────────────────────────
// SPECIFICATIONS
// ───────────────────────────────────────────────────────────────────────────────

/** Configuration for a CRUD Supabase API client. */
export type CrudSupabaseSpecification<T extends Instantiable> = {
  table: string
  adapter: Adapter<T>
  validator: Validator<T>
}

/** Configuration for a Supabase business-rule client. */
export type BusRuleSupabaseSpecification = {
  fn: string
}

// ───────────────────────────────────────────────────────────────────────────────
// MAKERS
// ───────────────────────────────────────────────────────────────────────────────

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

  /** Get non-deleted record by id from Supabase and map to domain entity. */
  async get(id: Id): Promise<T> {
    const { data, error } = await Supabase.client()
      .from(table)
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
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

// ───────────────────────────────────────────────────────────────────────────────
// INTERNALS
// ───────────────────────────────────────────────────────────────────────────────

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
