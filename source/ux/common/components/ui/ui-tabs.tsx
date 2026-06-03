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
import { type Component, createSignal, onCleanup, onMount, splitProps } from '@solid-js'
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

const TAB_DRAG_THRESHOLD_PX = 4

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
  let tabListElement!: HTMLElement
  const [hasOverflow, setHasOverflow] = createSignal(false)
  const [isDragging, setIsDragging] = createSignal(false)
  const [local] = splitProps(props, ['children'])
  let dragStartX = 0
  let dragStartScrollLeft = 0
  let dragMoved = false
  let targetTabElement: HTMLButtonElement | null = null
  let replayingTabClick = false
  let suppressNextClick = false
  let clearSuppressionId: number | undefined

  const updateOverflow = (): void => {
    setHasOverflow(tabListElement.scrollWidth > tabListElement.clientWidth)
  }

  const findTargetTab = (event: Event): HTMLButtonElement | null => {
    if (!(event.target instanceof Element)) return null
    return event.target.closest('[data-ui=\'tab\']')
  }

  const clearClickSuppressionSoon = (): void => {
    if (clearSuppressionId !== undefined) clearTimeout(clearSuppressionId)
    clearSuppressionId = setTimeout(() => {
      suppressNextClick = false
      clearSuppressionId = undefined
    })
  }

  const startDrag = (event: PointerEvent): void => {
    if (!hasOverflow() || event.pointerType !== 'mouse') return
    event.preventDefault()
    event.stopPropagation()
    dragStartX = event.clientX
    dragStartScrollLeft = tabListElement.scrollLeft
    dragMoved = false
    suppressNextClick = true
    targetTabElement = findTargetTab(event)
    setIsDragging(true)
    tabListElement.setPointerCapture(event.pointerId)
  }

  const dragTabs = (event: PointerEvent): void => {
    if (!isDragging()) return
    event.preventDefault()
    event.stopPropagation()
    const dragDistance = event.clientX - dragStartX
    if (Math.abs(dragDistance) > TAB_DRAG_THRESHOLD_PX) dragMoved = true
    tabListElement.scrollLeft = dragStartScrollLeft - dragDistance
  }

  const stopDrag = (event: PointerEvent): void => {
    if (!isDragging()) return
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)
    tabListElement.releasePointerCapture(event.pointerId)
    if (!dragMoved) {
      replayingTabClick = true
      targetTabElement?.click()
      replayingTabClick = false
    }
    targetTabElement = null
    dragMoved = false
    clearClickSuppressionSoon()
  }

  const cancelDrag = (event: PointerEvent): void => {
    if (!isDragging()) return
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)
    tabListElement.releasePointerCapture(event.pointerId)
    targetTabElement = null
    dragMoved = false
    clearClickSuppressionSoon()
  }

  const suppressCapturedTabClick = (event: MouseEvent): void => {
    if (replayingTabClick || !suppressNextClick) return
    event.preventDefault()
    event.stopPropagation()
    suppressNextClick = false
    if (clearSuppressionId !== undefined) clearTimeout(clearSuppressionId)
    clearSuppressionId = undefined
  }

  onMount(() => {
    updateOverflow()
    const observer = new ResizeObserver(updateOverflow)
    observer.observe(tabListElement)
    tabListElement.addEventListener('pointerdown', startDrag, true)
    tabListElement.addEventListener('pointermove', dragTabs, true)
    tabListElement.addEventListener('pointerup', stopDrag, true)
    tabListElement.addEventListener('pointercancel', cancelDrag, true)
    tabListElement.addEventListener('click', suppressCapturedTabClick, true)
    onCleanup(() => {
      observer.disconnect()
      tabListElement.removeEventListener('pointerdown', startDrag, true)
      tabListElement.removeEventListener('pointermove', dragTabs, true)
      tabListElement.removeEventListener('pointerup', stopDrag, true)
      tabListElement.removeEventListener('pointercancel', cancelDrag, true)
      tabListElement.removeEventListener('click', suppressCapturedTabClick, true)
      if (clearSuppressionId !== undefined) clearTimeout(clearSuppressionId)
    })
  })

  return (
    <TabsList
      ref={tabListElement}
      data-ui='tab-list'
      data-ui-overflow={hasOverflow() ? 'scroll' : undefined}
      data-ui-state={isDragging() ? 'dragging' : undefined}
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
