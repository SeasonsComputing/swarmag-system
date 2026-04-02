/*
╔═════════════════════════════════════════════════════════════════════════════╗
║ Make client implementation for API contracts over IndexedDB                 ║
║ IndexedDB transport bindings for CRUD/list API contracts                    ║
╚═════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines the IndexedDB CRUD client maker contract used by the API composition
layer.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
CrudIndexedDbSpecification     CRUD IndexedDB client configuration.
makeCrudIndexedDbClient(spec)  Build CRUD/list client over IndexedDB.
*/

import { IndexedDb } from '@core/db/indexeddb.ts'
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
import type { ApiCrudContract, ApiErrorDetail, DeleteResult } from './api-contract.ts'
import { apiError, throwApiError } from './api-contract.ts'

/** Configuration for a CRUD IndexedDB API client. */
export type CrudIndexedDbSpecification<T extends Instantiable> = {
  store: string
  adapter: Adapter<T>
}

/** Maker to produce a CRUD/list API client over IndexedDB. */
export const makeCrudIndexedDbClient = <T extends Instantiable>(
  { store, adapter }: CrudIndexedDbSpecification<T>
): ApiCrudContract<T> => {
  IndexedDb.registerStore(store)
  return {
    /* Create record in IndexedDB from create payload and return mapped entity. */
    async create(input: CreateFromInstantiable<T>): Promise<T> {
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

    /* Get non-deleted record by id from IndexedDB and map to domain entity. */
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

    /* Apply update patch to an existing non-deleted IndexedDB record. */
    async update(source: UpdateFromInstantiable<T>): Promise<T> {
      try {
        const { id, ...patch } = source
        const record = adapter.fromDomain(patch as AdapterPatch<T>)
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

    /* Soft-delete record in IndexedDB and return delete contract payload. */
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
    }
  }
}
