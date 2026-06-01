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
import { splitProps } from '@solid-js'
import { AppButton, type AppButtonVariant } from './app-button.tsx'
import { type AppComponent, type AppComponentProps, controlState } from './ui-helpers.ts'

/** Tooltip control props. */
export type AppTooltipProps = AppComponentProps & {
  trigger?: AppComponent
  triggerVariant?: AppButtonVariant
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
export const AppTooltip = (props: AppTooltipProps): AppComponent => {
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
        as={AppButton}
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
