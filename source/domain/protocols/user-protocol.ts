/**
 * Protocol types for user operations.
 * Defines wire shapes for request/response contracts.
 */

import { User, UserRole } from '../abstractions/user.ts'

/** Input for creating a user. */
export type UserCreateInput = {
  displayName: string
  primaryEmail: string
  phoneNumber: string
  avatarUrl?: string
  roles?: UserRole[]
  status?: User['status']
}

/** Input for updating a user. */
export type UserUpdateInput = {
  id: string
  displayName?: string
  primaryEmail?: string
  phoneNumber?: string
  avatarUrl?: string | null
  roles?: UserRole[] | null
  status?: User['status']
}
