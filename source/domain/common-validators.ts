/**
 * Domain-level invariant validators for common entities.
 */

import type { User, UserRole } from '@domain/common.ts'

export type UserCreateInput = {
  displayName: string
  primaryEmail: string
  phoneNumber: string
  avatarUrl?: string
  roles?: UserRole[]
  status?: User['status']
}

export type UserUpdateInput = {
  id: string
  displayName?: string
  primaryEmail?: string
  phoneNumber?: string
  avatarUrl?: string | null
  roles?: UserRole[] | null
  status?: User['status']
}

export type UserDeleteInput = { id: string }

export type UserGetQuery = { id?: string }

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0

const isUserStatus = (value: unknown): value is NonNullable<User['status']> =>
  value === 'active' || value === 'inactive'

export const validateUserCreateInput = (input?: UserCreateInput | null): string | null => {
  if (!isNonEmptyString(input?.displayName)) return 'displayName is required'
  if (!isNonEmptyString(input?.primaryEmail)) return 'primaryEmail is required'
  if (!isNonEmptyString(input?.phoneNumber)) return 'phoneNumber is required'
  if (input?.status && !isUserStatus(input.status)) return 'status must be active or inactive'
  if (input?.roles && !Array.isArray(input.roles)) return 'roles must be an array of UserRole'
  return null
}

export const validateUserUpdateInput = (input?: UserUpdateInput | null): string | null => {
  if (!isNonEmptyString(input?.id)) return 'id is required'
  if (input?.status && !isUserStatus(input.status)) return 'status must be active or inactive'
  if (input?.roles && !Array.isArray(input.roles)) return 'roles must be an array of UserRole'
  return null
}

export const validateUserDeleteInput = (input?: UserDeleteInput | null): string | null => {
  if (!isNonEmptyString(input?.id)) return 'id is required'
  return null
}

export const validateUserGetQuery = (input?: UserGetQuery | null): string | null => {
  if (!isNonEmptyString(input?.id)) return 'id is required'
  return null
}
