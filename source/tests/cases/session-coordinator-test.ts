/** Session eligibility; execution awaits the shared API bootstrap backlog fix. */

import '@tests/config/test-config.ts'
import { id } from '@core/std'
import type { Session } from '@core/stdx'
import type { User } from '@domain/abstractions/user.ts'
import { api } from '@front/api/api.ts'
import { SessionCoordinator } from '@front/app/shell/session-coordinator.ts'
import { UserProvider } from '@front/app/shell/user-provider.ts'
import { createRoot } from '@solid-js'
import { assertEquals } from '@std/assert'
import { operationsUserSample } from '@tests/fixtures/user-samples.ts'

Deno.test('SessionCoordinator rejects an active deleted User before data readiness', async () => {
  await verifyEligibility({
    ...operationsUserSample,
    status: 'active',
    deletedAt: '2026-10-13T12:00:00Z'
  }, false)
})

Deno.test('SessionCoordinator prepares an active live User', async () => {
  await verifyEligibility({ ...operationsUserSample, status: 'active' }, true)
})

Deno.test('SessionCoordinator rejects an inactive live User', async () => {
  await verifyEligibility({ ...operationsUserSample, status: 'inactive' }, false)
})

/** Exercise initialization under a Solid owner and restore the shared API after each case. */
const verifyEligibility = async (user: User, eligible: boolean): Promise<void> => {
  const originalGet = api.Users.get
  const originalSession = api.Auth.getSession
  const originalSubscribe = api.Auth.onAuthStateChange
  const originalLogout = api.Auth.logout
  const originalReady = api.SessionState.setReady
  const originalClear = api.SessionState.clear
  const completed = Promise.withResolvers<void>()
  let logoutCount = 0
  let readyCount = 0
  let unsubscribeCount = 0
  let dispose = () => {}

  SessionCoordinator.clear()
  api.Users.get = userId => {
    assertEquals(userId, user.id)
    return Promise.resolve(user)
  }
  api.Auth.getSession = () => Promise.resolve({ userId: user.id })
  api.Auth.onAuthStateChange = () => () => {
    unsubscribeCount++
  }
  api.Auth.logout = () => {
    logoutCount++
    return Promise.resolve()
  }
  api.SessionState.setReady = provider => {
    assertEquals(provider, UserProvider)
    assertEquals(UserProvider.user(), user)
    assertEquals(api.SessionState.isPrepared(), false)
    readyCount++
    originalReady(provider)
    completed.resolve()
  }
  api.SessionState.clear = () => {
    originalClear()
    if (logoutCount > 0) completed.resolve()
  }
  try {
    createRoot(cleanup => {
      dispose = cleanup
      SessionCoordinator.init()
    })
    await completed.promise
    assertEquals(logoutCount, eligible ? 0 : 1)
    assertEquals(readyCount, eligible ? 1 : 0)
    assertEquals(api.SessionState.store.isDataReady, eligible)
    assertEquals(api.SessionState.store.isAuthenticated, eligible)
    assertEquals(api.SessionState.store.userId, eligible ? user.id : null)
    assertEquals(api.SessionState.store.user, eligible ? UserProvider : null)
    assertEquals(UserProvider.user(), eligible ? user : null)
  } finally {
    dispose()
    api.Users.get = originalGet
    api.Auth.getSession = originalSession
    api.Auth.onAuthStateChange = originalSubscribe
    api.Auth.logout = originalLogout
    api.SessionState.setReady = originalReady
    api.SessionState.clear = originalClear
    SessionCoordinator.clear()
  }
  assertEquals(unsubscribeCount, 1)
}

Deno.test('SessionCoordinator waits for hydration and clears on identity change', async () => {
  const originalGet = api.Users.get
  const originalSession = api.Auth.getSession
  const originalSubscribe = api.Auth.onAuthStateChange
  const firstLoad = Promise.withResolvers<User>()
  const secondLoad = Promise.withResolvers<User>()
  const secondUser = { ...operationsUserSample, id: id() }
  let emit: (session: Session | null) => void = () => {}
  let dispose = () => {}
  SessionCoordinator.clear()
  api.Auth.getSession = () => Promise.resolve({ userId: operationsUserSample.id })
  api.Auth.onAuthStateChange = callback => {
    emit = callback
    return () => {}
  }
  api.Users.get = id => id === operationsUserSample.id ? firstLoad.promise : secondLoad.promise
  try {
    createRoot(cleanup => {
      dispose = cleanup
      SessionCoordinator.init()
    })
    await Promise.resolve()
    assertEquals(api.SessionState.isPrepared(), false)
    assertEquals(api.SessionState.store.user, null)
    firstLoad.resolve(operationsUserSample)
    await Promise.resolve()
    assertEquals(api.SessionState.isPrepared(), true)
    assertEquals(api.SessionState.store.user, UserProvider)
    emit({ userId: secondUser.id })
    assertEquals(UserProvider.user(), null)
    assertEquals(api.SessionState.store.user, null)
    assertEquals(api.SessionState.isPrepared(), false)
    secondLoad.resolve(secondUser)
    await Promise.resolve()
    assertEquals(UserProvider.id(), secondUser.id)
    assertEquals(api.SessionState.isPrepared(), true)
    emit(null)
    assertEquals(UserProvider.user(), null)
    assertEquals(api.SessionState.store.user, null)
    assertEquals(api.SessionState.isSignedOut(), true)
  } finally {
    dispose()
    api.Users.get = originalGet
    api.Auth.getSession = originalSession
    api.Auth.onAuthStateChange = originalSubscribe
    SessionCoordinator.clear()
  }
})
