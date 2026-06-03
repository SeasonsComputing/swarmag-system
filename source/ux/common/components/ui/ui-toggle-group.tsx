/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Ui toggle group control                                                     ║
║ Semantic wrapper for the Kobalte ToggleGroup primitive.                      ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Emits toggle-group control semantics without styling concerns.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
UiToggleGroup  Toggle-group control with declared states.
UiToggleItem   Toggle item control for UiToggleGroup.
*/

import {
  ToggleGroup,
  type ToggleGroupItemProps,
  type ToggleGroupRootProps
} from '@kobalte/core/toggle-group'
import { type Component, createEffect, createSignal, splitProps } from '@solid-js'
import { controlState, type UiComponent, type UiComponentProps, type WithDataUi } from './ui-helpers.ts'

/** Toggle-group control props. */
export type UiToggleGroupProps<Value extends string = string> = UiComponentProps & {
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
export type UiToggleItemProps<Value extends string = string> = UiComponentProps & {
  value: Value
  disabled?: boolean
  class?: never
  classList?: never
  style?: never
  'data-ui'?: never
}

const ToggleGroupRoot = ToggleGroup as Component<WithDataUi<ToggleGroupRootProps>>
const ToggleGroupItem = ToggleGroup.Item as Component<WithDataUi<ToggleGroupItemProps>>

/** Toggle-group control with declared states. */
export const UiToggleGroup = <Value extends string = string>(
  props: UiToggleGroupProps<Value>
): UiComponent => {
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

/** Toggle item control for UiToggleGroup. */
export const UiToggleItem = <Value extends string = string>(
  props: UiToggleItemProps<Value>
): UiComponent => {
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
