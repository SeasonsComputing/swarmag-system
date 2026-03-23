/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ User domain adapters                                                         ║
║ Dictionary serialization for user topic abstractions.                        ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Maps storage dictionaries to user abstractions and back.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
toUser(dict)  Deserialize User from dictionary.
fromUser(user)  Serialize User to dictionary.
*/

import type { Dictionary } from '@core/std'
import type { User } from '@domain/abstractions/user.ts'

// ────────────────────────────────────────────────────────────────────────────
// PUBLIC
// ────────────────────────────────────────────────────────────────────────────

export const toUser = (dict: Dictionary): User => ({
  id: dict.id as string,
  createdAt: dict.created_at as string,
  updatedAt: dict.updated_at as string,
  deletedAt: dict.deleted_at as string | undefined,
  roles: (dict.roles as User['roles']) ?? [],
  displayName: dict.display_name as string,
  primaryEmail: dict.primary_email as string,
  phoneNumber: dict.phone_number as string,
  avatarUrl: dict.avatar_url as string | undefined,
  status: dict.status as User['status']
})

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
