/*
╔═════════════════════════════════════════════════════════════════════════════╗
║ HTTP-HANDLER                                                                ║
║ Platform-agnostic HTTP handler utilities                                    ║
╚═════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Provides a typed, platform-agnostic abstraction over the Fetch API
Request/Response contract for building REST APIs. Works identically on
Netlify or Supabase functions (edge runtime) or Node and Deno-based
application server (host runtime).

╔═════════════════════════════════════════════════════════════════════════════╗
║ USAGE                                                                       ║
╚═════════════════════════════════════════════════════════════════════════════╝

EXPORTED APIs & TYPEs
───────────────────────────────────────────────────────────────────────────────
HttpMethod, HttpQuery, HttpHeaders
  → Fundamental HTTP primitives used throughout
HttpCodes
  → Semantic constants: HttpCodes.ok, HttpCodes.badRequest, etc.
  → Eliminates magic numbers, improves readability
HttpRequest<Body, Query, Headers>
  → Typed request wrapper: { method, body, query, headers, rawRequest }
  → Handlers receive this instead of raw Fetch Request
HttpResponse<Body, Headers>
  → Typed response envelope: { statusCode, body, headers? }
  → Handlers return this instead of raw Fetch Response
HttpHandler<RequestBody, Query, ResponseBody>
  → Type alias for handler functions: async (request: Request): Promise<Response>

RESPONSE BUILDER HELPERS
───────────────────────────────────────────────────────────────────────────────
Success builders:
  toOk(data)                  → 200 { data: T }
  toCreated(data)             → 201 { data: T }
Error builders:
  toBadRequest(msg)           → 400 { error: string }
  toNotFound(msg)             → 404 { error: string }
  toMethodNotAllowed()        → 405 { error: string }
  toUnprocessable(msg)        → 422 { error: string }
  toInternalError(msg)        → 500 { error: string, details?: string }
Usage pattern:
  return toOk(user)           // Success case
  return toNotFound('...')    // Client error
  return toInternalError(...) // Server error

HTTP HANDLER WRAPPER (ADAPTER)
───────────────────────────────────────────────────────────────────────────────
wrapHttpHandler<RequestBody, Query, ResponseBody>(
  handler: HttpHandler,
  config?: HttpHandlerConfig
): (request: Request) => Promise<Response>

The primary export - wraps your handler with:

Pre-processing:
  ✓ OPTIONS preflight handling (if CORS enabled)
  ✓ HTTP method validation
  ✓ Header normalization (lowercase keys)
  ✓ Body parsing with size limits & Content-Type checks
  ✓ Query parameter extraction
Handler Delegation:
  ✓ Pass typed HttpRequest to your handler
  ✓ Catch and serialize any thrown errors
Post-processing:
  ✓ Validate status code
  ✓ Serialize response body
  ✓ Apply CORS headers
  ✓ Set Content-Type
  ✓ Return standardized Fetch Response
Error-handling:
  ✓ Top-level try/catch wraps everything
  ✓ Body parsing errors → 400/413 responses
  ✓ Handler errors → 500 responses with safe serialization
  ✓ Never leaks stack traces or sensitive data

EXAMPLE OF BASIC HANDLER
───────────────────────────────────────────────────────────────────────────────
export default wrapHttpHandler(async (req) => {
  if (req.method !== 'POST') return toMethodNotAllowed()
  const user = await createUser(req.body)
  return toCreated(user)
})

EXAMPLE WITH CORS & VALIDATION
───────────────────────────────────────────────────────────────────────────────
export default wrapHttpHandler(async (req) => {
  const validated = validateUserInput(req.body)
  if (!validated.ok) return toUnprocessable(validated.error)
  return toOk(await saveUser(validated.data))
}, {
  cors: true,
  maxBodySize: 1024 * 1024 // 1MB limit
})

╔═════════════════════════════════════════════════════════════════════════════╗
║ INTERNALS                                                                   ║
╚═════════════════════════════════════════════════════════════════════════════╝

DESIGN PRINCIPLES:
───────────────────────────────────────────────────────────────────────────────
1. Platform Agnostic
   Uses only Web Standards (Fetch API) - no platform-specific imports
2. Type Safety
   Full TypeScript generics for request/response bodies and query params
3. Fast-Fail Validation
   Rejects invalid requests early with clear error messages
4. Security First
   Never leaks stack traces, validates all inputs, enforces size limits
5. Consistent Envelopes
   Success: { data: T }, Error: { error: string, details?: string }
6. Zero Runtime Dependencies
   Pure TypeScript with no external packages

FETCH REQUEST-RESPONSE FLOW:
───────────────────────────────────────────────────────────────────────────────
┌─────────────────┐
|  Fetch Request  |         (Raw HTTP from client)
└────────┬────────┘
         ▼
┌──────────────────┐
| wrapHttpHandler  |        (Handler Adapter HoC)
└────────┬─────────┘
         ├──▶ Parse & validate HTTP method
         ├──▶ Normalize headers (lowercase)
         ├──▶ Parse body (JSON, size limits)
         ├──▶ Extract query parameters
         ├──▶ Handle CORS (if configured)
         ▼
┌─────────────────┐
|   HttpRequest   |      (Typed, validated request)
└────────┬────────┘
         ▼
┌─────────────────┐
|  Your Handler   |         (Business logic)
└────────┬────────┘
         ▼
┌─────────────────┐
|  HttpResponse   |    (Typed response envelope)
└────────┬────────┘
         ├──▶ Validate status code
         ├──▶ Serialize body (JSON)
         ├──▶ Apply CORS headers
         ├──▶ Set Content-Type
         ▼
┌────────────────┐
| Fetch Response |   (Standardized HTTP response)
└────────────────┘

  HANDLER CONFIGURATION
  ───────────────────────────────────────────────────────────────────────────────
  HttpHandlerConfig
    → CORS: boolean | { origin, methods, headers, credentials }
    → maxBodySize: bytes (default 6MB for Netlify compatibility)
    → validateContentType: enforce application/json (default true)
    → multiValueQueryParams: handle ?tag=a&tag=b (default false)

  REQUEST NORMALIZATION
  ───────────────────────────────────────────────────────────────────────────────
  normalizeHeaders(Headers) → HttpHeaders
    → Convert Fetch Headers to { [key: string]: string }
    → Lowercase all keys for case-insensitive access
  normalizeQuery(URLSearchParams) → HttpQuery
    → Extract query string into { [key: string]: string }
    → Optionally handle multi-value params (?tag=a&tag=b → "a,b")
  normalizeHeaderMap(HttpHeaders) → HttpHeaders
    → Ensure response headers are lowercase (internal helper)

  CORS & RESPONSE BUILDING
  ───────────────────────────────────────────────────────────────────────────────
  makeCorsHeaders(config) → HttpHeaders
    → Generate Access-Control-* headers from config
    → Defaults: origin='*', methods=all, headers=common
  toHeaders(HttpHeaders) → Headers
    → Convert plain object to Fetch Headers instance

  VALIDATION & ERROR HANDLING
  ───────────────────────────────────────────────────────────────────────────────
  validateStatusCode(number) → number
    → Ensure status code is valid HTTP range (100-599)
    → Falls back to 500 if invalid
  serializeError(unknown) → { name, message }
    → Safely convert any error value to JSON-safe object
    → Handles Error instances, strings, objects, primitives
  byteLength(string) → number
    → Calculate UTF-8 byte size (for body size limits)
  NamedError
    → Internal error type with stable .name for error routing

  REQUEST BODY PARSING
  ───────────────────────────────────────────────────────────────────────────────
  parseRequestBody(request, method, contentType, config) → unknown      |
    → Core body parsing pipeline with validation:                       |
      1. Skip if method doesn't expect body (GET, HEAD, OPTIONS)
      2. Check Content-Length header against maxBodySize
      3. Read body text and measure actual byte length
      4. Validate Content-Type is application/json (if enabled)
      5. Parse JSON with error handling
  Throws NamedError on failure:
    - PayloadTooLarge: body exceeds maxBodySize
    - InvalidContentType: not application/json
    - InvalidJSON: JSON.parse() failed

  RESPONSE OUTPUT
  ───────────────────────────────────────────────────────────────────────────────
  NO_BODY_STATUS_CODES = [204, 304]
    → Status codes that should return empty body
  makeResponse(statusCode, body, headers?, config?) → Response
    → Core response builder with consistent structure:
      1. Merge CORS headers if configured
      2. Handle no-body status codes (204, 304)
      3. Serialize body to JSON (or pass through string)
      4. Set Content-Type header
      5. Return Fetch Response instance
  makeErrorResponse(statusCode, error, details, config?) → Response
    → Convenience wrapper for error responses
    → Always returns { error: string, details?: string }
`*/

