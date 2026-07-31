/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Customer onboarding contact stage                                            ║
║ Collects and validates the customer's primary contact details.               ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import { expectEmail, expectNonEmptyString, toEmail } from '@core/std'
import { CONTACT_PREFERRED_CHANNELS, type ContactPreferredChannel } from '@domain/abstractions/common.ts'
import { useAbstractionFormKeyboard } from '@front/ux/shell/use-abstraction-form-keyboard.ts'
import { useAbstractionFormValidation } from '@front/ux/shell/use-abstraction-form-validation.ts'
import { type UiComponent, UiField, UiFieldset, UiInput, UiLayout, UiSingleSelect } from '@front/ux/ui'
import { labelFromKebabCase } from '@front/ux/ui/components/ui-helpers.ts'
import { onCleanup } from '@solid-js'
import type { OnboardingState } from './onboarding-state.ts'

/** Props for the contact stage. */
export type OnboardingStageContactProps = {
  state: OnboardingState
  onFormCheck: (check: () => boolean) => void
}

/** Renders the contact-details stage. */
export const OnboardingStageContact = (props: OnboardingStageContactProps): UiComponent => {
  let formRef: HTMLFormElement | undefined
  const { state } = props
  const validation = useAbstractionFormValidation(() => formRef, {
    displayName: () => expectNonEmptyString(state.displayName(), 'Name'),
    phoneNumber: () => expectNonEmptyString(state.phoneNumber(), 'Phone'),
    email: () => state.email().trim() ? expectEmail(toEmail(state.email()), 'Email') : null
  })
  props.onFormCheck(validation.validateForm)
  onCleanup(() => props.onFormCheck(() => false))
  useAbstractionFormKeyboard(() => formRef, field => validation.blurField(field))

  return (
    <form ref={formRef} onSubmit={event => event.preventDefault()}>
      <UiLayout data-feat='onboarding-stage-contact'>
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
                  label: labelFromKebabCase(value)
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
