/**
 * Domain model for system users in the swarmAg system.
 * Users carry identity, role membership, and contact information.
 */

import type { CompositionPositive, Instantiable } from '@core-std'

/** Canonical role set. */
export const USER_ROLES = ['administrator', 'sales', 'operations'] as const

/** Role type derived from tuple. */
export type UserRole = (typeof USER_ROLES)[number]

/** System user identity and membership. */
export type User = Instantiable & {
  displayName: string
  primaryEmail: string
  phoneNumber: string
  avatarUrl?: string
  roles: CompositionPositive<UserRole>
  status?: 'active' | 'inactive'
}
