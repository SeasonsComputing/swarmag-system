/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ App input control                                                            ║
║ Semantic wrapper for the Kobalte TextField primitive.                        ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Emits input control semantics without styling concerns.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AppInput  Text input control with declared states.
*/

import {
  TextField,
  type TextFieldRootProps,
  type TextFieldInputProps
} from '@kobalte/core/text-field'
import { type JSX, splitProps } from '@solid-js'
import { controlState, withDataUI } from './controls-helpers.ts'

/** Input control props. */
export type AppInputProps =
  & Omit<
    JSX.InputHTMLAttributes<HTMLInputElement>,
    'class' | 'classList' | 'style' | 'data-ui' | 'data-ui-state'
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

const TextFieldRoot = withDataUI<TextFieldRootProps>(TextField)
const TextFieldInput = withDataUI<TextFieldInputProps>(TextField.Input)

/** Text input control with declared states. */
export const AppInput = (props: AppInputProps): JSX.Element => {
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
      id={local.id}
      name={local.name}
      required={local.required}
      disabled={local.disabled || local.loading}
      readOnly={local.readOnly}
      validationState={local.error ? 'invalid' : undefined}
    >
      <TextFieldInput
        {...others as unknown as TextFieldInputProps}
        data-ui='input'
        data-ui-state={controlState(local) as string | undefined}
      />
    </TextFieldRoot>
  )
}
