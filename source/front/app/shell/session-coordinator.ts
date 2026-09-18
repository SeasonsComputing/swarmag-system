/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ swarmAg session coordinator                                                  ║
║ Application identity preparation and auth session synchronization.           ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Owns swarmAg user eligibility and the auth subscription. Retains only the
prepared identity, not the domain User. Initialization runs under the shell's
Solid mount owner so subscription cleanup follows application disposal.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AppSessionCoordinator  Session lifecycle with explicit application cleanup.
SessionCoordinator  Initialize session coordination or clear prepared state.
*/

import type { Session } from '@core/api/api-auth-contract.ts'
import type { Id } from '@core/std'
import { api } from '@front/api/api.ts'
import type { SessionCoordinator as SessionCoordinatorContract } from '@front/ux/shell/shell.ts'
import { onCleanup } from '@solid-js'

/** Session lifecycle contract including application-owned sign-out cleanup. */
export interface AppSessionCoordinator extends SessionCoordinatorContract {
  clear(): void
}

/** Application-owned session lifecycle and explicit sign-out cleanup. */
export const SessionCoordinator: AppSessionCoordinator = { init, clear }

let preparedUserId: Id | null = null

/** Start persisted-session resolution and subscribe under the active mount owner. */
function init(): void {
  void syncSession()
  const unsubscribe = api.Auth.onAuthStateChange(session => void applySession(session))
  onCleanup(() => {
    unsubscribe()
    clear()
  })
}

/** Clear both application preparation and generic session state. */
function clear(): void {
  preparedUserId = null
  api.SessionState.clear()
}

/** Resolve the persisted browser session through the same path as auth events. */
async function syncSession(): Promise<void> {
  await applySession(await api.Auth.getSession())
}

/** Apply auth identity, then prepare application-specific eligibility and readiness. */
async function applySession(session: Session | null): Promise<void> {
  if (!session) {
    clear()
    return
  }

  if (api.SessionState.store.userId !== session.userId) clear()
  api.SessionState.setAuth(session.userId)
  if (preparedUserId === session.userId) return

  const user = await api.Users.get(session.userId)
  if (api.SessionState.store.userId !== session.userId) return
  if (user.status !== 'active') {
    try {
      await api.Auth.logout()
    } finally {
      clear()
    }
    return
  }
  preparedUserId = session.userId
  api.SessionState.setReady()
}
