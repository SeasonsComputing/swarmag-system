/**
 * Protocol input shapes for User boundary operations.
 */

import type { Id } from '@core-std'
import type { User, UserRole } from '@domain/abstractions/user.ts'

/** Input for creating a User. */
export type UserCreate = {
  displayName: string
  primaryEmail: string
  phoneNumber: string
  avatarUrl?: string
  roles: UserRole[]
}

/** Input for updating a User. */
export type UserUpdate = {
  id: Id
  displayName?: string
  primaryEmail?: string
  phoneNumber?: string
  avatarUrl?: string
  roles?: UserRole[]
  status?: User['status']
}
