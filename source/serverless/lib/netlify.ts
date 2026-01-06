/**
 * Netlify adapter wrapping typed handlers with JSON parsing, validation, and error handling.
 */

import type {
  Handler,
  HandlerEvent,
  HandlerResponse,
} from '@netlify/functions'
import {
  HttpCodes,
  isHttpMethod,
  type ApiHandler,
  type ApiRequest,
  type ApiResponse,
  type HttpHeaders,
  type HttpMethod,
  type HttpQuery,
} from './api-binding'

/** 
 * Re-export Netlify types for consumers that need the raw event/response shapes. 
 */
export type { HandlerEvent, HandlerResponse }

/**
 * Configuration options for the Netlify adapter.
 */
export interface NetlifyAdapterConfig {
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
const METHODS_WITH_BODY = new Set<HttpMethod>(['POST', 'PUT', 'PATCH'])
const DEFAULT_MAX_BODY_SIZE = 6 * 1024 * 1024

/**
 * HTTP status codes that should not include a response body.
 */
const NO_BODY_STATUS_CODES = new Set([204, 304])

/**
 * Raw Netlify event shapes used for normalization helpers.
 */
type RawHeaders = Record<string, string | undefined>
type RawQueryParams = Record<string, string | undefined>
type RawMultiValueQueryParams = Record<string, string[] | undefined>

/**
 * Normalize HTTP headers to lowercase keys for case-insensitive access.
 * @param headers Raw headers object.
 * @returns Normalized headers with lowercase keys.
 */
const normalizeHeaders = (headers: RawHeaders | null): HttpHeaders => {
  if (!headers) return {}
  
  const normalized: HttpHeaders = {}
  for (const [key, value] of Object.entries(headers)) {
    if (value !== undefined) {
      normalized[key.toLowerCase()] = value
    }
  }
  return normalized
}

/**
 * Parse query string parameters, optionally handling multi-value params.
 * @param params Raw query parameters from Netlify.
 * @param multiValueParams Multi-value query parameters from Netlify.
 * @param enableMultiValue Whether to merge multi-value parameters.
 * @returns Clean query object with string values (multi-values joined with commas).
 */
const normalizeQuery = (
  params: RawQueryParams | null,
  multiValueParams: RawMultiValueQueryParams | null,
  enableMultiValue: boolean
): HttpQuery => {
  if (!params) return {}
  
  const normalized: HttpQuery = {}
  
  // Start with single-value params
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      normalized[key] = value
    }
  }
  
  // Merge multi-value params if enabled
  if (enableMultiValue && multiValueParams) {
    for (const [key, values] of Object.entries(multiValueParams)) {
      if (values !== undefined && values.length > 1) {
        // Only override if there are actually multiple values
        normalized[key] = values.join(',') // Or keep as array if your HttpQuery type supports it
      }
    }
  }
  
  return normalized
}

/**
 * Build CORS headers based on configuration.
 * @param config CORS configuration.
 * @returns Headers object with CORS headers.
 */
const buildCorsHeaders = (
  config: boolean | NonNullable<NetlifyAdapterConfig['cors']>
): HttpHeaders => {
  if (config === false) return {}
  
  const corsConfig = config === true ? {} : config
  return {
    'access-control-allow-origin': corsConfig.origin ?? '*',
    'access-control-allow-methods': corsConfig.methods?.join(', ') ?? 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'access-control-allow-headers': corsConfig.headers?.join(', ') ?? 'Content-Type, Authorization',
    'vary': 'Origin', // Prevent CDN caching issues
    ...(corsConfig.credentials ? { 'access-control-allow-credentials': 'true' } : {}),
  }
}

/**
 * Build a Netlify response with consistent headers.
 * @param statusCode HTTP status code.
 * @param body JSON-serializable payload, or a pre-serialized string when using a custom content-type.
 * @param additionalHeaders Optional additional headers to merge.
 * @param config Adapter configuration for CORS, etc.
 * @returns Netlify handler response.
 */
