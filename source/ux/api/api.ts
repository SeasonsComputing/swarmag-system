/**
 * Composed API namespace for UX applications.
 */

import { AuthSupabaseClient } from '@core/client/auth-supabase-client.ts'
import { makeCrudSupabaseClient } from '@core/client/make-supabase-client.ts'
import type { User } from '@domain/abstractions/user.ts'
import { UserAdapter } from '@domain/adapters/user-adapter.ts'

export const api = {
  Auth: AuthSupabaseClient,
  Users: makeCrudSupabaseClient<User>({ table: 'users', adapter: UserAdapter })
}
