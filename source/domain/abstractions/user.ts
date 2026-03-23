/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ User domain abstractions                                                     ║
║ Canonical types for user identity and role membership.                       ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines user role catalog and user account abstractions.
*/

import type { CompositionPositive, Instantiable } from '@core/std'

/** Allowed user role values. */
export const USER_ROLES = ['administrator', 'sales', 'operations'] as const
export type UserRole = (typeof USER_ROLES)[number]

/** Allowed user status values. */
export const USER_STATUSES = ['active', 'inactive'] as const
export type UserStatus = (typeof USER_STATUSES)[number]

/** System user identity and membership abstraction. */
export type User = Instantiable & {
  roles: CompositionPositive<UserRole>
  displayName: string
  primaryEmail: string
  phoneNumber: string
  avatarUrl?: string
  status: UserStatus
}
