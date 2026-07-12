/**
 * Unit tests for the edge caller verification handshake: missing, malformed,
 * and empty bearer tokens are rejected with 401 before any network call.
 */

import { makeSupabaseEdgeAuth } from '@core/service/make-supabase-edge-auth.ts'
import { HttpServiceError } from '@core/service/wrap-busrule-http-handler.ts'
import { type StringDictionary } from '@core/std'
import { type HttpRequest } from '@core/stdx'
import { assertEquals, assertRejects } from '@std/assert'

const EdgeAuth = makeSupabaseEdgeAuth({
  url: 'http://localhost:54321',
  publicKey: 'public-key',
  serviceKey: 'service-key'
})

const requestWith = (
  headers: StringDictionary
): HttpRequest => ({ method: 'POST', body: {}, query: {}, headers } as HttpRequest)

Deno.test('verifyCaller rejects a missing Authorization header', async () => {
  const error = await assertRejects(
    () => EdgeAuth.verifyCaller(requestWith({})),
    HttpServiceError
  )
  assertEquals(error.statusCode, 401)
})

Deno.test('verifyCaller rejects a non-bearer Authorization header', async () => {
  const error = await assertRejects(
    () => EdgeAuth.verifyCaller(requestWith({ authorization: 'Basic abc123' })),
    HttpServiceError
  )
  assertEquals(error.statusCode, 401)
})

Deno.test('verifyCaller rejects an empty bearer token', async () => {
  const error = await assertRejects(
    () => EdgeAuth.verifyCaller(requestWith({ authorization: 'Bearer   ' })),
    HttpServiceError
  )
  assertEquals(error.statusCode, 401)
})
