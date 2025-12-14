/**
 * Shared API binding types and HTTP codes used by Netlify adapters.
 */

/** HTTP header map for Netlify responses/requests. */
export type HttpHeaders = Record<string, string>

/** HTTP query map for Netlify responses/requests. */
export type HttpQuery = Record<string, string | undefined>

/** HTTP method for Netlify actions. */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

/** HTTP response codes for Netlify REST calls. */
export const HttpCodes = {
  ok: 200,
  created: 201,
  noContent: 204,
  badRequest: 400,
  notFound: 404,
  methodNotAllowed: 405,
  unprocessableEntity: 422,
  internalError: 500,
} as const

/**
 * Typed Netlify request wrapper passed into API handlers.
 * @template Body Request body type.
 * @template Query Query string type.
 */
export interface ApiRequest<Body = unknown, Query = HttpQuery> {
  method: HttpMethod
  body: Body
  query: Query
  headers: HttpHeaders
  rawEvent: unknown
}

/**
 * Standardized API handler response envelope.
 * @template Payload JSON-serializable response body type.
 */
export interface ApiResult<Payload = unknown> {
  statusCode: number
  headers?: HttpHeaders
  body: Payload
}

/**
 * Type alias for a typed API handler used by platform adapters.
 * @template Body Request body type.
 * @template Query Query string type.
 * @template Payload Response payload type.
 */
export type ApiHandler<Body = unknown, Query = HttpQuery, Payload = unknown>
  = (req: ApiRequest<Body, Query>) => Promise<ApiResult<Payload>> | ApiResult<Payload>
