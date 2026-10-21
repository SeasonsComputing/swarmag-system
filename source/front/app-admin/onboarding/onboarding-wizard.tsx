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
  const contract: WizardContract<CustomerDraft> = {
    formTitle: 'Customer Onboarding',
    steps: customerSteps(state),
    draft: () => customerDraft(state),
    commit: async () => {
      await api.Customers.create(scopes.Customers.detail.toCreate(customerDraft(state)))
    }
  }
  return (
    <div data-app='onboarding-page'>
      <Wizard contract={contract} onFinish={props.onCancel} onCancel={props.onCancel} />
    </div>
  )
}
