/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Declared form write scopes                                                   ║
║ Per-domain write-authority declarations for UX forms.                        ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Companion seam to api.ts: declared form fields and create defaults.
Customer and User forms derive drafts and write projections from field metadata.
Customer declarations add scoped adapters; User declarations project Direct writes.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
scopes  Declared form write scopes keyed by API topic.
├ Customers.detail  Contact, identity, address, and sites.
└ Users.detail      Identity, contact preferences, notes, roles, and status.
*/

import { CustomerAdapter } from '@domain/adapters/customer-adapter.ts'
import { UserAdapter } from '@domain/adapters/user-adapter.ts'
import { makeAdaptedFormScope, makeFormScope } from './make-form-scope.ts'

/** Declared form write scopes keyed by API topic. */
export const scopes = {
  Customers: {
    detail: makeAdaptedFormScope({
      fields: [
        CustomerAdapter.primaryContact,
        CustomerAdapter.name,
        CustomerAdapter.status,
        CustomerAdapter.line1,
        CustomerAdapter.line2,
        CustomerAdapter.city,
        CustomerAdapter.state,
        CustomerAdapter.postalCode,
        CustomerAdapter.country,
        CustomerAdapter.sites
      ],
      defaults: { accountManagerId: undefined, notes: [] }
    })
  },
  Users: {
    detail: makeFormScope({
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
