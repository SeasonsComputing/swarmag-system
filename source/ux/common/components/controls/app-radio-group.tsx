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

import { RadioGroup } from '@kobalte/core/radio-group'
import { type JSX, splitProps } from '@solid-js'
import { bindActiveAttribute, controlState } from './controls-helpers.ts'

/** Radio-group control props. */
export type AppRadioGroupProps<Value extends string = string> = {
  children?: JSX.Element
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
  children?: JSX.Element
  value: Value
  disabled?: boolean
  class?: never
  classList?: never
  style?: never
  'data-ui'?: never
}

type AppRadioItemContainerProps<Value extends string> = {
  children?: JSX.Element
  value: Value
  disabled?: boolean
  'data-ui': 'radio-item'
  ref?: (element: HTMLDivElement) => void
}

type AppRadioGroupRootProps<Value extends string = string> = {
  children?: JSX.Element
  disabled?: boolean
  name?: string
  required?: boolean
  value?: Value
  defaultValue?: Value
  onChange?: (value: Value) => void
  validationState?: 'valid' | 'invalid'
  'data-ui': 'radio-group'
  'data-ui-state'?: 'error' | 'disabled' | 'loading'
}

type AppRadioItemControlProps = {
  children?: JSX.Element
  'data-ui': 'radio'
}

const RadioGroupRoot = RadioGroup as unknown as <Value extends string = string>(
  props: AppRadioGroupRootProps<Value>
) => JSX.Element
const RadioItem = RadioGroup.Item as unknown as <Value extends string = string>(
  props: AppRadioItemContainerProps<Value>
) => JSX.Element

const RadioItemControl = RadioGroup.ItemControl as unknown as (
  props: AppRadioItemControlProps
) => JSX.Element

/** Radio-group control with declared states. */
export const AppRadioGroup = <Value extends string = string>(
  props: AppRadioGroupProps<Value>
): JSX.Element => {
  const [local] = splitProps(props, [
    'children',
    'disabled',
    'error',
    'loading',
    'name',
    'required',
    'value',
    'defaultValue',
    'onChange',
    'class',
    'classList',
    'style',
    'data-ui',
    'data-ui-state'
  ])

  return (
    <RadioGroupRoot<Value>
      data-ui='radio-group'
      data-ui-state={controlState(local)}
      disabled={local.disabled || local.loading}
      name={local.name}
      required={local.required}
      value={local.value}
      defaultValue={local.defaultValue}
      onChange={local.onChange}
      validationState={local.error ? 'invalid' : undefined}
    >
      {local.children}
    </RadioGroupRoot>
  )
}

/** Radio item control for AppRadioGroup. */
export const AppRadioItem = <Value extends string = string>(
  props: AppRadioItemProps<Value>
): JSX.Element => {
  const [local] = splitProps(props, [
    'children',
    'value',
    'disabled',
    'class',
    'classList',
    'style',
    'data-ui'
  ])

  return (
    <RadioItem<Value>
      data-ui='radio-item'
      value={local.value}
      disabled={local.disabled}
      ref={element => bindActiveAttribute(element, ['data-checked', 'aria-checked'])}
    >
      <RadioGroup.ItemInput />
      <RadioItemControl data-ui='radio'>
        <RadioGroup.ItemIndicator />
      </RadioItemControl>
      {local.children}
    </RadioItem>
  )
}
