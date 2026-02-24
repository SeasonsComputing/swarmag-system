/*
╔═════════════════════════════════════════════════════════════════════════════╗
║ API contracts for CRUD, List & business rule operations                     ║
║ TODO                                                                        ║
╚═════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
TODO

╔═════════════════════════════════════════════════════════════════════════════╗
║ USAGE                                                                       ║
╚═════════════════════════════════════════════════════════════════════════════╝

EXPORTED APIs & TYPEs
───────────────────────────────────────────────────────────────────────────────
ApiError
ApiCrudContract
ApiBusRuleContract
DeleteResult
ListOptions
ListResult<T>
listPageLimitValue(string): number
listCursorValue(string): number

EXAMPLES
───────────────────────────────────────────────────────────────────────────────
TODO
*/

import type { Dictionary, Id, When } from '@core-std'

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
export interface ApiCrudContract<T, TCreate, TUpdate> {
  create(input: TCreate): Promise<T>
  get(id: Id): Promise<T>
  update(input: TUpdate): Promise<T>
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
export type ListOptions = {
  limit?: number
  cursor?: number
}

/** Paginated list result. */
export type ListResult<T> = {
  data: T[]
  cursor: number
  hasMore: boolean
}

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
