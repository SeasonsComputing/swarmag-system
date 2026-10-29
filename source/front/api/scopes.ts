/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Declared form write scopes                                                   ║
║ Per-domain write-authority declarations for UX forms.                        ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Companion seam to api.ts: declared form fields and create defaults.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
scopes              Declared form write scopes keyed by API topic.
├ AssetTypes.detail Label and catalog availability.
├ Assets.detail     Identity, type, status, and notes.
├ Chemicals.detail  Identity, usage, handling, external SDS reference, and notes.
├ Customers.detail  Contact, identity, account manager, address, sites, and notes.
├ Services.detail   Identity, category, description, and notes.
└ Users.detail      Identity, contact preferences, notes, roles, and status.
*/

import { makeAdaptedScope, makeScope } from '@core/stdx'
import { AssetAdapter, AssetTypeAdapter } from '@domain/adapters/asset-adapter.ts'
import { ChemicalAdapter } from '@domain/adapters/chemical-adapter.ts'
import { CustomerAdapter } from '@domain/adapters/customer-adapter.ts'
import { ServiceAdapter } from '@domain/adapters/service-adapter.ts'
import { UserAdapter } from '@domain/adapters/user-adapter.ts'

/** Declared form write scopes keyed by API topic. */
export const scopes = {
  AssetTypes: {
    detail: makeAdaptedScope({
      fields: [AssetTypeAdapter.label, AssetTypeAdapter.active],
      defaults: {}
    })
  },
  Assets: {
    detail: makeAdaptedScope({
      fields: [
        AssetAdapter.type,
        AssetAdapter.label,
        AssetAdapter.description,
        AssetAdapter.serialNumber,
        AssetAdapter.status,
        AssetAdapter.notes
      ],
      defaults: {}
    })
  },
  Chemicals: {
    detail: makeAdaptedScope({
      fields: [
        ChemicalAdapter.name,
        ChemicalAdapter.epaNumber,
        ChemicalAdapter.usage,
        ChemicalAdapter.signalWord,
        ChemicalAdapter.restrictedUse,
        ChemicalAdapter.reEntryIntervalHours,
        ChemicalAdapter.storageLocation,
        ChemicalAdapter.sdsUrl,
        ChemicalAdapter.notes
      ],
      defaults: { labels: [] }
    })
  },
  Customers: {
    detail: makeAdaptedScope({
      fields: [
        CustomerAdapter.primaryContact,
        CustomerAdapter.name,
        CustomerAdapter.status,
        CustomerAdapter.accountManagerId,
        CustomerAdapter.line1,
        CustomerAdapter.line2,
        CustomerAdapter.city,
        CustomerAdapter.state,
        CustomerAdapter.postalCode,
        CustomerAdapter.country,
        CustomerAdapter.sites,
        CustomerAdapter.notes
      ],
      defaults: {}
    })
  },
  Services: {
    detail: makeAdaptedScope({
      fields: [
        ServiceAdapter.name,
        ServiceAdapter.sku,
        ServiceAdapter.description,
        ServiceAdapter.category,
        ServiceAdapter.notes
      ],
      defaults: { facets: [] }
    })
  },
  Users: {
    detail: makeScope({
      fields: [
        UserAdapter.displayName,
        UserAdapter.primaryEmail,
        UserAdapter.phoneNumber,
        UserAdapter.preferredChannel,
        UserAdapter.notes,
        UserAdapter.roles,
        UserAdapter.status
      ],
      defaults: {}
    })
  }
}
