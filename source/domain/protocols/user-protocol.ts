/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ User protocol types                                                          ║
║ Boundary payload contracts for user topic abstractions.                      ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines create and update protocol payload shapes for user abstractions.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
UserCreate  Create payload for User.
UserUpdate  Update payload for User.
*/

import type { CreateFromInstantiable, UpdateFromInstantiable } from '@core/std'
import type { User } from '@domain/abstractions/user.ts'

/* User protocol */
export type UserCreate = CreateFromInstantiable<User>
export type UserUpdate = UpdateFromInstantiable<User>
