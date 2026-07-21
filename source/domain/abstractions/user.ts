/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ User domain abstractions                                                     ║
║ Canonical types for user identity and membership.                            ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines user role catalog, status catalog, and user abstractions.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
USER_ROLES     Allowed user role values.
UserRole       User role derived from USER_ROLES.
USER_STATUSES  Allowed user status values.
UserStatus     User status derived from USER_STATUSES.
User           System user identity and membership abstraction.
*/

import type { CompositionMany, CompositionPositive, Instantiable } from '@core/std'
import type { ContactPreferredChannel, Note } from '@domain/abstractions/common.ts'

/** Allowed user role values. */
export const USER_ROLES = ['administrator', 'sales', 'operations', 'customer'] as const
export type UserRole = (typeof USER_ROLES)[number]

/** Allowed user status values. */
export const USER_STATUSES = ['active', 'inactive'] as const
export type UserStatus = (typeof USER_STATUSES)[number]

/** System user identity and membership abstraction. */
export type User = Instantiable & {
  roles: CompositionPositive<UserRole>
  notes: CompositionMany<Note>
  displayName: string
  primaryEmail: string
  phoneNumber: string
  preferredChannel: ContactPreferredChannel
  avatarUrl?: string
  status: UserStatus
}
