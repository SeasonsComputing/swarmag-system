/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ App toggle group control                                                     ║
║ Semantic wrapper for the Kobalte ToggleGroup primitive.                      ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Emits toggle-group control semantics without styling concerns.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AppToggleGroup  Toggle-group control with declared states.
AppToggleItem   Toggle item control for AppToggleGroup.
*/

import { ToggleGroup } from '@kobalte/core/toggle-group'
import { type JSX, splitProps } from '@solid-js'
import { bindActiveAttribute, controlState } from './controls-helpers.ts'

/** Toggle-group control props. */
export type AppToggleGroupProps<Value extends string = string> = {
  children?: JSX.Element
  disabled?: boolean
  error?: boolean
  loading?: boolean
  value?: Value
  defaultValue?: Value
  onChange?: (value: Value) => void
  class?: never
  classList?: never
  style?: never
  'data-ui'?: never
  'data-ui-state'?: never
}

/** Toggle item control props. */
export type AppToggleItemProps<Value extends string = string> = {
  children?: JSX.Element
  value: Value
  disabled?: boolean
  class?: never
  classList?: never
  style?: never
  'data-ui'?: never
}

type AppToggleGroupRootProps<Value extends string = string> = {
  children?: JSX.Element
  disabled?: boolean
  value?: Value
  defaultValue?: Value
  onChange?: (value: Value) => void
  multiple?: false
  'data-ui': 'toggle-group'
  'data-ui-state'?: 'error' | 'disabled' | 'loading'
}

type AppToggleItemRootProps<Value extends string = string> = {
  children?: JSX.Element
  value: Value
  disabled?: boolean
  'data-ui': 'toggle'
  ref?: (element: HTMLButtonElement) => void
}

const ToggleGroupRoot = ToggleGroup as unknown as <Value extends string = string>(
  props: AppToggleGroupRootProps<Value>
) => JSX.Element
const ToggleGroupItem = ToggleGroup.Item as unknown as <Value extends string = string>(
  props: AppToggleItemRootProps<Value>
) => JSX.Element

/** Toggle-group control with declared states. */
export const AppToggleGroup = <Value extends string = string>(
  props: AppToggleGroupProps<Value>
): JSX.Element => {
  const [local] = splitProps(props, [
    'children',
    'disabled',
    'error',
    'loading',
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
    <ToggleGroupRoot<Value>
      data-ui='toggle-group'
      data-ui-state={controlState(local)}
      disabled={local.disabled || local.loading}
      multiple={false}
      value={local.value}
      defaultValue={local.defaultValue}
      onChange={local.onChange}
    >
      {local.children}
    </ToggleGroupRoot>
  )
}

/** Toggle item control for AppToggleGroup. */
export const AppToggleItem = <Value extends string = string>(
  props: AppToggleItemProps<Value>
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
    <ToggleGroupItem<Value>
      data-ui='toggle'
      value={local.value}
      disabled={local.disabled}
      ref={element => bindActiveAttribute(element, ['data-checked', 'aria-pressed'])}
    >
      {local.children}
    </ToggleGroupItem>
  )
}
