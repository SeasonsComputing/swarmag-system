/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Customer onboarding wizard                                                   ║
║ Onboarding of a customer and initial job assessment.                         ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Collects a new Customer draft through shared Customer steps and commits once.
Supplies its aggregate draft to Wizard for enclosing discard protection.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
OnboardingWizardProps  Props for the intake workflow.
└ onCancel             Closes the intake workflow.
OnboardingWizard       Customer intake composition root.
*/

import { api } from '@front/api/api.ts'
import { scopes } from '@front/api/scopes.ts'
import { createCustomerState, customerDraft } from '@front/app-admin/customers/customer-state.ts'
import type { CustomerDraft } from '@front/app-admin/customers/customer-state.ts'
import { customerSteps } from '@front/app-admin/customers/customer-steps.tsx'
import { makeAttachmentSave } from '@front/app/shell/make-attachment-save.ts'
import { onCleanup } from '@solid-js'
import type { WizardContract } from '@ux/shell/workbench/wizard-contract.ts'
import { Wizard } from '@ux/shell/workbench/wizard.tsx'
import type { UiComponent } from '@ux/ui'

import './onboarding-wizard.css'

/** Props for the onboarding wizard. */
export type OnboardingWizardProps = {
  onCancel: () => void
}

/** Customer intake persists once, at Finish. */
export const OnboardingWizard = (props: OnboardingWizardProps): UiComponent => {
  const state = createCustomerState()
  const scope = scopes.Customers.detail
  const save = makeAttachmentSave({
    create: (draft: CustomerDraft) => api.Customers.create(scope.toCreate(draft)),
    update: (record, draft) => api.Customers.update(scope.adapter, scope.toUpdate(record.id, draft)),
    place: async (owner, draft) => ({
      ...draft,
      notes: await api.Attachments.Customers.place(owner, draft.notes),
      sites: await Promise.all(
        draft.sites.map(async site => ({
          ...site,
          notes: await api.Attachments.Customers.place(owner, site.notes)
        }))
      )
    }),
    reconcile: draft => {
      state.setNotes(draft.notes)
      draft.sites.forEach((site, i) => state.setSite(i, site))
    }
  })
  onCleanup(() => {
    void save.discard()
  })
  const contract: WizardContract<CustomerDraft> = {
    formTitle: 'Customer Onboarding',
    steps: customerSteps(state, save.stage),
    draft: () => customerDraft(state),
    commit: async () => {
      await save.create(customerDraft(state))
    }
  }
  return (
    <div data-app='onboarding-page'>
      <Wizard contract={contract} onFinish={props.onCancel} onCancel={props.onCancel} />
    </div>
  )
}
