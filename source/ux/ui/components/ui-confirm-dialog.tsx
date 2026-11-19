/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Ui confirm dialog                                                            ║
║ The one confirmation dialog: a question, Cancel, and one action.             ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Asks before an action runs. The host shows it while a confirmation is pending
and closes it from its handlers; the dialog owns its busy and error states.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
UiConfirmDialog       Confirmation dialog at content size.

COMPONENT PROPERTIES
───────────────────────────────────────────────────────────────────────────────
UiConfirmDialogProps  Question, action, and handlers.
├ title               The question.
├ message             What confirming does.
├ action              The action button's label and variant (default danger).
├ onConfirm           Runs the action; a returned promise makes the dialog busy.
└ onCancel            Cancel, Escape, or an outside click.

SEMANTICS
───────────────────────────────────────────────────────────────────────────────
While a returned promise runs, both buttons are disabled, the action shows
loading, and dismissal is ignored. A rejection shows its message in a danger
alert and the dialog stays open; the host closes it when the action succeeds.
*/

import { createSignal, Show } from '@solid-js'
import { UiAlert } from './ui-alert.tsx'
import { UiButton } from './ui-button.tsx'
import { UiDialog } from './ui-dialog.tsx'
import { UiFormActions } from './ui-form-actions.tsx'
import type { UiComponent } from './ui-helpers.ts'

/** Question, action, and handlers. */
export type UiConfirmDialogProps = {
  title: string
  message?: string
  action: { label: string; variant?: 'danger' | 'primary' }
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}

/** Confirmation dialog at content size. */
export const UiConfirmDialog = (props: UiConfirmDialogProps): UiComponent => {
  const [busy, setBusy] = createSignal(false)
  const [error, setError] = createSignal<string | null>(null)

  const confirm = async (): Promise<void> => {
    if (busy()) return
    setBusy(true)
    setError(null)
    try {
      await props.onConfirm()
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : `${props.action.label} failed.`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <UiDialog
      open
      size='content'
      surface='liquid'
      dismissible={!busy()}
      onOpenChange={open => {
        if (!open && !busy()) props.onCancel()
      }}
    >
      <div data-ui='confirm-dialog'>
        <h2 data-ui='confirm-dialog-title'>{props.title}</h2>
        <Show when={props.message}>
          {message => <p data-ui='confirm-dialog-message'>{message()}</p>}
        </Show>
        <Show when={error()}>
          {message => <UiAlert variant='danger'>{message()}</UiAlert>}
        </Show>
        <UiFormActions>
          <UiButton variant='ghost' disabled={busy()} onClick={props.onCancel}>Close</UiButton>
          <UiButton
            variant={props.action.variant ?? 'danger'}
            loading={busy()}
            onClick={() => void confirm()}
          >
            {props.action.label}
          </UiButton>
        </UiFormActions>
      </div>
    </UiDialog>
  )
}
