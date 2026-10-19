/** Prepared User identity and role-based creation defaults. */

import { UserProvider } from '@front/app/shell/user-provider.ts'
import { assertEquals, assertStrictEquals } from '@std/assert'
import { salesUserSample } from '@tests/fixtures/user-samples.ts'

Deno.test('UserProvider exposes the prepared User and defaults for any matching role', () => {
  try {
    UserProvider.set(salesUserSample)
    assertStrictEquals(UserProvider.user(), salesUserSample)
    assertEquals(UserProvider.id(), salesUserSample.id)
    assertEquals(UserProvider.roles(), ['sales'])
    assertEquals(UserProvider.idWithAnyRole(['operations', 'sales']), salesUserSample.id)
    assertEquals(UserProvider.idWithAnyRole(['operations']), undefined)
  } finally {
    UserProvider.clear()
  }
  assertEquals(UserProvider.user(), null)
  assertEquals(UserProvider.id(), null)
  assertEquals(UserProvider.roles(), [])
  assertEquals(UserProvider.idWithAnyRole(['sales']), undefined)
})
