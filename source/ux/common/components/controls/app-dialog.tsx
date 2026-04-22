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
import { type JSX, splitProps } from '@solid-js'
import { controlState } from './controls-helpers.ts'

/** Dialog control props. */
export type AppDialogProps = {
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

/** Dialog control with declared states. */
export const AppDialog = (props: AppDialogProps): JSX.Element => {
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
    <Dialog open={local.open} defaultOpen={local.defaultOpen} onOpenChange={local.onOpenChange}>
      <Dialog.Trigger
        data-ui='dialog'
        data-ui-state={controlState(local)}
        disabled={local.disabled || local.loading}
      >
        {local.trigger}
      </Dialog.Trigger>
      {local.children}
    </Dialog>
  )
}