// ───────────────────────────────────────────────────────────────────────────────
// PUBLIC EXPORTS
// ───────────────────────────────────────────────────────────────────────────────

/** HTTP header map for responses/requests. */
export type HttpHeaders = Record<string, string>

/** HTTP query map for responses/requests. */
export type HttpQuery = Record<string, string>

/** HTTP method for handlers. */
export type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'OPTIONS'
  | 'HEAD'

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

/**
 * Typed request wrapper passed into handlers.
 * @template RequestBody Request body type.
 * @template Query Query string type.
 */
export type HttpRequest<
  Body = unknown,
  Query = HttpQuery,
  Headers = HttpHeaders
> = {
  method: HttpMethod
  body: Body
  query: Query
  headers: Headers
  rawRequest: Request
}

/**
 * Standardized handler response envelope.
 * @template ResponseBody JSON-serializable response body type.
 */
export type HttpResponse<
  Body = unknown,
  Headers = HttpHeaders
> = {
  statusCode: number
  headers?: Headers
  body: Body
}

/**
 * Type alias for a typed HTTP handler.
 * @template RequestBody Request body type.
 * @template Query Query string type.
 * @template ResponseBody Response body type.
 */
export type HttpHandler<
  RequestBody = unknown,
  Query = HttpQuery,
  ResponseBody = unknown
