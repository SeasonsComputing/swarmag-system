/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Service detail Step                                                          ║
║ Edits owned fields with host-integrated validation and draft lifetime.       ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Edits owned fields with host-integrated validation and draft lifetime.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
ServiceStepDetailProps  Detail Step inputs.
├ state                 The retained form draft.
└ context               Host validation and drill context.
ServiceStepDetail       Render the single detail Step.
*/

import { expectConstEnum, expectNonEmptyString } from '@core/std'
import { SERVICE_CATEGORIES } from '@domain/abstractions/service.ts'
import type { ServiceCategory } from '@domain/abstractions/service.ts'
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
  UiText,
  UiTextArea,
  UiToggleGroup,
  UiToggleItem
} from '@ux/ui'
import type { UiComponent } from '@ux/ui'
import { ServiceAssetTypes } from './service-asset-types.tsx'
import type { ServiceState } from './service-state.ts'

/** Inputs for one Service detail Step. */
export type ServiceStepDetailProps = {
  state: ServiceState
  context: PanelStepContext
}

/** Render owned fields and register mounted validation with the host. */
export const ServiceStepDetail = (props: ServiceStepDetailProps): UiComponent => {
  const { state } = props
  let formRef: HTMLFormElement | undefined
  const validation = useAbstractionFormValidation(() => formRef, {
    name: () => expectNonEmptyString(state.name(), 'Name'),
    sku: () => expectNonEmptyString(state.sku(), 'SKU'),
    category: () => expectConstEnum(state.category(), 'Category', SERVICE_CATEGORIES)
  })
  onCleanup(props.context.registerValidation(validation.validateForm))
  useAbstractionFormKeyboard(() => formRef, field => validation.blurField(field))
  return (
    <DrillDown
      rootTitle='Service details'
      context={props.context}
      root={drill => (
        <form ref={formRef} onSubmit={event => event.preventDefault()}>
          <UiLayout>
            <UiFieldset legend='Service information'>
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
                <UiField for='sku' label='SKU' required>
                  <UiInput
                    name='sku'
                    value={state.sku()}
                    onInput={event => {
                      state.setSku(event.currentTarget.value)
                      validation.inputField('sku')
                    }}
                    onBlur={() => validation.blurField('sku')}
                    error={validation.isInvalid('sku')}
                    required
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
                <UiField variant='caption' label='Category' required>
                  <UiToggleGroup<ServiceCategory>
                    value={state.category()}
                    onChange={value => {
                      state.setCategory(value)
                      validation.changeField('category')
                    }}
                    error={validation.isInvalid('category')}
                  >
                    {SERVICE_CATEGORIES.map(value => (
                      <UiToggleItem value={value}>{UiText.label(value)}</UiToggleItem>
                    ))}
                  </UiToggleGroup>
                </UiField>
                <UiField variant='caption' label='Required asset types'>
                  <ServiceAssetTypes
                    stored={state.storedAssetTypes}
                    value={state.requiredAssetTypes()}
                    onChange={state.setRequiredAssetTypes}
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
