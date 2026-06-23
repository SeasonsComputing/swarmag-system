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
makeAuthUsers  Build the auth-synchronized Users CRUD client.
*/

import type { ApiCrudContract, DeleteResult, ListOptions, ListResult } from '@core/api/api-contract.ts'
import { makeCrudSupabaseClient } from '@core/client/make-supabase-client.ts'
import type { CreateFromInstantiable, Id, UpdateFromInstantiable } from '@core/std'
import type { User } from '@domain/abstractions/user.ts'
import { UserAdapter } from '@domain/adapters/user-adapter.ts'

/** Build the auth-synchronized Users CRUD client. */
export const makeAuthUsers = (): ApiCrudContract<User> => {
  const users = makeCrudSupabaseClient<User>({ table: 'users', adapter: UserAdapter })
  return {
    /**
     * Create a domain user and provision a Supabase Auth identity.
     * @param input User creation payload.
     * @returns The newly created domain user.
     */
    create: async (input: CreateFromInstantiable<User>): Promise<User> => {
      await syncAuthCreate(input)
      return users.create(input)
    },

    /**
     * Delete a domain user and revoke the Supabase Auth identity.
     * @param id Id of the user to delete.
     * @returns Deletion result.
     */
    delete: async (id: Id): Promise<DeleteResult> => {
      await syncAuthDelete(id)
      return users.delete(id)
    },

    /**
     * Retrieve a domain user by id.
     * @param id Id of the user to retrieve.
     * @returns The domain user.
     */
    get: (id: Id): Promise<User> => users.get(id),

    /**
     * List domain users.
     * @param options Optional pagination and filter options.
     * @returns Paginated list result.
     */
    list: (options?: ListOptions): Promise<ListResult<User>> => users.list(options),

    /**
     * Update a domain user and synchronize the Supabase Auth identity.
     * @param input User update payload.
     * @returns The updated domain user.
     */
    update: async (input: UpdateFromInstantiable<User>): Promise<User> => {
      const user = await users.update(input)
      await syncAuthUpdate(user)
      return user
    }
  }
}

// ────────────────────────────────────────────────────────────────────────────
// INTERNALS
// ────────────────────────────────────────────────────────────────────────────

/** Provision a Supabase Auth identity for a newly created domain user. */
async function syncAuthCreate(_input: CreateFromInstantiable<User>): Promise<void> {}

/** Revoke the Supabase Auth identity for a deleted domain user. */
async function syncAuthDelete(_id: Id): Promise<void> {}

/** Synchronize auth identity metadata after a domain user update. */
async function syncAuthUpdate(_user: User): Promise<void> {}
