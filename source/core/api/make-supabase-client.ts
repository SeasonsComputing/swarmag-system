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
CrudSupabaseSpecification             CRUD Supabase client configuration.
makeCrudSupabaseClient(spec)          Build CRUD/list client over Supabase.
*/

import { Supabase } from '@core/db/supabase.ts'
import { type Dictionary, type Id, instance, type Instantiable, type When, when } from '@core/std'
import type { PostgrestError } from '@supabase/client'
import {
  type ApiCrudContract,
  ApiError,
  type DeleteResult,
  listCursorValue,
  type ListOptions,
  listPageLimitValue,
  type ListResult
} from './api-contract.ts'

// ────────────────────────────────────────────────────────────────────────────
// PUBLIC
// ────────────────────────────────────────────────────────────────────────────

/** Configuration for a CRUD Supabase API client. */
export type CrudSupabaseSpecification<T extends Instantiable> = {
  table: string
  fromStorage: (dict: Dictionary) => T
  toStorage: (value: T) => Dictionary
}

/**
 * Factory to produce a CRUD/list API client over Supabase.
 * @param spec API specification with table and domain mappers.
 * @returns API client object with CRUD/list methods.
 */
export const makeCrudSupabaseClient = <T extends Instantiable, TCreate, TUpdate>(
  spec: CrudSupabaseSpecification<T>
): ApiCrudContract<T, TCreate, TUpdate> => {
  const { table, fromStorage, toStorage } = spec

  return {
    async create(input: TCreate): Promise<T> {
      const entity = instance<T>(asDictionary(input, 'create payload') as Partial<T>)

      const payload = toStorage(entity)
      const { data, error } = await Supabase.client()
        .from(table)
        .insert(payload)
        .select()
        .single()

      if (error) toApiError(error, 'Failed to create record')
      return fromStorage(data as Dictionary)
    },

    async get(recordId: Id): Promise<T> {
      const { data, error } = await Supabase.client()
        .from(table)
        .select('*')
        .eq('id', recordId)
        .is('deleted_at', null)
        .single()

      if (error) toApiError(error, 'Failed to get record')
      return fromStorage(data as Dictionary)
    },

    async update(input: TUpdate): Promise<T> {
      const inputPatch = asDictionary(input, 'update payload')
      const recordId = inputPatch.id as Id | undefined
      if (!recordId) throw new ApiError('Update payload missing required id', 400)

      const current = await this.get(recordId)
      const currentDict = asDictionary(current, 'existing entity')
      const next = {
        ...currentDict,
        ...inputPatch,
        id: recordId,
        updatedAt: when()
      } as T

      const row = toStorage(next)
      const {
        id: _id,
        created_at: _createdAt,
        deleted_at: _deletedAt,
        ...patch
      } = row

      const { data, error } = await Supabase.client()
        .from(table)
        .update(patch)
        .eq('id', recordId)
        .is('deleted_at', null)
        .select()
        .single()

      if (error) toApiError(error, 'Failed to update record')
      return fromStorage(data as Dictionary)
    },

    async delete(recordId: Id): Promise<DeleteResult> {
      const deletedAt = when()
      const { data, error } = await Supabase.client()
        .from(table)
        .update({ deleted_at: deletedAt, updated_at: deletedAt })
        .eq('id', recordId)
        .is('deleted_at', null)
        .select('id, deleted_at')
        .single()

      if (error) toApiError(error, 'Failed to delete record')
      const row = data as Dictionary
      return { id: row.id as Id, deletedAt: row.deleted_at as When }
    },

    async list(options?: ListOptions): Promise<ListResult<T>> {
      const limit = listPageLimitValue(options?.limit?.toString())
      const cursor = listCursorValue(options?.cursor?.toString())

      const { data, error } = await Supabase.client()
        .from(table)
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: true })
        .range(cursor, cursor + limit)

      if (error) toApiError(error, 'Failed to list records')
      const rows = (data ?? []) as Dictionary[]
      const hasMore = rows.length > limit
      const page = hasMore ? rows.slice(0, limit) : rows
      return {
        data: page.map(row => fromStorage(row)),
        cursor: cursor + page.length,
        hasMore
      }
    }
  }
}

// ────────────────────────────────────────────────────────────────────────────
// PRIVATE
// ────────────────────────────────────────────────────────────────────────────

/**
 * Map a PostgrestError to ApiError.
 * @param error Supabase PostgREST error.
 * @param fallback Fallback message when error message is empty.
 * @throws ApiError with mapped status.
 */
const toApiError = (error: PostgrestError, fallback: string): never => {
  const status = error.code === 'PGRST116' ? 404 : 400
  throw new ApiError(error.message || fallback, status, error.details ?? undefined)
}

/**
 * Ensure value is a dictionary object.
 * @param value Value to validate.
 * @param label Label for error text.
 * @returns Dictionary value.
 */
const asDictionary = (value: unknown, label: string): Dictionary => {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return value as Dictionary
  }
  throw new ApiError(`${label} must be an object`, 400)
}
