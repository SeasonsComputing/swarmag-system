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

import {
  TextField,
  type TextFieldTextAreaProps
} from '@kobalte/core/text-field'
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

const TextFieldRoot = TextField as unknown as typeof TextField
const TextFieldTextArea = TextField.TextArea as unknown as typeof TextField.TextArea

/** Multiline input control with declared states. */
export const AppTextarea = (props: AppTextareaProps): JSX.Element => {
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
      <TextFieldTextArea
        {...others as unknown as TextFieldTextAreaProps}
        data-ui='textarea'
        data-ui-state={controlState(local) as string | undefined}
      />
    </TextFieldRoot>
  )
}
