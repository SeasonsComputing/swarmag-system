/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ User protocol shapes                                                         ║
║ Create and update payloads for user topic abstractions.                      ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines create and update protocol shapes for the User abstraction.

EXPORTED APIs & TYPEs
───────────────────────────────────────────────────────────────────────────────
UserCreate  Create payload for a User.
UserUpdate  Update payload for a User.
*/

import type { CreateFromInstantiable, UpdateFromInstantiable } from '@core/std'
import type { User } from '@domain/abstractions/user.ts'

// ────────────────────────────────────────────────────────────────────────────
// PROTOCOL
// ────────────────────────────────────────────────────────────────────────────

export type UserCreate = CreateFromInstantiable<User>
export type UserUpdate = UpdateFromInstantiable<User>
