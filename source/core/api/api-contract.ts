/*
╔═════════════════════════════════════════════════════════════════════════════╗
║ API contracts for CRUD, List & business rule operations                     ║
║ Shared transport-agnostic contracts and pagination helpers                  ║
╚═════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines the canonical client contracts used across the API composition layer:
CRUD operations, business-rule operations, uniform delete/list result shapes,
and query-string pagination normalization.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
ApiError - Standard API failure error shape.
├ message  Error message.
├ status   HTTP-like status code.
└ details  Optional provider detail/code.

ApiErrorDetail - Normalized error detail shape for mapping.
├ message  Optional provider message.
├ status   Optional provider status.
├ details  Optional provider detail.
└ code     Optional provider code.

checkApiError(error, ...): void    Throw ApiError when provider error exists.
throwApiError(error, ...): never   Always throw ApiError from provider error.
apiError(error): boolean           Runtime type guard and logger for ApiError.
checkValidatorError(result): void  Throw ApiError 422 when a validator rejects a payload.

CrudBaseContract<T> - Non-mutating-shape CRUD primitives shared by every realization.
├ create(input)  Create one resource.
├ get(id)        Read one resource.
└ delete(id)     Delete one resource and return DeleteResult.

AdaptedUpdateContract<T> - Scoped update via a client-side ScopedUpdateAdapter (Supabase, IndexedDB).
└ update(scoped, source)  Update declared fields through an adapter translation.

DirectUpdateContract<T> - Scoped update with no adapter translation (abstraction-oriented HTTP).
└ update(source)  Update declared fields directly.

PinnedUpdateContract<T, K> - Scoped update pinned to one declared key set (e.g. a composed wrapper).
└ update(source)  Update the fixed declared fields.

CrudListContract<T> - Paginated listing.
└ list?(options?)  List resources with pagination.

ApiCrudContract<T> - CrudBaseContract<T> & AdaptedUpdateContract<T> & CrudListContract<T>. The default CRUD/list
                      client contract (Supabase, IndexedDB — client-side adapter translation).

ApiBusRuleContract<TParams, TResult> - Generic business-rule execution contract.
└ run(params)  Execute business rule and return typed result.

DeleteResult - Uniform soft-delete response payload.
├ id         Deleted resource id.
└ deletedAt  Soft-delete timestamp.

ListOptions - Pagination request options.
├ limit   Requested page size.
└ cursor  Requested pagination cursor.

ListResult<T> - Pagination response payload.
├ data     Page data set.
├ cursor   Cursor for next read position.
└ hasMore  True when more rows remain.

listPageLimitValue(string): number Parse/clamp list page size.
listCursorValue(string):    number Parse/sanitize list cursor offset.
*/

import type {
  CreateFromInstantiable,
  Dictionary,
  ExpectResult,
  FromInstantiable,
  Id,
  Instantiable,
  ScopedUpdate,
  When
} from '@core/std'
import type { ScopedUpdateAdapter } from '@core/stdx'

// ────────────────────────────────────────────────────────────────────────────
// ERROR HANDLING
// ────────────────────────────────────────────────────────────────────────────

/** Error thrown when an API call fails. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/** Normalized provider-error shape for ApiError mapping. */
export type ApiErrorDetail = {
  message?: string
  status?: number
  details?: string
  code?: string
}

/**
 * Throw ApiError when provider error is present.
 * Uses fallback message when provider message is empty.
 * Details default to provider details, then provider code.
 */
export function checkApiError<T extends ApiErrorDetail>(
  error: T | null | undefined,
  fallback: string,
  status: number | ((error: T) => number),
  details?: (error: T) => string | undefined
): void {
  if (!error) return
  throwApiError(error, fallback, status, details)
}

/**
 * Always throw ApiError using provider-error details.
 * Uses fallback message when provider message is empty.
 * Details default to provider details, then provider code.
 */
export function throwApiError<T extends ApiErrorDetail>(
  error: T,
  fallback: string,
  status: number | ((error: T) => number),
  details?: (error: T) => string | undefined
): never {
  const mappedStatus = typeof status === 'function' ? status(error) : status
  const mappedDetails = details ? details(error) : error.details ?? error.code
  throw new ApiError(error.message || fallback, mappedStatus, mappedDetails)
}

