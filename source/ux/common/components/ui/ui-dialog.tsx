/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Ui dialog control                                                           ║
║ Semantic wrapper for the Kobalte Dialog primitive.                           ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Emits dialog control semantics without styling concerns.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
UiDialog  Dialog control with declared states.
*/

import { Dialog } from '@kobalte/core/dialog'
import { splitProps } from '@solid-js'
import { UiButton, type UiButtonVariant } from './ui-button.tsx'
import { controlState, type UiComponent, type UiComponentProps } from './ui-helpers.ts'

/** Dialog control props. */
export type UiDialogProps = UiComponentProps & {
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

/** Dialog control with declared states. */
export const UiDialog = (props: UiDialogProps): UiComponent => {
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
        as={UiButton}
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
