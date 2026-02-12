/**
 * Mappers for converting between Supabase user rows and domain Users.
 */

import type { User } from '@domain/abstractions/user.ts'
import { isUserRoles, isUserStatus } from '@domain/validators/user-validators.ts'
import type { Dictionary } from '@utils'

/** Map a domain User into a Dictionary shape. */
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

/**
 * Convert a Dictionary into a User domain model.
 * Payload is truth - if present, use it directly.
 * Falls back to column mapping for legacy records.
 */
export const rowToUser = (row: unknown): User => {
  if (!row || typeof row !== 'object') {
    throw new Error('User row is missing required fields')
  }

  const record = row as Dictionary

  // Payload as truth - direct cast if present
  if (record.payload && typeof record.payload === 'object') {
    const payload = record.payload as Dictionary
    if (
      typeof payload.id === 'string'
      && typeof payload.displayName === 'string'
      && typeof payload.primaryEmail === 'string'
      && typeof payload.phoneNumber === 'string'
    ) {
      return payload as unknown as User
    }
  }

  // Legacy fallback - map from columns
  const id = record.id as string
  const displayName = (record.display_name ?? record.displayName) as string
  const primaryEmail = (record.primary_email ?? record.primaryEmail) as string
  const phoneNumber = (record.phone_number ?? record.phoneNumber) as string

  if (!id || !displayName || !primaryEmail || !phoneNumber) {
    throw new Error('User row is missing required fields')
  }

  return {
    id,
    displayName,
    primaryEmail,
    phoneNumber,
    avatarUrl: (record.avatar_url ?? record.avatarUrl) as string | undefined,
    roles: isUserRoles(record.roles) ? record.roles : undefined,
    status: isUserStatus(record.status) ? record.status : undefined,
    createdAt: (record.created_at ?? record.createdAt) as string | undefined,
    updatedAt: (record.updated_at ?? record.updatedAt) as string | undefined,
    deletedAt: (record.deleted_at ?? record.deletedAt) as string | undefined
  }
}
