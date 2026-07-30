/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Application API namespace                                                    ║
║ Composed access to authentication, state, and domain clients.                ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Composes the shared UX API namespace, binding applications to their data clients
without coupling feature code to a specific storage or backend implementation.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
api  Shared API namespace for UX applications.
├ Auth            Passwordless authentication and session observation.
├ AppState        Persistent state.
├ SessionState    Reactive authenticated-user session state.
├ Assets          Asset CRUD client.
├ Chemicals       Chemical CRUD client.
├ Customers       Customer CRUD client.
├ Jobs            Job CRUD client.
├ Services        Service CRUD client.
├ Users           User CRUD with Supabase Auth synchronization.
└ Workflows       Workflow CRUD client.
*/

import { AuthSupabaseClient } from '@core/client/auth-supabase-client.ts'
import { makeCrudSupabaseClient } from '@core/client/make-supabase-client.ts'
import { type Customer } from '@domain/abstractions/customer.ts'
import { CustomerAdapter } from '@domain/adapters/customer-adapter.ts'
import { AppState } from '@front/ux/stores/app-state.ts'
import { SessionState } from '@front/ux/stores/session-state.ts'
import { makeAuthUsers } from './make-auth-users.ts'

/** Shared UX API namespace for authentication, state, and domain clients. */
export const api = {
  /** Passwordless authentication and session observation. */
  Auth: AuthSupabaseClient,

  /** Persistent state. */
  AppState,
  SessionState,

  /** Domain clients. */
  // Assets: makeCrudSupabaseClient<Asset>({ table: 'assets', adapter: AssetAdapter }),
  // Chemicals: makeCrudSupabaseClient<Chemical>({ table: 'chemicals', adapter: ChemicalAdapter }),
  Customers: makeCrudSupabaseClient<Customer>({ table: 'customers', adapter: CustomerAdapter }),
  // Jobs: makeCrudSupabaseClient<Job>({ table: 'jobs', adapter: JobAdapter }),
  // Services: makeCrudSupabaseClient<Service>({ table: 'services', adapter: ServiceAdapter }),
  Users: makeAuthUsers()
  // Workflows: makeCrudSupabaseClient<Workflow>({ table: 'workflows', adapter: WorkflowAdapter }),
}
