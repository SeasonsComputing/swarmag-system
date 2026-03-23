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
  expectCompositionPositive,
  expectConstEnum,
  expectId,
  expectNonEmptyString,
  type ExpectResult,
  expectValid
} from '@core/std'
import { USER_ROLES, USER_STATUSES, type UserRole } from '@domain/abstractions/user.ts'
import type { UserCreate, UserUpdate } from '@domain/protocols/user-protocol.ts'

// ────────────────────────────────────────────────────────────────────────────
// PUBLIC
// ────────────────────────────────────────────────────────────────────────────

export const validateUserCreate = (input: UserCreate): ExpectResult =>
  expectValid(
    expectCompositionPositive(input.roles, 'roles', isUserRole),
    expectNonEmptyString(input.displayName, 'displayName'),
    expectNonEmptyString(input.primaryEmail, 'primaryEmail'),
    expectNonEmptyString(input.phoneNumber, 'phoneNumber'),
    expectNonEmptyString(input.avatarUrl, 'avatarUrl', true),
    expectConstEnum(input.status, 'status', USER_STATUSES)
  )

export const validateUserUpdate = (input: UserUpdate): ExpectResult =>
  expectValid(
    expectId(input.id, 'id'),
    expectCompositionPositive(input.roles, 'roles', isUserRole, true),
    expectNonEmptyString(input.displayName, 'displayName', true),
    expectNonEmptyString(input.primaryEmail, 'primaryEmail', true),
    expectNonEmptyString(input.phoneNumber, 'phoneNumber', true),
    expectNonEmptyString(input.avatarUrl, 'avatarUrl', true),
    expectConstEnum(input.status, 'status', USER_STATUSES, true)
  )

const isUserRole = (v: unknown): v is UserRole => expectConstEnum(v, 'role', USER_ROLES) === null
