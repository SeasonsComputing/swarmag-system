/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Customer contact step                                                        ║
║ Collects and validates the customer's primary contact details.               ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Renders primary-contact fields and registers mounted field validation with
the containing sequence. State belongs to the workbench.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
CustomerStepContactProps  Contact panel inputs.
CustomerStepContact       Primary-contact fields and validation.
*/

import { expectEmail, expectNonEmptyString, toEmail } from '@core/std'
import { CONTACT_PREFERRED_CHANNELS } from '@domain/abstractions/common.ts'
import type { ContactPreferredChannel } from '@domain/abstractions/common.ts'
import { onCleanup } from '@solid-js'
import type { PanelStepContext } from '@ux/shell/panel/panel-sequence-contract.ts'
import { useAbstractionFormKeyboard } from '@ux/shell/workbench/use-abstraction-form-keyboard.ts'
import { useAbstractionFormValidation } from '@ux/shell/workbench/use-abstraction-form-validation.ts'
import { UiField, UiFieldset, UiInput, UiLayout, UiSingleSelect, UiText } from '@ux/ui'
import type { UiComponent } from '@ux/ui'
import type { CustomerState } from './customer-state.ts'

/** Props for the contact step. */
export type CustomerStepContactProps = {
  state: CustomerState
  context: PanelStepContext
}

/** Renders the contact-details step. */
export const CustomerStepContact = (props: CustomerStepContactProps): UiComponent => {
  let formRef: HTMLFormElement | undefined
  const { state } = props
  const validation = useAbstractionFormValidation(() => formRef, {
    displayName: () => expectNonEmptyString(state.displayName(), 'Name'),
    phoneNumber: () => expectNonEmptyString(state.phoneNumber(), 'Phone'),
    email: () => state.email().trim() ? expectEmail(toEmail(state.email()), 'Email') : null
  })
  onCleanup(props.context.registerValidation(validation.validateForm))
  useAbstractionFormKeyboard(() => formRef, field => validation.blurField(field))

  return (
    <form ref={formRef} onSubmit={event => event.preventDefault()}>
      <UiLayout data-app='customer-step-contact'>
        <UiFieldset legend='Primary Contact'>
          <UiLayout>
            <UiField for='displayName' label='Name' required>
              <UiInput
                name='displayName'
                value={state.displayName()}
                onInput={event => {
                  state.setDisplayName(event.currentTarget.value)
                  validation.inputField('displayName')
                }}
                onBlur={() => validation.blurField('displayName')}
                error={validation.isInvalid('displayName')}
                required
              />
            </UiField>
            <UiField for='phoneNumber' label='Phone' required>
              <UiInput
                name='phoneNumber'
                type='tel'
                value={state.phoneNumber()}
                onInput={event => {
                  state.setPhoneNumber(event.currentTarget.value)
                  validation.inputField('phoneNumber')
                }}
                onBlur={() => validation.blurField('phoneNumber')}
                error={validation.isInvalid('phoneNumber')}
                required
              />
            </UiField>
            <UiField for='preferredChannel' label='Preferred Channel'>
              <UiSingleSelect
                name='preferredChannel'
                options={CONTACT_PREFERRED_CHANNELS.map(value => ({
                  value,
                  label: UiText.label(value)
                }))}
                value={state.preferredChannel()}
                onChange={value => state.setPreferredChannel(value as ContactPreferredChannel)}
              />
            </UiField>
            <UiField for='email' label='Email'>
              <UiInput
                name='email'
                type='email'
                value={state.email()}
                onInput={event => {
                  state.setEmail(event.currentTarget.value)
                  validation.inputField('email')
                }}
                onBlur={() => validation.blurField('email')}
                error={validation.isInvalid('email')}
              />
            </UiField>
          </UiLayout>
        </UiFieldset>
      </UiLayout>
    </form>
  )
}
