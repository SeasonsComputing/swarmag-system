/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ User domain adapter                                                          ║
║ Serialization for user topic abstractions.                                   ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Serializes between Dictionary and User domain types.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
toUser    Deserialize User from a storage dictionary.
fromUser  Serialize User to a storage dictionary.
*/

import type { CompositionPositive, Dictionary, Id, When } from '@core/std'
import type { User, UserRole, UserStatus } from '@domain/abstractions/user.ts'

/** Deserialize User from a storage dictionary. */
export const toUser = (dict: Dictionary): User => ({
  id: dict.id as Id,
  createdAt: dict.created_at as When,
  updatedAt: dict.updated_at as When,
  deletedAt: dict.deleted_at as When | undefined,
  roles: dict.roles as CompositionPositive<UserRole>,
  displayName: dict.display_name as string,
  primaryEmail: dict.primary_email as string,
  phoneNumber: dict.phone_number as string,
  avatarUrl: dict.avatar_url as string | undefined,
  status: dict.status as UserStatus
})

/** Serialize User to a storage dictionary. */
export const fromUser = (user: User): Dictionary => ({
  id: user.id,
  created_at: user.createdAt,
  updated_at: user.updatedAt,
  deleted_at: user.deletedAt,
  roles: user.roles,
  display_name: user.displayName,
  primary_email: user.primaryEmail,
  phone_number: user.phoneNumber,
  avatar_url: user.avatarUrl,
  status: user.status
})
