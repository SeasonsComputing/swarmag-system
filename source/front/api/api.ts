/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Application API namespace                                                    ║
║ Composed access to authentication, document stores, state, and clients.      ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Composes the shared UX API namespace, binding applications to their data clients
without coupling feature code to a specific storage or backend implementation.
The document stores are composed in their own modules and included here.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
api                          Shared API namespace for UX applications.
├ Auth                       Passwordless authentication and session observation.
├ DocumentStoreAttachments   Attachment stores and clients, included as members.
│ ├ AttachmentsInbox         Device attachment inbox.
│ ├ AttachmentsServer        Shared Supabase attachment store.
│ ├ AttachmentsUploads       Durable capture, placement, access, and delivery.
│ └ Attachments              Recognition, catalog placement, and references.
├ DocumentStoreFieldBinder   Field Binder stores and clients, included as members.
│ ├ FieldBinderInbox         Independent Binder staging and pending delivery.
│ ├ FieldBinderServer        Remote Binder source.
│ ├ FieldBinderStore         Complete local reader mirror.
│ ├ FieldBinderUploads       Uploads over the Binder pair.
│ ├ FieldBinderSource        Source inventory management.
│ └ FieldBinder              Local reader and explicit complete preparation.
├ AppState                   Persistent state.
├ SessionState               Reactive authenticated-user session state.
├ BackgroundTasks            Reactive reports of background work and failures.
├ AssetTypes                 Asset type catalog CRUD client.
├ Assets                     Asset CRUD client.
├ Chemicals                  Chemical CRUD client.
├ Customers                  Customer CRUD client.
├ Facets                     Curated classification catalog CRUD client.
├ Services                   Service CRUD client.
├ ServiceRequiredAssetTypes  Required asset type membership by Service.
└ Users                      User CRUD with Supabase Auth synchronization.
*/

import { AuthSupabaseClient } from '@core/cli/auth-supabase-client.ts'
import { makeCrudSupabaseClient, makeJunctionSupabaseClient } from '@core/cli/make-supabase-client.ts'
import type { Asset, AssetType } from '@domain/abstractions/asset.ts'
import type { Chemical } from '@domain/abstractions/chemical.ts'
import type { Facet } from '@domain/abstractions/common.ts'
import type { Customer } from '@domain/abstractions/customer.ts'
import type { Service, ServiceRequiredAssetType } from '@domain/abstractions/service.ts'
import { AssetAdapter, AssetTypeAdapter } from '@domain/adapters/asset-adapter.ts'
import { ChemicalAdapter } from '@domain/adapters/chemical-adapter.ts'
import { FacetAdapter } from '@domain/adapters/common-adapter.ts'
import { CustomerAdapter } from '@domain/adapters/customer-adapter.ts'
import { ServiceAdapter, ServiceRequiredAssetTypeAdapter } from '@domain/adapters/service-adapter.ts'
import {
  validateAssetCreate,
  validateAssetTypeCreate,
  validateAssetTypeUpdate,
  validateAssetUpdate
} from '@domain/validators/asset-validator.ts'
import { validateChemicalCreate, validateChemicalUpdate } from '@domain/validators/chemical-validator.ts'
import { validateFacetCreate, validateFacetUpdate } from '@domain/validators/common-validator.ts'
import { validateCustomerCreate, validateCustomerUpdate } from '@domain/validators/customer-validator.ts'
import {
  validateServiceCreate,
  validateServiceRequiredAssetTypeCreate,
  validateServiceUpdate
} from '@domain/validators/service-validator.ts'
import { AppState } from '@ux/shell/runtime/app-state.ts'
import { BackgroundTasks } from '@ux/shell/runtime/background-tasks.ts'
import { SessionState } from '@ux/shell/runtime/session-state.ts'
import { DocumentStoreAttachments } from './docstore-attachments.ts'
import { DocumentStoreFieldBinder } from './docstore-field-binder.ts'
import { makeAuthUsers } from './make-auth-users.ts'

/** Shared UX API namespace for authentication, state, and domain clients. */
export const api = {
  /** Passwordless authentication and session observation. */
  Auth: AuthSupabaseClient,

  /** Document Stores for Attachments and Field Binder. */
  ...DocumentStoreAttachments,
  ...DocumentStoreFieldBinder,

  /** Persistent and ephemeral state. */
  AppState,
  SessionState,
  BackgroundTasks,

  /** Domain clients. */
  AssetTypes: makeCrudSupabaseClient<AssetType>({
    table: 'asset_types',
    adapter: AssetTypeAdapter,
    validator: {
      validateCreate: validateAssetTypeCreate,
      validateUpdate: validateAssetTypeUpdate
    }
  }),
  Assets: makeCrudSupabaseClient<Asset>({
    table: 'assets',
    adapter: AssetAdapter,
    validator: {
      validateCreate: validateAssetCreate,
      validateUpdate: validateAssetUpdate
    }
  }),
  Chemicals: makeCrudSupabaseClient<Chemical>({
    table: 'chemicals',
    adapter: ChemicalAdapter,
    validator: {
      validateCreate: validateChemicalCreate,
      validateUpdate: validateChemicalUpdate
    }
  }),
  Customers: makeCrudSupabaseClient<Customer>({
    table: 'customers',
    adapter: CustomerAdapter,
    validator: {
      validateCreate: validateCustomerCreate,
      validateUpdate: validateCustomerUpdate
    }
  }),
  Facets: makeCrudSupabaseClient<Facet>({
    table: 'facets',
    adapter: FacetAdapter,
    validator: {
      validateCreate: validateFacetCreate,
      validateUpdate: validateFacetUpdate
    }
  }),
  // Jobs: makeCrudSupabaseClient<Job>({ table: 'jobs', adapter: JobAdapter }),
  Services: makeCrudSupabaseClient<Service>({
    table: 'services',
    adapter: ServiceAdapter,
    validator: {
      validateCreate: validateServiceCreate,
      validateUpdate: validateServiceUpdate
    }
  }),
  ServiceRequiredAssetTypes: makeJunctionSupabaseClient<ServiceRequiredAssetType>({
    table: 'service_required_asset_types',
    adapter: ServiceRequiredAssetTypeAdapter,
    validator: { validateCreate: validateServiceRequiredAssetTypeCreate },
    owner: 'serviceId',
    partner: 'assetTypeId'
  }),
  Users: makeAuthUsers()
  // Workflows: makeCrudSupabaseClient<Workflow>({ table: 'workflows', adapter: WorkflowAdapter }),
}
