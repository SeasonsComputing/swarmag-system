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

/** Tab list control props. */
export type AppTabListProps = {
  children?: JSX.Element
  class?: never
  classList?: never
  style?: never
  'data-ui'?: never
}

/** Tab trigger control props. */
export type AppTabProps = {
  children?: JSX.Element
  value: string
  disabled?: boolean
  class?: never
  classList?: never
  style?: never
  'data-ui'?: never
}

/** Tab panel control props. */
export type AppTabPanelProps = {
  children?: JSX.Element
  value: string
  class?: never
  classList?: never
  style?: never
  'data-ui'?: never
}

type AppTabListRootProps = {
  children?: JSX.Element
  'data-ui': 'tab-list'
}

type AppTabRootProps = {
  children?: JSX.Element
  value: string
  disabled?: boolean
  'data-ui': 'tab'
}

type AppTabPanelRootProps = {
  children?: JSX.Element
  value: string
  'data-ui': 'tab-panel'
}

const TabsList = Tabs.List as unknown as (props: AppTabListRootProps) => JSX.Element
const TabsTrigger = Tabs.Trigger as unknown as (props: AppTabRootProps) => JSX.Element
const TabsContent = Tabs.Content as unknown as (props: AppTabPanelRootProps) => JSX.Element

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

/** Tab list control for AppTabs. */
export const AppTabList = (props: AppTabListProps): JSX.Element => {
  const [local] = splitProps(props, ['children', 'class', 'classList', 'style', 'data-ui'])
  return <TabsList data-ui='tab-list'>{local.children}</TabsList>
}

/** Tab trigger control for AppTabs. */
export const AppTab = (props: AppTabProps): JSX.Element => {
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
    <TabsTrigger data-ui='tab' value={local.value} disabled={local.disabled}>
      {local.children}
    </TabsTrigger>
  )
}

/** Tab panel control for AppTabs. */
export const AppTabPanel = (props: AppTabPanelProps): JSX.Element => {
  const [local] = splitProps(props, ['children', 'value', 'class', 'classList', 'style', 'data-ui'])
  return <TabsContent data-ui='tab-panel' value={local.value}>{local.children}</TabsContent>
}
