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
AppSingleSelect  Single-value select control with declared states.
*/

import { Select, type SelectRootItemComponentProps } from '@kobalte/core/select'
import { splitProps } from '@solid-js'
import { type AppComponent, type AppOption, appOptionLabel, controlState } from './ui-helpers.ts'

type CollectionItem = { rawValue: AppOption; key: string }

/** Select control props. */
export type AppSingleSelectProps = {
  disabled?: boolean
  error?: boolean
  id?: string
  name?: string
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
export const AppSingleSelect = (props: AppSingleSelectProps): AppComponent => {
  const [local] = splitProps(props, [
    'disabled',
    'error',
    'id',
    'name',
    'loading',
    'options',
    'value',
    'defaultValue',
    'onChange',
    'placeholder'
  ])

  const handleChange = (option: AppOption | null): void => {
    if (option === null) return

    local.onChange?.(option.value)
  }

  return (
    <SelectRoot
      name={local.name}
      options={local.options as AppOption[]}
      optionValue='value'
      optionTextValue={appOptionLabel}
      disabled={local.disabled || local.loading}
      validationState={local.error ? 'invalid' : undefined}
      placeholder={local.placeholder}
      disallowEmptySelection
      gutter={4}
      modal={false}
      {...(local.value === undefined
        ? {}
        : { value: local.options.find(o => o.value === local.value) ?? null })}
      defaultValue={local.options.find(o => o.value === local.defaultValue)}
      onChange={handleChange}
      itemComponent={(item: SelectRootItemComponentProps<AppOption>) => (
        <SelectItem data-ui='single-select-item' item={item.item}>
          {appOptionLabel(item.item.rawValue)}
        </SelectItem>
      )}
    >
      <Select.Trigger
        id={local.id ?? local.name}
        data-ui='single-select'
        data-ui-state={controlState(local)}
      >
        <Select.Value<AppOption>>
          {state =>
            state.selectedOption() ? appOptionLabel(state.selectedOption()!) : (local.placeholder ?? '')}
        </Select.Value>
        <Select.Icon data-ui='single-select-icon'>
          <span data-ui='single-select-icon-glyph' />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <SelectContent data-ui='single-select-content'>
          <Select.Listbox autofocus />
        </SelectContent>
      </Select.Portal>
    </SelectRoot>
  )
}
