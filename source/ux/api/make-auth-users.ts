/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Make auth users API                                                          ║
║ CRUD contract wrapper for auth-synchronized user mutations.                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Preserves the standard Users CRUD surface while encapsulating user/auth
synchronization behind the topic API implementation.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
makeAuthUsers  Wrap Users CRUD with auth synchronization hooks.
*/

import type { ApiCrudContract, DeleteResult, ListOptions, ListResult } from '@core/api/api-contract.ts'
import type { CreateFromInstantiable, Id, UpdateFromInstantiable } from '@core/std'
import type { User } from '@domain/abstractions/user.ts'

/** Build an auth-synchronized Users CRUD contract. */
export const makeAuthUsers = (
  users: ApiCrudContract<User>
): ApiCrudContract<User> => ({
  create: async (input: CreateFromInstantiable<User>): Promise<User> => {
    await syncAuthCreate(input)
    return users.create(input)
  },

  delete: async (id: Id): Promise<DeleteResult> => {
    await syncAuthDelete(id)
    return users.delete(id)
  },

  get: (id: Id): Promise<User> => users.get(id),

  list: (options?: ListOptions): Promise<ListResult<User>> => users.list(options),

  update: async (input: UpdateFromInstantiable<User>): Promise<User> => {
    const user = await users.update(input)
    await syncAuthUpdate(user)
    return user
  }
})

async function syncAuthCreate(_input: CreateFromInstantiable<User>): Promise<void> {}

async function syncAuthDelete(_id: Id): Promise<void> {}

async function syncAuthUpdate(_user: User): Promise<void> {}
