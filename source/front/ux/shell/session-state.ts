/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Session state store                                                          ║
║ Reactive auth and session state shared across all apps.                      ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Single source of truth for authentication and session state. All session
mutations flow through named helpers — no caller uses setSessionStore directly
outside this module.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
SessionStore - Session data
├ userId           Authenticated user id or null.
├ isAuthenticated  True when a session is active.
├ isLoading        True while boot-time auth resolution is pending.
└ isDataReady      True when required post-auth data is loaded.

SessionState - Session data and mutation methods
├ store            Reactive session state snapshot.
├ setAuth(userId)  Mark session active and clear loading.
├ setReady()       Mark boot-time data load complete.
└ clear()          Reset session state to signed-out defaults.
*/

import type { Id } from '@core/std'
import { createStore } from '@solid-js/store'

/** Auth and session state shared across all UX applications. */
export type SessionStore = {
  userId: Id | null
  isAuthenticated: boolean
  isLoading: boolean
  isDataReady: boolean
}

/** Contract for the session state singleton and its mutation methods. */
export interface SessionStateContract {
  store: SessionStore
  setAuth: (userId: Id) => void
  setReady: () => void
  clear: () => void
}

/** Reactive storage */
const [sessionStore, setSessionStore] = createStore<SessionStore>({
  userId: null,
  isAuthenticated: false,
  isLoading: true,
  isDataReady: false
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
    isDataReady: false
  })

/** Signal that all boot-time data is loaded and the app is ready to render. */
const setDataReady = (): void => setSessionStore('isDataReady', true)

/** Session state store singleton */
export const SessionState: SessionStateContract = {
  store: sessionStore,
  setAuth: setSessionAuth,
  setReady: setDataReady,
  clear: clearSession
}
