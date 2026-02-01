/**
 * Shared types and interfaces used across the swarmAg domain models.
 * These define common data structures for various domain abstractions.
 */

import type { ID, When } from '@utils'

/** Allowed role memberships for users. */
export const USER_ROLES = ['administrator', 'sales', 'operations'] as const
export type UserRole = (typeof USER_ROLES)[number]

/** Represents a user in the system. */
export interface User {
  id: ID
  displayName: string
  primaryEmail: string
  phoneNumber: string
  avatarUrl?: string
  roles?: UserRole[]
  status?: 'active' | 'inactive'
  createdAt?: When
  updatedAt?: When
  deletedAt?: When
}
