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
ApiError                           Standard API failure error shape.
ApiErrorDetail                     Normalized error detail shape for mapping.
checkApiError(error, ...): void    Throw ApiError when provider error exists.
throwApiError(error, ...): never   Always throw ApiError from provider error.
apiError(error): boolean           Runtime type guard and logger for ApiError.
ApiCrudContract                    Generic CRUD/list client contract.
ApiBusRuleContract                 Generic business-rule execution contract.
DeleteResult                       Uniform soft-delete response payload.
ListOptions                        Pagination request options.
ListResult<T>                      Pagination response payload.
listPageLimitValue(string): number Parse/clamp list page size.
listCursorValue(string): number    Parse/sanitize list cursor offset.
*/

import type {
  CreateFromInstantiable,
  Dictionary,
  Id,
  Instantiable,
  UpdateFromInstantiable,
  When
} from '@core/std'

// ────────────────────────────────────────────────────────────────────────────
// Error Handling
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

// ────────────────────────────────────────────────────────────────────────────
// CRUD & Business Rule API Contracts
// ────────────────────────────────────────────────────────────────────────────

/** CRUD API contract */
export interface ApiCrudContract<T extends Instantiable> {
  create(input: CreateFromInstantiable<T>): Promise<T>
  get(id: Id): Promise<T>
  update(input: UpdateFromInstantiable<T>): Promise<T>
  delete(id: Id): Promise<DeleteResult>
  list?(options?: ListOptions): Promise<ListResult<T>>
}

/** Business rule API contract */
export interface ApiBusRuleContract {
  run(params: Dictionary): Promise<Dictionary>
}

/** Deletion result with timestamp. */
export type DeleteResult = {
  id: Id
  deletedAt: When
}

// ────────────────────────────────────────────────────────────────────────────
// List API contracts
// ────────────────────────────────────────────────────────────────────────────

/** Default pagination limit when not specified. */
const DEFAULT_LIMIT = 25

/** Maximum allowed pagination limit. */
const MAX_LIMIT = 100

/** Default pagination cursor when not specified. */
const DEFAULT_CURSOR = 0

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
