/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ App radio group control                                                      ║
║ Semantic wrapper for the Kobalte RadioGroup primitive.                       ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Emits radio-group control semantics without styling concerns.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AppRadioGroup  Radio-group control with declared states.
AppRadioItem   Radio item control for AppRadioGroup.
*/

import {
  RadioGroup,
  type RadioGroupItemProps,
  type RadioGroupRootProps
} from '@kobalte/core/radio-group'
import { type Component, splitProps } from '@solid-js'
import { type AppComponent, controlState, type WithDataUI } from './controls-helpers.ts'

/** Radio-group control props. */
export type AppRadioGroupProps<Value extends string = string> = {
  children?: AppComponent
  disabled?: boolean
  error?: boolean
  loading?: boolean
  name?: string
  required?: boolean
  value?: Value
  defaultValue?: Value
  onChange?: (value: Value) => void
  class?: never
  classList?: never
  style?: never
  'data-ui'?: never
  'data-ui-state'?: never
}

/** Radio item control props. */
export type AppRadioItemProps<Value extends string = string> = {
  children?: AppComponent
  value: Value
  disabled?: boolean
  class?: never
  classList?: never
  style?: never
  'data-ui'?: never
}

const RadioGroupRoot = RadioGroup as Component<WithDataUI<RadioGroupRootProps>>
const RadioItem = RadioGroup.Item as Component<WithDataUI<RadioGroupItemProps>>
const RadioItemControl = RadioGroup.ItemControl as unknown as typeof RadioGroup.ItemControl

/** Radio-group control with declared states. */
export const AppRadioGroup = <Value extends string = string>(
  props: AppRadioGroupProps<Value>
): AppComponent => {
  const [local] = splitProps(props, [
    'children',
    'disabled',
    'error',
    'loading',
    'name',
    'required',
    'value',
    'defaultValue',
    'onChange'
  ])

  return (
    <RadioGroupRoot
      data-ui='radio-group'
      data-ui-state={controlState(local)}
      disabled={local.disabled || local.loading}
      name={local.name}
      required={local.required}
      value={local.value}
      defaultValue={local.defaultValue}
      onChange={(value: string) => local.onChange?.(value as Value)}
      validationState={local.error ? 'invalid' : undefined}
    >
      {local.children}
    </RadioGroupRoot>
  )
}

/** Radio item control for AppRadioGroup. */
export const AppRadioItem = <Value extends string = string>(
  props: AppRadioItemProps<Value>
): AppComponent => {
  const [local] = splitProps(props, [
    'children',
    'value',
    'disabled'
  ])

  return (
    <RadioItem
      data-ui='radio-item'
      value={local.value}
      disabled={local.disabled}
    >
      <RadioGroup.ItemInput />
      <RadioItemControl data-ui='radio'>
        <RadioGroup.ItemIndicator />
      </RadioItemControl>
      <RadioGroup.ItemLabel>{local.children}</RadioGroup.ItemLabel>
    </RadioItem>
  )
}
