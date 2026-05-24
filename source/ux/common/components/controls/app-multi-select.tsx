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

import { type StringSet } from '@core/std'
import { Listbox, type ListboxItemOptions } from '@kobalte/core/listbox'
import { splitProps } from '@solid-js'
import { type AppComponent, type AppOption, appOptionLabel, controlState } from './controls-helpers.ts'

/** Multi-select control props. */
export type AppMultiSelectProps = {
  disabled?: boolean
  error?: boolean
  loading?: boolean
  options: ReadonlyArray<AppOption>
  value?: string[]
  defaultValue?: string[]
  onChange?: (value: string[]) => void
  class?: never
  classList?: never
  style?: never
  'data-ui'?: never
  'data-ui-state'?: never
}

const ListboxRoot = Listbox as unknown as typeof Listbox
const ListboxItem = Listbox.Item as unknown as typeof Listbox.Item

/** Inline multi-value select control with declared states. */
export const AppMultiSelect = (props: AppMultiSelectProps): AppComponent => {
  const [local] = splitProps(props, [
    'disabled',
    'error',
    'loading',
    'options',
    'value',
    'defaultValue',
    'onChange'
  ])

  return (
    <ListboxRoot
      data-ui='multi-select'
      data-ui-state={controlState(local)}
      options={local.options as AppOption[]}
      optionValue='value'
      optionTextValue={appOptionLabel}
      selectionMode='multiple'
      value={local.value}
      defaultValue={local.defaultValue}
      onChange={(selected: StringSet) => local.onChange?.([...selected])}
      renderItem={(item: ListboxItemOptions['item']) => (
        <ListboxItem data-ui='multi-select-item' item={item}>
          {appOptionLabel((item as unknown as { rawValue: AppOption }).rawValue)}
        </ListboxItem>
      )}
    />
  )
}
