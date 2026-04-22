/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ App checkbox control                                                         ║
║ Semantic wrapper for the Kobalte Checkbox primitive.                         ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Emits checkbox control semantics without styling concerns.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AppCheckbox  Checkbox control with declared states.
*/

import { Checkbox } from '@kobalte/core/checkbox'
import { type JSX, splitProps } from '@solid-js'
import { controlState } from './controls-helpers.ts'

/** Checkbox control props. */
export type AppCheckboxProps = {
  children?: JSX.Element
  checked?: boolean
  defaultChecked?: boolean
  disabled?: boolean
  error?: boolean
  loading?: boolean
  name?: string
  required?: boolean
  value?: string
  onChange?: (checked: boolean) => void
  class?: never
  classList?: never
  style?: never
  'data-ui'?: never
  'data-ui-state'?: never
}

/** Checkbox control with declared states. */
export const AppCheckbox = (props: AppCheckboxProps): JSX.Element => {
  const [local] = splitProps(props, [
    'children',
    'checked',
    'defaultChecked',
    'disabled',
    'error',
    'loading',
    'name',
    'required',
    'value',
    'onChange',
    'class',
    'classList',
    'style',
    'data-ui',
    'data-ui-state'
  ])

  return (
    <Checkbox
      checked={local.checked}
      defaultChecked={local.defaultChecked}
      disabled={local.disabled || local.loading}
      name={local.name}
      required={local.required}
      value={local.value}
      onChange={local.onChange}
      validationState={local.error ? 'invalid' : undefined}
    >
      <Checkbox.Input data-ui='checkbox' data-ui-state={controlState(local)} />
      {local.children}
    </Checkbox>
  )
}
