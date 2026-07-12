/*
╔═════════════════════════════════════════════════════════════════════════════╗
║ Make client implementation for API contracts over Supabase                  ║
║ Supabase transport bindings for CRUD, list & business-rule API contracts    ║
╚═════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Builds transport-agnostic CRUD/list API contracts over Supabase PostgREST
with domain-layer serialization hooks and uniform ApiError mapping.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
CrudSupabaseSpecification          CRUD Supabase client configuration.
makeCrudSupabaseClient(spec)       Build CRUD/list client over Supabase.
RpcSupabaseSpecification           RPC Supabase client configuration.
makeBusRuleSupabaseRpcClient(spec) Build business-rule client over Supabase RPC.
EdgeSupabaseSpecification          Edge Function client configuration.
makeBusRuleSupabaseEdgeClient(spec) Build business-rule client over Supabase Edge Functions.
*/

import type {
  ApiBusRuleContract,
  ApiCrudContract,
  ApiErrorDetail,
  DeleteResult,
  ListOptions,
  ListResult
} from '@core/api/api-contract.ts'
import {
  checkApiError,
  listCursorValue,
  listPageLimitValue,
  throwApiError
} from '@core/api/api-contract.ts'
import { Supabase } from '@core/db/supabase.ts'
import {
  type CreateFromInstantiable,
  type Dictionary,
  type Id,
  type Instantiable,
  instantiable,
  type UpdateFromInstantiable,
  type When,
  when
} from '@core/std'
import type { Adapter, AdapterPatch } from '@core/stdx'

// ───────────────────────────────────────────────────────────────────────────────
// SPECIFICATIONS
// ───────────────────────────────────────────────────────────────────────────────

/** Configuration for a CRUD Supabase API client. */
export type CrudSupabaseSpecification<T> = {
  table: string
  adapter: Adapter<T>
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
  { table, adapter }: CrudSupabaseSpecification<T>
): ApiCrudContract<T> => ({
  /* Create record in Supabase from create payload and return mapped entity. */
  async create(input: CreateFromInstantiable<T>): Promise<T> {
    const record = adapter.fromDomain(instantiable<T>(input) as AdapterPatch<T>)
    const { data, error } = await Supabase.client()
      .from(table)
      .insert(record)
      .select()
      .single()
    checkApiError(error, 'Failed to create record', Supabase.errorToStatus)
    return adapter.toDomain(data)
  },

  /* Get non-deleted record by id from Supabase and map to domain entity. */
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

  /* Apply update patch to an existing non-deleted Supabase record. */
  async update(source: UpdateFromInstantiable<T>): Promise<T> {
    const { id, ...patch } = source
    const record = adapter.fromDomain(patch as AdapterPatch<T>)
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

  /* Soft-delete record in Supabase and return delete contract payload. */
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

  /* List paginated non-deleted records from Supabase. */
  async list(options?: ListOptions): Promise<ListResult<T>> {
    const limit = listPageLimitValue(options?.limit?.toString())
    const cursor = listCursorValue(options?.cursor?.toString())
    const { data, error } = await Supabase.client()
      .from(table)
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
      .range(cursor, cursor + limit)
    checkApiError(error, 'Failed to list records', Supabase.errorToStatus)
    const rows = (data ?? []) as Dictionary[]
    const hasMore = rows.length > limit
    const page = hasMore ? rows.slice(0, limit) : rows
    return {
      data: page.map(row => adapter.toDomain(row)),
      cursor: cursor + page.length,
      hasMore
    }
  }
})

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

const edgeErrorDetail = async (error: unknown): Promise<ApiErrorDetail> => {
  const detail = error as Dictionary
  const body = await edgeErrorBody(detail['context'])
  return {
    message: body?.['error'] as string | undefined ?? detail['message'] as string | undefined,
    status: edgeErrorStatus(error),
    details: body?.['details'] as string | undefined
  }
}

// non-2xx edge responses carry `{ error, details? }`; gateway failures may not be JSON
const edgeErrorBody = async (context: unknown): Promise<Dictionary | undefined> => {
  if (!(context instanceof Response)) return undefined
  try {
    return await context.json() as Dictionary
  } catch {
    return undefined
  }
}

const edgeErrorStatus = (error: unknown): number => {
  const context = (error as Dictionary)['context']
  return context instanceof Response ? context.status : 500
}
