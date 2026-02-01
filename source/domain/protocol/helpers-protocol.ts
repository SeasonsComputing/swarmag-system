/**
 * Protocol types for abstraction helpers
 * Defines wire shapes for request/response contracts.
 */

import type { ID, When } from '@utils'

/** Pagination options for list operations. */
export interface ListOptions {
  limit?: number
  cursor?: number
}

/** Paginated list result. */
export interface ListResult<T> {
  data: T[]
  cursor: number
  hasMore: boolean
}

/** Deletion result with timestamp. */
export interface DeleteResult {
  id: ID
  deletedAt: When
}