const buildResponse = (
  statusCode: number,
  body: unknown,
  additionalHeaders: HttpHeaders = {},
  config: NetlifyAdapterConfig = {}
): HandlerResponse => {
  const corsHeaders = config.cors ? buildCorsHeaders(config.cors) : {}
  const normalizedResponseHeaders = normalizeHeaders(additionalHeaders)

  if (NO_BODY_STATUS_CODES.has(statusCode)) {
    return {
      statusCode,
      headers: {
        ...corsHeaders,
        ...normalizedResponseHeaders,
      },
      body: '',
    }
  }

  const customContentType = normalizedResponseHeaders['content-type']
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

  return {
    statusCode,
    headers: {
      ...(isJsonResponse ? { 'content-type': 'application/json' } : {}),
      ...corsHeaders,
      ...normalizedResponseHeaders,
    },
    body: bodyString,
  }
}

/**
 * Build a standardized error response envelope.
 * @param statusCode HTTP status code.
 * @param error Error name or label.
 * @param details Error details string.
 * @param config Adapter configuration.
 * @returns Netlify handler response.
 */
const buildErrorResponse = (
  statusCode: number,
  error: string,
  details: string,
  config: NetlifyAdapterConfig = {}
): HandlerResponse => buildResponse(statusCode, { error, details }, {}, config)

/**
 * Safely serialize an error for JSON response.
 * @param err Unknown error value.
 * @returns Error object with name and message.
 */
