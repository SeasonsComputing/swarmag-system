/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Asset type detail Step                                                       ║
║ Edits owned fields with host-integrated validation and draft lifetime.       ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Edits owned fields with host-integrated validation and draft lifetime.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AssetTypeStepDetailProps  Detail Step inputs.
├ state  The retained form draft.
└ context  Host validation and drill context.
AssetTypeStepDetail  Render the single detail Step.
*/

import { expectNonEmptyString } from '@core/std'
import { onCleanup } from '@solid-js'
import type { PanelStepContext } from '@ux/shell/panel/panel-sequence-contract.ts'
import { useAbstractionFormKeyboard } from '@ux/shell/workbench/use-abstraction-form-keyboard.ts'
import { useAbstractionFormValidation } from '@ux/shell/workbench/use-abstraction-form-validation.ts'
import { UiField, UiFieldset, UiInput, UiLayout, UiToggleGroup, UiToggleItem } from '@ux/ui'
import type { UiComponent } from '@ux/ui'
import type { AssetTypeState } from './asset-type-state.ts'

/** Inputs for one Asset type detail Step. */
export type AssetTypeStepDetailProps = {
  state: AssetTypeState
  context: PanelStepContext
}

/** Render owned fields and register mounted validation with the host. */
export const AssetTypeStepDetail = (props: AssetTypeStepDetailProps): UiComponent => {
  const { state } = props
  let formRef: HTMLFormElement | undefined
  const validation = useAbstractionFormValidation(() => formRef, {
    label: () => expectNonEmptyString(state.label(), 'Label')
  })
  onCleanup(props.context.registerValidation(validation.validateForm))
  useAbstractionFormKeyboard(() => formRef, field => validation.blurField(field))
  return (
    <form ref={formRef} onSubmit={event => event.preventDefault()}>
      <UiLayout>
        <UiFieldset legend='Asset type information'>
          <UiLayout>
            <UiField for='label' label='Label' required>
              <UiInput
                name='label'
                value={state.label()}
                onInput={event => {
                  state.setLabel(event.currentTarget.value)
                  validation.inputField('label')
                }}
                onBlur={() => validation.blurField('label')}
                error={validation.isInvalid('label')}
                required
              />
            </UiField>
            <UiField variant='caption' label='Status'>
              <UiToggleGroup
                value={state.active() ? 'active' : 'inactive'}
                onChange={value => state.setActive(value === 'active')}
              >
                <UiToggleItem value='active'>Active</UiToggleItem>
                <UiToggleItem value='inactive'>Inactive</UiToggleItem>
              </UiToggleGroup>
            </UiField>
          </UiLayout>
        </UiFieldset>
      </UiLayout>
    </form>
  )
}
