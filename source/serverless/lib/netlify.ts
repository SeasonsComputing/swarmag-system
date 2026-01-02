/**
 * Netlify adapter wrapping typed handlers with JSON parsing and error handling.
 */

import type {
  Handler,
  HandlerEvent,
  HandlerResponse,
} from '@netlify/functions'

import {
  HttpCodes,
  type ApiHandler,
  type ApiRequest,
  type HttpHeaders,
  type HttpMethod,
} from './api-binding'

/** 
 * Re-export Netlify types for consumers that need the raw event/response shapes. 
 */
export type { HandlerEvent, HandlerResponse }

/**
 * Build a JSON Netlify response with a consistent content type header.
 * @param statusCode HTTP status code.
 * @param body JSON-serializable payload.
 * @param headers Optional additional headers to merge.
 * @returns Netlify handler response.
 */
const response = (statusCode: number, body: unknown, headers?: HttpHeaders):
  HandlerResponse => ({
    statusCode,
    headers: {
      'content-type': 'application/json',
      ...(headers ?? {}),
    },
    body: JSON.stringify(body),
  })

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
      try {
        const request: ApiRequest<RequestBody, Query> = {
          method: event.httpMethod as HttpMethod,
          body: (event.body ? JSON.parse(event.body) : {}) as RequestBody,
          query: (event.queryStringParameters ?? {}) as Query,
          headers: (event.headers ?? {}) as HttpHeaders,
          rawEvent: event,
        }
        const result = await handle(request)
        return response(result.statusCode, result.body, result.headers)
      } catch (err) {
        const { name, message } = err as Error;
        return response(HttpCodes.internalError, { error: name, details: message })
      }
    }
