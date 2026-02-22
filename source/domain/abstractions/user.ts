/**
 * Domain models for system users in swarmAg.
 * Users carry identity and role membership for authorization intent.
 */

import type { Id, When } from '@core-std'

/** Canonical role set for all system users. */
export const USER_ROLES = ['administrator', 'sales', 'operations'] as const

/** Role type derived from the canonical role tuple. */
export type UserRole = (typeof USER_ROLES)[number]

/** System user identity and role membership. */
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
