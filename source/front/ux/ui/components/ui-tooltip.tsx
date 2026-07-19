/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Ui tooltip control                                                           ║
║ Semantic wrapper for the Kobalte Tooltip primitive.                          ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Emits tooltip control semantics without styling concerns.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
UiTooltip  Tooltip control with declared states.
*/

import { Tooltip } from '@kobalte/core/tooltip'
import { splitProps } from '@solid-js'
import { UiButton, type UiButtonVariant } from './ui-button.tsx'
import { controlState, type UiComponent, type UiComponentProps } from './ui-helpers.ts'

/** Tooltip control props. */
export type UiTooltipProps = UiComponentProps & {
  trigger?: UiComponent
  triggerVariant?: UiButtonVariant
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
export const UiTooltip = (props: UiTooltipProps): UiComponent => {
  const [local] = splitProps(props, [
    'children',
    'trigger',
    'triggerVariant',
    'open',
    'defaultOpen',
    'error',
    'loading',
    'disabled',
    'onOpenChange'
  ])
  return (
    <Tooltip
      open={local.open}
      defaultOpen={local.defaultOpen}
      onOpenChange={local.onOpenChange}
      disabled={local.disabled || local.loading}
    >
      <Tooltip.Trigger
        as={UiButton}
        disabled={local.disabled || local.loading}
        variant={local.triggerVariant ?? 'secondary'}
      >
        {local.trigger}
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content data-ui='tooltip' data-ui-state={controlState(local)}>
          {local.children}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip>
  )
}
