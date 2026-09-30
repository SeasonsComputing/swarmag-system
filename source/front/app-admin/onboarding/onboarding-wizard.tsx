/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Customer onboarding wizard                                                   ║
║ Composes shared Customer steps into the intake workflow.                     ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Composes shared Customer steps into the existing create-only intake workflow.
The workbench persists once and returns to the dashboard.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
OnboardingWizardProps  Props for the intake workflow.
OnboardingWizard       Customer intake composition root.
*/

import { api } from '@front/api/api.ts'
import { createCustomerState, customerDraft } from '@front/app-admin/customers/customer-state.ts'
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
  const contract: WizardContract = {
    formTitle: 'Customer Onboarding',
    steps: customerSteps(state),
    commit: async () => {
      await api.Customers.create({ ...customerDraft(state), accountManagerId: undefined, notes: [] })
    }
  }
  return (
    <div data-app='onboarding-page'>
      <Wizard contract={contract} onFinish={props.onCancel} onCancel={props.onCancel} />
    </div>
  )
}