> = (
  request: HttpRequest<RequestBody, Query>
) =>
  | Promise<HttpResponse<ResponseBody>>
  | HttpResponse<ResponseBody>

/**
 * Build a 200 OK response with data payload.
 * @param data Response data.
 * @returns HttpResponse with status 200.
 */
export const toOk = <T>(data: T): HttpResponse<{ data: T }> => ({
  statusCode: HttpCodes.ok,
  body: { data }
})

/**
 * Build a 201 Created response with data payload.
 * @param data Created resource data.
 * @returns HttpResponse with status 201.
 */
export const toCreated = <T>(data: T): HttpResponse<{ data: T }> => ({
  statusCode: HttpCodes.created,
  body: { data }
})

/**
 * Build a 400 Bad Request error response.
 * @param error Error message.
 * @returns HttpResponse with status 400.
 */
export const toBadRequest = (error: string): HttpResponse<{ error: string }> => ({
  statusCode: HttpCodes.badRequest,
  body: { error }
})

/**
 * Build a 404 Not Found error response.
 * @param error Error message.
 * @returns HttpResponse with status 404.
 */
export const toNotFound = (error: string): HttpResponse<{ error: string }> => ({
  statusCode: HttpCodes.notFound,
  body: { error }
})

/**
 * Build a 405 Method Not Allowed error response.
 * @returns HttpResponse with status 405.
 */
export const toMethodNotAllowed = (): HttpResponse<{ error: string }> => ({
  statusCode: HttpCodes.methodNotAllowed,
  body: { error: 'Method Not Allowed' }
})

/**
 * Build a 422 Unprocessable Entity error response.
 * @param error Validation error message.
 * @returns HttpResponse with status 422.
 */
export const toUnprocessable = (error: string): HttpResponse<{ error: string }> => ({
  statusCode: HttpCodes.unprocessableEntity,
  body: { error }
})

/**
 * Build a 500 Internal Server Error response.
 * @param error Error message.
 * @param details Optional error details or error object.
 * @returns HttpResponse with status 500.
 */
export const toInternalError = (
  error: string,
  details?: unknown
): HttpResponse<{ error: string; details?: string }> => ({
  statusCode: HttpCodes.internalError,
  body: details ? { error, details: extractErrorMessage(details) } : { error }
})

/**
 * Configuration options for the HTTP provider.
 */
export interface HttpHandlerConfig {
  /** Enable CORS headers in responses. Default: false */
  cors?:
    | boolean
    | { origin?: string; methods?: string[]; headers?: string[]; credentials?: boolean }
  /** Maximum request body size in bytes. Default: 6MB (Netlify limit) */
  maxBodySize?: number
  /** Validate Content-Type header for requests with bodies. Default: true */
  validateContentType?: boolean
  /** Support multi-value query parameters (e.g., ?tag=red&tag=blue). Default: false */
  multiValueQueryParams?: boolean
}

