/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Session state store                                                          ║
║ Reactive auth and session state shared across all apps.                      ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Holds authentication, readiness, and the application-supplied user. All session
mutations flow through named helpers — no caller uses setSessionStore directly
outside this module.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
SessionStore - Session data
├ userId           Authenticated user id or null.
├ isAuthenticated  True when a session is active.
├ isLoading        True while boot-time auth resolution is pending.
├ isDataReady      True when required post-auth data is loaded.
└ user             Prepared application user, or null.

SessionStateContract - Contract for the SessionState singleton
├ store            Reactive session state snapshot.
├ setAuth(userId)  Mark session active and clear loading.
├ setReady(user)   Hold the prepared user and mark data ready.
├ isPrepared()     Authenticated content may render.
├ isSignedOut()    Resolution finished without a session.
└ clear()          Reset session state to signed-out defaults.

SessionState - Provider for SessionStateContract
*/

import type { Id } from '@core/std'
import { createStore } from '@solid-js/store'
import type { SessionUserContract } from './session-contracts.ts'

/** Auth and session state shared across all UX applications. */
export type SessionStore = {
  userId: Id | null
  isAuthenticated: boolean
  isLoading: boolean
  isDataReady: boolean
  user: SessionUserContract | null
}

/** Contract for the session state singleton and its mutation methods. */
export interface SessionStateContract {
  store: SessionStore
  setAuth: (userId: Id) => void
  setReady: (user: SessionUserContract) => void
  isPrepared: () => boolean
  isSignedOut: () => boolean
  clear: () => void
}

/** Reactive storage */
const [sessionStore, setSessionStore] = createStore<SessionStore>({
  userId: null,
  isAuthenticated: false,
  isLoading: true,
  isDataReady: false,
  user: null
})

/** Mark session active from the authenticated userId; clears the loading flag. */
const setSessionAuth = (userId: Id): void =>
  setSessionStore({
    userId,
    isAuthenticated: true,
    isLoading: false
  })

/** Clear all session state on sign-out or unauthenticated boot completion. */
const clearSession = (): void =>
  setSessionStore({
    userId: null,
    isAuthenticated: false,
    isLoading: false,
    isDataReady: false,
    user: null
  })

/** Hold the prepared application user and mark session data ready. */
const setDataReady = (user: SessionUserContract): void => setSessionStore({ user, isDataReady: true })

/** Signed in and prepared: authenticated content may render. */
const isSessionPrepared = (): boolean =>
  !sessionStore.isLoading && sessionStore.isAuthenticated && sessionStore.isDataReady

/** Resolution finished with no session: the login route applies. */
const isSessionSignedOut = (): boolean => !sessionStore.isLoading && !sessionStore.isAuthenticated

/** Session state store singleton */
export const SessionState: SessionStateContract = {
  store: sessionStore,
  setAuth: setSessionAuth,
  setReady: setDataReady,
  isPrepared: isSessionPrepared,
  isSignedOut: isSessionSignedOut,
  clear: clearSession
}
