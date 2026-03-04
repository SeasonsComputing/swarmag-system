/**
 * User domain protocols.
 */

import type { CreateFromInstantiable, UpdateFromInstantiable } from '@core-std'
import type { User } from '@domain/abstractions/user.ts'

export type UserCreate = CreateFromInstantiable<User>
export type UserUpdate = UpdateFromInstantiable<User>
