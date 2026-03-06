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

import {
  expectCompositionPositive,
  expectConstEnum,
  expectId,
  expectNonEmptyString,
  expectValid
} from '@core-std'
import { USER_ROLES, USER_STATUSES, type UserRole } from '@domain/abstractions/user.ts'
import type { UserCreate, UserUpdate } from '@domain/protocols/user-protocol.ts'

// ────────────────────────────────────────────────────────────────────────────
// VALIDATORS
// ────────────────────────────────────────────────────────────────────────────

/** Validates UserCreate; returns error message or null. */
export const validateUserCreate = (input: UserCreate): string | null => {
  return expectValid(
    expectCompositionPositive(
      input.roles,
      'roles',
      (entry): entry is UserRole => USER_ROLES.includes(entry as UserRole)
    ),
    expectNonEmptyString(input.displayName, 'displayName'),
    expectNonEmptyString(input.primaryEmail, 'primaryEmail'),
    expectNonEmptyString(input.phoneNumber, 'phoneNumber'),
    expectNonEmptyString(input.avatarUrl, 'avatarUrl', true),
    expectConstEnum(input.status, 'status', USER_STATUSES, true)
  )
}

/** Validates UserUpdate; returns error message or null. */
export const validateUserUpdate = (input: UserUpdate): string | null => {
  return expectValid(
    expectId(input.id, 'id'),
    expectCompositionPositive(
      input.roles,
      'roles',
      (entry): entry is UserRole => USER_ROLES.includes(entry as UserRole),
      true
    ),
    expectNonEmptyString(input.displayName, 'displayName', true),
    expectNonEmptyString(input.primaryEmail, 'primaryEmail', true),
    expectNonEmptyString(input.phoneNumber, 'phoneNumber', true),
    expectNonEmptyString(input.avatarUrl, 'avatarUrl', true),
    expectConstEnum(input.status, 'status', USER_STATUSES, true)
  )
}

// ────────────────────────────────────────────────────────────────────────────
// INTERNALS
// ────────────────────────────────────────────────────────────────────────────
