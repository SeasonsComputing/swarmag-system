/**
 * Protocols for the user domain area: User create and update shapes.
 */

import type { CreateFromInstantiable, UpdateFromInstantiable } from '@core-std'
import type { User } from '@domain/abstractions/user.ts'

/** Input for creating a User. */
export type UserCreate = CreateFromInstantiable<User>

/** Input for updating a User. */
export type UserUpdate = UpdateFromInstantiable<User>
