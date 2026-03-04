/**
 * User protocol validator.
 */

import { isCompositionPositive, isId, isNonEmptyString } from '@core-std'
import {
  USER_ROLES,
  USER_STATUSES,
  type UserRole,
  type UserStatus
} from '@domain/abstractions/user.ts'
import type {
  UserCreate,
  UserUpdate
} from '@domain/protocols/user-protocol.ts'

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
  if (input.avatarUrl !== undefined && !isNonEmptyString(input.avatarUrl)) {
    return 'avatarUrl must be a non-empty string when provided'
  }
  if (input.status !== undefined && !USER_STATUSES.includes(input.status as UserStatus)) {
    return 'status must be a valid UserStatus when provided'
  }
  if (
    !isCompositionPositive(input.roles, (value): value is UserRole => {
      return USER_ROLES.includes(value as UserRole)
    })
  ) {
    return 'roles must be a non-empty array of valid UserRole values'
  }

  return null
}

/** Validates UserUpdate; returns error message or null. */
export const validateUserUpdate = (input: UserUpdate): string | null => {
  if (!isId(input.id)) return 'id must be a valid Id'

  if (input.displayName !== undefined && !isNonEmptyString(input.displayName)) {
    return 'displayName must be a non-empty string when provided'
  }
  if (input.primaryEmail !== undefined && !isNonEmptyString(input.primaryEmail)) {
    return 'primaryEmail must be a non-empty string when provided'
  }
  if (input.phoneNumber !== undefined && !isNonEmptyString(input.phoneNumber)) {
    return 'phoneNumber must be a non-empty string when provided'
  }
  if (input.avatarUrl !== undefined && !isNonEmptyString(input.avatarUrl)) {
    return 'avatarUrl must be a non-empty string when provided'
  }
  if (input.status !== undefined && !USER_STATUSES.includes(input.status as UserStatus)) {
    return 'status must be a valid UserStatus when provided'
  }
  if (
    input.roles !== undefined
    && !isCompositionPositive(input.roles, (value): value is UserRole => {
      return USER_ROLES.includes(value as UserRole)
    })
  ) {
    return 'roles must be a non-empty array of valid UserRole values when provided'
  }

  return null
}

// ────────────────────────────────────────────────────────────────────────────
// INTERNALS
// ────────────────────────────────────────────────────────────────────────────
