/**
 * Domain models for users in the swarmAg system.
 * A User holds identity and role information. Roles are non-empty;
 * at least one role is required. USER_ROLES is the canonical tuple
 * from which UserRole is derived.
 */

import type { CompositionPositive, Instantiable } from '@core-std'

/** Canonical role set. */
export const USER_ROLES = ['administrator', 'sales', 'operations'] as const

/** Role type derived from the canonical tuple. */
export type UserRole = (typeof USER_ROLES)[number]

/** System user identity and membership; at least one role is required. */
export type User = Instantiable & {
  displayName: string
  primaryEmail: string
  phoneNumber: string
  avatarUrl?: string
  roles: CompositionPositive<UserRole>
  status?: 'active' | 'inactive'
}
