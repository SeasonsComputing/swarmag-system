/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Ui text area control                                                        ║
║ Semantic wrapper for the Kobalte TextField primitive.                        ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Emits text area control semantics without styling concerns.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
UiTextArea  Multiline input control with declared states.
*/

import { TextField, type TextFieldTextAreaProps } from '@kobalte/core/text-field'
import { type JSX, splitProps } from '@solid-js'
import { controlState, type UiComponent } from './ui-helpers.ts'

/** Text area control props. */
export type UiTextAreaProps =
  & Omit<
    JSX.TextareaHTMLAttributes<HTMLTextAreaElement>,
    | 'class'
    | 'classList'
    | 'style'
    | 'data-ui'
    | 'data-ui-state'
  >
  & {
    error?: boolean
    loading?: boolean
    class?: never
    classList?: never
    style?: never
    'data-ui'?: never
    'data-ui-state'?: never
  }

const TextFieldRoot = TextField as unknown as typeof TextField
const TextFieldTextArea = TextField.TextArea as unknown as typeof TextField.TextArea

/** Multiline input control with declared states. */
export const UiTextArea = (props: UiTextAreaProps): UiComponent => {
  const [local, others] = splitProps(props, [
    'error',
    'loading',
    'disabled',
    'id',
    'name',
    'rows',
    'required',
    'readOnly'
  ])
  return (
    <TextFieldRoot
      name={local.name}
      required={local.required}
      disabled={local.disabled || local.loading}
      readOnly={local.readOnly}
      validationState={local.error ? 'invalid' : undefined}
    >
      <TextFieldTextArea
        id={local.id ?? local.name}
        rows={local.rows}
        {...others as unknown as TextFieldTextAreaProps}
        data-ui='textarea'
        data-ui-state={controlState(local) as string | undefined}
      />
    </TextFieldRoot>
  )
}
