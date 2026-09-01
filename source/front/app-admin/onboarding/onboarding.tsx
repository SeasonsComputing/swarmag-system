/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Customer onboarding wizard                                                   ║
║ Composes the guided multi-stage customer creation flow.                      ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import { toTrimmed } from '@core/std'
import type { CustomerCreate } from '@domain/protocols/customer-protocol.ts'
import { CustomerUpdateScopes } from '@front/api/api-update-scopes.ts'
import { api } from '@front/api/api.ts'
import { OnboardingStageContact } from '@front/app-admin/onboarding/onboarding-stage-contact.tsx'
import { OnboardingStageCustomer } from '@front/app-admin/onboarding/onboarding-stage-customer.tsx'
import { OnboardingStageSites } from '@front/app-admin/onboarding/onboarding-stage-sites.tsx'
import { createOnboardingState } from '@front/app-admin/onboarding/onboarding-state.ts'
import type { WizardContract, WizardStage } from '@front/ux/shell/wizard-contract.ts'
import { Wizard } from '@front/ux/shell/wizard.tsx'
import type { UiComponent } from '@front/ux/ui'
import { createSignal } from '@solid-js'

import './onboarding.css'

/** Props for the onboarding wizard component. */
export type OnboardingProps = {
  onCancel: () => void
}

/** The onboarding wizard composition root. */
export const Onboarding = (props: OnboardingProps): UiComponent => {
  const state = createOnboardingState()
  const [contactFormCheck, setContactFormCheck] = createSignal<() => boolean>(() => false)
  const [customerFormCheck, setCustomerFormCheck] = createSignal<() => boolean>(() => false)

  /** Stage collecting the customer's primary contact details. */
  const stageContact: WizardStage = {
    name: 'contact',
    title: 'Contact details',
    render: () => (
      <OnboardingStageContact
        state={state}
        onFormCheck={check => setContactFormCheck(() => check)}
      />
    ),
    validate: () => contactFormCheck()(),
    canAdvance: () => {
      const email = state.email().trim()
      return state.displayName().trim().length > 0 && state.phoneNumber().trim().length > 0
        && (!email || email.includes('@'))
    }
  }

  /** Stage collecting the customer account address and creating the customer record. */
  const stageCustomer: WizardStage = {
    name: 'customer',
    title: 'Customer address',
    render: () => (
      <OnboardingStageCustomer
        state={state}
        onFormCheck={check => setCustomerFormCheck(() => check)}
      />
    ),
    validate: () => customerFormCheck()(),
    canAdvance: () =>
      [state.name, state.line1, state.city, state.state, state.postalCode, state.country]
        .every(value => value().trim().length > 0),
    commit: async () => {
      const create: CustomerCreate = {
        accountManagerId: undefined,
        primaryContact: [{
          displayName: toTrimmed(state.displayName()),
          phoneNumber: toTrimmed(state.phoneNumber()),
          preferredChannel: state.preferredChannel(),
          ...(state.email().trim() ? { email: toTrimmed(state.email()) } : {})
        }],
        sites: state.customer()?.sites ?? [],
        notes: [],
        name: toTrimmed(state.name()),
        status: state.status(),
        line1: toTrimmed(state.line1()),
        ...(state.line2().trim() ? { line2: toTrimmed(state.line2()) } : {}),
        city: toTrimmed(state.city()),
        state: toTrimmed(state.state()),
        postalCode: toTrimmed(state.postalCode()),
        country: toTrimmed(state.country())
      }
      const customer = state.customer()
      if (customer) {
        state.setCustomer(
          await api.Customers.update(CustomerUpdateScopes.address, {
            id: customer.id,
            primaryContact: create.primaryContact,
            name: create.name,
            status: create.status,
            line1: create.line1,
            line2: create.line2,
            city: create.city,
            state: create.state,
            postalCode: create.postalCode,
            country: create.country
          })
        )
        return
      }
      state.setCustomer(await api.Customers.create(create))
    }
  }

  /** Stage collecting optional job-site details after the customer record exists. */
  const stageSites: WizardStage = {
    name: 'sites',
    title: 'Job sites',
    render: context => (
      <OnboardingStageSites
        state={state}
        onReturnControl={context.registerDrillReturn}
      />
    ),
    canAdvance: () => true,
    commit: async () => {
      const customer = state.customer()
      if (state.sites().length > 0 && customer) {
        await api.Customers.update(CustomerUpdateScopes.sites, {
          id: customer.id,
          sites: state.sites()
        })
      }
    }
  }

  /** Wizard contract defining the ordered onboarding stages. */
  const contract: WizardContract = {
    formTitle: 'Customer Onboarding',
    stages: [stageContact, stageCustomer, stageSites]
  }

  return (
    <div data-app='onboarding-page'>
      <Wizard contract={contract} onFinish={props.onCancel} onCancel={props.onCancel} />
    </div>
  )
}
