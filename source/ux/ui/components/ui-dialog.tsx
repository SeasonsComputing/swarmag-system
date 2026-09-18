/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Ui dialog control                                                            ║
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

/** Dialog size treatments declared by the design language. */
export type UiDialogSize = 'content' | 'panel' | 'workbench'

/** Dialog control props. */
export type UiDialogProps = UiComponentProps & {
  trigger?: UiComponent
  triggerVariant?: UiButtonVariant
  size?: UiDialogSize
  open?: boolean
  defaultOpen?: boolean
  dismissible?: boolean
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
    'size',
    'open',
    'defaultOpen',
    'dismissible',
    'error',
    'loading',
    'disabled',
    'onOpenChange'
  ])
  return (
    <Dialog
      open={local.open}
      defaultOpen={local.defaultOpen}
      onOpenChange={local.onOpenChange}
      modal
      preventScroll
    >
      {local.trigger && (
        <Dialog.Trigger
          as={UiButton}
          disabled={local.disabled || local.loading}
          variant={local.triggerVariant ?? 'secondary'}
        >
          {local.trigger}
        </Dialog.Trigger>
      )}
      <Dialog.Portal>
        <Dialog.Overlay data-ui='dialog-overlay' />
        <Dialog.Content
          data-ui='dialog'
          data-ui-size={local.size ?? 'panel'}
          data-ui-state={controlState(local)}
          onPointerDownOutside={event => {
            if (!local.dismissible) event.preventDefault()
          }}
        >
          {local.children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
