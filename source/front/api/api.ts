/**
 * Composed API namespace for UX applications.
 */

import { AuthSupabaseClient } from '@core/client/auth-supabase-client.ts'
import { AppState } from '@front/ux/stores/app-state.ts'
import { SessionState } from '@front/ux/stores/session-state.ts'
import { makeAuthUsers } from './make-auth-users.ts'

export const api = {
  Auth: AuthSupabaseClient,
  AppState,
  SessionState,
  Users: makeAuthUsers()
}
