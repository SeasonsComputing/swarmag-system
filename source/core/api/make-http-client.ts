/*
╔═════════════════════════════════════════════════════════════════════════════╗
║ Make client implementation for API contracts over HTTP                      ║
║ HTTP transport bindings for CRUD and business-rule API contracts            ║
╚═════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Builds transport-agnostic API contracts over HTTP by providing factory
functions for CRUD resources and business-rule endpoints with uniform error
envelope handling.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
CrudHttpSpecification                  CRUD HTTP client configuration.
BusRuleHttpSpecification               Business-rule HTTP client configuration.
makeCrudHttpClient(spec)               Build CRUD/list client over HTTP.
makeBusRuleHttpClient(spec)            Build business-rule runner over HTTP.
*/

import type { Dictionary, Id } from '@core/std'
import {
  type ApiBusRuleContract,
  type ApiCrudContract,
  ApiError,
  DeleteResult,
  type ListOptions,
  type ListResult
} from './api-contract.ts'

// ───────────────────────────────────────────────────────────────────────────────
// PUBLIC
// ───────────────────────────────────────────────────────────────────────────────

/** Configuration for a business-rule HTTP API client. */
export type HttpSpecification = { basePath: string }

/**
 * Factory to produce an API client.
 * @param spec - API specification with base path.
 * @returns API client object with CRUD methods.
 */
export function makeCrudHttpClient<T, TCreate, TUpdate>(
  spec: HttpSpecification
): ApiCrudContract<T, TCreate, TUpdate> {
  const { basePath } = spec
  const api: ApiCrudContract<T, TCreate, TUpdate> = {
    async create(input: TCreate): Promise<T> {
      const res = await fetch(`${basePath}/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      })
      return unwrap<T>(res)
    },
    async get(id: Id): Promise<T> {
      const res = await fetch(`${basePath}/get?id=${id}`)
      return unwrap<T>(res)
    },
    async update(input: TUpdate): Promise<T> {
      const res = await fetch(`${basePath}/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      })
      return unwrap<T>(res)
    },
    async delete(id: Id): Promise<DeleteResult> {
      const res = await fetch(`${basePath}/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      return unwrap<DeleteResult>(res)
    },
    async list(options?: ListOptions): Promise<ListResult<T>> {
      const res = await fetch(`${basePath}/list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options ?? {})
      })
      return unwrapList<T>(res, 'Failed to list items')
    }
  }
  return api
}

/**
 * Factory to produce a business-rule API client over HTTP.
 * @param spec - API specification with base path.
 * @returns API client object with BusRule methods.
 */
export function makeBusRuleHttpClient(spec: HttpSpecification): ApiBusRuleContract {
  const { basePath } = spec
  return {
    async run(params: Dictionary): Promise<Dictionary> {
      const res = await fetch(basePath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      })
      return unwrap<Dictionary>(res)
    }
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// PRIVATE
// ───────────────────────────────────────────────────────────────────────────────

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
async function unwrap<T>(response: Response): Promise<T> {
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
async function unwrapList<T>(
  response: Response,
  fallbackError: string
): Promise<ListResult<T>> {
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
