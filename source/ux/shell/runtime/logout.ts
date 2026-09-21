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

import type { ApiAuthContract } from '@core/api/api-auth-contract.ts'
import { SessionState } from './session-state.ts'

/** End the active session and always clear local session state. */
export async function logout(auth: ApiAuthContract): Promise<void> {
  try {
    await auth.logout()
  } catch (error) {
    console.error('[logout] logout failed', error)
  } finally {
    SessionState.clear()
  }
}
