/**
 * Domain abstractions for users in the swarmAg system.
 * Users represent system identities with role-based membership.
 */

import type { Id, When } from '@core-std'

/** Canonical role set. */
export const USER_ROLES = ['administrator', 'sales', 'operations'] as const

/** Role type derived from the canonical tuple. */
export type UserRole = (typeof USER_ROLES)[number]

/** System user identity and membership. */
export type User = {
  id: Id
  displayName: string
  primaryEmail: string
  phoneNumber: string
  avatarUrl?: string
  roles: [UserRole?, ...UserRole[]]
  status?: 'active' | 'inactive'
  createdAt?: When
  updatedAt?: When
  deletedAt?: When
}
