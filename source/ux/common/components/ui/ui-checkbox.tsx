/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Ui checkbox control                                                         ║
║ Semantic wrapper for the Kobalte Checkbox primitive.                         ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Emits checkbox control semantics without styling concerns.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
UiCheckbox  Checkbox control with declared states.
*/

import { Checkbox } from '@kobalte/core/checkbox'
import { splitProps } from '@solid-js'
import { controlState, type UiComponent, type UiComponentProps } from './ui-helpers.ts'

/** Checkbox control props. */
export type UiCheckboxProps = UiComponentProps & {
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
export const UiCheckbox = (props: UiCheckboxProps): UiComponent => {
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
    'onChange'
  ])
  return (
    <Checkbox
      data-ui='checkbox'
      data-ui-state={controlState(local)}
      checked={local.checked}
      defaultChecked={local.defaultChecked}
      disabled={local.disabled || local.loading}
      name={local.name}
      required={local.required}
      value={local.value}
      onChange={local.onChange}
      validationState={local.error ? 'invalid' : undefined}
    >
      <Checkbox.Input />
      <Checkbox.Control>
        <Checkbox.Indicator />
      </Checkbox.Control>
      <Checkbox.Label>{local.children}</Checkbox.Label>
    </Checkbox>
  )
}