/** ApiError handler */
export function apiError(error: unknown): boolean {
  if (error instanceof ApiError) {
    console.error(`${error.status}: ${error.message}`)
    if (error.details) console.error(error.details)
    return true
  }
  return false
}

/**
 * Throw ApiError 422 when a validator rejects a payload.
 * The result string is already the message — validation failures are
 * expected, user-correctable feedback, not a fault worth a console trace.
 */
export function checkValidatorError(result: ExpectResult): void {
  if (result !== null) throw new ApiError(result, 422)
}

// ────────────────────────────────────────────────────────────────────────────
// CRUD & BUSINESS RULE API CONTRACTS
// ────────────────────────────────────────────────────────────────────────────

/** Non-mutating-shape CRUD primitives shared by every ApiCrudContract realization. */
export interface CrudBaseContract<T extends Instantiable> {
  create(input: CreateFromInstantiable<T>): Promise<T>
  get(id: Id): Promise<T>
  delete(id: Id): Promise<DeleteResult>
}

/** Scoped update via a client-side ScopedUpdateAdapter (Supabase, IndexedDB). */
export interface AdaptedUpdateContract<T extends Instantiable> {
  update<K extends keyof FromInstantiable<T>>(
    scoped: ScopedUpdateAdapter<T, K>,
    source: ScopedUpdate<T, K>
  ): Promise<T>
}

/** Scoped update with no adapter translation (abstraction-oriented HTTP endpoints). */
export interface DirectUpdateContract<T extends Instantiable> {
  update<K extends keyof FromInstantiable<T>>(source: ScopedUpdate<T, K>): Promise<T>
}

/** Scoped update pinned to one declared key set, e.g. a composed wrapper's fixed surface. */
export interface PinnedUpdateContract<T extends Instantiable, K extends keyof FromInstantiable<T>> {
  update(source: ScopedUpdate<T, K>): Promise<T>
}

/** Paginated listing. */
export interface CrudListContract<T> {
  list(options?: ListOptions): Promise<ListResult<T>>
}

/** CRUD API contract for adapter-translated backing stores (Supabase, IndexedDB). */
export type ApiCrudContract<T extends Instantiable> =
  & CrudBaseContract<T>
  & AdaptedUpdateContract<T>
  & CrudListContract<T>

/** Business rule API contract. Type parameters default to Dictionary for backward compatibility. */
export interface ApiBusRuleContract<
  TParams extends Dictionary = Dictionary,
  TResult = Dictionary
> {
  run(params: TParams): Promise<TResult>
}

/** Deletion result with timestamp. */
export type DeleteResult = {
  id: Id
  deletedAt: When
}

// ────────────────────────────────────────────────────────────────────────────
// LIST API CONTRACTS
// ────────────────────────────────────────────────────────────────────────────

/** Default pagination limit when not specified. */
export const DEFAULT_LIMIT = 25

/** Maximum allowed pagination limit. */
export const MAX_LIMIT = 100

/** Default pagination cursor when not specified. */
export const DEFAULT_CURSOR = 0

/** Pagination options for list operations. */
export type ListOptions = { limit?: number; cursor?: number }

/** Paginated list result. */
export type ListResult<T> = { data: T[]; cursor: number; hasMore: boolean }

/**
 * Clamp a pagination limit to the range 1-100, defaulting to 25 when unset.
 * @param value Raw limit value from the query string.
 * @returns Clamped limit value.
 */
export const listPageLimitValue = (value?: string | null): number => {
  const parsed = Number.parseInt(value ?? '', 10)
  if (Number.isNaN(parsed) || parsed <= 0) return DEFAULT_LIMIT
  return Math.min(parsed, MAX_LIMIT)
}

/**
 * Parse a pagination cursor to a non-negative integer, defaulting to 0.
 * @param value Raw cursor value from the query string.
 * @returns Parsed cursor.
 */
export const listCursorValue = (value?: string | null): number => {
  const parsed = Number.parseInt(value ?? '', 10)
  return Number.isNaN(parsed) || parsed < 0 ? DEFAULT_CURSOR : parsed
}
