/**
 * Minimal dev server for Netlify Dev custom framework.
 */

const DEFAULT_PORT = 8889
const portValue = Deno.env.get('PORT')
const port = portValue ? Number(portValue) : DEFAULT_PORT

Deno.serve({ port }, () => new Response('swarmAg dev server', {
  status: 200,
  headers: { 'content-type': 'text/plain; charset=utf-8' },
}))
