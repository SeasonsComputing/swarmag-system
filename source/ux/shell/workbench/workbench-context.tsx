/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Workbench context                                                            ║
║ Local draft checks and shared step services.                                 ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Keeps draft checks in the workbench lifetime, outside the sequence controller.
Nested draft owners unregister when closed; retained state lasts for the session.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
createWorkbenchContext  Bind step services to a workbench instance.
WorkbenchDiscard        One confirmation for an enclosing discard action.
*/

import { createSignal, onCleanup } from '@solid-js'
import type { DrillReturnControl } from '@ux/shell/panel/drill-contract.ts'
import type { PanelFeedback } from '@ux/shell/panel/panel-contract.ts'
import type { PanelStepContext } from '@ux/shell/panel/panel-sequence-contract.ts'
import type { PanelSequenceControl } from '@ux/shell/panel/panel-sequence.tsx'
import { UiButton, UiDialog, UiFormActions, UiLayout } from '@ux/ui'
import type { UiActionButtonProps, UiComponent } from '@ux/ui'

/** Bind contextual services to the lifetime of one workbench draft. */
export const createWorkbenchContext = (
  sequence: PanelSequenceControl,
  feedback: (value: PanelFeedback | null) => void,
  busy: () => boolean
) => {
  const checks = new Set<() => boolean>()
  const [drillReturn, setDrillReturn] = createSignal<DrillReturnControl | null>(null)
  const [trailingAction, setTrailingAction] = createSignal<
    (() => UiActionButtonProps | undefined) | null
  >(null)
  onCleanup(() => checks.clear())
  const context: PanelStepContext = {
    registerValidation: sequence.registerValidation,
    registerDrillReturn: setDrillReturn,
    registerTrailingAction: action => setTrailingAction(() => action),
    registerDirty: check => {
      checks.add(check)
      return () => {
        checks.delete(check)
      }
    },
    feedback,
    busy
  }
  return {
    context,
    drillReturn,
    trailingAction: () => trailingAction()?.(),
    isDirty: () => [...checks].some(check => check())
  }
}

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
