/**
 * Adapters for converting between Dictionary and User domain abstractions.
 */

import type { Dictionary } from '@core-std'
import { notValid } from '@core-std'
import type { User } from '@domain/abstractions/user.ts'

/** Convert a Dictionary to a User domain object. */
export const toUser = (dict: Dictionary): User => {
  if (!dict['id']) notValid('User dictionary missing required field: id')
  if (!dict['display_name']) notValid('User dictionary missing required field: display_name')
  if (!dict['primary_email']) notValid('User dictionary missing required field: primary_email')
  if (!dict['phone_number']) notValid('User dictionary missing required field: phone_number')

  return {
    id: dict['id'] as string,
    displayName: dict['display_name'] as string,
    primaryEmail: dict['primary_email'] as string,
    phoneNumber: dict['phone_number'] as string,
    avatarUrl: dict['avatar_url'] as string | undefined,
    roles: (dict['roles'] ?? []) as User['roles'],
    status: dict['status'] as User['status'],
    createdAt: dict['created_at'] as string | undefined,
    updatedAt: dict['updated_at'] as string | undefined,
    deletedAt: dict['deleted_at'] as string | undefined
  }
}

/** Convert a User domain object to a Dictionary. */
export const fromUser = (user: User): Dictionary => ({
  id: user.id,
  display_name: user.displayName,
  primary_email: user.primaryEmail,
  phone_number: user.phoneNumber,
  avatar_url: user.avatarUrl,
  roles: user.roles,
  status: user.status,
  created_at: user.createdAt,
  updated_at: user.updatedAt,
  deleted_at: user.deletedAt
})
