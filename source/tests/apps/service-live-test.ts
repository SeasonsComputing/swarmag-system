/**
 * Live test for service-list endpoint (requires LIVE_BASE_URL).
 */

import { assert } from '@std/assert'
import { App } from '@utils/app.ts'

App.init([
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'SUPABASE_ANON_KEY',
  'LIVE_BASE_URL',
  'LIVE_SERVICE_LIST_PATH'
])
const baseUrl = App.get('LIVE_BASE_URL')
const serviceListPath = App.get('LIVE_SERVICE_LIST_PATH')

Deno.test('service-list live endpoint responds with a 2xx status', async () => {
  const url = new URL(serviceListPath, baseUrl)
  const response = await fetch(url)
  assert(response.status >= 200)
  assert(response.status < 300)

  const body = await response.json()
  assert('data' in body)
})
