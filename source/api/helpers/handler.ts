import type { Handler, HandlerEvent } from '@netlify/functions'
import { jsonResponse, parseJsonBody } from './http'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface ApiRequest<Body = unknown, Query = Record<string, string | undefined>> {
  method: HttpMethod
  body: Body
  query: Query
  headers: Record<string, string>
  rawEvent: HandlerEvent
}

export interface ApiResult<Payload = unknown> {
  statusCode: number
  headers?: Record<string, string>
  body: Payload
}

export type ApiHandler<
  Body = unknown,
  Query = Record<string, string | undefined>,
  Payload = unknown,
> = (req: ApiRequest<Body, Query>) => Promise<ApiResult<Payload>> | ApiResult<Payload>

/**
 * Wrap a typed API handler with Netlify's Handler interface, providing
 * JSON parsing, consistent response shape, and basic error handling.
 */
export const withNetlify =
  <Body, Query, Payload>(handle: ApiHandler<Body, Query, Payload>): Handler =>
  async (event) => {
    let parsedBody: Body

    try {
      parsedBody = event.body ? parseJsonBody<Body>(event.body) : (undefined as Body)
    } catch (error) {
      return jsonResponse(400, { error: (error as Error).message })
    }

    const request: ApiRequest<Body, Query> = {
      method: event.httpMethod as HttpMethod,
      body: parsedBody,
      query: (event.queryStringParameters ?? {}) as Query,
      headers: (event.headers ?? {}) as Record<string, string>,
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
      return jsonResponse(500, {
        error: 'Unhandled error',
        details: (error as Error).message,
      })
    }
  }
