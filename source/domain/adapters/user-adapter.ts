/**
 * User domain adapters.
 */

import type { Dictionary, When } from '@core-std'
import { notValid } from '@core-std'
import type { User, UserRole, UserStatus } from '@domain/abstractions/user.ts'

/** Create a User from its dictionary representation. */
export const toUser = (dict: Dictionary): User => {
  if (!dict.id) return notValid('User dictionary missing required field: id')
  if (!dict.display_name) {
    return notValid('User dictionary missing required field: display_name')
  }
  if (!dict.primary_email) {
    return notValid('User dictionary missing required field: primary_email')
  }
  if (!dict.phone_number) {
    return notValid('User dictionary missing required field: phone_number')
  }
  if (!dict.roles) return notValid('User dictionary missing required field: roles')
  if (!dict.created_at) {
    return notValid('User dictionary missing required field: created_at')
  }
  if (!dict.updated_at) {
    return notValid('User dictionary missing required field: updated_at')
  }

  return {
    id: dict.id as string,
    displayName: dict.display_name as string,
    primaryEmail: dict.primary_email as string,
    phoneNumber: dict.phone_number as string,
    avatarUrl: dict.avatar_url as string | undefined,
    status: dict.status as UserStatus | undefined,
    roles: (dict.roles as UserRole[]).map(role => role),
    createdAt: dict.created_at as When,
    updatedAt: dict.updated_at as When,
    deletedAt: dict.deleted_at as When | undefined
  }
}

/** Create a dictionary representation from a User. */
export const fromUser = (user: User): Dictionary => ({
  id: user.id,
  display_name: user.displayName,
  primary_email: user.primaryEmail,
  phone_number: user.phoneNumber,
  avatar_url: user.avatarUrl,
  status: user.status,
  roles: user.roles.map(role => role),
  created_at: user.createdAt,
  updated_at: user.updatedAt,
  deleted_at: user.deletedAt
})
