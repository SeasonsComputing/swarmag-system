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
UiTabs      Tabs control with declared states.
UiTab       Tab trigger control for UiTabs.
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
import {
  type Accessor,
  type Component,
  createContext,
  onCleanup,
  onMount,
  splitProps,
  useContext
} from '@solid-js'
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
  layout?: UiTabListLayout
  class?: never
  classList?: never
  style?: never
  'data-ui'?: never
  'data-ui-layout'?: never
}

/** Tab list layout modes. */
export type UiTabListLayout = 'between'

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
const TabsList = Tabs.List as Component<TabListDataProps>
const TabsTrigger = Tabs.Trigger as Component<WithDataUi<TabsTriggerProps>>
const TabsContent = Tabs.Content as Component<WithDataUi<TabsContentProps>>

type TabListDataProps = WithDataUi<TabsListProps> & {
  'data-ui-layout'?: UiTabListLayout
}

type UiTabsContextValue = {
  activationMode: Accessor<UiTabsActivationMode>
}

const UiTabsContext = createContext<UiTabsContextValue>()

const AUTOMATIC_ACTIVATION_KEYS = [
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'End',
  'Home'
] as const

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
  const activationMode = (): UiTabsActivationMode => local.activationMode ?? 'manual'
  return (
    <UiTabsContext.Provider value={{ activationMode }}>
      <TabsRoot
        data-ui='tabs'
        data-ui-state={controlState(local)}
        disabled={local.disabled}
        value={local.value}
        defaultValue={local.defaultValue}
        activationMode={activationMode()}
        onChange={(value: string) => local.onChange?.(value as Value)}
      >
        {local.children}
      </TabsRoot>
    </UiTabsContext.Provider>
  )
}

/** Tab list control for UiTabs. */
export const UiTabList = (props: UiTabListProps): UiComponent => {
  const [local] = splitProps(props, ['children', 'layout'])
  const context = useContext(UiTabsContext)
  let tabListElement!: HTMLElement

  const activateFocusedTab = (event: KeyboardEvent): void => {
    if (context?.activationMode() !== 'automatic') return
    if (!AUTOMATIC_ACTIVATION_KEYS.includes(event.key as typeof AUTOMATIC_ACTIVATION_KEYS[number])) {
      return
    }

    queueMicrotask(() => {
      const activeElement = document.activeElement
      if (!(activeElement instanceof HTMLButtonElement)) return
      if (!tabListElement.contains(activeElement)) return
      if (activeElement.hasAttribute('data-selected')) return
      activeElement.click()
    })
  }

  return (
    <TabsList
      ref={tabListElement}
      data-ui='tab-list'
      data-ui-layout={local.layout}
      onKeyDown={activateFocusedTab}
    >
      {local.children}
    </TabsList>
  )
}

/** Tab trigger control for UiTabs. */
export const UiTab = <Value extends string = string>(
  props: UiTabProps<Value>
): UiComponent => {
  let tabElement!: HTMLButtonElement
  const [local] = splitProps(props, [
    'children',
    'value',
    'disabled'
  ])

  onMount(() => {
    scrollSelectedTabIntoView(tabElement)
    const observer = new MutationObserver(() => scrollSelectedTabIntoView(tabElement))
    observer.observe(tabElement, {
      attributes: true,
      attributeFilter: ['data-selected']
    })
    onCleanup(() => observer.disconnect())
  })

  return (
    <TabsTrigger
      ref={tabElement}
      data-ui='tab'
      value={local.value}
      disabled={local.disabled}
      onClick={() => tabElement.focus()}
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

/** Scroll the selected tab trigger into view within its tab list. */
const scrollSelectedTabIntoView = (tabElement: HTMLElement): void => {
  if (!tabElement.hasAttribute('data-selected')) return
  tabElement.scrollIntoView({
    block: 'nearest',
    inline: 'nearest',
    behavior: 'smooth'
  })
}
