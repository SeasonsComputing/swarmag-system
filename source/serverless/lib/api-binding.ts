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
const HttpMethodSet = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'] as const

/**
 * Type guard for supported HTTP method strings.
 * @param value Raw value to validate HTTP method.
 * @returns True when value is a supported HTTP method.
 */
export const isHttpMethod = (value: string): value is HttpMethod => (HttpMethodSet as readonly string[]).includes(value)

/** HTTP response codes for REST calls. */
export const HttpCodes = { ok: 200, created: 201, noContent: 204, badRequest: 400, notFound: 404, methodNotAllowed: 405,
  payloadTooLarge: 413, unprocessableEntity: 422, internalError: 500 } as const

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
) =>
  | Promise<ApiResponse<ResponseBody>>
  | ApiResponse<ResponseBody>

// ----------------------------------------------------------------------------
// Response Helpers
// ----------------------------------------------------------------------------

/**
 * Extract error message from unknown error value.
 * @param err Unknown error value.
 * @returns Error message string.
 */
const extractErrorMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  return String(err)
}

/**
 * Build a 200 OK response with data payload.
 * @param data Response data.
 * @returns ApiResponse with status 200.
 */
export const toOk = <T>(data: T): ApiResponse<{ data: T }> => ({ statusCode: HttpCodes.ok, body: { data } })

/**
 * Build a 201 Created response with data payload.
 * @param data Created resource data.
 * @returns ApiResponse with status 201.
 */
export const toCreated = <T>(data: T): ApiResponse<{ data: T }> => ({ statusCode: HttpCodes.created, body: { data } })

/**
 * Build a 400 Bad Request error response.
 * @param error Error message.
 * @returns ApiResponse with status 400.
 */
export const toBadRequest = (error: string): ApiResponse<{ error: string }> => ({ statusCode: HttpCodes.badRequest,
  body: { error } })

/**
 * Build a 404 Not Found error response.
 * @param error Error message.
 * @returns ApiResponse with status 404.
 */
export const toNotFound = (error: string): ApiResponse<{ error: string }> => ({ statusCode: HttpCodes.notFound,
  body: { error } })

/**
 * Build a 405 Method Not Allowed error response.
 * @returns ApiResponse with status 405.
 */
export const toMethodNotAllowed = (): ApiResponse<{ error: string }> => ({ statusCode: HttpCodes.methodNotAllowed,
  body: { error: 'Method Not Allowed' } })

/**
 * Build a 422 Unprocessable Entity error response.
 * @param error Validation error message.
 * @returns ApiResponse with status 422.
 */
export const toUnprocessable = (error: string): ApiResponse<{ error: string }> => ({
  statusCode: HttpCodes.unprocessableEntity,
  body: { error }
})

/**
 * Build a 500 Internal Server Error response.
 * @param error Error message.
 * @param details Optional error details or error object.
 * @returns ApiResponse with status 500.
 */
export const toInternalError = (
  error: string,
  details?: unknown
): ApiResponse<{ error: string; details?: string }> => ({ statusCode: HttpCodes.internalError,
  body: details ? { error, details: extractErrorMessage(details) } : { error } })
