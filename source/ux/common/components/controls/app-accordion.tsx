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

import { Accordion } from '@kobalte/core/accordion'
import { type JSX, splitProps } from '@solid-js'
import { controlState } from './controls-helpers.ts'

/** Accordion root props. */
export type AppAccordionProps = {
  children?: JSX.Element
  error?: boolean
  loading?: boolean
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

type AppAccordionRootProps = {
  children?: JSX.Element
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (value: string[]) => void
  'data-ui': 'accordion'
  'data-ui-state'?: 'error' | 'disabled' | 'loading'
}

type AppAccordionItemRootProps = {
  children?: JSX.Element
  value: string
  disabled?: boolean
  'data-ui': 'accordion-item'
}

type AppAccordionTriggerRootProps = {
  children?: JSX.Element
  'data-ui': 'accordion-trigger'
}

type AppAccordionContentRootProps = {
  children?: JSX.Element
  'data-ui': 'accordion-content'
}

const AccordionRoot = Accordion as unknown as (props: AppAccordionRootProps) => JSX.Element
const AccordionItem = Accordion.Item as unknown as (
  props: AppAccordionItemRootProps
) => JSX.Element
const AccordionTrigger = Accordion.Trigger as unknown as (
  props: AppAccordionTriggerRootProps
) => JSX.Element
const AccordionContent = Accordion.Content as unknown as (
  props: AppAccordionContentRootProps
) => JSX.Element

/** Accordion root with declared states. */
export const AppAccordion = (props: AppAccordionProps): JSX.Element => {
  const [local] = splitProps(props, [
    'children',
    'error',
    'loading',
    'value',
    'defaultValue',
    'onValueChange',
    'class',
    'classList',
    'style',
    'data-ui',
    'data-ui-state'
  ])

  return (
    <AccordionRoot
      data-ui='accordion'
      data-ui-state={controlState(local)}
      value={local.value}
      defaultValue={local.defaultValue}
      onValueChange={local.onValueChange}
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
    'disabled',
    'class',
    'classList',
    'style',
    'data-ui'
  ])

  return (
    <AccordionItem data-ui='accordion-item' value={local.value} disabled={local.disabled}>
      {local.children}
    </AccordionItem>
  )
}

/** Accordion trigger control for AppAccordionItem. */
export const AppAccordionTrigger = (props: AppAccordionTriggerProps): JSX.Element => {
  const [local] = splitProps(props, ['children', 'class', 'classList', 'style', 'data-ui'])

  return (
    <Accordion.Header>
      <AccordionTrigger data-ui='accordion-trigger'>{local.children}</AccordionTrigger>
    </Accordion.Header>
  )
}

/** Accordion content control for AppAccordionItem. */
export const AppAccordionContent = (props: AppAccordionContentProps): JSX.Element => {
  const [local] = splitProps(props, ['children', 'class', 'classList', 'style', 'data-ui'])

  return <AccordionContent data-ui='accordion-content'>{local.children}</AccordionContent>
}
