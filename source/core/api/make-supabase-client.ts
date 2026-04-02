/*
╔═════════════════════════════════════════════════════════════════════════════╗
║ Make client implementation for API contracts over Supabase                  ║
║ Supabase transport bindings for CRUD API contracts                          ║
╚═════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Builds transport-agnostic CRUD/list API contracts over Supabase PostgREST
with domain-layer serialization hooks and uniform ApiError mapping.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
CrudSupabaseSpecification     CRUD Supabase client configuration.
makeCrudSupabaseClient(spec)  Build CRUD/list client over Supabase.
*/

import { Supabase } from '@core/db/supabase.ts'
import type {
  Adapter,
  AdapterPatch,
  CreateFromInstantiable,
  Dictionary,
  Id,
  Instantiable,
  UpdateFromInstantiable,
  When
} from '@core/std'
import { instantiable, when } from '@core/std'
import type { ApiCrudContract, DeleteResult, ListOptions, ListResult } from './api-contract.ts'
import { checkApiError, listCursorValue, listPageLimitValue } from './api-contract.ts'

/** Configuration for a CRUD Supabase API client. */
export type CrudSupabaseSpecification<T> = {
  table: string
  adapter: Adapter<T>
}

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
