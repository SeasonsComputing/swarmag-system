/**
 * Protocol input shapes for User boundary operations.
 */

import type { Id } from '@core-std'
import type { UserRole } from '@domain/abstractions/user.ts'

/** Input for creating a User. */
export type UserCreateInput = {
  displayName: string
  primaryEmail: string
  phoneNumber: string
  avatarUrl?: string
  roles: UserRole[]
}

/** Input for updating a User. */
export type UserUpdateInput = {
  id: Id
  displayName?: string
  primaryEmail?: string
  phoneNumber?: string
  avatarUrl?: string
  roles?: UserRole[]
  status?: 'active' | 'inactive'
}
