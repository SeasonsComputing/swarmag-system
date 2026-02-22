/**
 * Validators for user protocol inputs at system boundaries.
 * Returns an error message string on failure, null on success.
 */
import { isNonEmptyString, isId } from '@core-std'
import type { UserCreateInput, UserUpdateInput } from '@domain/protocols/user-protocol.ts'

/** Validates input for creating a User. */
export const validateUserCreate = (input: UserCreateInput): string | null => {
  if (!isNonEmptyString(input.displayName)) return 'displayName is required'
  if (!isNonEmptyString(input.primaryEmail)) return 'primaryEmail is required'
  if (!isNonEmptyString(input.phoneNumber)) return 'phoneNumber is required'
  return null
}

/** Validates input for updating a User. */
export const validateUserUpdate = (input: UserUpdateInput): string | null => {
  if (!isId(input.id)) return 'id must be a valid Id'
  if (input.displayName !== undefined && !isNonEmptyString(input.displayName)) return 'displayName must be a non-empty string'
  if (input.primaryEmail !== undefined && !isNonEmptyString(input.primaryEmail)) return 'primaryEmail must be a non-empty string'
  if (input.phoneNumber !== undefined && !isNonEmptyString(input.phoneNumber)) return 'phoneNumber must be a non-empty string'
  return null
}
