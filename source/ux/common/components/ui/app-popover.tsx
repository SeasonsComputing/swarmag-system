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
import { splitProps } from '@solid-js'
import { AppButton, type AppButtonVariant } from './app-button.tsx'
import { type AppComponent, type AppComponentProps, controlState } from './ui-helpers.ts'

/** Popover control props. */
export type AppPopoverProps = AppComponentProps & {
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

/** Popover control with declared states. */
export const AppPopover = (props: AppPopoverProps): AppComponent => {
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
    <Popover open={local.open} defaultOpen={local.defaultOpen} onOpenChange={local.onOpenChange}>
      <Popover.Trigger
        as={AppButton}
        disabled={local.disabled || local.loading}
        variant={local.triggerVariant ?? 'secondary'}
      >
        {local.trigger}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content data-ui='popover' data-ui-state={controlState(local)}>
          {local.children}
        </Popover.Content>
      </Popover.Portal>
    </Popover>
  )
}
