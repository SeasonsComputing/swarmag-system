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
HttpSpecification            CRUD & Business Rule HTTP client configuration.
makeCrudHttpClient(spec)     Build CRUD/list client over HTTP.
makeBusRuleHttpClient(spec)  Build business-rule runner over HTTP.
*/

import type {
  ApiBusRuleContract,
  ApiCrudContract,
  ApiErrorDetail,
  DeleteResult,
  ListOptions,
  ListResult
} from '@core/api/api-contract.ts'
import { ApiError, checkApiError, throwApiError } from '@core/api/api-contract.ts'
import type {
  CreateFromInstantiable,
  Dictionary,
  Id,
  Instantiable,
  UpdateFromInstantiable
} from '@core/std'

/** Configuration for a business-rule HTTP API client. */
export type HttpSpecification = { basePath: string }

/**
 * Maker to produce an API client.
 * @param spec - API specification with base path.
 * @returns API client object with CRUD methods.
 */
export const makeCrudHttpClient = <T extends Instantiable>(
  { basePath }: HttpSpecification
): ApiCrudContract<T> => ({
  /* Create record over HTTP and unwrap API envelope. */
  async create(input: CreateFromInstantiable<T>): Promise<T> {
    const res = await request(`${basePath}/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    })
    return unwrap<T>(res)
  },

  /* Get record by id over HTTP and unwrap API envelope. */
  async get(id: Id): Promise<T> {
    const res = await request(`${basePath}/get?id=${encodeURIComponent(id)}`)
    return unwrap<T>(res)
  },

  /* Update record over HTTP and unwrap API envelope. */
  async update(source: UpdateFromInstantiable<T>): Promise<T> {
    const res = await request(`${basePath}/update`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(source)
    })
    return unwrap<T>(res)
  },

  /* Soft-delete record over HTTP and unwrap delete payload. */
  async delete(id: Id): Promise<DeleteResult> {
    const res = await request(`${basePath}/delete`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    return unwrap<DeleteResult>(res)
  },

  /* List records over HTTP using list payload options. */
  async list(options?: ListOptions): Promise<ListResult<T>> {
    const res = await request(`${basePath}/list`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options ?? {})
    })
    return unwrapList<T>(res, 'Failed to list items')
  }
})

/**
 * Factory to produce a business-rule API client over HTTP.
 * @param spec - API specification with base path.
 * @returns API client object with BusRule methods.
 */
export const makeBusRuleHttpClient = (
  { basePath }: HttpSpecification
): ApiBusRuleContract => ({
  async run(params: Dictionary): Promise<Dictionary> {
    const res = await request(basePath, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    })
    return unwrap<Dictionary>(res)
  }
})

// ───────────────────────────────────────────────────────────────────────────────
// INTERNALS
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Execute fetch and normalize transport failures to ApiError.
 * @param input Request URL.
 * @param init Request options.
 * @returns Fetch response.
 * @throws ApiError on network/transport failure.
 */
async function request(input: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init)
  } catch (error) {
    throwApiError(
      { message: error instanceof Error ? error.message : undefined },
      'Network request failed',
      503
    )
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
async function unwrap<T>(response: Response): Promise<T> {
  const body = await parseBody(response)
  if (!response.ok) {
    const apiError: ApiErrorDetail = {
      message: body.error as string | undefined,
      details: body.details as string | undefined
    }
    checkApiError(apiError, 'Request failed', response.status)
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
    const apiError: ApiErrorDetail = {
      message: body.error as string | undefined,
      details: body.details as string | undefined
    }
    checkApiError(apiError, fallbackError, response.status)
  }
  return {
    data: body.data as T[],
    cursor: body.cursor as number,
    hasMore: body.hasMore as boolean
  }
}
