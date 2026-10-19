/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ swarmAg session coordinator                                                  ║
║ Application identity preparation and auth session synchronization.           ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Owns swarmAg user eligibility and the auth subscription. Holds the prepared
User through UserProvider. Initialization runs under the shell's
Solid mount owner so subscription cleanup follows application disposal.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
SessionCoordinator  Initialize session coordination or clear prepared state.
*/

import type { Session } from '@core/stdx'
import { api } from '@front/api/api.ts'
import { onCleanup } from '@solid-js'
import type { SessionCoordinatorContract } from '@ux/shell/runtime/session-contracts.ts'
import { UserProvider } from './user-provider.ts'

/** Application-owned identity preparation and auth subscription. */
class AppSessionCoordinator implements SessionCoordinatorContract {
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
    UserProvider.clear()
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
    if (UserProvider.id() === session.userId) return

    const user = await api.Users.get(session.userId)
    if (api.SessionState.store.userId !== session.userId) return
    if (user.deletedAt !== undefined || user.status !== 'active') {
      try {
        await api.Auth.logout()
      } finally {
        this.clear()
      }
      return
    }
    UserProvider.set(user)
    api.SessionState.setReady(UserProvider)
  }
}

/** Shared suite session coordinator. */
export const SessionCoordinator = new AppSessionCoordinator()
