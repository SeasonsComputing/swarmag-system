/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ User provider tests                                                          ║
║ Verify prepared User identity and role-based creation defaults.              ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Prepared User identity and role-based creation defaults.
*/

import { UserProvider } from '@front/app/shell/user-provider.ts'
import { assertEquals, assertStrictEquals } from '@std/assert'
import { UserSamples } from '@tests/fixtures/user-samples.ts'

Deno.test('UserProvider exposes the prepared User and defaults for any matching role', () => {
  try {
    UserProvider.set(UserSamples.sales)
    assertStrictEquals(UserProvider.user(), UserSamples.sales)
    assertEquals(UserProvider.id(), UserSamples.sales.id)
    assertEquals(UserProvider.roles(), ['sales'])
    assertEquals(UserProvider.idWithAnyRole(['operations', 'sales']), UserSamples.sales.id)
    assertEquals(UserProvider.idWithAnyRole(['operations']), undefined)
  } finally {
    UserProvider.clear()
  }
  assertEquals(UserProvider.user(), null)
  assertEquals(UserProvider.id(), null)
  assertEquals(UserProvider.roles(), [])
  assertEquals(UserProvider.idWithAnyRole(['sales']), undefined)
})
