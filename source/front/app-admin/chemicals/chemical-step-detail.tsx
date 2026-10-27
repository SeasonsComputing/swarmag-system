/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Chemical detail Step                                                         ║
║ Edits owned fields with host-integrated validation and draft lifetime.       ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Edits owned fields with host-integrated validation and draft lifetime.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
ChemicalStepDetailProps  Detail Step inputs.
├ state  The retained form draft.
└ context  Host validation and drill context.
ChemicalStepDetail  Render the single detail Step.
*/

import { expectNonEmptyString } from '@core/std'
import { CHEMICAL_SIGNAL_WORDS, CHEMICAL_USAGES } from '@domain/abstractions/chemical.ts'
import type { ChemicalSignalWord, ChemicalUsage } from '@domain/abstractions/chemical.ts'
import { NotesEditor } from '@front/app/shell/notes-editor.tsx'
import { onCleanup } from '@solid-js'
import { DrillDown } from '@ux/shell/panel/drill-down.tsx'
import type { PanelStepContext } from '@ux/shell/panel/panel-sequence-contract.ts'
import { useAbstractionFormKeyboard } from '@ux/shell/workbench/use-abstraction-form-keyboard.ts'
import { useAbstractionFormValidation } from '@ux/shell/workbench/use-abstraction-form-validation.ts'
import {
  UiField,
  UiFieldset,
  UiInput,
  UiLayout,
  UiSingleSelect,
  UiText,
  UiToggleGroup,
  UiToggleItem
} from '@ux/ui'
import type { UiComponent } from '@ux/ui'
import type { ChemicalState } from './chemical-state.ts'
import { reEntryIntervalError } from './chemical-state.ts'

/** Inputs for one Chemical detail Step. */
export type ChemicalStepDetailProps = {
  state: ChemicalState
  context: PanelStepContext
}

/** Render owned fields and register mounted validation with the host. */
export const ChemicalStepDetail = (props: ChemicalStepDetailProps): UiComponent => {
  const { state } = props
  let formRef: HTMLFormElement | undefined
  const validation = useAbstractionFormValidation(() => formRef, {
    name: () => expectNonEmptyString(state.name(), 'Name'),
    reEntryIntervalHours: () => reEntryIntervalError(state.reEntryIntervalHours())
  })
  onCleanup(props.context.registerValidation(() => {
    const nativeValid = formRef?.reportValidity() ?? true
    const fieldsValid = validation.validateForm()
    return nativeValid && fieldsValid
  }))
  useAbstractionFormKeyboard(() => formRef, field => validation.blurField(field))
  return (
    <DrillDown
      rootTitle='Chemical details'
      context={props.context}
      root={drill => (
        <form ref={formRef} onSubmit={event => event.preventDefault()}>
          <UiLayout>
            <UiFieldset legend='Chemical information'>
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
                <UiField for='epaNumber' label='EPA number'>
                  <UiInput
                    name='epaNumber'
                    value={state.epaNumber()}
                    onInput={event => {
                      state.setEpaNumber(event.currentTarget.value)
                      validation.inputField('epaNumber')
                    }}
                    onBlur={() => validation.blurField('epaNumber')}
                    error={validation.isInvalid('epaNumber')}
                  />
                </UiField>
                <UiField for='usage' label='Usage' required>
                  <UiSingleSelect
                    name='usage'
                    value={state.usage()}
                    options={CHEMICAL_USAGES.map(value => ({ value, label: UiText.label(value) }))}
                    onChange={value => state.setUsage(value as ChemicalUsage)}
                  />
                </UiField>
                <UiField for='signalWord' label='Signal word' required>
                  <UiSingleSelect
                    name='signalWord'
                    value={state.signalWord()}
                    options={CHEMICAL_SIGNAL_WORDS.map(value => ({ value, label: UiText.label(value) }))}
                    onChange={value => state.setSignalWord(value as ChemicalSignalWord)}
                  />
                </UiField>
              </UiLayout>
            </UiFieldset>
            <UiFieldset legend='Handling and reference'>
              <UiLayout>
                <UiField variant='caption' label='Restricted use'>
                  <UiToggleGroup
                    value={state.restrictedUse() ? 'yes' : 'no'}
                    onChange={value => state.setRestrictedUse(value === 'yes')}
                  >
                    <UiToggleItem value='yes'>Yes</UiToggleItem>
                    <UiToggleItem value='no'>No</UiToggleItem>
                  </UiToggleGroup>
                </UiField>
                <UiField for='reEntryIntervalHours' label='Re-entry interval (hours)'>
                  <UiInput
                    name='reEntryIntervalHours'
                    type='number'
                    min='1'
                    step='1'
                    value={UiText.from(state.reEntryIntervalHours())}
                    onChange={event => {
                      state.setReEntryIntervalHours(UiText.number(event.currentTarget.value))
                      validation.changeField('reEntryIntervalHours')
                    }}
                    onBlur={() => validation.blurField('reEntryIntervalHours')}
                    error={validation.isInvalid('reEntryIntervalHours')}
                  />
                </UiField>
                <UiField for='storageLocation' label='Storage location'>
                  <UiInput
                    name='storageLocation'
                    value={state.storageLocation()}
                    onInput={event => {
                      state.setStorageLocation(event.currentTarget.value)
                      validation.inputField('storageLocation')
                    }}
                    onBlur={() => validation.blurField('storageLocation')}
                    error={validation.isInvalid('storageLocation')}
                  />
                </UiField>
                <UiField for='sdsUrl' label='SDS URL'>
                  <UiInput
                    name='sdsUrl'
                    value={state.sdsUrl()}
                    onInput={event => {
                      state.setSdsUrl(event.currentTarget.value)
                      validation.inputField('sdsUrl')
                    }}
                    onBlur={() => validation.blurField('sdsUrl')}
                    error={validation.isInvalid('sdsUrl')}
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
