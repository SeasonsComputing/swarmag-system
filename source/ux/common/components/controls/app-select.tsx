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
AppSelect  Single-value select control with declared states.
*/

import { Select } from '@kobalte/core/select'
import { type JSX, splitProps } from '@solid-js'
import { controlState } from './controls-helpers.ts'

type CollectionItem = { rawValue: string; key: string }

/** Select control props. */
export type AppSelectProps = {
  disabled?: boolean
  error?: boolean
  id?: string
  loading?: boolean
  options: ReadonlyArray<string>
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  placeholder?: string
  class?: never
  classList?: never
  style?: never
  'data-ui'?: never
  'data-ui-state'?: never
}

type AppSelectRootProps = {
  options: ReadonlyArray<string>
  disabled?: boolean
  validationState?: 'valid' | 'invalid'
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  itemComponent?: (props: { item: CollectionItem }) => JSX.Element
  children?: JSX.Element
}

type AppSelectContentProps = {
  'data-ui': 'select-content'
  children?: JSX.Element
}

type AppSelectItemProps = {
  item: CollectionItem
  'data-ui': 'select-item'
  children?: JSX.Element
}

const SelectRoot = Select as unknown as (props: AppSelectRootProps) => JSX.Element
const SelectContent = Select.Content as unknown as (props: AppSelectContentProps) => JSX.Element
const SelectItem = Select.Item as unknown as (props: AppSelectItemProps) => JSX.Element

/** Single-value select control with declared states. */
export const AppSelect = (props: AppSelectProps): JSX.Element => {
  const [local] = splitProps(props, [
    'disabled',
    'error',
    'id',
    'loading',
    'options',
    'value',
    'defaultValue',
    'onChange',
    'placeholder',
    'class',
    'classList',
    'style',
    'data-ui',
    'data-ui-state'
  ])

  return (
    <SelectRoot
      options={local.options}
      disabled={local.disabled || local.loading}
      validationState={local.error ? 'invalid' : undefined}
      value={local.value}
      defaultValue={local.defaultValue}
      onChange={local.onChange}
      itemComponent={item => (
        <SelectItem data-ui='select-item' item={item.item}>
          {item.item.rawValue}
        </SelectItem>
      )}
    >
      <Select.Trigger id={local.id} data-ui='select' data-ui-state={controlState(local)}>
        <Select.Value<string> placeholder={local.placeholder ?? ''}>
          {state => state.selectedOption() ?? ''}
        </Select.Value>
      </Select.Trigger>
      <Select.Portal>
        <SelectContent data-ui='select-content'>
          <Select.Listbox />
        </SelectContent>
      </Select.Portal>
    </SelectRoot>
  )
}
