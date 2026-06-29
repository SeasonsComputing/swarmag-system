/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ User domain abstractions                                                     ║
║ Canonical types for user identity, membership, and contact preference.       ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines user role catalog, contact channel catalog, and user abstractions.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
USER_ROLES                  Allowed user role values.
UserRole                    User role derived from USER_ROLES.
CONTACT_PREFERRED_CHANNELS  Allowed contact communication channels.
ContactPreferredChannel     Channel type derived from CONTACT_PREFERRED_CHANNELS.
USER_STATUSES               Allowed user status values.
UserStatus                  User status derived from USER_STATUSES.
User                        System user identity and membership abstraction.
*/

import type { CompositionMany, CompositionPositive, Instantiable } from '@core/std'
import type { Note } from '@domain/abstractions/common.ts'

/** Allowed user role values. */
export const USER_ROLES = ['administrator', 'sales', 'operations', 'customer'] as const
export type UserRole = (typeof USER_ROLES)[number]

/** Allowed contact communication channels. */
export const CONTACT_PREFERRED_CHANNELS = ['email', 'text', 'phone'] as const
export type ContactPreferredChannel = (typeof CONTACT_PREFERRED_CHANNELS)[number]

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
