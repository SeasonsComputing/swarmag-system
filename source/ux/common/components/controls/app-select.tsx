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

import {
  Select,
  type SelectRootItemComponentProps
} from '@kobalte/core/select'
import { type JSX, splitProps } from '@solid-js'
import { type AppOption, appOptionLabel, controlState } from './controls-helpers.ts'

type CollectionItem = { rawValue: AppOption; key: string }

/** Select control props. */
export type AppSelectProps = {
  disabled?: boolean
  error?: boolean
  id?: string
  loading?: boolean
  options: ReadonlyArray<AppOption>
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

const SelectRoot = Select as unknown as typeof Select
const SelectContent = Select.Content as unknown as typeof Select.Content
const SelectItem = Select.Item as unknown as typeof Select.Item

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
    'placeholder'
  ])

  return (
    <SelectRoot
      options={local.options as AppOption[]}
      optionValue='value'
      optionTextValue={appOptionLabel}
      disabled={local.disabled || local.loading}
      validationState={local.error ? 'invalid' : undefined}
      placeholder={local.placeholder}
      {...(local.value === undefined ? {} : { value: local.options.find(o => o.value === local.value) ?? null })}
      defaultValue={local.options.find(o => o.value === local.defaultValue)}
      onChange={(option: AppOption | null) => local.onChange?.(option?.value ?? '')}
      itemComponent={(item: SelectRootItemComponentProps<AppOption>) => (
        <SelectItem data-ui='select-item' item={item.item}>
          {appOptionLabel(item.item.rawValue)}
        </SelectItem>
      )}
    >
      <Select.Trigger id={local.id} data-ui='select' data-ui-state={controlState(local)}>
        <Select.Value<AppOption>>
          {state => state.selectedOption() ? appOptionLabel(state.selectedOption()!) : (local.placeholder ?? '')}
        </Select.Value>
        <Select.Icon data-ui='select-icon'>
          <span data-ui='select-icon-glyph' />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <SelectContent data-ui='select-content'>
          <Select.Listbox />
        </SelectContent>
      </Select.Portal>
    </SelectRoot>
  )
}
