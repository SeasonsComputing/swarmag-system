/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Ui input control                                                            ║
║ Semantic wrapper for the Kobalte TextField primitive.                        ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Emits input control semantics without styling concerns.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
UiInput  Text input control with declared states.
*/

import { TextField, type TextFieldInputProps } from '@kobalte/core/text-field'
import { type JSX, splitProps } from '@solid-js'
import { controlState, type UiComponent } from './ui-helpers.ts'

/** Input control props. */
export type UiInputProps =
  & Omit<
    JSX.InputHTMLAttributes<HTMLInputElement>,
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
const TextFieldInput = TextField.Input as unknown as typeof TextField.Input

/** Text input control with declared states. */
export const UiInput = (props: UiInputProps): UiComponent => {
  const [local, others] = splitProps(props, [
    'error',
    'loading',
    'disabled',
    'id',
    'name',
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
      <TextFieldInput
        id={local.id ?? local.name}
        {...others as unknown as TextFieldInputProps}
        data-ui='input'
        data-ui-state={controlState(local) as string | undefined}
      />
    </TextFieldRoot>
  )
}
