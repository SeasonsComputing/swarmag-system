import type { HandlerEvent, HandlerResponse } from '@netlify/functions'

/**
 * Invoke a Netlify-wrapped handler with a minimal synthetic event.
 * Parses the JSON response body for easier assertions.
 */
export const runNetlifyHandler = async <Body = any, Query extends Record<string, any> = Record<string, any>>(
  handler: (event: HandlerEvent) => Promise<HandlerResponse>,
  method: string,
  body?: Body,
  query?: Query,
  headers: Record<string, string> = {},
) => {
  const event: HandlerEvent = {
    httpMethod: method,
    headers,
    queryStringParameters: query as any,
    body: body !== undefined ? JSON.stringify(body) : null,
  } as any

  const res = await handler(event, {} as any)
  const parsedBody = res.body ? JSON.parse(res.body) : undefined
  return { statusCode: res.statusCode, headers: res.headers ?? {}, body: parsedBody }
}
