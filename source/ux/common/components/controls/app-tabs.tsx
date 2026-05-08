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
AppTab   Tab trigger control for AppTabs.
AppTabList   Tab list control for AppTabs.
AppTabPanel  Tab panel control for AppTabs.
*/

import { Tabs } from '@kobalte/core/tabs'
import { type JSX, splitProps } from '@solid-js'
import { bindActiveAttribute, controlState } from './controls-helpers.ts'

/** Tabs control props. */
export type AppTabsProps<Value extends string = string> = {
  children?: JSX.Element
  disabled?: boolean
  error?: boolean
  loading?: boolean
  value?: Value
  defaultValue?: Value
  onChange?: (value: Value) => void
  class?: never
  classList?: never
  style?: never
  'data-ui'?: never
  'data-ui-state'?: never
}

/** Tab list control props. */
export type AppTabListProps = {
  children?: JSX.Element
  class?: never
  classList?: never
  style?: never
  'data-ui'?: never
}

/** Tab trigger control props. */
export type AppTabProps<Value extends string = string> = {
  children?: JSX.Element
  value: Value
  disabled?: boolean
  class?: never
  classList?: never
  style?: never
  'data-ui'?: never
}

/** Tab panel control props. */
export type AppTabPanelProps<Value extends string = string> = {
  children?: JSX.Element
  value: Value
  class?: never
  classList?: never
  style?: never
  'data-ui'?: never
}

type AppTabListRootProps = {
  children?: JSX.Element
  'data-ui': 'tab-list'
}

type AppTabsRootProps<Value extends string = string> = {
  children?: JSX.Element
  value?: Value
  defaultValue?: Value
  onChange?: (value: Value) => void
  'data-ui': 'tabs'
  'data-ui-state'?: 'error' | 'disabled' | 'loading'
}

type AppTabRootProps<Value extends string> = {
  children?: JSX.Element
  value: Value
  disabled?: boolean
  'data-ui': 'tab'
  ref?: (element: HTMLButtonElement) => void
}

type AppTabPanelRootProps<Value extends string> = {
  children?: JSX.Element
  value: Value
  'data-ui': 'tab-panel'
}

const TabsRoot = Tabs as unknown as <Value extends string = string>(
  props: AppTabsRootProps<Value>
) => JSX.Element
const TabsList = Tabs.List as unknown as (props: AppTabListRootProps) => JSX.Element
const TabsTrigger = Tabs.Trigger as unknown as <Value extends string = string>(
  props: AppTabRootProps<Value>
) => JSX.Element
const TabsContent = Tabs.Content as unknown as <Value extends string = string>(
  props: AppTabPanelRootProps<Value>
) => JSX.Element

/** Tabs control with declared states. */
export const AppTabs = <Value extends string = string>(
  props: AppTabsProps<Value>
): JSX.Element => {
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
    <TabsRoot<Value>
      data-ui='tabs'
      data-ui-state={controlState(local)}
      value={local.value}
      defaultValue={local.defaultValue}
      onChange={local.onChange}
    >
      {local.children}
    </TabsRoot>
  )
}

/** Tab list control for AppTabs. */
export const AppTabList = (props: AppTabListProps): JSX.Element => {
  const [local] = splitProps(props, ['children', 'class', 'classList', 'style', 'data-ui'])
  return <TabsList data-ui='tab-list'>{local.children}</TabsList>
}

/** Tab trigger control for AppTabs. */
export const AppTab = <Value extends string = string>(
  props: AppTabProps<Value>
): JSX.Element => {
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
    <TabsTrigger<Value>
      data-ui='tab'
      value={local.value}
      disabled={local.disabled}
      ref={element => bindActiveAttribute(element, ['data-selected', 'aria-selected'])}
    >
      {local.children}
    </TabsTrigger>
  )
}

/** Tab panel control for AppTabs. */
export const AppTabPanel = <Value extends string = string>(
  props: AppTabPanelProps<Value>
): JSX.Element => {
  const [local] = splitProps(props, ['children', 'value', 'class', 'classList', 'style', 'data-ui'])
  return <TabsContent<Value> data-ui='tab-panel' value={local.value}>{local.children}</TabsContent>
}
