/*
╔═════════════════════════════════════════════════════════════════════════════╗
║ User domain adapters                                                        ║
║ Dictionary serialization for user topic abstractions                        ║
╚═════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Serializes user topic abstractions between Dictionary and domain shapes.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
toUser                              Deserialize User from Dictionary.
fromUser                            Serialize User to Dictionary.
*/

import type { Dictionary, Id, When } from '@core/std'
import type { User } from '@domain/abstractions/user.ts'

/** Deserialize User from Dictionary. */
export const toUser = (dict: Dictionary): User => ({
  id: dict.id as Id,
  createdAt: dict.created_at as When,
  updatedAt: dict.updated_at as When,
  deletedAt: dict.deleted_at as When | undefined,
  roles: dict.roles as User['roles'],
  displayName: dict.display_name as string,
  primaryEmail: dict.primary_email as string,
  phoneNumber: dict.phone_number as string,
  avatarUrl: dict.avatar_url as string | undefined,
  status: dict.status as User['status']
})

/** Serialize User to Dictionary. */
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
