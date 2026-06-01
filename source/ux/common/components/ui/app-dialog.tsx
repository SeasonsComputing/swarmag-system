/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ App dialog control                                                           ║
║ Semantic wrapper for the Kobalte Dialog primitive.                           ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Emits dialog control semantics without styling concerns.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AppDialog  Dialog control with declared states.
*/

import { Dialog } from '@kobalte/core/dialog'
import { splitProps } from '@solid-js'
import { AppButton, type AppButtonVariant } from './app-button.tsx'
import { type AppComponent, type AppComponentProps, controlState } from './controls-helpers.ts'

/** Dialog control props. */
export type AppDialogProps = AppComponentProps & {
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

/** Dialog control with declared states. */
export const AppDialog = (props: AppDialogProps): AppComponent => {
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
    <Dialog open={local.open} defaultOpen={local.defaultOpen} onOpenChange={local.onOpenChange}>
      <Dialog.Trigger
        as={AppButton}
        disabled={local.disabled || local.loading}
        variant={local.triggerVariant ?? 'secondary'}
      >
        {local.trigger}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay data-ui='dialog-overlay' />
        <Dialog.Content data-ui='dialog' data-ui-state={controlState(local)}>
          {local.children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
