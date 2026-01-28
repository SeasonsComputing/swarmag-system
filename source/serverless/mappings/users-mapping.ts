/**
 * Mappers for converting between Supabase user rows and domain Users.
 */

import type { User } from '@domain/common.ts'
import type { Dictionary } from '@utils'

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
  Array.isArray(value) && value.every(role => typeof role === 'string')

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
  payload: user
})

const parseUserFields = (src: Dictionary): User | undefined => {
  const id = typeof src.id === 'string' ? src.id : undefined
  const displayName = typeof src.displayName === 'string' ? src.displayName : undefined
  const primaryEmail = typeof src.primaryEmail === 'string' ? src.primaryEmail : undefined
  const phoneNumber = typeof src.phoneNumber === 'string' ? src.phoneNumber : undefined
  const createdAt = typeof src.createdAt === 'string' ? src.createdAt : undefined
  const updatedAt = typeof src.updatedAt === 'string' ? src.updatedAt : undefined
  const deletedAt = typeof src.deletedAt === 'string' ? src.deletedAt : undefined
  const avatarUrl = typeof src.avatarUrl === 'string' ? src.avatarUrl : undefined
  const roles = isUserRoles(src.roles) ? src.roles : undefined
  const status = isUserStatus(src.status) ? src.status : undefined

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
      deletedAt
    }
  }

  return undefined
}

const normalizeUserRecord = (record: Dictionary): Dictionary => ({
  id: record.id,
  displayName: typeof record.displayName === 'string' ? record.displayName : record.display_name,
  primaryEmail: typeof record.primaryEmail === 'string' ? record.primaryEmail : record.primary_email,
  phoneNumber: typeof record.phoneNumber === 'string' ? record.phoneNumber : record.phone_number,
  createdAt: typeof record.createdAt === 'string' ? record.createdAt : record.created_at,
  updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : record.updated_at,
  deletedAt: typeof record.deletedAt === 'string' ? record.deletedAt : record.deleted_at,
  avatarUrl: typeof record.avatarUrl === 'string' ? record.avatarUrl : record.avatar_url,
  roles: record.roles,
  status: record.status
})

/** Convert a Supabase row into a User domain model, preferring the payload when present. */
export const rowToUser = (row: unknown): User => {
  if (!row || typeof row !== 'object') {
    throw new Error('User row is missing required fields')
  }

  const record = row as Dictionary
  if (record.payload && typeof record.payload === 'object') {
    const payload = record.payload as Dictionary
    const parsedPayload = parseUserFields(payload)
    if (parsedPayload) return parsedPayload
  }

  const parsedRecord = parseUserFields(normalizeUserRecord(record))
  if (parsedRecord) return parsedRecord

  throw new Error('User row is missing required fields')
}
