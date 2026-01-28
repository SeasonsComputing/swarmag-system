/**
 * Shared types and utilities for Api abstraction classes.
 */

import type { Dictionary, ID, When } from '@utils'

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

/**
 * Parse the JSON body from a response.
 * @param response - The fetch response.
 * @returns The parsed body.
 * @throws ApiError if JSON parsing fails.
 */
async function parseBody(response: Response): Promise<Dictionary> {
  try {
    return await response.json()
  } catch {
    throw new ApiError('Invalid JSON response', response.status)
  }
}

/**
 * Unwrap a response envelope, returning data or throwing ApiError.
 * @param response - The fetch response.
 * @returns The unwrapped data.
 * @throws ApiError on non-ok response.
 */
export async function unwrap<T>(response: Response): Promise<T> {
  const body = await parseBody(response)

  if (!response.ok) {
    throw new ApiError(
      (body.error as string) ?? 'Request failed',
      response.status,
      body.details as string | undefined
    )
  }

  return body.data as T
}

/**
 * Unwrap a paginated list response.
 * @param response - The fetch response.
 * @param fallbackError - Error message if request fails.
 * @returns The unwrapped list result.
 * @throws ApiError on non-ok response.
 */
export async function unwrapList<T>(response: Response, fallbackError: string): Promise<ListResult<T>> {
  const body = await parseBody(response)

  if (!response.ok) {
    throw new ApiError(
      (body.error as string) ?? fallbackError,
      response.status,
      body.details as string | undefined
    )
  }

  return {
    data: body.data as T[],
    cursor: body.cursor as number,
    hasMore: body.hasMore as boolean
  }
}
