/**
 * Composed API namespace for UX applications.
 */

import { AuthSupabaseClient } from '@core/client/auth-supabase-client.ts'
import { makeCrudSupabaseClient } from '@core/client/make-supabase-client.ts'
import type { User } from '@domain/abstractions/user.ts'
import { UserAdapter } from '@domain/adapters/user-adapter.ts'
import { AppState } from '@ux/common/stores/app-state.ts'
import { DashboardState } from '@ux/common/stores/dashboard-state.ts'
import { SessionState } from '@ux/common/stores/session-state.ts'

export const api = {
  Auth: AuthSupabaseClient,

  AppState,
  SessionState,
  DashboardState,

  Users: makeCrudSupabaseClient<User>({ table: 'users', adapter: UserAdapter })
}
