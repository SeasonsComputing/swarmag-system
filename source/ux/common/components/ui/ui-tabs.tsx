/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Ui tabs control                                                             ║
║ Semantic wrapper for the Kobalte Tabs primitive.                             ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Emits tabs control semantics without styling concerns.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
UiTabs  Tabs control with declared states.
UiTab   Tab trigger control for UiTabs.
UiTabList   Tab list control for UiTabs.
UiTabPanel  Tab panel control for UiTabs.
*/

import {
  Tabs,
  type TabsContentProps,
  type TabsListProps,
  type TabsRootProps,
  type TabsTriggerProps
} from '@kobalte/core/tabs'
import { type Component, splitProps } from '@solid-js'
import { controlState, type UiComponent, type UiComponentProps, type WithDataUi } from './ui-helpers.ts'

/** Tabs control props. */
export type UiTabsActivationMode = 'automatic' | 'manual'

/** Tabs control props. */
export type UiTabsProps<Value extends string = string> = UiComponentProps & {
  disabled?: boolean
  error?: boolean
  loading?: boolean
  value?: Value
  defaultValue?: Value
  activationMode?: UiTabsActivationMode
  onChange?: (value: Value) => void
  class?: never
  classList?: never
  style?: never
  'data-ui'?: never
  'data-ui-state'?: never
}

/** Tab list control props. */
export type UiTabListProps = UiComponentProps & {
  class?: never
  classList?: never
  style?: never
  'data-ui'?: never
}

/** Tab trigger control props. */
export type UiTabProps<Value extends string = string> = UiComponentProps & {
  value: Value
  disabled?: boolean
  class?: never
  classList?: never
  style?: never
  'data-ui'?: never
}

/** Tab panel control props. */
export type UiTabPanelProps<Value extends string = string> = UiComponentProps & {
  value: Value
  class?: never
  classList?: never
  style?: never
  'data-ui'?: never
}

const TabsRoot = Tabs as Component<WithDataUi<TabsRootProps>>
const TabsList = Tabs.List as Component<WithDataUi<TabsListProps>>
const TabsTrigger = Tabs.Trigger as Component<WithDataUi<TabsTriggerProps>>
const TabsContent = Tabs.Content as Component<WithDataUi<TabsContentProps>>

/** Tabs control with declared states. */
export const UiTabs = <Value extends string = string>(
  props: UiTabsProps<Value>
): UiComponent => {
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

/** Tab list control for UiTabs. */
export const UiTabList = (props: UiTabListProps): UiComponent => {
  const [local] = splitProps(props, ['children'])
  return <TabsList data-ui='tab-list'>{local.children}</TabsList>
}

/** Tab trigger control for UiTabs. */
export const UiTab = <Value extends string = string>(
  props: UiTabProps<Value>
): UiComponent => {
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

/** Tab panel control for UiTabs. */
export const UiTabPanel = <Value extends string = string>(
  props: UiTabPanelProps<Value>
): UiComponent => {
  const [local] = splitProps(props, ['children', 'value'])
  return <TabsContent data-ui='tab-panel' value={local.value}>{local.children}</TabsContent>
}
