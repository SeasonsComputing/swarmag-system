/**
 * Mappers for converting between Supabase user rows and domain Users.
 */

import type { User } from '@domain/common'
import type { Row } from '@core/platform/db-binding'

/**
 * Type guard for accepted user status values.
 * @param value Potential status value.
 * @returns True when the value is an allowed status string.
 */
const isUserStatus = (value: unknown): value is NonNullable<User['status']> =>
  value === 'active' || value === 'inactive'

/**
 * Type guard for a User roles array of strings.
 * @param value Potential roles value.
 * @returns True when the value is an array of strings.
 */
const isUserRoles = (value: unknown): value is User['roles'] =>
  Array.isArray(value) && value.every((role) => typeof role === 'string')

/** Map a domain User into a Supabase row shape. */
export const userToRow = (user: User) => ({
  id: user.id,
  display_name: user.displayName,
  primary_email: user.primaryEmail,
  phone_number: user.phoneNumber,
  avatar_url: user.avatarUrl ?? null,
  roles: user.roles ?? null,
  status: user.status ?? 'active',
  created_at: user.createdAt,
  updated_at: user.updatedAt,
  deleted_at: user.deletedAt ?? null,
  payload: user,
})

/** Convert a Supabase row into a User domain model, preferring the payload when present. */
export const rowToUser = (row: Row<User>): User => {
  if (row.payload) return row.payload

  const id = typeof row.id === 'string' ? row.id : undefined
  const displayName =
    typeof (row as any).displayName === 'string'
      ? (row as any).displayName
      : typeof (row as any).display_name === 'string'
        ? (row as any).display_name
        : undefined
  const primaryEmail =
    typeof (row as any).primaryEmail === 'string'
      ? (row as any).primaryEmail
      : typeof (row as any).primary_email === 'string'
        ? (row as any).primary_email
        : undefined
  const phoneNumber =
    typeof (row as any).phoneNumber === 'string'
      ? (row as any).phoneNumber
      : typeof (row as any).phone_number === 'string'
        ? (row as any).phone_number
        : undefined
  const createdAt =
    typeof (row as any).createdAt === 'string'
      ? (row as any).createdAt
      : typeof (row as any).created_at === 'string'
        ? (row as any).created_at
        : undefined
  const updatedAt =
    typeof (row as any).updatedAt === 'string'
      ? (row as any).updatedAt
      : typeof (row as any).updated_at === 'string'
        ? (row as any).updated_at
        : undefined
  const deletedAt =
    typeof (row as any).deletedAt === 'string'
      ? (row as any).deletedAt
      : typeof (row as any).deleted_at === 'string'
        ? (row as any).deleted_at
        : undefined
  const avatarUrl =
    typeof (row as any).avatarUrl === 'string'
      ? (row as any).avatarUrl
      : typeof (row as any).avatar_url === 'string'
        ? (row as any).avatar_url
        : undefined
  const roles = isUserRoles((row as any).roles) ? (row as any).roles : undefined
  const status = isUserStatus((row as any).status) ? (row as any).status : undefined

  if (id && displayName && primaryEmail && phoneNumber && createdAt && updatedAt) {
    return {
      id,
      displayName,
      primaryEmail,
      phoneNumber,
      avatarUrl,
      roles,
      status,
      createdAt,
      updatedAt,
      deletedAt,
    }
  }

  throw new Error('User row is missing required fields')
}
