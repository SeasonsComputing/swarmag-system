/**
 * Live test for service-list endpoint (requires LIVE_BASE_URL).
 */

import { assert } from '@std/assert'
import { validateRequiredVars } from '@utils/environment.ts'

let baseUrl: string | undefined
try {
  validateRequiredVars(['LIVE_BASE_URL'])
  baseUrl = Deno.env.get('LIVE_BASE_URL')
} catch {
  baseUrl = undefined
}
const serviceListPath = Deno.env.get('LIVE_SERVICE_LIST_PATH') ?? '/.netlify/edge-functions/services-list'

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
