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

import {
  Tabs,
  type TabsContentProps,
  type TabsListProps,
  type TabsRootProps,
  type TabsTriggerProps
} from '@kobalte/core/tabs'
import { type Component, splitProps } from '@solid-js'
import {
  type AppComponent,
  type AppComponentProps,
  controlState,
  type WithDataUI
} from './ui-helpers.ts'

/** Tabs control props. */
export type AppTabsActivationMode = 'automatic' | 'manual'

/** Tabs control props. */
export type AppTabsProps<Value extends string = string> = AppComponentProps & {
  disabled?: boolean
  error?: boolean
  loading?: boolean
  value?: Value
  defaultValue?: Value
  activationMode?: AppTabsActivationMode
  onChange?: (value: Value) => void
  class?: never
  classList?: never
  style?: never
  'data-ui'?: never
  'data-ui-state'?: never
}

/** Tab list control props. */
export type AppTabListProps = AppComponentProps & {
  class?: never
  classList?: never
  style?: never
  'data-ui'?: never
}

/** Tab trigger control props. */
export type AppTabProps<Value extends string = string> = AppComponentProps & {
  value: Value
  disabled?: boolean
  class?: never
  classList?: never
  style?: never
  'data-ui'?: never
}

/** Tab panel control props. */
export type AppTabPanelProps<Value extends string = string> = AppComponentProps & {
  value: Value
  class?: never
  classList?: never
  style?: never
  'data-ui'?: never
}

const TabsRoot = Tabs as Component<WithDataUI<TabsRootProps>>
const TabsList = Tabs.List as Component<WithDataUI<TabsListProps>>
const TabsTrigger = Tabs.Trigger as Component<WithDataUI<TabsTriggerProps>>
const TabsContent = Tabs.Content as Component<WithDataUI<TabsContentProps>>

/** Tabs control with declared states. */
export const AppTabs = <Value extends string = string>(
  props: AppTabsProps<Value>
): AppComponent => {
  const [local] = splitProps(props, [
    'children',
    'disabled',
    'error',
    'loading',
    'value',
    'defaultValue',
    'activationMode',
    'onChange'
  ])

  return (
    <TabsRoot
      data-ui='tabs'
      data-ui-state={controlState(local)}
      disabled={local.disabled}
      value={local.value}
      defaultValue={local.defaultValue}
      activationMode={local.activationMode ?? 'manual'}
      onChange={(value: string) => local.onChange?.(value as Value)}
    >
      {local.children}
    </TabsRoot>
  )
}

/** Tab list control for AppTabs. */
export const AppTabList = (props: AppTabListProps): AppComponent => {
  const [local] = splitProps(props, ['children'])
  return <TabsList data-ui='tab-list'>{local.children}</TabsList>
}

/** Tab trigger control for AppTabs. */
export const AppTab = <Value extends string = string>(
  props: AppTabProps<Value>
): AppComponent => {
  const [local] = splitProps(props, [
    'children',
    'value',
    'disabled'
  ])

  return (
    <TabsTrigger
      data-ui='tab'
      value={local.value}
      disabled={local.disabled}
    >
      {local.children}
    </TabsTrigger>
  )
}

/** Tab panel control for AppTabs. */
export const AppTabPanel = <Value extends string = string>(
  props: AppTabPanelProps<Value>
): AppComponent => {
  const [local] = splitProps(props, ['children', 'value'])
  return <TabsContent data-ui='tab-panel' value={local.value}>{local.children}</TabsContent>
}
