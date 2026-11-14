/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Field Binder detail Step                                                     ║
║ Adds one document by Upload, Library, or Chemicals; edits name, description. ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Renders the stock Manager's single Detail Step. On Add, the Source toggle
chooses how the document arrives, and choosing it starts its upload task; the
name is the chosen document's, read-only. Chemicals walks three numbered steps:
select a chemical document, open its link and save the file, upload the file;
each later step reads as a direction until the first is done. On Edit, how the document arrived is
a read-only line, the source URL stays editable while the document is pending,
and a delivered document's name is editable, which renames it. There is no
document control on Edit. Validation, dirty checks, and Close belong to the
stock host.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
FieldBinderStepDetailProps  Detail Step inputs.
├ state                    Retained editor draft and upload task.
└ context                  Host validation, feedback, and pending state.
FieldBinderStepDetail       Binder document form.
*/

import { expectNonEmptyString, expectUrl } from '@core/std'
import { ATTACHMENT_KINDS } from '@domain/abstractions/common.ts'
import { AttachmentFormats } from '@front/api/attachment-formats.ts'
import type { FieldBinderUploadSource } from '@front/api/field-binder-inventory.ts'
import { UploadTask } from '@front/api/upload-task.ts'
import { UrlField } from '@front/app/shell/url-field.tsx'
import { onCleanup, Show } from '@solid-js'
import type { PanelStepContext } from '@ux/shell/panel/panel-sequence-contract.ts'
import { useFormKeyboard } from '@ux/shell/workbench/use-form-keyboard.ts'
import { useFormValidation } from '@ux/shell/workbench/use-form-validation.ts'
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
import { FieldBinderChemicalPicker } from './field-binder-chemical-picker.tsx'
import { FieldBinderLibraryPicker } from './field-binder-library-picker.tsx'
import type { FieldBinderState } from './field-binder-state.ts'

/** Retained draft and workbench-owned validation/feedback services. */
export type FieldBinderStepDetailProps = {
  state: FieldBinderState
  context: PanelStepContext
}