/**
 * Wrap a typed HTTP handler to the HttpRequest/HttpResponse contract.
 *
 * @template RequestBody Request body type (for documentation only - validated by handler).
 * @template Query Query parameters type (for documentation only - validated by handler).
 * @template ResponseBody Response body type.
 * @param handle Typed handler to wrap. Must validate its own inputs.
 * @param config Optional adapter configuration for CORS, validation, etc.
 * @returns HTTP handler ready for export.
 */
export const wrapHttpHandler = <
  RequestBody = unknown,
  Query = HttpQuery,
  ResponseBody = unknown
>(
  handler: HttpHandler<RequestBody, Query, ResponseBody>,
  config: HttpHandlerConfig = {}
) => {
  return async (request: Request): Promise<Response> => {
    try {
      //
      // Validate & normalize the request
      //

      const method = request.method

      if (method === 'OPTIONS' && config.cors) {
        return makeResponse(HttpCodes.noContent, '', {}, config)
      }

      if (!isHttpMethod(method)) {
        return makeErrorResponse(HttpCodes.methodNotAllowed, 'MethodNotAllowed',
          `HTTP method '${method}' is not supported`, config)
      }

      const headers = normalizeHeaders(request.headers)

      let body: unknown
      try {
        body = await parseRequestBody(request, method, headers['content-type'], config)
      } catch (err) {
        const { name, message } = serializeError(err)
        const statusCode = name === 'PayloadTooLarge'
          ? HttpCodes.payloadTooLarge
          : HttpCodes.badRequest
        return makeErrorResponse(statusCode, name, message, config)
      }

      const url = new URL(request.url)
      const query = normalizeQuery(url.searchParams, config.multiValueQueryParams ?? false)

      const HttpRequest: HttpRequest<RequestBody, Query, HttpHeaders> = {
        method,
        body: body as RequestBody,
        query: query as Query,
        headers,
        rawRequest: request
      }

      //
      // Delegate to handler
      //

      const result: HttpResponse<ResponseBody, HttpHeaders> = await handler(HttpRequest)

      //
      // Validate and prepare response
      //

      const statusCode = validateStatusCode(result.statusCode)
      return makeResponse(statusCode, result.body, result.headers, config)
    } catch (err) {
      const { name, message } = serializeError(err)
      console.error('Unhandled error in HTTP handler:', { name, message, err })
      return makeErrorResponse(HttpCodes.internalError, name, message, config)
    }
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// PRIVATE IMPLEMENTATION
// ───────────────────────────────────────────────────────────────────────────────

type Message = { name: string; message: string; stack?: string }

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
 * HTTP methods that typically include request bodies.
 */
const METHODS_WITH_BODY = new Set<HttpMethod>(['POST', 'PUT', 'PATCH', 'DELETE'])
const DEFAULT_MAX_BODY_SIZE = 6 * 1024 * 1024

/**
 * HTTP status codes that should not include a response body.
 */
const NO_BODY_STATUS_CODES = new Set([204, 304])

/** Common HTTP header keys. */
const HEADER_CONTENT_TYPE = 'content-type'
const HEADER_AUTHORIZATION = 'authorization'
const HEADER_VARY = 'vary'
const HEADER_ALLOW_ORIGIN = 'access-control-allow-origin'
const HEADER_ALLOW_METHODS = 'access-control-allow-methods'
const HEADER_ALLOW_HEADERS = 'access-control-allow-headers'
const HEADER_ALLOW_CREDENTIALS = 'access-control-allow-credentials'

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
 * Normalize HTTP headers to lowercase keys for case-insensitive access.
 * @param headers Raw headers object.
 * @returns Normalized headers with lowercase keys.
 */
const normalizeHeaders = (headers: Headers): HttpHeaders => {
  const normalized: HttpHeaders = {}
  for (const [key, value] of headers.entries()) {
    normalized[key.toLowerCase()] = value
  }
  return normalized
}

/**
 * Parse query string parameters, optionally handling multi-value params.
 * @param params URLSearchParams instance.
 * @param enableMultiValue Whether to merge multi-value parameters.
 * @returns Clean query object with string values (multi-values joined with commas).
 */
const normalizeQuery = (params: URLSearchParams, enableMultiValue: boolean): HttpQuery => {
  const normalized: HttpQuery = {}
  const keys = new Set<string>()
  params.forEach((_value, key) => keys.add(key))
  for (const key of keys) {
    const values = params.getAll(key)
    if (values.length === 0) continue
    if (enableMultiValue && values.length > 1) {
      normalized[key] = values.join(',')
    } else {
      normalized[key] = values[0]
    }
  }
  return normalized
}

/**
 * Normalize a header map to lowercase keys.
 * @param headers Header map.
 * @returns Normalized headers with lowercase keys.
 */
const normalizeHeaderMap = (headers: HttpHeaders): HttpHeaders => {
  const normalized: HttpHeaders = {}
  for (const [key, value] of Object.entries(headers)) {
    normalized[key.toLowerCase()] = value
  }
  return normalized
}

/**
 * Make CORS headers based on configuration.
 * @param config CORS configuration.
 * @returns Headers object with CORS headers.
 */
const makeCorsHeaders = (
  config: boolean | NonNullable<HttpHandlerConfig['cors']>
): HttpHeaders => {
  if (config === false) return {}
  const corsConfig = config === true ? {} : config
  return {
    [HEADER_ALLOW_ORIGIN]: corsConfig.origin ?? '*',
    [HEADER_ALLOW_METHODS]: corsConfig.methods?.join(', ')
      ?? 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    [HEADER_ALLOW_HEADERS]: corsConfig.headers?.join(', ') ?? 'Content-Type, Authorization',
    [HEADER_VARY]: 'Origin',
    ...(corsConfig.credentials ? { [HEADER_ALLOW_CREDENTIALS]: 'true' } : {})
  }
}

/**
 * Convert a header map into a Headers object.
 * @param headers Header map.
 * @returns Headers instance.
 */
const toHeaders = (headers: HttpHeaders): Headers => {
  const responseHeaders = new Headers()
  for (const [key, value] of Object.entries(headers)) {
    responseHeaders.set(key, value)
  }
  return responseHeaders
}

/**
 * Validate that status code is in valid HTTP range.
 * @param statusCode Status code to validate.
 * @returns Validated status code.
 */
const validateStatusCode = (statusCode: number): number => {
  if (!Number.isInteger(statusCode) || statusCode < 100 || statusCode > 599) {
    console.warn(`Handler returned invalid status code ${statusCode}, using 500`)
    return HttpCodes.internalError
  }
  return statusCode
}

/**
 * Safely serialize an error for JSON response.
 * @param err Unknown error value.
 * @returns Error object with name and message.
 */
const serializeError = (err: unknown): Message => {
  // 1. Force everything into an Error-like shape immediately
  const normalized = err instanceof Error
    ? err
    : (typeof err === 'object' && err !== null && 'message' in err)
    ? err as Error // It looks like an error, treat it like one
    : new Error(typeof err === 'string' ? err : JSON.stringify(err) || String(err))

  // 2. Extract properties manually (because stringify skips non-enumerable Error props)
  const result: { name: string; message: string; stack?: string } = {
    name: normalized.name || 'Error',
    message: String(normalized.message || 'Unknown error'),
    stack: normalized.stack
  }

  // 3. Handle additional custom metadata (e.g., status codes, "cause")
  if (err && typeof err === 'object') {
    try {
      // Pick up extra custom properties that aren't name/message/stack
      const extraData = JSON.parse(JSON.stringify(err, getCircularReplacer()))
      return { ...extraData, ...result }
    } catch {
      // If circular, we still have the name/message/stack from step 2
    }
  }
  return result
}

// Helper to prevent the "Circular structure to JSON" crash
const getCircularReplacer = () => {
  const seen = new WeakSet()
  return (_key: string, value: unknown) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) return '[Circular]'
      seen.add(value)
    }
    return value
  }
}

