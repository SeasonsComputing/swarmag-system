/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Customer onboarding customer stage                                           ║
║ Collects and validates customer identity and billing address details.        ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import { expectNonEmptyString } from '@core/std'
import { CUSTOMER_STATUSES, type CustomerStatus } from '@domain/abstractions/customer.ts'
import { useAbstractionFormKeyboard } from '@front/ux/shell/use-abstraction-form-keyboard.ts'
import { useAbstractionFormValidation } from '@front/ux/shell/use-abstraction-form-validation.ts'
import {
  type UiComponent,
  UiField,
  UiFieldset,
  UiInput,
  UiLayout,
  UiText,
  UiToggleGroup,
  UiToggleItem
} from '@front/ux/ui'
import { For, onCleanup } from '@solid-js'
import type { OnboardingState } from './onboarding-state.ts'

/** Props for the customer and billing stage. */
export type OnboardingStageCustomerProps = {
  state: OnboardingState
  onFormCheck: (check: () => boolean) => void
}

/** Renders the customer and billing-address stage. */
export const OnboardingStageCustomer = (props: OnboardingStageCustomerProps): UiComponent => {
  let formRef: HTMLFormElement | undefined
  const { state } = props
  const validation = useAbstractionFormValidation(() => formRef, {
    name: () => expectNonEmptyString(state.name(), 'Name'),
    line1: () => expectNonEmptyString(state.line1(), 'Address'),
    city: () => expectNonEmptyString(state.city(), 'City'),
    state: () => expectNonEmptyString(state.state(), 'State / Province'),
    postalCode: () => expectNonEmptyString(state.postalCode(), 'ZIP / Postal Code'),
    country: () => expectNonEmptyString(state.country(), 'Country')
  })
  props.onFormCheck(validation.validateForm)
  onCleanup(() => props.onFormCheck(() => false))
  useAbstractionFormKeyboard(() => formRef, field => validation.blurField(field))

  return (
    <form ref={formRef} onSubmit={event => event.preventDefault()}>
      <UiLayout data-app='onboarding-stage-customer'>
        <UiFieldset legend='Customer Information'>
          <UiLayout>
            <UiField for='name' label='Name' required>
              <UiInput
                name='name'
                value={state.name()}
                onInput={event => {
                  state.setName(event.currentTarget.value)
                  validation.inputField('name')
                }}
                onBlur={() => validation.blurField('name')}
                error={validation.isInvalid('name')}
                required
              />
            </UiField>
            <UiField variant='caption' label='Status'>
              <UiToggleGroup<CustomerStatus> value={state.status()} onChange={state.setStatus}>
                <For each={CUSTOMER_STATUSES}>
                  {value => (
                    <UiToggleItem value={value}>
                      <span>{UiText.label(value)}</span>
                    </UiToggleItem>
                  )}
                </For>
              </UiToggleGroup>
            </UiField>
          </UiLayout>
        </UiFieldset>
        <UiFieldset legend='Billing Address'>
          <UiLayout>
            <CustomerInput state={state} validation={validation} name='line1' label='Address' required />
            <CustomerInput
              state={state}
              validation={validation}
              name='line2'
              label='Unit'
            />
            <CustomerInput state={state} validation={validation} name='city' label='City' required />
            <UiLayout variant='inline-fill'>
              <CustomerInput
                state={state}
                validation={validation}
                name='state'
                label='Region'
                required
              />
              <CustomerInput
                state={state}
                validation={validation}
                name='postalCode'
                label='Postal'
                required
              />
              <CustomerInput
                state={state}
                validation={validation}
                name='country'
                label='Country'
                required
              />
            </UiLayout>
          </UiLayout>
        </UiFieldset>
      </UiLayout>
    </form>
  )
}

/** Props for a customer address input bound to onboarding state. */
type CustomerInputProps = {
  state: OnboardingState
  validation: ReturnType<typeof useAbstractionFormValidation>
  name: 'line1' | 'line2' | 'city' | 'state' | 'postalCode' | 'country'
  label: string
  required?: boolean
}

/** Renders one customer address input and wires validation feedback. */
const CustomerInput = (props: CustomerInputProps): UiComponent => {
  const setter = {
    line1: props.state.setLine1,
    line2: props.state.setLine2,
    city: props.state.setCity,
    state: props.state.setState,
    postalCode: props.state.setPostalCode,
    country: props.state.setCountry
  }[props.name]

  const value = {
    line1: props.state.line1,
    line2: props.state.line2,
    city: props.state.city,
    state: props.state.state,
    postalCode: props.state.postalCode,
    country: props.state.country
  }[props.name]

  return (
    <UiField for={props.name} label={props.label} required={props.required}>
      <UiInput
        name={props.name}
        value={value()}
        onInput={event => {
          setter(event.currentTarget.value)
          props.validation.inputField(props.name)
        }}
        onBlur={() => props.validation.blurField(props.name)}
        error={props.validation.isInvalid(props.name)}
        required={props.required}
      />
    </UiField>
  )
}
