/**
 * User protocol validators.
 */

import { isCompositionPositive, isId, isNonEmptyString } from '@core-std'
import { USER_ROLES } from '@domain/abstractions/user.ts'
import type { UserRole } from '@domain/abstractions/user.ts'
import type { UserCreate, UserUpdate } from '@domain/protocols/user-protocol.ts'

// ────────────────────────────────────────────────────────────────────────────
// VALIDATORS
// ────────────────────────────────────────────────────────────────────────────

/** Validates UserCreate; returns error message or null. */
export const validateUserCreate = (input: UserCreate): string | null => {
  if (!isNonEmptyString(input.displayName)) {
    return 'displayName must be a non-empty string'
  }
  if (!isNonEmptyString(input.primaryEmail)) {
    return 'primaryEmail must be a non-empty string'
  }
  if (!isNonEmptyString(input.phoneNumber)) {
    return 'phoneNumber must be a non-empty string'
  }
  if (!isCompositionPositive(input.roles, isUserRole)) {
    return 'roles must be a non-empty array of valid UserRole values'
  }
  return null
}

/** Validates UserUpdate; returns error message or null. */
export const validateUserUpdate = (input: UserUpdate): string | null => {
  if (!isId(input.id)) return 'id must be a valid Id'
  if (input.displayName !== undefined && !isNonEmptyString(input.displayName)) {
    return 'displayName must be a non-empty string'
  }
  if (input.primaryEmail !== undefined && !isNonEmptyString(input.primaryEmail)) {
    return 'primaryEmail must be a non-empty string'
  }
  if (input.phoneNumber !== undefined && !isNonEmptyString(input.phoneNumber)) {
    return 'phoneNumber must be a non-empty string'
  }
  if (input.roles !== undefined && !isCompositionPositive(input.roles, isUserRole)) {
    return 'roles must be a non-empty array of valid UserRole values'
  }
  return null
}

// ────────────────────────────────────────────────────────────────────────────
// VALIDATOR DECOMPOSITION
// ────────────────────────────────────────────────────────────────────────────

const isUserRole = (v: unknown): v is UserRole => USER_ROLES.includes(v as UserRole)
