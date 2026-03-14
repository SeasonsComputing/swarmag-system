/*
╔═════════════════════════════════════════════════════════════════════════════╗
║ User protocol contracts                                                     ║
║ Create and update payload contracts for user abstractions                   ║
╚═════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines boundary payload contracts for user persisted abstractions.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
UserCreate                         Create payload contract for User.
UserUpdate                         Update payload contract for User.
*/

import type { CreateFromInstantiable, UpdateFromInstantiable } from '@core/std'
import type { User } from '@domain/abstractions/user.ts'

/** Create payload contract for User. */
export type UserCreate = CreateFromInstantiable<User>

/** Update payload contract for User. */
export type UserUpdate = UpdateFromInstantiable<User>
