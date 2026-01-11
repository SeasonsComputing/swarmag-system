/**
 * Minimal dev server for Netlify Dev custom framework.
 */

import { validateRequiredVars } from '@utils/environment.ts'

validateRequiredVars([
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'SUPABASE_ANON_KEY',
  'DEV_SERVER_PORT',
  'LIVE_BASE_URL',
  'LIVE_SERVICE_LIST_PATH'
])

const port = Number(Deno.env.get('DEV_SERVER_PORT'))
const init = { status: 200, headers: { 'content-type': 'text/plain; charset=utf-8' } }
const handler = () => new Response('swarmAg dev server', init)
Deno.serve({ port }, handler)
