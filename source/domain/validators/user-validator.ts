/*
╔═════════════════════════════════════════════════════════════════════════════╗
║ User protocol validator                                                    ║
║ Boundary validation for user protocol payloads.                            ║
╚═════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Validates create and update protocol payloads for user topic abstractions.

EXPORTED APIs & TYPEs
───────────────────────────────────────────────────────────────────────────────
validateUserCreate(input)
  Validate UserCreate payloads.

validateUserUpdate(input)
  Validate UserUpdate payloads.
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
  if (
    !isCompositionPositive(input.roles, (entry): entry is UserRole => {
      return USER_ROLES.includes(entry as UserRole)
    })
  ) {
    return 'roles must be a non-empty array of valid UserRole values'
  }
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
  return null
}

/** Validates UserUpdate; returns error message or null. */
export const validateUserUpdate = (input: UserUpdate): string | null => {
  if (!isId(input.id)) return 'id must be a valid Id'

  if (
    input.roles !== undefined
    && !isCompositionPositive(input.roles, (entry): entry is UserRole => {
      return USER_ROLES.includes(entry as UserRole)
    })
  ) {
    return 'roles must be a non-empty array of valid UserRole values when provided'
  }
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
  return null
}

// ────────────────────────────────────────────────────────────────────────────
// INTERNALS
// ────────────────────────────────────────────────────────────────────────────
