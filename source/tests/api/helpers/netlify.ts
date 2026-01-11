/**
 * Test helper for invoking Netlify-wrapped handlers.
 */

/**
 * Invoke a Netlify-wrapped handler with a minimal Request.
 * Parses the JSON response body for easier assertions.
 */
export const runNetlifyHandler = async <
  Body = unknown,
  Query extends Record<string, unknown> = Record<string, unknown>
>(
  handler: (request: Request) => Promise<Response>,
  method: string,
  body?: Body,
  query?: Query,
  headers: Record<string, string> = {}
) => {
  const url = new URL('http://localhost/.netlify/edge-functions/mock')
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value))
    }
  }

  const request = new Request(url.toString(), {
    method,
    headers: {
      ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
      ...headers
    },
    body: body !== undefined ? JSON.stringify(body) : undefined
  })

  const res = await handler(request)
  const contentType = res.headers.get('content-type') ?? ''
  const parsedBody = contentType.includes('application/json')
    ? await res.json()
    : await res.text()
  return { statusCode: res.status, headers: Object.fromEntries(res.headers.entries()), body: parsedBody }
}
