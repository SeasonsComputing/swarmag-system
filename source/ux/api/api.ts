/**
 * Composed API namespace for UX applications.
 */

import { makeCrudSupabaseClient } from '@core/api/make-supabase-client.ts'
import type { Id } from '@core/std'
import type { User } from '@domain/abstractions/user.ts'
import { fromUser, toUser } from '@domain/adapters/user-adapter.ts'
import type { UserCreate, UserUpdate } from '@domain/protocols/user-protocol.ts'
import { authnClient } from '@ux/common/lib/authn-supabase-client.ts'

export const api = {
  Auth: authnClient,

  Users: makeCrudSupabaseClient<User, UserCreate, UserUpdate>({
    table: 'users',
    fromStorage: toUser,
    toStorage: fromUser
  }),

  /** Fetch and return the domain User for the authenticated session. */
  hydrateUser(userId: Id): Promise<User> {
    return api.Users.get(userId)
  }
  // TODO: compose remaining domain clients
  // (Assets, Chemicals, Customers, Services, Workflows, Jobs)
}
