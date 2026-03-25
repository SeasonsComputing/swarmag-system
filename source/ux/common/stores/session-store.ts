/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Session store                                                                ║
║ Reactive auth and session state shared across all apps.                      ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Single source of truth for authentication and session state. All session
mutations flow through named helpers — no caller uses setSessionStore directly
outside this module.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
sessionStore      Reactive read store; consumed by components and guards.
setSessionAuth    Mark session active and clear the loading flag.
clearSession      Clear all session state on sign-out or unauthenticated boot.
setSessionUser    Hydrate the domain User after authentication.
setDataReady      Signal all boot-time data is loaded; app is ready to render.
*/

import type { Id } from '@core/std'
import type { User } from '@domain/abstractions/user.ts'
import { createStore } from 'solid-js/store'

/** Auth and session state shared across all UX applications. */
type SessionStore = {
  userId: Id | null
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  isDataReady: boolean
}

/** Reactive storage */
const [sessionStore, setSessionStore] = createStore<SessionStore>({
  userId: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isDataReady: false
})

/** Mark session active from the authenticated userId; clears the loading flag. */
const setSessionAuth = (userId: Id): void =>
  setSessionStore({ userId, isAuthenticated: true, isLoading: false })

/** Clear all session state on sign-out or unauthenticated boot completion. */
const clearSession = (): void =>
  setSessionStore({
    userId: null,
    user: null,
    isAuthenticated: false,
    isLoading: false,
    isDataReady: false
  })

/** Set the hydrated domain User after successful authentication. */
const setSessionUser = (user: User): void => setSessionStore('user', user)

/** Signal that all boot-time data is loaded and the app is ready to render. */
const setDataReady = (): void => setSessionStore('isDataReady', true)

/** Session state store singleton */
const SessionStore = {
  store: sessionStore,
  setAuth: setSessionAuth,
  setUser: setSessionUser,
  setReady: setDataReady,
  clear: clearSession
}

export { SessionStore }
