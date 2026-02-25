/**
 * API namespace contract tests for user-facing consumers.
 */

import { assertEquals } from '@std/assert'
import { api } from '@ux-api'

Deno.test('api namespace is currently composed as an empty contract', () => {
  assertEquals(typeof api, 'object')
  assertEquals(Array.isArray(api), false)
  assertEquals(Object.keys(api).length, 0)
})
