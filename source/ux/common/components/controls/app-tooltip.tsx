/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ App tooltip control                                                          ║
║ Semantic wrapper for the Kobalte Tooltip primitive.                          ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Emits tooltip control semantics without styling concerns.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AppTooltip  Tooltip control with declared states.
*/

import { Tooltip } from '@kobalte/core/tooltip'
import { type JSX, splitProps } from '@solid-js'
import { controlState } from './controls-helpers.ts'

/** Tooltip control props. */
export type AppTooltipProps = {
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

/** Tooltip control with declared states. */
export const AppTooltip = (props: AppTooltipProps): JSX.Element => {
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
    <Tooltip open={local.open} defaultOpen={local.defaultOpen} onOpenChange={local.onOpenChange}>
      <Tooltip.Trigger
        data-ui='tooltip'
        data-ui-state={controlState(local)}
        disabled={local.disabled || local.loading}
      >
        {local.trigger}
      </Tooltip.Trigger>
      {local.children}
    </Tooltip>
  )
}
