/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Make client implementation for API contracts over IndexedDB                  ║
║ IndexedDB transport bindings for CRUD/list API contracts                     ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines the IndexedDB CRUD client maker contract used by the API composition
layer.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
CrudIndexedDbSpecification     CRUD IndexedDB client configuration, incl. validator.
makeCrudIndexedDbClient(spec)  Build CRUD/list client over IndexedDB.
*/

import { IndexedDb } from '@core/db/indexeddb.ts'
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
  ApiCrudContract,
  ApiErrorDetail,
  DeleteResult,
  ListCursor,
  ListOptions,
  ListQuery,
  ListResult,
  QueryOperator
} from '@core/stdx'
import {
  ApiError,
  apiError,
  checkValidatorError,
  listPage,
  listPageLimit,
  listQuery,
  readListCursor,
  resolveQueryFields,
  throwApiError
} from '@core/stdx'
import type { Adapter, AdapterPatch, ScopedUpdateAdapter } from '@core/stdx'

/** Configuration for a CRUD IndexedDB API client. */
export type CrudIndexedDbSpecification<T extends Instantiable> = {
  store: string
  adapter: Adapter<T>
  validator: Validator<T>
}

/** Maker to produce a CRUD/list API client over IndexedDB. */
export const makeCrudIndexedDbClient = <T extends Instantiable>(
  { store, adapter, validator }: CrudIndexedDbSpecification<T>
): ApiCrudContract<T> => {
  IndexedDb.registerStore(store)
  return {
    /** Create record in IndexedDB from create payload and return mapped entity. */
    async create(input: CreateFromInstantiable<T>): Promise<T> {
      checkValidatorError(validator.validateCreate(input))
      try {
        const data = instantiable<T>(input)
        const record = adapter.fromDomain(data)
        const db = await IndexedDb.connection()
        await db.add(store, record)
        return data
      } catch (error) {
        if (apiError(error)) throw error
        throwApiError(error as ApiErrorDetail, 'Create Failure', IndexedDb.errorToStatus(error))
      }
    },

    /** Get non-deleted record by id from IndexedDB and map to domain entity. */
    async get(id: Id): Promise<T> {
      try {
        const db = await IndexedDb.connection()
        const record = await db.get(store, id)
        if (record === undefined) throwApiError({ details: `id=[${id}]` }, 'Record not found', 404)
        return adapter.toDomain(record)
      } catch (error) {
        if (apiError(error)) throw error
        throwApiError(error as ApiErrorDetail, 'Read Failure', IndexedDb.errorToStatus(error))
      }
    },

    /** Apply declared-scope update patch to an existing non-deleted IndexedDB record. */
    async update<K extends keyof FromInstantiable<T>>(
      scoped: ScopedUpdateAdapter<T, K>,
      source: ScopedUpdate<T, K>
    ): Promise<T> {
      checkValidatorError(validator.validateUpdate(source as UpdateFromInstantiable<T>))
      const { id, ...patch } = source
      try {
        const record = scoped.fromDomain(patch as Pick<AdapterPatch<T>, K>)
        const db = await IndexedDb.connection()
        const tx = db.transaction(store, 'readwrite')
        const curr = await tx.store.get(id)
        if (curr === undefined) throwApiError({ details: `id=[${id}]` }, 'Record not found', 404)
        const next: T = { ...curr, ...record, updated_at: when() }
        await tx.store.put(next)
        await tx.done
        return adapter.toDomain(next)
      } catch (error) {
        if (apiError(error)) throw error
        throwApiError(error as ApiErrorDetail, 'Update Failure', IndexedDb.errorToStatus(error))
      }
    },

    /** Soft-delete record in IndexedDB and return delete contract payload. */
    async delete(id: Id): Promise<DeleteResult> {
      try {
        const db = await IndexedDb.connection()
        const tx = db.transaction(store, 'readwrite')
        const curr = await tx.store.get(id)
        if (curr === undefined) throwApiError({ details: `id=[${id}]` }, 'Record not found', 404)
        const now = when()
        const del: Dictionary = { ...curr, updated_at: now, deleted_at: now }
        await tx.store.put(del)
        await tx.done
        return { id: del['id'] as Id, deletedAt: del['deleted_at'] as When }
      } catch (error) {
        if (apiError(error)) throw error
        throwApiError(error as ApiErrorDetail, 'Read Failure', IndexedDb.errorToStatus(error))
      }
    },

    /** Evaluate declared criteria and page using the same store-local comparator. */
    async list(options: ListOptions<T> = {}): Promise<ListResult<T>> {
      try {
        const query = listQuery(options)
        // Resolve fields only to fail fast; local evaluation reads domain keys directly.
        resolveQueryFields(adapter, query)
        const db = await IndexedDb.connection()
        const issuer = `indexeddb:${db.name}:${store}`
        const cursor = readListCursor(options.cursor, issuer, query)
        const records = await db.getAll(store)
        const collator = new Intl.Collator('en-US')
        const entities = records.map(record => adapter.toDomain(record))
          .filter(entity => entity.deletedAt === undefined && matchesQuery(entity, query, collator))
          .sort((left, right) => compareRows(left, right, query, collator))
          .filter(entity => afterCursor(entity, cursor, query, collator))
        const limit = listPageLimit(options.limit)
        return listPage(
          entities.slice(0, limit + 1),
          limit,
          issuer,
          query,
          entity => entity[query.order.field] as string | number,
          entity => entity.id
        )
      } catch (error) {
        if (apiError(error)) throw error
        throwApiError(error as ApiErrorDetail, 'List Failure', IndexedDb.errorToStatus(error))
      }
    }
  }
}