/**
 * Return a byte length for a string using UTF-8 encoding.
 * @param value Raw string.
 * @returns Byte length.
 */
const byteLength = (value: string): number => new TextEncoder().encode(value).length

/**
 * Parse and validate request body with size limits.
 * @param request Fetch Request.
 * @param method HTTP method.
 * @param contentType Content-Type header value.
 * @param config Adapter configuration.
 * @returns Parsed body or undefined.
 * @throws Error if parsing fails or validation fails.
 */
const parseRequestBody = async (
  request: Request,
  method: HttpMethod,
  contentType: string | undefined,
  config: HttpHandlerConfig
): Promise<unknown> => {
  // No body expected for these methods
  if (!METHODS_WITH_BODY.has(method)) return undefined

  // No body provided
  if (!request.body) return undefined

  const maxSize = config.maxBodySize ?? DEFAULT_MAX_BODY_SIZE
  const contentLength = request.headers.get('content-length')
  if (contentLength) {
    const parsedLength = Number.parseInt(contentLength, 10)
    if (!Number.isNaN(parsedLength) && parsedLength > maxSize) {
      throw new NamedError('PayloadTooLarge',
        `Request body exceeds maximum size of ${maxSize} bytes`)
    }
  }

  const decodedBody = await request.text()
  if (!decodedBody) {
    return undefined
  }

  const bodySize = byteLength(decodedBody)
  if (bodySize > maxSize) {
    throw new NamedError('PayloadTooLarge',
      `Request body exceeds maximum size of ${maxSize} bytes`)
  }

  // Validate Content-Type for bodies
  if (config.validateContentType !== false) {
    const ct = contentType?.toLowerCase() ?? ''
    if (!ct.includes('application/json')) {
      throw new NamedError('InvalidContentType',
        `Expected Content-Type: application/json, received: ${contentType ?? 'none'}`)
    }
  }

  // Parse JSON
  try {
    return JSON.parse(decodedBody)
  } catch (err) {
    throw new NamedError('InvalidJSON', `Invalid JSON: ${(err as Error).message}`)
  }
}

