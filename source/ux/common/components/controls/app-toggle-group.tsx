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

import {
  ToggleGroup,
  type ToggleGroupItemProps,
  type ToggleGroupRootProps
} from '@kobalte/core/toggle-group'
import { type Component, createEffect, createSignal, type JSX, splitProps } from '@solid-js'
import { controlState, type WithDataUI } from './controls-helpers.ts'

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

const ToggleGroupRoot = ToggleGroup as Component<WithDataUI<ToggleGroupRootProps>>
const ToggleGroupItem = ToggleGroup.Item as Component<WithDataUI<ToggleGroupItemProps>>

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
    'onChange'
  ])
  const [selectedValue, setSelectedValue] = createSignal<Value | undefined>(
    local.value ?? local.defaultValue
  )

  createEffect(() => {
    if (local.value !== undefined) {
      setSelectedValue(() => local.value)
    }
  })

  const handleChange = (value: string | null): void => {
    if (value === null) return

    const nextValue = value as Value
    if (local.value === undefined) {
      setSelectedValue(() => nextValue)
    }
    local.onChange?.(nextValue)
  }

  return (
    <ToggleGroupRoot
      data-ui='toggle-group'
      data-ui-state={controlState(local)}
      disabled={local.disabled || local.loading}
      value={selectedValue()}
      onChange={handleChange}
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
    'disabled'
  ])

  return (
    <ToggleGroupItem
      data-ui='toggle-item'
      value={local.value}
      disabled={local.disabled}
    >
      {local.children}
    </ToggleGroupItem>
  )
}
