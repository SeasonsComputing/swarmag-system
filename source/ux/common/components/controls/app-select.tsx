/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ App select control                                                           ║
║ Semantic wrapper for the Kobalte Select primitive.                           ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Emits select control semantics without styling concerns.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AppSelect         Single-value select control with declared states.
AppSelectContent  Select content control for AppSelect.
AppSelectItem     Select item control for AppSelect.
*/

import { Select } from '@kobalte/core/select'
import { type JSX, splitProps } from '@solid-js'
import { controlState } from './controls-helpers.ts'

/** Select control props. */
export type AppSelectProps = {
  children?: JSX.Element
  disabled?: boolean
  error?: boolean
  loading?: boolean
  class?: never
  classList?: never
  style?: never
  'data-ui'?: never
  'data-ui-state'?: never
}

/** Select content control props. */
export type AppSelectContentProps = {
  children?: JSX.Element
  class?: never
  classList?: never
  style?: never
  'data-ui'?: never
}

/** Select item control props. */
export type AppSelectItemProps = {
  children?: JSX.Element
  item: string
  disabled?: boolean
  class?: never
  classList?: never
  style?: never
  'data-ui'?: never
}

type AppSelectRootProps = {
  children?: JSX.Element
  disabled?: boolean
  validationState?: 'valid' | 'invalid'
}

type AppSelectContentRootProps = {
  children?: JSX.Element
  'data-ui': 'select-content'
}

type AppSelectItemRootProps = {
  children?: JSX.Element
  item: string
  disabled?: boolean
  'data-ui': 'select-item'
}

const SelectRoot = Select as unknown as (props: AppSelectRootProps) => JSX.Element
const SelectContent = Select.Content as unknown as (
  props: AppSelectContentRootProps
) => JSX.Element
const SelectItem = Select.Item as unknown as (props: AppSelectItemRootProps) => JSX.Element

/** Single-value select control with declared states. */
export const AppSelect = (props: AppSelectProps): JSX.Element => {
  const [local] = splitProps(props, [
    'children',
    'disabled',
    'error',
    'loading',
    'class',
    'classList',
    'style',
    'data-ui',
    'data-ui-state'
  ])

  return (
    <SelectRoot
      disabled={local.disabled || local.loading}
      validationState={local.error ? 'invalid' : undefined}
    >
      <Select.Trigger data-ui='select' data-ui-state={controlState(local)}>
        {local.children}
      </Select.Trigger>
    </SelectRoot>
  )
}

/** Select content control for AppSelect. */
export const AppSelectContent = (props: AppSelectContentProps): JSX.Element => {
  const [local] = splitProps(props, ['children', 'class', 'classList', 'style', 'data-ui'])
  return <SelectContent data-ui='select-content'>{local.children}</SelectContent>
}

/** Select item control for AppSelect. */
export const AppSelectItem = (props: AppSelectItemProps): JSX.Element => {
  const [local] = splitProps(props, [
    'children',
    'item',
    'disabled',
    'class',
    'classList',
    'style',
    'data-ui'
  ])

  return (
    <SelectItem data-ui='select-item' item={local.item} disabled={local.disabled}>
      {local.children}
    </SelectItem>
  )
}
