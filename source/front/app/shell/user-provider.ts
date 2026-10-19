/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ swarmAg user provider                                                        ║
║ Prepared domain User behind the shell session contract.                      ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Holds the eligible User for the prepared session. Only the coordinator sets
and clears it; domain-aware consumers read it or derive creation defaults.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
UserProvider  Shared suite prepared user and role-based creation defaults.
*/

import type { Id } from '@core/std'
import type { User, UserRole } from '@domain/abstractions/user.ts'
import { createSignal } from '@solid-js'
import type { Accessor, Setter } from '@solid-js'
import type { SessionUserContract } from '@ux/shell/runtime/session-contracts.ts'

/** swarmAg signed-in user behind the shell's domain-free contract. */
class AppUserProvider implements SessionUserContract {
  readonly #user: Accessor<User | null>
  readonly #setUser: Setter<User | null>
  constructor() {
    const [user, setUser] = createSignal<User | null>(null)
    this.#user = user
    this.#setUser = setUser
  }

  /** Signed-in user id, or null when signed out. */
  id(): Id | null {
    return this.#user()?.id ?? null
  }

  /** Signed-in user's roles; empty when signed out. */
  roles(): readonly string[] {
    return this.#user()?.roles ?? []
  }

  /** Signed-in domain User, or null when signed out. */
  user(): User | null {
    return this.#user()
  }

  /** Signed-in user's id when they hold any listed role; otherwise undefined. */
  idWithAnyRole(roles: readonly UserRole[]): Id | undefined {
    const user = this.#user()
    return user?.roles.some(role => roles.includes(role)) ? user.id : undefined
  }

  /** Hold the prepared User; only the coordinator calls it. */
  set(user: User): void {
    this.#setUser(user)
  }

  /** Release the User on sign-out or identity change. */
  clear(): void {
    this.#setUser(null)
  }
}

/** Shared suite prepared user. */
export const UserProvider = new AppUserProvider()
