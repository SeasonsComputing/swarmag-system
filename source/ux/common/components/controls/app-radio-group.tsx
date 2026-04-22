/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ App radio group control                                                      ║
║ Semantic wrapper for the Kobalte RadioGroup primitive.                       ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Emits radio-group control semantics without styling concerns.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AppRadioGroup  Radio-group control with declared states.
AppRadioItem   Radio item control for AppRadioGroup.
*/

import { RadioGroup } from '@kobalte/core/radio-group'
import { type JSX, splitProps } from '@solid-js'
import { controlState } from './controls-helpers.ts'

/** Radio-group control props. */
export type AppRadioGroupProps = {
  children?: JSX.Element
  disabled?: boolean
  error?: boolean
  loading?: boolean
  name?: string
  required?: boolean
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  class?: never
  classList?: never
  style?: never
  'data-ui'?: never
  'data-ui-state'?: never
}

/** Radio item control props. */
export type AppRadioItemProps = {
  children?: JSX.Element
  value: string
  disabled?: boolean
  class?: never
  classList?: never
  style?: never
  'data-ui'?: never
}

type AppRadioItemRootProps = {
  children?: JSX.Element
  value: string
  disabled?: boolean
  'data-ui': 'radio'
}

const RadioGroupItem = RadioGroup.Item as unknown as (
  props: AppRadioItemRootProps
) => JSX.Element

/** Radio-group control with declared states. */
export const AppRadioGroup = (props: AppRadioGroupProps): JSX.Element => {
  const [local] = splitProps(props, [
    'children',
    'disabled',
    'error',
    'loading',
    'name',
    'required',
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
    <RadioGroup
      data-ui='radio-group'
      data-ui-state={controlState(local)}
      disabled={local.disabled || local.loading}
      name={local.name}
      required={local.required}
      value={local.value}
      defaultValue={local.defaultValue}
      onChange={local.onChange}
      validationState={local.error ? 'invalid' : undefined}
    >
      {local.children}
    </RadioGroup>
  )
}

/** Radio item control for AppRadioGroup. */
export const AppRadioItem = (props: AppRadioItemProps): JSX.Element => {
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
    <RadioGroupItem data-ui='radio' value={local.value} disabled={local.disabled}>
      {local.children}
    </RadioGroupItem>
  )
}
