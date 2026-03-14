/*
╔═════════════════════════════════════════════════════════════════════════════╗
║ User domain abstractions                                                    ║
║ User identity and authorization role abstractions                           ║
╚═════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines user identity abstractions and role/status value sets.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
USER_ROLES                         Allowed user roles.
UserRole                           User role union.
USER_STATUSES                      Allowed user statuses.
UserStatus                         User status union.
User                               System user identity abstraction.
*/

import type { CompositionPositive, Instantiable } from '@core/std'

/** Canonical user role values. */
export const USER_ROLES = ['administrator', 'sales', 'operations'] as const
export type UserRole = (typeof USER_ROLES)[number]

/** User availability statuses. */
export const USER_STATUSES = ['active', 'inactive'] as const
export type UserStatus = (typeof USER_STATUSES)[number]

/** System user identity and membership. */
export type User = Instantiable & {
  roles: CompositionPositive<UserRole>
  displayName: string
  primaryEmail: string
  phoneNumber: string
  avatarUrl?: string
  status: UserStatus
}
