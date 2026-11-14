/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ URL field                                                                    ║
║ Edits and opens an absolute URL using its declared schemes.                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Owns the labelled URL input and captioned open action in one stretching row.
Validates and opens an absolute URL using its declared schemes; its placeholder
shows the first scheme, so the expected form shows before an error does.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
UrlFieldProps  Controlled URL input.
├ name         Field name and label target.
├ label        URL input label.
├ value        Current URL text.
├ onValue      Edit callback.
├ schemes      Allowed URL schemes.
├ required     Whether blank is invalid.
├ error        Host validation state.
└ onBlur       Host blur notification.
UrlField       URL input and secondary-window open action.
*/

import { isUrl } from '@core/std'
import type { UrlScheme } from '@core/std'
import { createSignal } from '@solid-js'
import { UiActionButton, UiField, UiInput, UiLayout, UiWindow } from '@ux/ui'
import type { UiComponent } from '@ux/ui'

import './url-field.css'

/** Controlled URL editor with field-owned schemes. */
export type UrlFieldProps = {
  name: string
  label: string
  value: string
  onValue: (value: string) => void
  schemes: readonly UrlScheme[]
  required?: boolean
  error?: boolean
  onBlur?: () => void
}

/** Render a URL input and an open action available only for valid values. */
export const UrlField = (props: UrlFieldProps): UiComponent => {
  const [touched, setTouched] = createSignal(false)
  const valid = (): boolean => isUrl(props.value.trim(), props.schemes)
  const invalid = (): boolean => !valid() && (props.required === true || props.value.trim() !== '')
  return (
    <UiLayout variant='inline-fill' data-app='url-field'>
      <UiField for={props.name} label={props.label} required={props.required}>
        <UiInput
          name={props.name}
          type='url'
          value={props.value}
          placeholder={`${props.schemes[0]}://example.url?doc=1234`}
          required={props.required}
          error={props.error || (touched() && invalid())}
          onInput={event => props.onValue(event.currentTarget.value)}
          onBlur={() => {
            setTouched(true)
            props.onBlur?.()
          }}
        />
      </UiField>
      <UiField label='Open' variant='caption'>
        <UiActionButton
          icon='external-link'
          label='Open URL'
          disabled={!valid()}
          onClick={() => {
            if (valid()) UiWindow.open(props.value.trim())
          }}
        />
      </UiField>
    </UiLayout>
  )
}
