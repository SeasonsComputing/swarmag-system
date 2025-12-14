/**
 * Live test for service-list endpoint (requires LIVE_BASE_URL).
 */

import { describe, expect, it } from 'vitest'

const baseUrl = process.env.LIVE_BASE_URL
const serviceListPath =
  process.env.LIVE_SERVICE_LIST_PATH ?? '/.netlify/functions/service-list'

const liveDescribe = baseUrl ? describe : describe.skip

liveDescribe('service-list live endpoint', () => {
  it('responds with a 2xx status', async () => {
    const url = new URL(serviceListPath, baseUrl)
    const response = await fetch(url)
    expect(response.status).toBeGreaterThanOrEqual(200)
    expect(response.status).toBeLessThan(300)

    const body = (await response.json()) as Record<string, unknown>
    expect(body).toHaveProperty('data')
  })
})
