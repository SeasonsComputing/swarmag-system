/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ User domain abstractions                                                     ║
║ System user identity and role membership.                                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines the User abstraction, role enumeration, and status enumeration for
system user identity and membership.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
USER_ROLES     Canonical role values.
UserRole       User role union type.
USER_STATUSES  Canonical user status values.
UserStatus     User status union type.
User           System user identity and membership.
*/

import type { CompositionPositive, Instantiable } from '@core/std'

/** Canonical role values. */
export const USER_ROLES = ['administrator', 'sales', 'operations'] as const
export type UserRole = (typeof USER_ROLES)[number]

/** Canonical user status values. */
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
