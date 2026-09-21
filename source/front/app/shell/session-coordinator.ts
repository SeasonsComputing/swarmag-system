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
SessionCoordinator  Initialize session coordination or clear prepared state.
*/

import type { Session } from '@core/api/api-auth-contract.ts'
import type { Id } from '@core/std'
import { api } from '@front/api/api.ts'
import { onCleanup } from '@solid-js'
import type { SessionCoordinatorContract } from '@ux/shell/runtime/shell.ts'

/** Application-owned identity preparation and auth subscription. */
class AppSessionCoordinator implements SessionCoordinatorContract {
  #preparedUserId: Id | null = null

  /** Start persisted-session resolution and subscribe under the active mount owner. */
  init(): void {
    void this.#syncSession()
    const unsubscribe = api.Auth.onAuthStateChange(session => void this.#applySession(session))
    onCleanup(() => {
      unsubscribe()
      this.clear()
    })
  }

  /** Clear both application preparation and generic session state. */
  clear(): void {
    this.#preparedUserId = null
    api.SessionState.clear()
  }

  /** Resolve the persisted browser session through the same path as auth events. */
  async #syncSession(): Promise<void> {
    await this.#applySession(await api.Auth.getSession())
  }

  /** Apply auth identity, then prepare application-specific eligibility and readiness. */
  async #applySession(session: Session | null): Promise<void> {
    if (!session) {
      this.clear()
      return
    }

    if (api.SessionState.store.userId !== session.userId) this.clear()
    api.SessionState.setAuth(session.userId)
    if (this.#preparedUserId === session.userId) return

    const user = await api.Users.get(session.userId)
    if (api.SessionState.store.userId !== session.userId) return
    if (user.status !== 'active') {
      try {
        await api.Auth.logout()
      } finally {
        this.clear()
      }
      return
    }
    this.#preparedUserId = session.userId
    api.SessionState.setReady()
  }
}

/** Shared suite session coordinator. */
export const SessionCoordinator: SessionCoordinatorContract = new AppSessionCoordinator()
