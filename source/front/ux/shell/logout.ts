/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Logout                                                                       ║
║ Transition work for terminating the active auth session.                     ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Terminates the remote auth session when possible and always clears local session
state. Route navigation is owned by the shell transition that invokes this work.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
logout  Ends the active session and clears local session state.
*/

import { api } from '@front/api'

/** End the active session and always clear local session state. */
export async function logout(): Promise<void> {
  try {
    await api.Auth.logout()
  } catch (error) {
    console.error('[logout] logout failed', error)
  } finally {
    api.SessionState.clear()
  }
}
