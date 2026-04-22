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

import { TextField } from '@kobalte/core/text-field'
import { type JSX, splitProps } from '@solid-js'
import { controlState } from './controls-helpers.ts'

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

type AppInputRootProps = {
  children?: JSX.Element
  id?: string
  name?: string
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  validationState?: 'valid' | 'invalid'
}

type AppInputFieldProps =
  & JSX.InputHTMLAttributes<HTMLInputElement>
  & {
    'data-ui': 'input'
    'data-ui-state'?: 'error' | 'disabled' | 'loading'
  }

const TextFieldRoot = TextField as unknown as (props: AppInputRootProps) => JSX.Element
const TextFieldInput = TextField.Input as unknown as (props: AppInputFieldProps) => JSX.Element

/** Text input control with declared states. */
export const AppInput = (props: AppInputProps): JSX.Element => {
  const [local, others] = splitProps(props, [
    'error',
    'loading',
    'disabled',
    'id',
    'name',
    'required',
    'readOnly',
    'class',
    'classList',
    'style',
    'data-ui',
    'data-ui-state'
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
        {...others}
        id={local.id}
        data-ui='input'
        data-ui-state={controlState(local)}
        disabled={local.disabled || local.loading}
        required={local.required}
        readOnly={local.readOnly}
      />
    </TextFieldRoot>
  )
}
