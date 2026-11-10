/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ URL field                                                                    ║
║ Edits and opens an absolute URL using its declared schemes.                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Edits and opens an absolute URL using its declared schemes.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
UrlFieldProps  Controlled URL input.
├ name         Field name and label target.
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
import { UiActionButton, UiInput, UiLayout } from '@ux/ui'
import type { UiComponent } from '@ux/ui'

/** Controlled URL editor with field-owned schemes. */
export type UrlFieldProps = {
  name: string
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
    <UiLayout>
      <UiInput
        name={props.name}
        type='url'
        value={props.value}
        required={props.required}
        error={props.error || (touched() && invalid())}
        onInput={event => props.onValue(event.currentTarget.value)}
        onBlur={() => {
          setTouched(true)
          props.onBlur?.()
        }}
      />
      <UiActionButton
        icon='external-link'
        label='Open URL'
        labelMode='visible'
        disabled={!valid()}
        onClick={() => {
          if (valid()) globalThis.open(props.value.trim(), '_blank', 'noopener,noreferrer')
        }}
      />
    </UiLayout>
  )
}
