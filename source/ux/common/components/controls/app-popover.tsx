/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ App popover control                                                          ║
║ Semantic wrapper for the Kobalte Popover primitive.                          ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Emits popover control semantics without styling concerns.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AppPopover  Popover control with declared states.
*/

import { Popover } from '@kobalte/core/popover'
import { type JSX, splitProps } from '@solid-js'
import { controlState } from './controls-helpers.ts'

/** Popover control props. */
export type AppPopoverProps = {
  children?: JSX.Element
  trigger?: JSX.Element
  open?: boolean
  defaultOpen?: boolean
  error?: boolean
  loading?: boolean
  disabled?: boolean
  onOpenChange?: (open: boolean) => void
  class?: never
  classList?: never
  style?: never
  'data-ui'?: never
  'data-ui-state'?: never
}

/** Popover control with declared states. */
export const AppPopover = (props: AppPopoverProps): JSX.Element => {
  const [local] = splitProps(props, [
    'children',
    'trigger',
    'open',
    'defaultOpen',
    'error',
    'loading',
    'disabled',
    'onOpenChange',
    'class',
    'classList',
    'style',
    'data-ui',
    'data-ui-state'
  ])

  return (
    <Popover open={local.open} defaultOpen={local.defaultOpen} onOpenChange={local.onOpenChange}>
      <Popover.Trigger
        data-ui='popover'
        data-ui-state={controlState(local)}
        disabled={local.disabled || local.loading}
      >
        {local.trigger}
      </Popover.Trigger>
      {local.children}
    </Popover>
  )
}
