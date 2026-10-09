/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Customer steps                                                               ║
║ Shared Customer step composition.                                            ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Composes Customer steps for either host. Hosts own draft lifetime and writes.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
customerSteps  Compose the shared Customer step fragment.
*/

import { isCustomerSite } from '@domain/validators/customer-validator.ts'
import type { PanelSequence, PanelStepContext } from '@ux/shell/panel/panel-sequence-contract.ts'
import { customerDraft } from './customer-state.ts'
import type { CustomerState } from './customer-state.ts'
import { CustomerStepBilling } from './customer-step-billing.tsx'
import { CustomerStepContact } from './customer-step-contact.tsx'
import { CustomerStepDetail } from './customer-step-detail.tsx'
import { CustomerStepSites } from './customer-step-sites.tsx'

/** Compose a fragment; retained state checks have the same lifetime as that state. */
export const customerSteps = (state: CustomerState): PanelSequence => {
  const baseline = JSON.stringify(customerDraft(state))
  const changed = () => JSON.stringify(customerDraft(state)) !== baseline
  const retainCheck = (context: PanelStepContext): void => {
    context.registerDirty(changed)
  }
  return [
    {
      name: 'detail',
      title: 'Customer details',
      render: context => {
        retainCheck(context)
        return <CustomerStepDetail state={state} context={context} />
      }
    },
    {
      name: 'contact',
      title: 'Primary contact',
      render: context => {
        retainCheck(context)
        return <CustomerStepContact state={state} context={context} />
      }
    },
    {
      name: 'billing',
      title: 'Billing address',
      render: context => {
        retainCheck(context)
        return <CustomerStepBilling state={state} context={context} />
      }
    },
    {
      name: 'sites',
      title: 'Job sites',
      validate: () => state.sites().every(isCustomerSite),
      render: context => {
        retainCheck(context)
        return <CustomerStepSites state={state} context={context} />
      }
    }
  ]
}
