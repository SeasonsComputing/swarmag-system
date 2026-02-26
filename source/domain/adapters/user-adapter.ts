/**
 * User adapters to and from Dictionary representation.
 */

import type { Dictionary, When } from '@core-std'
import { notValid } from '@core-std'
import type { User, UserRole } from '@domain/abstractions/user.ts'

/** Create a User from serialized dictionary format */
export const toUser = (dict: Dictionary): User => {
  if (!dict.id) return notValid('User dictionary missing required field: id')
  if (!dict.display_name) return notValid('User dictionary missing required field: display_name')
  if (!dict.primary_email) return notValid('User dictionary missing required field: primary_email')
  if (!dict.phone_number) return notValid('User dictionary missing required field: phone_number')
  return {
    id: dict.id as string,
    displayName: dict.display_name as string,
    primaryEmail: dict.primary_email as string,
    phoneNumber: dict.phone_number as string,
    avatarUrl: dict.avatar_url as string | undefined,
    roles: (dict.roles as string[]).map((v) => v as UserRole),
    status: dict.status as User['status'],
    createdAt: dict.created_at as When,
    updatedAt: dict.updated_at as When,
    deletedAt: dict.deleted_at as When | undefined
  }
}

/** Serialize a User to dictionary format */
export const fromUser = (user: User): Dictionary => ({
  id: user.id,
  display_name: user.displayName,
  primary_email: user.primaryEmail,
  phone_number: user.phoneNumber,
  avatar_url: user.avatarUrl,
  roles: user.roles.map((v) => v),
  status: user.status,
  created_at: user.createdAt,
  updated_at: user.updatedAt,
  deleted_at: user.deletedAt
})
