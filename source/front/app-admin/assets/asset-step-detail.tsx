/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Asset detail Step                                                            ║
║ Edits owned fields with host-integrated validation and draft lifetime.       ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Edits owned fields with host-integrated validation and draft lifetime.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AssetStepDetailProps  Detail Step inputs.
├ state  The retained form draft.
└ context  Host validation and drill context.
AssetStepDetail  Render the single detail Step.
*/

import { expectId, expectNonEmptyString } from '@core/std'
import { ASSET_STATUSES } from '@domain/abstractions/asset.ts'
import type { AssetStatus } from '@domain/abstractions/asset.ts'
import { NotesEditor } from '@front/app/shell/notes-editor.tsx'
import { onCleanup } from '@solid-js'
import { DrillDown } from '@ux/shell/panel/drill-down.tsx'
import type { PanelStepContext } from '@ux/shell/panel/panel-sequence-contract.ts'
import { useAbstractionFormKeyboard } from '@ux/shell/workbench/use-abstraction-form-keyboard.ts'
import { useAbstractionFormValidation } from '@ux/shell/workbench/use-abstraction-form-validation.ts'
import { UiField, UiFieldset, UiInput, UiLayout, UiSingleSelect, UiText, UiTextArea } from '@ux/ui'
import type { UiComponent } from '@ux/ui'
import type { AssetState } from './asset-state.ts'
import { AssetTypePicker } from './asset-type-picker.tsx'

/** Inputs for one Asset detail Step. */
export type AssetStepDetailProps = {
  state: AssetState
  context: PanelStepContext
}

/** Render owned fields and register mounted validation with the host. */
export const AssetStepDetail = (props: AssetStepDetailProps): UiComponent => {
  const { state } = props
  let formRef: HTMLFormElement | undefined
  const validation = useAbstractionFormValidation(() => formRef, {
    label: () => expectNonEmptyString(state.label(), 'Label'),
    type: () => expectId(state.type(), 'Type')
  })
  onCleanup(props.context.registerValidation(validation.validateForm))
  useAbstractionFormKeyboard(() => formRef, field => validation.blurField(field))
  return (
    <DrillDown
      rootTitle='Asset details'
      context={props.context}
      root={drill => (
        <form ref={formRef} onSubmit={event => event.preventDefault()}>
          <UiLayout>
            <UiFieldset legend='Asset information'>
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
                <UiField for='type' label='Type' required>
                  <AssetTypePicker
                    storedId={state.storedType}
                    value={state.type()}
                    onChange={value => {
                      state.setType(value)
                      validation.changeField('type')
                    }}
                    error={validation.isInvalid('type')}
                  />
                </UiField>
                <UiField for='description' label='Description'>
                  <UiTextArea
                    name='description'
                    value={state.description()}
                    onInput={event => {
                      state.setDescription(event.currentTarget.value)
                      validation.inputField('description')
                    }}
                    onBlur={() => validation.blurField('description')}
                    error={validation.isInvalid('description')}
                  />
                </UiField>
                <UiField for='serialNumber' label='Serial number'>
                  <UiInput
                    name='serialNumber'
                    value={state.serialNumber()}
                    onInput={event => {
                      state.setSerialNumber(event.currentTarget.value)
                      validation.inputField('serialNumber')
                    }}
                    onBlur={() => validation.blurField('serialNumber')}
                    error={validation.isInvalid('serialNumber')}
                  />
                </UiField>
                <UiField for='status' label='Status'>
                  <UiSingleSelect
                    name='status'
                    value={state.status()}
                    options={ASSET_STATUSES.map(value => ({ value, label: UiText.label(value) }))}
                    onChange={value => state.setStatus(value as AssetStatus)}
                  />
                </UiField>
              </UiLayout>
            </UiFieldset>
            <NotesEditor notes={state.notes} onChange={state.setNotes} drill={drill} />
          </UiLayout>
        </form>
      )}
    />
  )
}
