/**
 * Composed API namespace for UX applications.
 */

import { makeCrudSupabaseClient } from '@core/api/make-supabase-client.ts'
import type { User } from '@domain/abstractions/user.ts'
import { fromUser, toUser } from '@domain/adapters/user-adapter.ts'
import type { UserCreate, UserUpdate } from '@domain/protocols/user-protocol.ts'
import { AuthSupabaseClient } from '@ux/common/lib/auth-supabase-client.ts'

export const api = {
  Auth: AuthSupabaseClient,

  Users: makeCrudSupabaseClient<User, UserCreate, UserUpdate>({
    table: 'users',
    fromStorage: toUser,
    toStorage: fromUser
  })
}
