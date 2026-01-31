/**
 * Domain-level invariant validators for common entities.
 */

import type { User, UserRole } from '@domain/abstractions/common.ts'

/**
 * Type guard for non-empty string values.
 * @param value - Value to check.
 * @returns True when value is a non-empty string.
 */
export const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0

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