/** Choosing a document starts its upload; Save still belongs to the Manager. */
export const FieldBinderStepDetail = (props: FieldBinderStepDetailProps): UiComponent => {
  let form: HTMLFormElement | undefined
  const state = props.state
  const chemicals = (): boolean => state.adding && state.source() === 'url'
  const urlEditable = (): boolean =>
    state.source() === 'url' && !state.delivered && (!state.adding || state.link() !== '')
  const validation = useFormValidation(() => form, {
    link: () => chemicals() ? expectNonEmptyString(state.link(), 'Chemical document') : null,
    document: () => state.adding ? expectNonEmptyString(state.name(), 'Document') : null,
    sourceUrl: () =>
      urlEditable() ? expectUrl(state.url().trim(), 'Source URL', ['http', 'https']) : null,
    name: () => state.delivered ? expectNonEmptyString(state.name(), 'Name') : null,
    description: () => expectNonEmptyString(state.description(), 'Description')
  })
  onCleanup(props.context.registerValidation(validation.validateForm))
  useFormKeyboard(() => form, field => validation.blurField(field))
  const choose = (run: () => void): void => {
    try {
      run()
      validation.changeField('document')
      props.context.feedback(null)
    } catch (error) {
      props.context.feedback({
        message: error instanceof Error ? error.message : 'The document could not be chosen.',
        variant: 'danger'
      })
    }
  }
  const sourceUrl = (): UiComponent => (
    <UrlField
      name='sourceUrl'
      label='Source URL'
      schemes={['http', 'https']}
      required
      value={state.url()}
      onValue={value => {
        state.setUrl(value)
        validation.inputField('sourceUrl')
      }}
      onBlur={() => validation.blurField('sourceUrl')}
      error={validation.isInvalid('sourceUrl')}
    />
  )
  const chooseFile = (): UiComponent => (
    <UiField for='document' label='Choose file' required>
      <UiInput
        type='file'
        name='document'
        accept={AttachmentFormats.accept(ATTACHMENT_KINDS)}
        disabled={props.context.busy()}
        error={validation.isInvalid('document')}
        onInput={event => {
          // Reset before the text-field primitive reads it; file inputs cannot accept text.
          const file = event.currentTarget.files?.[0]
          event.currentTarget.value = ''
          if (file) choose(() => state.choose(file.name, UploadTask.fromFile(file)))
        }}
      />
    </UiField>
  )
  return (
    <form ref={form} inert={props.context.busy()} onSubmit={event => event.preventDefault()}>
      <UiLayout>
        <UiFieldset legend='Source'>
          <UiLayout>
            <Show
              when={state.adding}
              fallback={
                <UiField label='Upload' variant='caption'>
                  <p>{uploadLine(props.state)}</p>
                </UiField>
              }
            >
              <UiToggleGroup
                value={state.source()}
                disabled={props.context.busy()}
                onChange={(value: FieldBinderUploadSource) => state.setSource(value)}
              >
                <UiToggleItem value='upload'>Upload</UiToggleItem>
                <UiToggleItem value='library'>Library</UiToggleItem>
                <UiToggleItem value='url'>Chemicals</UiToggleItem>
              </UiToggleGroup>
            </Show>
            <Show when={!state.adding && urlEditable()}>{sourceUrl()}</Show>
            <Show when={state.adding && !chemicals()}>
              <Show
                when={state.source() === 'library'}
                fallback={chooseFile()}
              >
                <FieldBinderLibraryPicker
                  disabled={props.context.busy()}
                  onChoose={(name, read, record) => choose(() => state.choose(name, read, record))}
                />
              </Show>
            </Show>
            <Show when={chemicals()}>
              <UiField label='1. Select chemical document' variant='caption'>
                <FieldBinderChemicalPicker
                  disabled={props.context.busy()}
                  onChoose={chosen => {
                    state.chooseLink(chosen.name, chosen.url)
                    validation.changeField('link')
                  }}
                />
              </UiField>
              <UiField label='2. Open document and save to your device' variant='caption'>
                <Show when={state.link()} fallback={<p>{CHEMICAL_FIRST}</p>}>
                  <UiLayout gap='tight'>
                    <p>{state.link()}</p>
                    {sourceUrl()}
                  </UiLayout>
                </Show>
              </UiField>
              <UiField label='3. Upload document' variant='caption'>
                <Show when={state.link()} fallback={<p>{CHEMICAL_FIRST}</p>}>
                  {chooseFile()}
                </Show>
              </UiField>
            </Show>
          </UiLayout>
        </UiFieldset>
        <UiFieldset legend='Document'>
          <UiLayout>
            <UiField for='name' label='Name' required={state.delivered}>
              <UiInput
                name='name'
                value={state.name()}
                placeholder='No document chosen.'
                required={state.delivered}
                disabled={props.context.busy() || !state.delivered}
                error={validation.isInvalid('name')}
                onInput={event => {
                  state.setName(event.currentTarget.value)
                  validation.inputField('name')
                }}
                onBlur={() => validation.blurField('name')}
              />
            </UiField>
            <UiField for='description' label='Description' required>
              <UiTextArea
                name='description'
                value={state.description()}
                required
                disabled={props.context.busy()}
                error={validation.isInvalid('description')}
                onInput={event => {
                  state.setDescription(event.currentTarget.value)
                  validation.inputField('description')
                }}
                onBlur={() => validation.blurField('description')}
              />
            </UiField>
          </UiLayout>
        </UiFieldset>
      </UiLayout>
    </form>
  )
}

/** A Chemicals step's direction until a chemical document is selected. */
const CHEMICAL_FIRST = 'Select chemical document first.'

/** How each document arrives, as the Edit line says it. */
const SOURCE_LABELS: { [Source in FieldBinderUploadSource]: string } = {
  upload: 'Upload',
  library: 'Library',
  url: 'Chemicals'
}

/** Source, kind, and the upload date, or Pending while the document has not arrived. */
const uploadLine = (state: FieldBinderState): string => {
  const parts = [SOURCE_LABELS[state.source()], UiText.label(state.kind() ?? 'document')]
  const arrived = state.uploadedAt ? new Date(state.uploadedAt).toLocaleDateString() : 'Pending'
  const source = state.delivered && state.url() ? ` · ${state.url()}` : ''
  return `${[...parts, arrived].join(' · ')}${source}`
}
