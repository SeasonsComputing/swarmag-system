/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Field Binder detail Step                                                     ║
║ File capture, required description, and optional source metadata.            ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Renders the stock Manager's single Detail Step. Chosen files are captured
immediately by the editor state. Metadata remains an ordinary unsaved draft;
validation, pending locks, dirty checks, and Close belong to the stock host.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
FieldBinderStepDetailProps  Detail Step inputs.
├ state                    Retained editor draft and file lifecycle.
└ context                  Host validation, feedback, and pending state.
FieldBinderStepDetail       Binder file/metadata form.
*/

import { expectNonEmptyString, expectUrl } from '@core/std'
import { ATTACHMENT_KINDS } from '@domain/abstractions/common.ts'
import { AttachmentFormats } from '@front/api/attachment-formats.ts'
import { UrlField } from '@front/app/shell/url-field.tsx'
import { onCleanup } from '@solid-js'
import type { PanelStepContext } from '@ux/shell/panel/panel-sequence-contract.ts'
import { useFormKeyboard } from '@ux/shell/workbench/use-form-keyboard.ts'
import { useFormValidation } from '@ux/shell/workbench/use-form-validation.ts'
import { UiField, UiFieldset, UiInput, UiLayout } from '@ux/ui'
import type { UiComponent } from '@ux/ui'
import type { FieldBinderState } from './field-binder-state.ts'

/** Retained draft and workbench-owned validation/feedback services. */
export type FieldBinderStepDetailProps = {
  state: FieldBinderState
  context: PanelStepContext
}

/** File choice is durable capture; Save still belongs to the Manager. */
export const FieldBinderStepDetail = (props: FieldBinderStepDetailProps): UiComponent => {
  let form: HTMLFormElement | undefined
  const state = props.state
  const validation = useFormValidation(() => form, {
    documentFile: () =>
      state.pending()
        ? 'Wait for the chosen file to finish saving on this device.'
        : expectNonEmptyString(state.documentAddress(), 'File'),
    description: () => expectNonEmptyString(state.description(), 'Description'),
    sourceUrl: () => expectUrl(state.url().trim() || undefined, 'Source URL', ['http', 'https'], true)
  })
  onCleanup(props.context.registerValidation(validation.validateForm))
  useFormKeyboard(() => form, field => validation.blurField(field))
  return (
    <form ref={form} inert={props.context.busy()} onSubmit={event => event.preventDefault()}>
      <UiFieldset legend='Document'>
        <UiLayout>
          <UiField for='documentFile' label='Choose File' required={!state.documentAddress()}>
            <UiInput
              type='file'
              name='documentFile'
              accept={AttachmentFormats.accept(ATTACHMENT_KINDS)}
              disabled={props.context.busy() || state.pending()}
              error={validation.isInvalid('documentFile')}
              onChange={async event => {
                const file = event.currentTarget.files?.[0]
                event.currentTarget.value = ''
                if (!file) return
                try {
                  await state.choose(file)
                  validation.changeField('documentFile')
                  props.context.feedback(null)
                } catch (error) {
                  props.context.feedback({
                    message: error instanceof Error ? error.message : 'File capture failed.',
                    variant: 'danger'
                  })
                }
              }}
            />
            <span>
              {state.pending()
                ? 'Saving file on this device…'
                : state.fileName() || (state.documentAddress()
                  ? 'Keep the current file, or choose a replacement.'
                  : 'Choose a document file.')}
            </span>
          </UiField>
          <UiField for='description' label='Description' required>
            <UiInput
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
          <UrlField
            name='sourceUrl'
            label='Source URL'
            schemes={['http', 'https']}
            value={state.url()}
            onValue={value => {
              state.setUrl(value)
              validation.inputField('sourceUrl')
            }}
            onBlur={() => validation.blurField('sourceUrl')}
            error={validation.isInvalid('sourceUrl')}
          />
        </UiLayout>
      </UiFieldset>
    </form>
  )
}
