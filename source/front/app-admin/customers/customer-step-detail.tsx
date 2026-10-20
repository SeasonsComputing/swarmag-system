/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Customer detail step                                                         ║
║ Collects customer identity, account manager, and customer notes.             ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Renders Customer identity, status, account manager, and notes and registers
mounted field validation with the containing sequence.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
CustomerStepDetailProps  Customer detail panel inputs.
CustomerStepDetail       Identity, account manager, and notes with validation.
*/

import { expectNonEmptyString } from '@core/std'
import { CUSTOMER_STATUSES } from '@domain/abstractions/customer.ts'
import type { CustomerStatus } from '@domain/abstractions/customer.ts'
import { NotesEditor } from '@front/app/shell/notes-editor.tsx'
import { UserPicker } from '@front/app/shell/user-picker.tsx'
import { For, onCleanup } from '@solid-js'
import { DrillDown } from '@ux/shell/panel/drill-down.tsx'
import type { PanelStepContext } from '@ux/shell/panel/panel-sequence-contract.ts'
import { useAbstractionFormKeyboard } from '@ux/shell/workbench/use-abstraction-form-keyboard.ts'
import { useAbstractionFormValidation } from '@ux/shell/workbench/use-abstraction-form-validation.ts'
import { UiField, UiFieldset, UiInput, UiLayout, UiText, UiToggleGroup, UiToggleItem } from '@ux/ui'
import type { UiComponent } from '@ux/ui'
import { ACCOUNT_MANAGER_ROLES } from './customer-state.ts'
import type { CustomerState } from './customer-state.ts'

import './customer-step-detail.css'

/** Props for the Customer Detail step. */
export type CustomerStepDetailProps = {
  state: CustomerState
  context: PanelStepContext
}

/** Renders the Customer Detail step. */
export const CustomerStepDetail = (props: CustomerStepDetailProps): UiComponent => {
  let formRef: HTMLFormElement | undefined
  const { state } = props
  const validation = useAbstractionFormValidation(() => formRef, {
    name: () => expectNonEmptyString(state.name(), 'Name')
  })
  onCleanup(props.context.registerValidation(validation.validateForm))
  useAbstractionFormKeyboard(() => formRef, field => validation.blurField(field))

  return (
    <DrillDown
      rootTitle='Customer details'
      context={props.context}
      root={drill => (
        <form ref={formRef} onSubmit={event => event.preventDefault()}>
          <UiLayout data-app='customer-step-detail'>
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
            <UiFieldset legend='Account'>
              <UiField for='account-manager' label='Manager'>
                <div data-app='customer-account-manager'>
                  <UserPicker
                    name='account-manager'
                    listedRoles={ACCOUNT_MANAGER_ROLES}
                    storedId={state.storedAccountManagerId}
                    value={state.accountManagerId()}
                    onChange={value => state.setAccountManagerId(value)}
                  />
                </div>
              </UiField>
            </UiFieldset>
            <NotesEditor notes={state.notes} onChange={state.setNotes} drill={drill} />
          </UiLayout>
        </form>
      )}
    />
  )
}
