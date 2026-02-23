/**
 * Validators for User boundary inputs.
 */

import { isNonEmptyString } from '@core-std'
import type { UserCreateInput, UserUpdateInput } from '@domain/protocols/user-protocol.ts'

/** Validate input for creating a User; returns an error message or null. */
export const validateUserCreate = (input: UserCreateInput): string | null => {
  if (!isNonEmptyString(input.displayName)) return 'displayName is required'
  if (!isNonEmptyString(input.primaryEmail)) return 'primaryEmail is required'
  if (!isNonEmptyString(input.phoneNumber)) return 'phoneNumber is required'
  return null
}

/** Validate input for updating a User; returns an error message or null. */
export const validateUserUpdate = (input: UserUpdateInput): string | null => {
  if (!isNonEmptyString(input.id)) return 'id is required'
  if (input.displayName !== undefined && !isNonEmptyString(input.displayName)) {
    return 'displayName must be a non-empty string'
  }
  if (input.primaryEmail !== undefined && !isNonEmptyString(input.primaryEmail)) {
    return 'primaryEmail must be a non-empty string'
  }
  if (input.phoneNumber !== undefined && !isNonEmptyString(input.phoneNumber)) {
    return 'phoneNumber must be a non-empty string'
  }
  return null
}
