/*
╔═════════════════════════════════════════════════════════════════════════════╗
║ API client contracts for CRUD & business rule operations                    ║
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
TODO

EXAMPLES
───────────────────────────────────────────────────────────────────────────────
TODO
*/

import type { Dictionary, ID } from '@core-std'

/** Error thrown when an Api call fails. */
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

 // CRUD & Busioness Rule Contract
 // ═════════════════════════════════════════════════════════════════════════════

/** CRUD API client contract */
export interface ApiClientCrud<T, TCreate, TUpdate> {
  create(input: TCreate): Promise<T>
  get(id: ID): Promise<T>
  update(input: TUpdate): Promise<T>
  delete(id: ID): Promise<DeleteResult>
  list?(options?: ListOptions): Promise<ListResult<T>>
}

/** Business rule API client contract */
export interface ApiClientBusRule {
  run(input: Dictionary): Promise<Dictionary>
}

/** Deletion result with timestamp. */
export type DeleteResult = {
  id: ID
  deletedAt: When
}

// LIST API
// ═════════════════════════════════════════════════════════════════════════════

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
export const clampLimit = (value?: string | null): number => {
  const parsed = Number.parseInt(value ?? '', 10)
  if (Number.isNaN(parsed) || parsed <= 0) return DEFAULT_LIMIT
  return Math.min(parsed, MAX_LIMIT)
}

/**
 * Parse a pagination cursor to a non-negative integer, defaulting to 0.
 * @param value Raw cursor value from the query string.
 * @returns Parsed cursor.
 */
export const parseCursor = (value?: string | null): number => {
  const parsed = Number.parseInt(value ?? '', 10)
  return Number.isNaN(parsed) || parsed < 0 ? DEFAULT_CURSOR : parsed
}
