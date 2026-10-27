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
├ AssetTypes      Asset type catalog CRUD client.
├ Assets          Asset CRUD client.
├ Chemicals       Chemical CRUD client.
├ Facets          Curated classification catalog CRUD client.
├ Customers       Customer CRUD client.
├ Jobs            Job CRUD client.
├ Services        Service CRUD client.
├ Users           User CRUD with Supabase Auth synchronization.
└ Workflows       Workflow CRUD client.
*/

import { AuthSupabaseClient } from '@core/cli/auth-supabase-client.ts'
import { makeCrudSupabaseClient } from '@core/cli/make-supabase-client.ts'
import type { Asset, AssetType } from '@domain/abstractions/asset.ts'
import type { Chemical } from '@domain/abstractions/chemical.ts'
import type { Facet } from '@domain/abstractions/common.ts'
import type { Customer } from '@domain/abstractions/customer.ts'
import { AssetAdapter, AssetTypeAdapter } from '@domain/adapters/asset-adapter.ts'
import { ChemicalAdapter } from '@domain/adapters/chemical-adapter.ts'
import { FacetAdapter } from '@domain/adapters/common-adapter.ts'
import { CustomerAdapter } from '@domain/adapters/customer-adapter.ts'
import {
  validateAssetCreate,
  validateAssetTypeCreate,
  validateAssetTypeUpdate,
  validateAssetUpdate
} from '@domain/validators/asset-validator.ts'
import { validateChemicalCreate, validateChemicalUpdate } from '@domain/validators/chemical-validator.ts'
import { validateFacetCreate, validateFacetUpdate } from '@domain/validators/common-validator.ts'
import { validateCustomerCreate, validateCustomerUpdate } from '@domain/validators/customer-validator.ts'
import { AppState } from '@ux/shell/runtime/app-state.ts'
import { SessionState } from '@ux/shell/runtime/session-state.ts'
import { makeAuthUsers } from './make-auth-users.ts'

/** Shared UX API namespace for authentication, state, and domain clients. */
export const api = {
  /** Passwordless authentication and session observation. */
  Auth: AuthSupabaseClient,

  /** Persistent and ephemoral state. */
  AppState,
  SessionState,

  /** Domain clients. */
  Facets: makeCrudSupabaseClient<Facet>({
    table: 'facets',
    adapter: FacetAdapter,
    validator: {
      validateCreate: validateFacetCreate,
      validateUpdate: validateFacetUpdate
    }
  }),
  AssetTypes: makeCrudSupabaseClient<AssetType>({
    table: 'asset_types',
    adapter: AssetTypeAdapter,
    validator: { validateCreate: validateAssetTypeCreate, validateUpdate: validateAssetTypeUpdate }
  }),
  Assets: makeCrudSupabaseClient<Asset>({
    table: 'assets',
    adapter: AssetAdapter,
    validator: { validateCreate: validateAssetCreate, validateUpdate: validateAssetUpdate }
  }),
  Chemicals: makeCrudSupabaseClient<Chemical>({
    table: 'chemicals',
    adapter: ChemicalAdapter,
    validator: { validateCreate: validateChemicalCreate, validateUpdate: validateChemicalUpdate }
  }),
  Customers: makeCrudSupabaseClient<Customer>({
    table: 'customers',
    adapter: CustomerAdapter,
    validator: {
      validateCreate: validateCustomerCreate,
      validateUpdate: validateCustomerUpdate
    }
  }),
  // Jobs: makeCrudSupabaseClient<Job>({ table: 'jobs', adapter: JobAdapter }),
  // Services: makeCrudSupabaseClient<Service>({ table: 'services', adapter: ServiceAdapter }),
  Users: makeAuthUsers()
  // Workflows: makeCrudSupabaseClient<Workflow>({ table: 'workflows', adapter: WorkflowAdapter }),
}