/**
 * Build a Response with consistent headers.
 * @param statusCode HTTP status code.
 * @param body JSON-serializable payload, or a pre-serialized string when using a custom content-type.
 * @param additionalHeaders Optional additional headers to merge.
 * @param config Adapter configuration for CORS, etc.
 * @returns Fetch Response.
 */
const makeResponse = (
  statusCode: number,
  body: unknown,
  additionalHeaders: HttpHeaders = {},
  config: HttpHandlerConfig = {}
): Response => {
  const corsHeaders = config.cors ? makeCorsHeaders(config.cors) : {}
  const normalizedResponseHeaders = normalizeHeaderMap(additionalHeaders)

  if (NO_BODY_STATUS_CODES.has(statusCode)) {
    return new Response('', {
      status: statusCode,
      headers: toHeaders({ ...corsHeaders, ...normalizedResponseHeaders })
    })
  }

  const customContentType = normalizedResponseHeaders[HEADER_CONTENT_TYPE]
  const isJsonResponse = !customContentType
    || customContentType.toLowerCase().includes('application/json')

  let bodyString: string
  if (isJsonResponse) {
    try {
      bodyString = JSON.stringify(body === undefined ? null : body)
    } catch (err) {
      console.error('Handler returned non-serializable response body:', body)
      return makeErrorResponse(HttpCodes.internalError, 'InvalidResponse',
        `Response body is not JSON-serializable: ${(err as Error).message}`, config)
    }
  } else if (typeof body === 'string') {
    bodyString = body
  } else {
    return makeErrorResponse(HttpCodes.internalError, 'InvalidResponse',
      'Non-JSON responses must provide a string body', config)
  }

  return new Response(bodyString, {
    status: statusCode,
    headers: toHeaders({
      ...(isJsonResponse ? { [HEADER_CONTENT_TYPE]: 'application/json' } : {}),
      ...corsHeaders,
      ...normalizedResponseHeaders
    })
  })
}

/**
 * Build a standardized error response envelope.
 * @param statusCode HTTP status code.
 * @param error Error name or label.
 * @param details Error details string.
 * @param config Adapter configuration.
 * @returns Fetch Response.
 */
const makeErrorResponse = (
  statusCode: number,
  error: string,
  details: string,
  config: HttpHandlerConfig = {}
): Response => makeResponse(statusCode, { error, details }, {}, config)

/**
 * Error with a stable name for adapter failures.
 */
class NamedError extends Error {
  constructor(name: string, message: string) {
    super(message)
    this.name = name
  }
}

/**
 * Type guard for supported HTTP method strings.
 * @param value Raw value to validate HTTP method.
 * @returns True when value is a supported HTTP method.
 */
const isHttpMethod = (value: string): value is HttpMethod =>
  (HttpMethodSet as readonly string[]).includes(value)
