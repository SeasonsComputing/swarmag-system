/**
 * Netlify edge handler wrapper for typed API handlers.
 */

import {
  ApiHandler,
  ApiRequest,
  ApiResponse,
  HEADER_ALLOW_CREDENTIALS,
  HEADER_ALLOW_HEADERS,
  HEADER_ALLOW_METHODS,
  HEADER_ALLOW_ORIGIN,
  HEADER_CONTENT_TYPE,
  HEADER_VARY,
  HttpCodes,
  HttpHeaders,
  HttpMethod,
  HttpQuery,
  isHttpMethod
} from './api-binding.ts'

/**
 * Configuration options for the Edge adapter.
 */
export interface ApiAdapterConfig {
  /** Enable CORS headers in responses. Default: false */
  cors?: boolean | {
    origin?: string
    methods?: string[]
    headers?: string[]
    credentials?: boolean
  }
  /** Maximum request body size in bytes. Default: 6MB (Netlify limit) */
  maxBodySize?: number
  /** Validate Content-Type header for requests with bodies. Default: true */
  validateContentType?: boolean
  /** Support multi-value query parameters (e.g., ?tag=red&tag=blue). Default: false */
  multiValueQueryParams?: boolean
}

/**
 * HTTP methods that typically include request bodies.
 */
const METHODS_WITH_BODY = new Set<HttpMethod>(['POST', 'PUT', 'PATCH', 'DELETE'])
const DEFAULT_MAX_BODY_SIZE = 6 * 1024 * 1024

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
const normalizeQuery = (
  params: URLSearchParams,
  enableMultiValue: boolean
): HttpQuery => {
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
 * Build CORS headers based on configuration.
 * @param config CORS configuration.
 * @returns Headers object with CORS headers.
 */
const buildCorsHeaders = (
  config: boolean | NonNullable<ApiAdapterConfig['cors']>
): HttpHeaders => {
  if (config === false) return {}
  const corsConfig = config === true ? {} : config
  return {
    [HEADER_ALLOW_ORIGIN]: corsConfig.origin ?? '*',
    [HEADER_ALLOW_METHODS]: corsConfig.methods?.join(', ') ?? 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
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
 * HTTP status codes that should not include a response body.
 */
const NO_BODY_STATUS_CODES = new Set([204, 304])

/**
 * Build a Response with consistent headers.
 * @param statusCode HTTP status code.
 * @param body JSON-serializable payload, or a pre-serialized string when using a custom content-type.
 * @param additionalHeaders Optional additional headers to merge.
 * @param config Adapter configuration for CORS, etc.
 * @returns Fetch Response.
 */
const buildResponse = (
  statusCode: number,
  body: unknown,
  additionalHeaders: HttpHeaders = {},
  config: ApiAdapterConfig = {}
): Response => {
  const corsHeaders = config.cors ? buildCorsHeaders(config.cors) : {}
  const normalizedResponseHeaders = normalizeHeaderMap(additionalHeaders)

  if (NO_BODY_STATUS_CODES.has(statusCode)) {
    return new Response('', {
      status: statusCode,
      headers: toHeaders({
        ...corsHeaders,
        ...normalizedResponseHeaders
      })
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
      return buildErrorResponse(
        HttpCodes.internalError,
        'InvalidResponse',
        `Response body is not JSON-serializable: ${(err as Error).message}`,
        config
      )
    }
  } else if (typeof body === 'string') {
    bodyString = body
  } else {
    return buildErrorResponse(
      HttpCodes.internalError,
      'InvalidResponse',
      'Non-JSON responses must provide a string body',
      config
    )
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
const buildErrorResponse = (
  statusCode: number,
  error: string,
  details: string,
  config: ApiAdapterConfig = {}
): Response => buildResponse(statusCode, { error, details }, {}, config)

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
const serializeError = (err: unknown): { name: string; message: string } => {
  if (err instanceof Error) return { name: err.name, message: err.message }
  if (typeof err === 'string') return { name: 'Error', message: err }
  if (err && typeof err === 'object') {
    try {
      return { name: 'Error', message: JSON.stringify(err) }
    } catch {
      return { name: 'Error', message: String(err) }
    }
  }
  return { name: 'Error', message: String(err) }
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
  config: ApiAdapterConfig
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
      throw new NamedError(
        'PayloadTooLarge',
        `Request body exceeds maximum size of ${maxSize} bytes`
      )
    }
  }

  const decodedBody = await request.text()
  if (!decodedBody) {
    return undefined
  }

  const bodySize = byteLength(decodedBody)
  if (bodySize > maxSize) {
    throw new NamedError(
      'PayloadTooLarge',
      `Request body exceeds maximum size of ${maxSize} bytes`
    )
  }

  // Validate Content-Type for bodies
  if (config.validateContentType !== false) {
    const ct = contentType?.toLowerCase() ?? ''
    if (!ct.includes('application/json')) {
      throw new NamedError(
        'InvalidContentType',
        `Expected Content-Type: application/json, received: ${contentType ?? 'none'}`
      )
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
 * Adapt a typed API handler to the Edge Request/Response contract.
 *
 * @template RequestBody Request body type (for documentation only - validated by handler).
 * @template Query Query parameters type (for documentation only - validated by handler).
 * @template ResponseBody Response body type.
 * @param handle Typed handler to wrap. Must validate its own inputs.
 * @param config Optional adapter configuration for CORS, validation, etc.
 * @returns Fetch handler ready for export.
 */
export const createApiHandler = <RequestBody = unknown, Query = HttpQuery, ResponseBody = unknown>(
  handle: ApiHandler<RequestBody, Query, ResponseBody>,
  config: ApiAdapterConfig = {}
) => {
  return async (request: Request): Promise<Response> => {
    try {
      const method = request.method

      if (method === 'OPTIONS' && config.cors) {
        return buildResponse(HttpCodes.noContent, '', {}, config)
      }

      if (!isHttpMethod(method)) {
        return buildErrorResponse(
          HttpCodes.methodNotAllowed,
          'MethodNotAllowed',
          `HTTP method '${method}' is not supported`,
          config
        )
      }

      const headers = normalizeHeaders(request.headers)

      let body: unknown
      try {
        body = await parseRequestBody(
          request,
          method,
          headers['content-type'],
          config
        )
      } catch (err) {
        const { name, message } = serializeError(err)
        const statusCode = name === 'PayloadTooLarge'
          ? HttpCodes.payloadTooLarge
          : HttpCodes.badRequest
        return buildErrorResponse(statusCode, name, message, config)
      }

      const url = new URL(request.url)
      const query = normalizeQuery(url.searchParams, config.multiValueQueryParams ?? false)

      const apiRequest: ApiRequest<RequestBody, Query, HttpHeaders> = {
        method,
        body: body as RequestBody,
        query: query as Query,
        headers,
        rawRequest: request
      }

      const result: ApiResponse<ResponseBody, HttpHeaders> = await handle(apiRequest)
      const statusCode = validateStatusCode(result.statusCode)

      return buildResponse(statusCode, result.body, result.headers, config)
    } catch (err) {
      const { name, message } = serializeError(err)
      console.error('Unhandled error in Edge handler:', { name, message, err })
      return buildErrorResponse(HttpCodes.internalError, name, message, config)
    }
  }
}
