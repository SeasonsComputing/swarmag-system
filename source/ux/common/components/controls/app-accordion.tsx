/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ App accordion control                                                        ║
║ Semantic wrapper for the Kobalte Accordion primitive.                        ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Emits accordion control semantics without styling concerns.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AppAccordion         Accordion root with declared states.
AppAccordionItem     Accordion item control for AppAccordion.
AppAccordionTrigger  Accordion trigger control for AppAccordionItem.
AppAccordionContent  Accordion content control for AppAccordionItem.
*/

import {
  Accordion,
  type AccordionContentProps,
  type AccordionRootProps,
  type AccordionTriggerProps
} from '@kobalte/core/accordion'
import { type Component, splitProps } from '@solid-js'
import {
  type AppComponent,
  type AppComponentProps,
  controlState,
  type WithDataUI
} from './controls-helpers.ts'

/** Accordion root props. */
export type AppAccordionProps = AppComponentProps & {
  error?: boolean
  loading?: boolean
  multiple?: boolean
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (value: string[]) => void
  class?: never
  classList?: never
  style?: never
  'data-ui'?: never
  'data-ui-state'?: never
}

/** Accordion item props. */
export type AppAccordionItemProps = AppComponentProps & {
  value: string
  disabled?: boolean
  class?: never
  classList?: never
  style?: never
  'data-ui'?: never
}

/** Accordion trigger props. */
export type AppAccordionTriggerProps = AppComponentProps & {
  class?: never
  classList?: never
  style?: never
  'data-ui'?: never
}

/** Accordion content props. */
export type AppAccordionContentProps = AppComponentProps & {
  class?: never
  classList?: never
  style?: never
  'data-ui'?: never
}

const AccordionRoot = Accordion as Component<WithDataUI<AccordionRootProps>>
const AccordionItem = Accordion.Item as unknown as typeof Accordion.Item
const AccordionTrigger = Accordion.Trigger as Component<WithDataUI<AccordionTriggerProps>>
const AccordionContent = Accordion.Content as Component<WithDataUI<AccordionContentProps>>

/** Accordion root with declared states. */
export const AppAccordion = (props: AppAccordionProps): AppComponent => {
  const [local] = splitProps(props, [
    'children',
    'error',
    'loading',
    'multiple',
    'value',
    'defaultValue',
    'onValueChange'
  ])

  return (
    <AccordionRoot
      data-ui='accordion'
      data-ui-state={controlState(local)}
      multiple={local.multiple}
      value={local.value}
      defaultValue={local.defaultValue}
      onChange={local.onValueChange}
    >
      {local.children}
    </AccordionRoot>
  )
}

/** Accordion item control for AppAccordion. */
export const AppAccordionItem = (props: AppAccordionItemProps): AppComponent => {
  const [local] = splitProps(props, [
    'children',
    'value',
    'disabled'
  ])

  return (
    <AccordionItem data-ui='accordion-item' value={local.value} disabled={local.disabled}>
      {local.children}
    </AccordionItem>
  )
}

/** Accordion trigger control for AppAccordionItem. */
export const AppAccordionTrigger = (props: AppAccordionTriggerProps): AppComponent => {
  const [local] = splitProps(props, ['children'])

  return (
    <Accordion.Header>
      <AccordionTrigger data-ui='accordion-trigger'>{local.children}</AccordionTrigger>
    </Accordion.Header>
  )
}

/** Accordion content control for AppAccordionItem. */
export const AppAccordionContent = (props: AppAccordionContentProps): AppComponent => {
  const [local] = splitProps(props, ['children'])

  return <AccordionContent data-ui='accordion-content'>{local.children}</AccordionContent>
}
