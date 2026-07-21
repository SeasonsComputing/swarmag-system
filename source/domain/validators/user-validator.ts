/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ User protocol validators                                                     ║
║ Boundary validation for user protocol payloads.                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Validates create and update protocol payloads for user abstractions.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
validateUserCreate(input)  Validate UserCreate payloads.
validateUserUpdate(input)  Validate UserUpdate payloads.
*/

import {
  expectCompositionMany,
  expectCompositionPositive,
  expectConstEnum,
  expectId,
  expectNonEmptyString,
  type ExpectResult,
  expectValid
} from '@core/std'
import { CONTACT_PREFERRED_CHANNELS } from '@domain/abstractions/common.ts'
import { USER_ROLES, USER_STATUSES, type UserRole } from '@domain/abstractions/user.ts'
import type { UserCreate, UserUpdate } from '@domain/protocols/user-protocol.ts'
import { isNote } from '@domain/validators/common-validator.ts'

/** Validate UserCreate payloads. */
export const validateUserCreate = (input: UserCreate): ExpectResult =>
  expectValid(
    expectCompositionPositive(input.roles, 'roles', isUserRole),
    expectCompositionMany(input.notes, 'notes', isNote),
    expectNonEmptyString(input.displayName, 'displayName'),
    expectNonEmptyString(input.primaryEmail, 'primaryEmail'),
    expectNonEmptyString(input.phoneNumber, 'phoneNumber'),
    expectConstEnum(input.preferredChannel, 'preferredChannel', CONTACT_PREFERRED_CHANNELS),
    expectNonEmptyString(input.avatarUrl, 'avatarUrl', true),
    expectConstEnum(input.status, 'status', USER_STATUSES)
  )

/** Validate UserUpdate payloads. */
export const validateUserUpdate = (input: UserUpdate): ExpectResult =>
  expectValid(
    expectId(input.id, 'id'),
    expectCompositionPositive(input.roles, 'roles', isUserRole, true),
    expectCompositionMany(input.notes, 'notes', isNote, true),
    expectNonEmptyString(input.displayName, 'displayName', true),
    expectNonEmptyString(input.primaryEmail, 'primaryEmail', true),
    expectNonEmptyString(input.phoneNumber, 'phoneNumber', true),
    expectConstEnum(input.preferredChannel, 'preferredChannel', CONTACT_PREFERRED_CHANNELS, true),
    expectNonEmptyString(input.avatarUrl, 'avatarUrl', true),
    expectConstEnum(input.status, 'status', USER_STATUSES, true)
  )

// ────────────────────────────────────────────────────────────────────────────
// GUARDS
// ────────────────────────────────────────────────────────────────────────────

const isUserRole = (v: unknown): v is UserRole => expectConstEnum(v, 'role', USER_ROLES) === null
