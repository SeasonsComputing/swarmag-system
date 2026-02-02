/**
 * Domain-level invariant validators for user abstraction
 */

import type { User, UserRole } from '@domain/abstractions/user.ts'
import type { UserCreateInput, UserUpdateInput } from '@domain/protocol/user-protocol.ts'
import { isNonEmptyString } from './helper-validators.ts'

/**
 * Type guard for accepted user status values.
 * @param value - Potential status value.
 * @returns True when the value is an allowed status string.
 */
export const isUserStatus = (value: unknown): value is NonNullable<User['status']> =>
  value === 'active' || value === 'inactive'

/**
 * Type guard for a User roles array.
 * @param value - Potential roles value.
 * @returns True when the value is an array of role strings.
 */
export const isUserRoles = (value: unknown): value is UserRole[] =>
  Array.isArray(value) && value.every(role => typeof role === 'string')

/**
 * Validate user creation input.
 * @param input - User creation input to validate.
 * @returns Error message or null if valid.
 */
export const validateUserCreateInput = (input?: UserCreateInput | null): string | null => {
  if (!isNonEmptyString(input?.displayName)) return 'displayName is required'
  if (!isNonEmptyString(input?.primaryEmail)) return 'primaryEmail is required'
  if (!isNonEmptyString(input?.phoneNumber)) return 'phoneNumber is required'
  if (input?.status && !isUserStatus(input.status)) {
    return 'status must be active or inactive'
  }
  if (input?.roles && !isUserRoles(input.roles)) {
    return 'roles must be an array of UserRole'
  }
  return null
}

/**
 * Validate user update input.
 * @param input - User update input to validate.
 * @returns Error message or null if valid.
 */
export const validateUserUpdateInput = (input?: UserUpdateInput | null): string | null => {
  if (!isNonEmptyString(input?.id)) return 'id is required'
  if (input?.status && !isUserStatus(input.status)) {
    return 'status must be active or inactive'
  }
  if (input?.roles && !isUserRoles(input.roles)) {
    return 'roles must be an array of UserRole'
  }
  return null
}
