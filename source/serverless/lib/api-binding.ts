/**
 * Shared API binding types and HTTP protocol constants.
 */

/** HTTP header map for responses/requests. */
export type HttpHeaders = Record<string, string>

/** HTTP query map for responses/requests. */
export type HttpQuery = Record<string, string>

/** HTTP method for API handlers. */
export type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'OPTIONS'
  | 'HEAD'

/** HTTP method set for validation. */
const HttpMethodSet = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'OPTIONS',
  'HEAD'
] as const

/**
 * Type guard for supported HTTP method strings.
 * @param value Raw value to validate HTTP method.
 * @returns True when value is a supported HTTP method.
 */
export const isHttpMethod = (value: string): value is HttpMethod => (HttpMethodSet as readonly string[]).includes(value)

/** HTTP response codes for REST calls. */
export const HttpCodes = {
  ok: 200,
  created: 201,
  noContent: 204,
  badRequest: 400,
  notFound: 404,
  methodNotAllowed: 405,
  payloadTooLarge: 413,
  unprocessableEntity: 422,
  internalError: 500
} as const

/** Common HTTP header keys. */
export const HEADER_CONTENT_TYPE = 'content-type'
export const HEADER_AUTHORIZATION = 'authorization'
export const HEADER_VARY = 'vary'
export const HEADER_ALLOW_ORIGIN = 'access-control-allow-origin'
export const HEADER_ALLOW_METHODS = 'access-control-allow-methods'
export const HEADER_ALLOW_HEADERS = 'access-control-allow-headers'
export const HEADER_ALLOW_CREDENTIALS = 'access-control-allow-credentials'

/**
 * Typed request wrapper passed into API handlers.
 * @template RequestBody Request body type.
 * @template Query Query string type.
 */
export interface ApiRequest<Body = unknown, Query = HttpQuery, Headers = HttpHeaders> {
  method: HttpMethod
  body: Body
  query: Query
  headers: Headers
  rawRequest: Request
}

/**
 * Standardized API handler response envelope.
 * @template ResponseBody JSON-serializable response body type.
 */
export interface ApiResponse<Body = unknown, Headers = HttpHeaders> {
  statusCode: number
  headers?: Headers
  body: Body
}

/**
 * Type alias for a typed API handler used by platform adapters.
 * @template RequestBody Request body type.
 * @template Query Query string type.
 * @template ResponseBody Response body type.
 */
export type ApiHandler<RequestBody = unknown, Query = HttpQuery, ResponseBody = unknown> = (
  req: ApiRequest<RequestBody, Query>
) => Promise<ApiResponse<ResponseBody>> | ApiResponse<ResponseBody>
