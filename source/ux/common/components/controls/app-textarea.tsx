/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ App textarea control                                                         ║
║ Semantic wrapper for the Kobalte TextField primitive.                        ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Emits textarea control semantics without styling concerns.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AppTextarea  Multiline input control with declared states.
*/

import { TextField } from '@kobalte/core/text-field'
import { type JSX, splitProps } from '@solid-js'
import { controlState } from './controls-helpers.ts'

/** Textarea control props. */
export type AppTextareaProps =
  & Omit<
    JSX.TextareaHTMLAttributes<HTMLTextAreaElement>,
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

type AppTextareaRootProps = {
  children?: JSX.Element
  id?: string
  name?: string
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  validationState?: 'valid' | 'invalid'
}

type AppTextareaFieldProps =
  & JSX.TextareaHTMLAttributes<HTMLTextAreaElement>
  & {
    'data-ui': 'textarea'
    'data-ui-state'?: 'error' | 'disabled' | 'loading'
  }

const TextFieldRoot = TextField as unknown as (props: AppTextareaRootProps) => JSX.Element
const TextFieldTextArea = TextField.TextArea as unknown as (
  props: AppTextareaFieldProps
) => JSX.Element

/** Multiline input control with declared states. */
export const AppTextarea = (props: AppTextareaProps): JSX.Element => {
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
      <TextFieldTextArea
        {...others}
        id={local.id}
        data-ui='textarea'
        data-ui-state={controlState(local)}
        disabled={local.disabled || local.loading}
        required={local.required}
        readOnly={local.readOnly}
      />
    </TextFieldRoot>
  )
}
