/**
 * Composed API namespace for UX applications.
 */

import { ApiError } from '@core/api/api-contract.ts'
import { AuthSupabaseClient } from '@core/client/auth-supabase-client.ts'
import {
  makeBusRuleSupabaseRpcClient,
  makeCrudSupabaseClient
} from '@core/client/make-supabase-client.ts'
import type { Id } from '@core/std'
import { type User } from '@domain/abstractions/user.ts'
import { UserAdapter } from '@domain/adapters/user-adapter.ts'
import type { UserCreate, UserUpdate } from '@domain/protocols/user-protocol.ts'
import { AppState } from '@ux/common/stores/app-state.ts'
import { DashboardState } from '@ux/common/stores/dashboard-state.ts'
import { SessionState } from '@ux/common/stores/session-state.ts'

export const api = {
  // ──────────────────────────────────────────────────────────────────────────
  // AUTHENTICATION
  // ──────────────────────────────────────────────────────────────────────────

  Auth: AuthSupabaseClient,

  // ──────────────────────────────────────────────────────────────────────────
  // STATE MANAGEMENT
  // ──────────────────────────────────────────────────────────────────────────

  AppState,
  SessionState,
  DashboardState,

  // ──────────────────────────────────────────────────────────────────────────
  // USER MANAGEMENT
  // ──────────────────────────────────────────────────────────────────────────

  Users: makeCrudSupabaseClient<User>({ table: 'users', adapter: UserAdapter }),
  userHasAccess: makeBusRuleSupabaseRpcClient<{ email: string }, boolean>({ fn: 'user_has_access' }),
  userCreateSynchAuth: {
    run: (_input: UserCreate): Promise<User> =>
      Promise.reject(new ApiError('Auth-synchronized user creation is not implemented yet.', 501))
  },
  userUpdateSynchAuth: {
    run: (_input: UserUpdate): Promise<User> =>
      Promise.reject(new ApiError('Auth-synchronized user update is not implemented yet.', 501))
  },
  userRevokeAuth: {
    run: (_input: { id: Id }): Promise<void> =>
      Promise.reject(new ApiError('Auth revocation is not implemented yet.', 501))
  }
}
