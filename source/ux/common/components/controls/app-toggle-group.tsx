/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ App toggle group control                                                     ║
║ Semantic wrapper for the Kobalte ToggleGroup primitive.                      ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Emits toggle-group control semantics without styling concerns.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AppToggleGroup  Toggle-group control with declared states.
*/

import { ToggleGroup } from '@kobalte/core/toggle-group'
import { type JSX, splitProps } from '@solid-js'
import { controlState } from './controls-helpers.ts'

/** Toggle-group control props. */
export type AppToggleGroupProps = {
  children?: JSX.Element
  disabled?: boolean
  error?: boolean
  loading?: boolean
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  class?: never
  classList?: never
  style?: never
  'data-ui'?: never
  'data-ui-state'?: never
}

type AppToggleGroupRootProps = {
  children?: JSX.Element
  disabled?: boolean
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  multiple?: false
  'data-ui': 'toggle-group'
  'data-ui-state'?: 'error' | 'disabled' | 'loading'
}

const ToggleGroupRoot = ToggleGroup as unknown as (props: AppToggleGroupRootProps) => JSX.Element

/** Toggle-group control with declared states. */
export const AppToggleGroup = (props: AppToggleGroupProps): JSX.Element => {
  const [local] = splitProps(props, [
    'children',
    'disabled',
    'error',
    'loading',
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
    <ToggleGroupRoot
      data-ui='toggle-group'
      data-ui-state={controlState(local)}
      disabled={local.disabled || local.loading}
      multiple={false}
      value={local.value}
      defaultValue={local.defaultValue}
      onChange={local.onChange}
    >
      {local.children}
    </ToggleGroupRoot>
  )
}
