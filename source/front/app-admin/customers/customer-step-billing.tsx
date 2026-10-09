/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Customer billing step                                                        ║
║ Billing address fields and their mounted validation.                         ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Edits the existing billing address within the shared Customer sequence.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
CustomerStepBilling  Billing address step.
*/

import { expectNonEmptyString } from '@core/std'
import { onCleanup } from '@solid-js'
import type { PanelStepContext } from '@ux/shell/panel/panel-sequence-contract.ts'
import { useAbstractionFormKeyboard } from '@ux/shell/workbench/use-abstraction-form-keyboard.ts'
import { useAbstractionFormValidation } from '@ux/shell/workbench/use-abstraction-form-validation.ts'
import { UiField, UiFieldset, UiInput, UiLayout } from '@ux/ui'
import type { UiComponent } from '@ux/ui'
import type { CustomerState } from './customer-state.ts'

/** Render billing address fields against the retained Customer state. */
export const CustomerStepBilling = (props: {
  state: CustomerState
  context: PanelStepContext
}): UiComponent => {
  let formRef: HTMLFormElement | undefined
  const { state } = props
  const validation = useAbstractionFormValidation(() => formRef, {
    line1: () => expectNonEmptyString(state.line1(), 'Address'),
    city: () => expectNonEmptyString(state.city(), 'City'),
    state: () => expectNonEmptyString(state.state(), 'State / Province'),
    postalCode: () => expectNonEmptyString(state.postalCode(), 'ZIP / Postal Code'),
    country: () => expectNonEmptyString(state.country(), 'Country')
  })
  onCleanup(props.context.registerValidation(validation.validateForm))
  useAbstractionFormKeyboard(() => formRef, field => validation.blurField(field))
  return (
    <form ref={formRef} onSubmit={event => event.preventDefault()}>
      <UiLayout>
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

/** Props for a customer address input bound to Customer state. */
type CustomerInputProps = {
  state: CustomerState
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
