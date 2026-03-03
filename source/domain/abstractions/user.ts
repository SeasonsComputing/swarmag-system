/**
 * Domain models for users in the swarmAg system.
 */

import type { CompositionPositive, Instantiable } from '@core-std'

/** Canonical role set. */
export const USER_ROLES = ['administrator', 'sales', 'operations'] as const
export type UserRole = (typeof USER_ROLES)[number]

/** Account lifecycle state. */
export const USER_STATUSES = ['active', 'inactive'] as const
export type UserStatus = (typeof USER_STATUSES)[number]

/** System user identity and membership. */
export type User = Instantiable & {
  displayName: string
  primaryEmail: string
  phoneNumber: string
  avatarUrl?: string
  status?: UserStatus
  roles: CompositionPositive<UserRole>
}
