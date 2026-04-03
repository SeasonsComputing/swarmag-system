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
UserAdapter  Deserialize/Serialize User.
*/

import { makeAdapter } from '@core/stdx'
import type { User } from '@domain/abstractions/user.ts'

/** Deserialize/Serialize User. */
export const UserAdapter = makeAdapter<User>({
  id: ['id'],
  createdAt: ['created_at'],
  updatedAt: ['updated_at'],
  deletedAt: ['deleted_at'],
  roles: ['roles'],
  displayName: ['display_name'],
  primaryEmail: ['primary_email'],
  phoneNumber: ['phone_number'],
  avatarUrl: ['avatar_url'],
  status: ['status']
})
