/**
 * Protocol input shapes for User create and update operations.
 * Partial shapes for boundary transmission — no domain logic.
 */
import type { Id } from '@core-std'
import type { UserRole, User } from '@domain/abstractions/user.ts'

/** Input shape for creating a User. */
export type UserCreateInput = {
  displayName: string
  primaryEmail: string
  phoneNumber: string
  avatarUrl?: string
  roles?: [UserRole?, ...UserRole[]]
  status?: User['status']
}

/** Input shape for updating a User. */
export type UserUpdateInput = {
  id: Id
  displayName?: string
  primaryEmail?: string
  phoneNumber?: string
  avatarUrl?: string
  roles?: [UserRole?, ...UserRole[]]
  status?: User['status']
}
