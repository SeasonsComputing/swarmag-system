/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ App tabs control                                                             ║
║ Semantic wrapper for the Kobalte Tabs primitive.                             ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Emits tabs control semantics without styling concerns.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AppTabs  Tabs control with declared states.
*/

import { Tabs } from '@kobalte/core/tabs'
import { type JSX, splitProps } from '@solid-js'
import { controlState } from './controls-helpers.ts'

/** Tabs control props. */
export type AppTabsProps = {
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

/** Tabs control with declared states. */
export const AppTabs = (props: AppTabsProps): JSX.Element => {
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
    <Tabs
      data-ui='tabs'
      data-ui-state={controlState(local)}
      value={local.value}
      defaultValue={local.defaultValue}
      onChange={local.onChange}
    >
      {local.children}
    </Tabs>
  )
}
