/**
 * Protocol input shapes for User boundary operations.
 */

import type {
  CreateFromInstantiable,
  UpdateFromInstantiable
} from '@core-std'
import type { User } from '@domain/abstractions/user.ts'

/** Input for creating a User. */
export type UserCreate = CreateFromInstantiable<User>

/** Input for updating a User. */
export type UserUpdate = UpdateFromInstantiable<User>
