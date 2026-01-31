/**
 * Protocol types for common entity operations.
 * Defines wire shapes for request/response contracts.
 */

import type { User, UserRole } from '@domain/abstractions/common.ts'
import { isNonEmptyString, isUserRoles, isUserStatus } from '@domain/validators/common-validators.ts'
import type { ID, When } from '@utils'

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

/** Pagination options for list operations. */
export interface ListOptions {
  limit?: number
  cursor?: number
}

/** Paginated list result. */
export interface ListResult<T> {
  data: T[]
  cursor: number
  hasMore: boolean
}

/** Deletion result with timestamp. */
export interface DeleteResult {
  id: ID
  deletedAt: When
}

/**
 * Validate user creation input.
 * @param input - User creation input to validate.
 * @returns Error message or null if valid.
 */
export const validateUserCreateInput = (input?: UserCreateInput | null): string | null => {
  if (!isNonEmptyString(input?.displayName)) return 'displayName is required'
  if (!isNonEmptyString(input?.primaryEmail)) return 'primaryEmail is required'
  if (!isNonEmptyString(input?.phoneNumber)) return 'phoneNumber is required'
  if (input?.status && !isUserStatus(input.status)) return 'status must be active or inactive'
  if (input?.roles && !isUserRoles(input.roles)) return 'roles must be an array of UserRole'
  return null
}

/**
 * Validate user update input.
 * @param input - User update input to validate.
 * @returns Error message or null if valid.
 */
export const validateUserUpdateInput = (input?: UserUpdateInput | null): string | null => {
  if (!isNonEmptyString(input?.id)) return 'id is required'
  if (input?.status && !isUserStatus(input.status)) return 'status must be active or inactive'
  if (input?.roles && !isUserRoles(input.roles)) return 'roles must be an array of UserRole'
  return null
}
