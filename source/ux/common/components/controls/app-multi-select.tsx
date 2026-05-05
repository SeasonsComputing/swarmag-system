/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ App multi-select control                                                     ║
║ Semantic wrapper for the Kobalte Listbox primitive.                          ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Emits multi-select control semantics without styling concerns.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AppMultiSelect  Inline multi-value select control with declared states.
*/

import { Listbox } from '@kobalte/core/listbox'
import { type JSX, splitProps } from '@solid-js'
import { controlState } from './controls-helpers.ts'

type CollectionItem = { rawValue: string; key: string }

/** Multi-select control props. */
export type AppMultiSelectProps = {
  disabled?: boolean
  error?: boolean
  loading?: boolean
  options: ReadonlyArray<string>
  value?: string[]
  defaultValue?: string[]
  onChange?: (value: string[]) => void
  class?: never
  classList?: never
  style?: never
  'data-ui'?: never
  'data-ui-state'?: never
}

type AppMultiSelectRootProps = {
  options: ReadonlyArray<string>
  disabled?: boolean
  selectionMode?: 'multiple'
  value?: string[]
  defaultValue?: string[]
  onChange?: (value: string[]) => void
  renderItem?: (item: CollectionItem) => JSX.Element
  'data-ui': 'multi-select'
  'data-ui-state'?: string
}

type AppMultiSelectItemProps = {
  item: CollectionItem
  'data-ui': 'multi-select-item'
  children?: JSX.Element
}

const ListboxRoot = Listbox as unknown as (props: AppMultiSelectRootProps) => JSX.Element
const ListboxItem = Listbox.Item as unknown as (props: AppMultiSelectItemProps) => JSX.Element

/** Inline multi-value select control with declared states. */
export const AppMultiSelect = (props: AppMultiSelectProps): JSX.Element => {
  const [local] = splitProps(props, [
    'disabled',
    'error',
    'loading',
    'options',
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
    <ListboxRoot
      data-ui='multi-select'
      data-ui-state={controlState(local)}
      options={local.options}
      disabled={local.disabled || local.loading}
      selectionMode='multiple'
      value={local.value}
      defaultValue={local.defaultValue}
      onChange={local.onChange}
      renderItem={item => (
        <ListboxItem data-ui='multi-select-item' item={item}>
          {item.rawValue}
        </ListboxItem>
      )}
    />
  )
}
