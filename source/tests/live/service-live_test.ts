/**
 * Live test for service-list endpoint (requires LIVE_BASE_URL).
 */

import { assert } from 'https://deno.land/std@0.224.0/assert/mod.ts'

const baseUrl = Deno.env.get('LIVE_BASE_URL')
const serviceListPath =
  Deno.env.get('LIVE_SERVICE_LIST_PATH') ?? '/.netlify/functions/service-list'

if (!baseUrl) {
  Deno.test('service-list live endpoint (skipped: LIVE_BASE_URL not set)', () => {})
} else {
  Deno.test('service-list live endpoint responds with a 2xx status', async () => {
    const url = new URL(serviceListPath, baseUrl)
    const response = await fetch(url)
    assert(response.status >= 200)
    assert(response.status < 300)

    const body = (await response.json()) as Record<string, unknown>
    assert('data' in body)
  })
}
