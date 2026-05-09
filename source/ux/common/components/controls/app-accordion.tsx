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
  type AccordionRootProps,
  type AccordionItemProps,
  type AccordionTriggerProps,
  type AccordionContentProps
} from '@kobalte/core/accordion'
import { type Component, type JSX, splitProps } from '@solid-js'
import { type WithDataUI, controlState, withDataUI } from './controls-helpers.ts'

/** Accordion root props. */
export type AppAccordionProps = {
  children?: JSX.Element
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
export type AppAccordionItemProps = {
  children?: JSX.Element
  value: string
  disabled?: boolean
  class?: never
  classList?: never
  style?: never
  'data-ui'?: never
}

/** Accordion trigger props. */
export type AppAccordionTriggerProps = {
  children?: JSX.Element
  class?: never
  classList?: never
  style?: never
  'data-ui'?: never
}

/** Accordion content props. */
export type AppAccordionContentProps = {
  children?: JSX.Element
  class?: never
  classList?: never
  style?: never
  'data-ui'?: never
}

const AccordionRoot = Accordion as Component<WithDataUI<AccordionRootProps>>
const AccordionItem = withDataUI<AccordionItemProps>(Accordion.Item)
const AccordionTrigger = Accordion.Trigger as Component<WithDataUI<AccordionTriggerProps>>
const AccordionContent = Accordion.Content as Component<WithDataUI<AccordionContentProps>>

/** Accordion root with declared states. */
export const AppAccordion = (props: AppAccordionProps): JSX.Element => {
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
export const AppAccordionItem = (props: AppAccordionItemProps): JSX.Element => {
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
export const AppAccordionTrigger = (props: AppAccordionTriggerProps): JSX.Element => {
  const [local] = splitProps(props, ['children'])

  return (
    <Accordion.Header>
      <AccordionTrigger data-ui='accordion-trigger'>{local.children}</AccordionTrigger>
    </Accordion.Header>
  )
}

/** Accordion content control for AppAccordionItem. */
export const AppAccordionContent = (props: AppAccordionContentProps): JSX.Element => {
  const [local] = splitProps(props, ['children'])

  return <AccordionContent data-ui='accordion-content'>{local.children}</AccordionContent>
}