// ────────────────────────────────────────────────────────────────────────────
// QUERY EVALUATION
// ────────────────────────────────────────────────────────────────────────────

/** Order two rows by the query's field and direction, breaking ties by id. */
const compareRows = <T extends Instantiable>(
  left: T,
  right: T,
  query: ListQuery<T>,
  collator: Intl.Collator
): number => {
  const value = compareValue(left[query.order.field], right[query.order.field], collator)
  const identity = left.id < right.id ? -1 : left.id > right.id ? 1 : 0
  return (query.order.direction === 'asc' ? 1 : -1) * (value || identity)
}

/** True when a row sorts after the cursor's position. */
const afterCursor = <T extends Instantiable>(
  entity: T,
  cursor: ListCursor | undefined,
  query: ListQuery<T>,
  collator: Intl.Collator
): boolean => {
  if (!cursor) return true
  const value = compareValue(entity[query.order.field], cursor.value, collator)
  const identity = entity.id < cursor.id ? -1 : entity.id > cursor.id ? 1 : 0
  return (query.order.direction === 'asc' ? 1 : -1) * (value || identity) > 0
}

/** Compare two sort values of one type: text by the collator, numbers numerically. */
const compareValue = (left: unknown, right: unknown, collator: Intl.Collator): number => {
  if (typeof left === 'number' && typeof right === 'number') return left - right
  if (typeof left === 'string' && typeof right === 'string') return collator.compare(left, right)
  throw new ApiError('List sort values must be required strings or numbers of the same type', 400)
}

/** True when a row meets every criterion and, when searched, the search term. */
const matchesQuery = <T>(entity: T, query: ListQuery<T>, collator: Intl.Collator): boolean => {
  for (const [key, input] of Object.entries(query.where)) {
    const value = entity[key as keyof T]
    for (
      const [operator, expected] of Object.entries(input as Dictionary) as [QueryOperator, unknown][]
    ) {
      if (value === undefined || value === null) return false
      if (!matchesOperator(value, operator, expected, collator)) return false
    }
  }
  if (!query.search) return true
  const term = query.search.term.toLocaleLowerCase('en-US')
  return query.search.fields.some(key => {
    const value = entity[key]
    return typeof value === 'string' && value.toLocaleLowerCase('en-US').includes(term)
  })
}

/** True when a value satisfies one criterion operator. */
const matchesOperator = (
  value: unknown,
  operator: QueryOperator,
  expected: unknown,
  collator: Intl.Collator
): boolean => {
  switch (operator) {
    case 'eq':
      return value === expected
    case 'in':
      return (expected as readonly unknown[]).includes(value)
    case 'gt':
      return compareValue(value, expected, collator) > 0
    case 'gte':
      return compareValue(value, expected, collator) >= 0
    case 'lt':
      return compareValue(value, expected, collator) < 0
    case 'lte':
      return compareValue(value, expected, collator) <= 0
    case 'hasAny':
      return (expected as readonly unknown[]).some(item => (value as readonly unknown[]).includes(item))
    case 'hasAll':
      return (expected as readonly unknown[]).every(item => (value as readonly unknown[]).includes(item))
  }
}
