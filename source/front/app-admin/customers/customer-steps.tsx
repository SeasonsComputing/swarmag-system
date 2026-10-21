/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Customer steps                                                               ║
║ Shared Customer step composition.                                            ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Composes Customer steps for either host. Hosts own draft lifetime and writes.
Hosts check the aggregate draft; nested editors register their local drafts.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
customerSteps  Compose the shared Customer step fragment.
*/

import { isCustomerSite } from '@domain/validators/customer-validator.ts'
import type { PanelSequence } from '@ux/shell/panel/panel-sequence-contract.ts'
import type { CustomerState } from './customer-state.ts'
import { CustomerStepBilling } from './customer-step-billing.tsx'
import { CustomerStepContact } from './customer-step-contact.tsx'
import { CustomerStepDetail } from './customer-step-detail.tsx'
import { CustomerStepSites } from './customer-step-sites.tsx'

/** Compose shared Customer steps without owning the aggregate discard check. */
export const customerSteps = (state: CustomerState): PanelSequence => [
  {
    name: 'detail',
    title: 'Customer details',
    render: context => <CustomerStepDetail state={state} context={context} />
  },
  {
    name: 'contact',
    title: 'Primary contact',
    render: context => <CustomerStepContact state={state} context={context} />
  },
  {
    name: 'billing',
    title: 'Billing address',
    render: context => <CustomerStepBilling state={state} context={context} />
  },
  {
    name: 'sites',
    title: 'Job sites',
    validate: () => state.sites().every(isCustomerSite),
    render: context => <CustomerStepSites state={state} context={context} />
  }
]
