/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Declared CRUD update scopes                                                  ║
║ Per-domain write-authority declarations for UX forms.                        ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Companion seam to api.ts: the single place every domain's declared update
scopes live. Each named export groups the fields one form is authorized to
write, composed with field adapters so the maker never sees a bare field list.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
CustomerUpdateScopes  Declared Customer update scopes for UX forms.
├ manager  Contact, identity, address, and sites — Customer Manager.
├ address  Contact and address fields — Customer address stage.
└ sites    Job-site list — Job sites stage.
*/

import { makeScopedUpdate } from '@core/stdx'
import { CustomerAdapter } from '@domain/adapters/customer-adapter.ts'

/** Declared Customer update scopes for UX forms. */
const customerFields = [
  CustomerAdapter.primaryContact,
  CustomerAdapter.name,
  CustomerAdapter.status,
  CustomerAdapter.line1,
  CustomerAdapter.line2,
  CustomerAdapter.city,
  CustomerAdapter.state,
  CustomerAdapter.postalCode,
  CustomerAdapter.country
]
export const CustomerUpdateScopes = {
  manager: makeScopedUpdate([...customerFields, CustomerAdapter.sites]),
  address: makeScopedUpdate([...customerFields]),
  sites: makeScopedUpdate([CustomerAdapter.sites])
}

// Future domains add their own named export below, same shape:
// export const AssetUpdateScopes = { ... }
