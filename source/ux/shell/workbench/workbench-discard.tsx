/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Workbench discard                                                            ║
║ Shared confirmation for an enclosing workbench discard action.               ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Asks once before an enclosing action discards changed workbench drafts.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
WorkbenchDiscard  Render the enclosing discard confirmation.

SEMANTICS
───────────────────────────────────────────────────────────────────────────────
Cancel, Escape, and outside dismissal call onCancel, retaining the drafts.
Discard calls onDiscard; the host owns the pending action and draft lifetime.
*/

import { UiButton, UiDialog, UiFormActions, UiLayout } from '@ux/ui'
import type { UiComponent } from '@ux/ui'

/** Ask once about all drafts the pending enclosing action would discard. */
export const WorkbenchDiscard = (props: {
  onCancel: () => void
  onDiscard: () => void
}): UiComponent => (
  <UiDialog
    open
    size='content'
    onOpenChange={open => {
      if (!open) props.onCancel()
    }}
  >
    <UiLayout>
      <h2>Discard unsaved changes?</h2>
      <p>Unsaved changes in this workbench will be discarded.</p>
      <UiFormActions>
        <UiButton variant='ghost' onClick={props.onCancel}>Cancel</UiButton>
        <UiButton variant='danger' onClick={props.onDiscard}>Discard</UiButton>
      </UiFormActions>
    </UiLayout>
  </UiDialog>
)
