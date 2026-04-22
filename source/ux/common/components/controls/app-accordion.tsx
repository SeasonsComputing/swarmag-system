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
AppAccordion  Accordion control with declared states.
*/

import { Accordion } from '@kobalte/core/accordion'
import { type JSX, splitProps } from '@solid-js'
import { controlState } from './controls-helpers.ts'

/** Accordion control props. */
export type AppAccordionProps = {
  children?: JSX.Element
  disabled?: boolean
  error?: boolean
  loading?: boolean
  value?: string[]
  defaultValue?: string[]
  onChange?: (value: string[]) => void
  class?: never
  classList?: never
  style?: never
  'data-ui'?: never
  'data-ui-state'?: never
}

type AppAccordionRootProps = {
  children?: JSX.Element
  value?: string[]
  defaultValue?: string[]
  onChange?: (value: string[]) => void
  'data-ui': 'accordion'
  'data-ui-state'?: 'error' | 'disabled' | 'loading'
}

const AccordionRoot = Accordion as unknown as (props: AppAccordionRootProps) => JSX.Element

/** Accordion control with declared states. */
export const AppAccordion = (props: AppAccordionProps): JSX.Element => {
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
    <AccordionRoot
      data-ui='accordion'
      data-ui-state={controlState(local)}
      value={local.value}
      defaultValue={local.defaultValue}
      onChange={local.onChange}
    >
      {local.children}
    </AccordionRoot>
  )
}
