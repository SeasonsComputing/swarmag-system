/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Ui multi-select control                                                     ║
║ Semantic wrapper for the Kobalte Listbox primitive.                          ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Emits multi-select control semantics without styling concerns.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
UiMultiSelect  Inline multi-value select control with declared states.
*/

import { type StringSet } from '@core/std'
import { Listbox, type ListboxItemOptions } from '@kobalte/core/listbox'
import { splitProps } from '@solid-js'
import { controlState, type UiComponent, type UiOption, uiOptionLabel } from './ui-helpers.ts'

/** Multi-select control props. */
export type UiMultiSelectProps = {
  disabled?: boolean
  error?: boolean
  id?: string
  loading?: boolean
  name?: string
  options: ReadonlyArray<UiOption>
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
export const UiMultiSelect = (props: UiMultiSelectProps): UiComponent => {
  const [local] = splitProps(props, [
    'disabled',
    'error',
    'id',
    'loading',
    'name',
    'options',
    'value',
    'defaultValue',
    'onChange'
  ])
  return (
    <ListboxRoot
      id={local.id ?? local.name}
      data-ui='multi-select'
      data-ui-state={controlState(local)}
      options={local.options as UiOption[]}
      optionValue='value'
      optionTextValue={uiOptionLabel}
      selectionMode='multiple'
      value={local.value}
      defaultValue={local.defaultValue}
      onChange={(selected: StringSet) => local.onChange?.([...selected])}
      renderItem={(item: ListboxItemOptions['item']) => (
        <ListboxItem data-ui='multi-select-item' item={item}>
          {uiOptionLabel((item as unknown as { rawValue: UiOption }).rawValue)}
        </ListboxItem>
      )}
    />
  )
}
