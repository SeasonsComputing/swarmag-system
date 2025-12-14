/**
 * Netlify adapter wrapping typed handlers with JSON parsing and error handling.
 */

import  {
  HttpCodes as BindingHttpCodes, 
  type HttpHeaders, 
  type ApiRequest,
  type ApiHandler,
  type HttpMethod,
} from './api-binding'
import type {
  Handler,
  HandlerEvent,
  HandlerResponse,
} from '@netlify/functions'

// Re-export Netlify types for consumers that need the raw event/response shapes.
export type { HandlerEvent, HandlerResponse }
export const HttpCodes = BindingHttpCodes

/**
 * Build a JSON Netlify response with a consistent content type header.
 * @param statusCode HTTP status code.
 * @param body JSON-serializable payload.
 * @param headers Optional additional headers to merge.
 * @returns Netlify handler response.
 */
const jsonResponse = (statusCode: number, body: unknown, headers: HttpHeaders = {}):
  HandlerResponse => ({
    statusCode,
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  })

/**
 * Safely parse a JSON request body string.
 * @template T Parsed payload type.
 * @param body Raw request body.
 * @returns Parsed payload.
 * @throws {Error} When the body is empty or not valid JSON.
 */
const parseJsonBody = <T,>(body: string | null): T => {
  if (!body) throw new Error('Empty request body')
  try {
    return JSON.parse(body) as T
  } catch (error) {
    throw new Error('Invalid JSON body')
  }
}

/**
 * Adapt a typed API handler to Netlify's `Handler` contract with JSON parsing and error handling.
 * @template Body Request body type.
 * @template Query Query string type.
 * @template Payload Response payload type.
 * @param handle Typed handler to wrap.
 * @returns Netlify handler ready for export.
 */
export const withNetlify =
  <Body, Query, Payload>(handle: ApiHandler<Body, Query, Payload>): Handler =>
    async (event) => {
      let parsedBody: Body

      try {
        parsedBody = event.body ? parseJsonBody<Body>(event.body) : (undefined as Body)
      } catch (error) {
        return jsonResponse(HttpCodes.badRequest, { error: (error as Error).message })
      }

      const request: ApiRequest<Body, Query> = {
        method: event.httpMethod as HttpMethod,
        body: parsedBody,
        query: (event.queryStringParameters ?? {}) as Query,
        headers: (event.headers ?? {}) as HttpHeaders,
        rawEvent: event,
      }

      try {
        const result = await handle(request)
        return {
          statusCode: result.statusCode,
          headers: { 'content-type': 'application/json', ...result.headers },
          body: JSON.stringify(result.body),
        }
      } catch (error) {
        return jsonResponse(HttpCodes.internalError, {
          error: 'Unhandled error',
          details: (error as Error).message,
        })
      }
    }
