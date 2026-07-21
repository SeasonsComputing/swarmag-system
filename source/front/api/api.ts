/**
 * Composed API namespace for UX applications.
 */

import { AuthSupabaseClient } from '@core/client/auth-supabase-client.ts'
import { makeCrudSupabaseClient } from '@core/client/make-supabase-client.ts'
import { type Customer } from '@domain/abstractions/customer.ts'
import { CustomerAdapter } from '@domain/adapters/customer-adapter.ts'
import { AppState } from '@front/ux/stores/app-state.ts'
import { SessionState } from '@front/ux/stores/session-state.ts'
import { makeAuthUsers } from './make-auth-users.ts'

export const api = {
  Auth: AuthSupabaseClient,
  AppState,
  SessionState,
  Users: makeAuthUsers(),
  Customers: makeCrudSupabaseClient<Customer>({ table: 'customers', adapter: CustomerAdapter })
}
