/** Session preparation gates authenticated content and retains the supplied user. */

import { UserProvider } from '@front/app/shell/user-provider.ts'
import { assertEquals, assertStrictEquals } from '@std/assert'
import { salesUserSample } from '@tests/fixtures/user-samples.ts'
import { SessionState } from '@ux/shell/runtime/session-state.ts'

Deno.test('SessionState distinguishes resolution, sign-out, authentication, and preparation', () => {
  assertEquals(SessionState.isPrepared(), false)
  assertEquals(SessionState.isSignedOut(), false)
  assertEquals(SessionState.store.user, null)
  try {
    SessionState.clear()
    assertEquals(SessionState.isSignedOut(), true)
    SessionState.setAuth(salesUserSample.id)
    assertEquals(SessionState.isSignedOut(), false)
    assertEquals(SessionState.isPrepared(), false)
    assertEquals(SessionState.store.user, null)
    UserProvider.set(salesUserSample)
    SessionState.setReady(UserProvider)
    assertEquals(SessionState.isPrepared(), true)
    assertStrictEquals(SessionState.store.user, UserProvider)
    assertEquals(SessionState.store.user?.id(), salesUserSample.id)
    assertEquals(SessionState.store.user?.roles(), ['sales'])
    SessionState.clear()
    assertEquals(SessionState.store.user, null)
    assertEquals(SessionState.store.isDataReady, false)
    assertEquals(SessionState.isPrepared(), false)
    assertEquals(SessionState.isSignedOut(), true)
  } finally {
    UserProvider.clear()
    SessionState.clear()
  }
})
