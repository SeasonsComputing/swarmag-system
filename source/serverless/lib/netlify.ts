/**
 * Netlify adapter wrapping typed handlers with JSON parsing and error handling.
 */

import {
  HttpCodes,
  type ApiHandler,
  type ApiRequest,
  type HttpHeaders,
  type HttpMethod,
} from './api-binding'
import type {
  Handler,
  HandlerEvent,
  HandlerResponse,
} from '@netlify/functions'

// Re-export Netlify types for consumers that need the raw event/response shapes.
export type { HandlerEvent, HandlerResponse }

/**
 * Build a JSON Netlify response with a consistent content type header.
 * @param statusCode HTTP status code.
 * @param body JSON-serializable payload.
 * @param headers Optional additional headers to merge.
 * @returns Netlify handler response.
 */
const jsonResponse = (statusCode: number, body: unknown, headers?: HttpHeaders):
  HandlerResponse => ({
    statusCode,
    headers: {
      'content-type': 'application/json',
      ...(headers ?? {}),
    },
    body: JSON.stringify(body),
  })

/**
 * Parse a JSON request body without throwing.
 * @param body Raw request body.
 * @returns Parsed body or an error message when invalid.
 */
const parseBody = <RequestBody>(body: string | null): { body?: RequestBody; error?: string } => {
  if (body == null) return {}
  try {
    return { body: JSON.parse(body) as RequestBody }
  } catch (error) {
    return { error: (error as Error).message }
  }
}

/**
 * Adapt a typed API handler to Netlify's `Handler` contract with JSON parsing and error handling.
 * @template RequestBody Request body type.
 * @template Query Query string type.
 * @template ResponseBody Response body type.
 * @param handle Typed handler to wrap.
 * @returns Netlify handler ready for export.
 */
export const withNetlify =
  <RequestBody, Query, ResponseBody>(handle: ApiHandler<RequestBody, Query, ResponseBody>): Handler =>
    async (event: HandlerEvent) => {
      const { body, error } = parseBody<RequestBody>(event.body)
      if (error) {
        return jsonResponse(HttpCodes.badRequest, { error })
      }

      const request: ApiRequest<RequestBody, Query> = {
        method: event.httpMethod as HttpMethod,
        body: body as RequestBody,
        query: (event.queryStringParameters ?? {}) as Query,
        headers: (event.headers ?? {}) as HttpHeaders,
        rawEvent: event,
      }

      try {
        const result = await handle(request)
        return jsonResponse(result.statusCode, result.body, result.headers)
      } catch (error) {
        return jsonResponse(HttpCodes.internalError, {
          error: 'Unhandled error',
          details: (error as Error).message,
        })
      }
    }
