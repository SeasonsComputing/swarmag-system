/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Ui accordion control                                                         ║
║ Semantic wrapper for the Kobalte Accordion primitive.                        ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Emits accordion control semantics without styling concerns.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
UiAccordion         Accordion root with declared states.
UiAccordionItem     Accordion item control for UiAccordion.
UiAccordionTrigger  Accordion trigger control for UiAccordionItem.
UiAccordionContent  Accordion content control for UiAccordionItem.
*/

import {
  Accordion,
  type AccordionContentProps,
  type AccordionRootProps,
  type AccordionTriggerProps
} from '@kobalte/core/accordion'
import { type Component, splitProps } from '@solid-js'
import { controlState, type UiComponent, type UiComponentProps, type WithDataUi } from './ui-helpers.ts'

/** Accordion root props. */
export type UiAccordionProps = UiComponentProps & {
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
export type UiAccordionItemProps = UiComponentProps & {
  value: string
  disabled?: boolean
  class?: never
  classList?: never
  style?: never
  'data-ui'?: never
}

/** Accordion trigger props. */
export type UiAccordionTriggerProps = UiComponentProps & {
  class?: never
  classList?: never
  style?: never
  'data-ui'?: never
}

/** Accordion content props. */
export type UiAccordionContentProps = UiComponentProps & {
  class?: never
  classList?: never
  style?: never
  'data-ui'?: never
}

const AccordionRoot = Accordion as Component<WithDataUi<AccordionRootProps>>
const AccordionItem = Accordion.Item as unknown as typeof Accordion.Item
const AccordionTrigger = Accordion.Trigger as Component<WithDataUi<AccordionTriggerProps>>
const AccordionContent = Accordion.Content as Component<WithDataUi<AccordionContentProps>>

/** Accordion root with declared states. */
export const UiAccordion = (props: UiAccordionProps): UiComponent => {
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

/** Accordion item control for UiAccordion. */
export const UiAccordionItem = (props: UiAccordionItemProps): UiComponent => {
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

/** Accordion trigger control for UiAccordionItem. */
export const UiAccordionTrigger = (props: UiAccordionTriggerProps): UiComponent => {
  const [local] = splitProps(props, ['children'])
  return (
    <Accordion.Header>
      <AccordionTrigger
        data-ui='accordion-trigger'
        onClick={e => e.currentTarget.focus()}
      >
        {local.children}
      </AccordionTrigger>
    </Accordion.Header>
  )
}

/** Accordion content control for UiAccordionItem. */
export const UiAccordionContent = (props: UiAccordionContentProps): UiComponent => {
  const [local] = splitProps(props, ['children'])
  return <AccordionContent data-ui='accordion-content'>{local.children}</AccordionContent>
}
