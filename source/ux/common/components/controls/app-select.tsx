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

type AppSelectRootProps = {
  children?: JSX.Element
  disabled?: boolean
  validationState?: 'valid' | 'invalid'
}

const SelectRoot = Select as unknown as (props: AppSelectRootProps) => JSX.Element

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