const serializeError = (err: unknown): { name: string; message: string } => {
  if (err instanceof Error) {
    return { name: err.name, message: err.message }
  }
  
  if (typeof err === 'string') {
    return { name: 'Error', message: err }
  }
  
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
 * Parse and validate request body with size limits.
 * @param body Raw body string or null.
 * @param isBase64Encoded Whether the body is base64-encoded.
 * @param method HTTP method.
 * @param contentType Content-Type header value.
 * @param config Adapter configuration.
 * @returns Parsed body or undefined.
 * @throws Error if parsing fails or validation fails.
 */
const parseRequestBody = (
  body: string | null,
  isBase64Encoded: boolean,
  method: HttpMethod,
  contentType: string | undefined,
  config: NetlifyAdapterConfig
): unknown => {
  // No body expected for these methods
  if (!METHODS_WITH_BODY.has(method)) {
    return undefined
  }
  
  // No body provided
  if (!body) {
    return undefined
  }
  
  let decodedBody = body
  if (isBase64Encoded) {
    try {
      decodedBody = Buffer.from(body, 'base64').toString('utf-8')
    } catch (err) {
      throw Object.assign(
        new Error(`Failed to decode base64 body: ${(err as Error).message}`),
        { name: 'Base64DecodeError' }
      )
    }
  }
  
  // Validate body size (after decoding)
  const maxSize = config.maxBodySize ?? DEFAULT_MAX_BODY_SIZE
  const bodySize = Buffer.byteLength(decodedBody, 'utf-8')
  if (bodySize > maxSize) {
    throw Object.assign(
      new Error(`Request body exceeds maximum size of ${maxSize} bytes`),
      { name: 'PayloadTooLarge' }
    )
  }
  
  // Validate Content-Type for bodies
  if (config.validateContentType !== false) {
    const ct = contentType?.toLowerCase() ?? ''
    if (!ct.includes('application/json')) {
      throw Object.assign(
        new Error(`Expected Content-Type: application/json, received: ${contentType ?? 'none'}`),
        { name: 'InvalidContentType' }
      )
    }
  }
  
  // Parse JSON
  try {
    return JSON.parse(decodedBody)
  } catch (err) {
    throw Object.assign(
      new Error(`Invalid JSON: ${(err as Error).message}`),
      { name: 'InvalidJSON' }
    )
  }
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
 * Adapt a typed API handler to Netlify's Handler contract with full error handling and validation.
 * 
 * **Important**: This adapter does NOT perform runtime type validation of request bodies or query
 * parameters. Handlers receive data typed per their generic parameters but MUST validate inputs 
 * themselves using a validation library (Zod, Yup, io-ts, etc.) or manual type guards.
 * 
 * The type parameters are for documentation and IDE support only - they do not provide runtime safety.
 * 
 * **Response body handling**: Handlers may return `undefined` as the response body for no-content
 * responses (e.g., 204). This will be coerced to `null` in JSON responses, or omitted entirely for
 * status codes 204 and 304.
 *
 * **Custom content types**: If your handler sets a custom `content-type` header (e.g., for binary
 * responses), ensure the body is pre-serialized as a string. The adapter will skip JSON stringification
 * for non-JSON content types.
 * 
 * @template RequestBody Request body type (for documentation only - validated by handler).
 * @template Query Query parameters type (for documentation only - validated by handler).
 * @template ResponseBody Response body type.
 * @param handle Typed handler to wrap. Must validate its own inputs.
 * @param config Optional adapter configuration for CORS, validation, etc.
 * @returns Netlify handler ready for export.
 * 
 * @example
 * ```typescript
 * import { z } from 'zod'
 * 
 * const CreateUserSchema = z.object({
 *   email: z.string().email(),
 *   name: z.string()
 * })
 * 
 * type CreateUserBody = z.infer<typeof CreateUserSchema>
 * 
 * export const handler = withNetlify<CreateUserBody, {}, { id: string }>(
 *   async (req) => {
 *     // Validate inputs - throws on invalid data
 *     const body = CreateUserSchema.parse(req.body)
 *     
 *     // Handle request with validated data
 *     const user = await createUser(body)
 *     
 *     return {
 *       statusCode: HttpCodes.created,
 *       body: { id: user.id }
 *     }
 *   },
 *   { cors: true, multiValueQueryParams: true }
 * )
 * 
 * // Example: No-content response
 * export const deleteHandler = withNetlify<never, { id: string }, undefined>(
 *   async (req) => {
 *     await deleteUser(req.query.id)
 *     return {
 *       statusCode: HttpCodes.noContent,
 *       body: undefined // Will be handled correctly
 *     }
 *   }
 * )
 * ```
 */
export const withNetlify = <RequestBody = unknown, Query = HttpQuery, ResponseBody = unknown>(
  handle: ApiHandler<RequestBody, Query, ResponseBody>,
  config: NetlifyAdapterConfig = {}
): Handler => {
  return async (event: HandlerEvent): Promise<HandlerResponse> => {
    try {
      // Normalize headers for case-insensitive access
      const headers = normalizeHeaders(event.headers)
      
      // Handle preflight CORS requests (no body, no content-type)
      if (event.httpMethod === 'OPTIONS' && config.cors) {
        return {
          statusCode: HttpCodes.noContent,
          headers: buildCorsHeaders(config.cors),
          body: '',
        }
      }
      
      // Validate HTTP method
      if (!isHttpMethod(event.httpMethod)) {
        return buildErrorResponse(
          HttpCodes.methodNotAllowed,
          'MethodNotAllowed',
          `HTTP method '${event.httpMethod}' is not supported`,
          config
        )
      }
      
      // Parse and validate request body
      let body: unknown
      try {
        body = parseRequestBody(
          event.body,
          event.isBase64Encoded ?? false,
          event.httpMethod,
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
      
      // Normalize query parameters
      const query = normalizeQuery(
        event.queryStringParameters,
        event.multiValueQueryStringParameters,
        config.multiValueQueryParams ?? false
      )
      
      // Build typed request object
      // SAFETY: Type casts are intentional. Handlers must validate at runtime.
      const request: ApiRequest<RequestBody, Query, HttpHeaders> = {
        method: event.httpMethod,
        body: body as RequestBody,
        query: query as Query,
        headers,
        rawEvent: event,
      }
      
      // Delegate to handler
      const result: ApiResponse<ResponseBody, HttpHeaders> = await handle(request)
      
      // Validate response
      const statusCode = validateStatusCode(result.statusCode)
      
      return buildResponse(statusCode, result.body, result.headers, config)
      
    } catch (err) {
      // Catch-all for unexpected errors
      const { name, message } = serializeError(err)
      console.error('Unhandled error in Netlify adapter:', { name, message, err })
      return buildErrorResponse(HttpCodes.internalError, name, message, config)
    }
  }
}
