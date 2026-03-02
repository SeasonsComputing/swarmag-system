/**
 * Validators for the user domain area: User create and update.
 */

import { isCompositionPositive, isId, isNonEmptyString } from '@core-std'
import type { UserRole, UserStatus } from '@domain/abstractions/user.ts'
import { USER_ROLES, USER_STATUSES } from '@domain/abstractions/user.ts'
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
  if (input.status !== undefined && !isUserStatus(input.status)) {
    return 'status must be a valid UserStatus'
  }
  return null
}

/** Validates UserUpdate; returns error message or null. */
export const validateUserUpdate = (input: UserUpdate): string | null => {
  if (!isId(input.id)) return 'id must be a valid UUID'
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
  if (input.status !== undefined && !isUserStatus(input.status)) {
    return 'status must be a valid UserStatus'
  }
  return null
}

// ────────────────────────────────────────────────────────────────────────────
// VALIDATOR GUARDS
// ────────────────────────────────────────────────────────────────────────────

const isUserRole = (v: unknown): v is UserRole =>
  typeof v === 'string' && (USER_ROLES as readonly string[]).includes(v)

const isUserStatus = (v: unknown): v is UserStatus =>
  typeof v === 'string' && (USER_STATUSES as readonly string[]).includes(v)
