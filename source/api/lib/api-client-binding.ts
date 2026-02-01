/**
 * Shared types and utilities for Api abstraction classes.
 */

import { Config } from '@api/config/api-config.ts'
import type { DeleteResult, ListOptions, ListResult } from '@domain/protocol/helpers-protocol.ts'
import type { Dictionary, ID } from '@utils'

/** Error thrown when an Api call fails. */
export class ApiError extends Error {
  constructor(message: string, public readonly status: number, public readonly details?: string) {
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
 * Build a full endpoint URL.
 * @param path - The path to append.
 * @returns Full URL.
 */
function endpoint(path: string): string {
  return `${Config.get('VITE_API_URL')}${path}`
}

/**
 * Unwrap a response envelope, returning data or throwing ApiError.
 * @param response - The fetch response.
 * @returns The unwrapped data.
 * @throws ApiError on non-ok response.
 */
async function unwrap<T>(response: Response): Promise<T> {
  const body = await parseBody(response)

  if (!response.ok) {
    throw new ApiError((body.error as string) ?? 'Request failed', response.status, body.details as string | undefined)
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
async function unwrapList<T>(response: Response, fallbackError: string): Promise<ListResult<T>> {
  const body = await parseBody(response)

  if (!response.ok) {
    throw new ApiError((body.error as string) ?? fallbackError, response.status, body.details as string | undefined)
  }

  return { data: body.data as T[], cursor: body.cursor as number, hasMore: body.hasMore as boolean }
}

/** Configuration for an API client. */
export interface ApiSpecification<T, TCreate, TUpdate> {
  basePath: string
}

/**
 * Factory to produce an API client.
 * @param spec - API specification with base path.
 * @returns API client object with CRUD methods.
 */
export function makeApiClient<T, TCreate, TUpdate>(spec: ApiSpecification<T, TCreate, TUpdate>) {
  const { basePath } = spec

  return { async create(input: TCreate): Promise<T> {
    const res = await fetch(endpoint(`${basePath}/create`), { method: 'POST',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) })
    return unwrap<T>(res)
  }, async get(id: ID): Promise<T> {
    const res = await fetch(endpoint(`${basePath}/get?id=${id}`))
    return unwrap<T>(res)
  }, async update(input: TUpdate): Promise<T> {
    const res = await fetch(endpoint(`${basePath}/update`), { method: 'PUT',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) })
    return unwrap<T>(res)
  }, async delete(id: ID): Promise<DeleteResult> {
    const res = await fetch(endpoint(`${basePath}/delete`), { method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    return unwrap<DeleteResult>(res)
  }, async list(options?: ListOptions): Promise<ListResult<T>> {
    const res = await fetch(endpoint(`${basePath}/list`), { method: 'POST',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(options ?? {}) })
    return unwrapList<T>(res, 'Failed to list items')
  } }
}
