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

SEMANTICS
───────────────────────────────────────────────────────────────────────────────
Dirty-state belongs to each draft's context: registerDirty(check) exposes a
local change check to the workbench and returns its cleanup callback. Retained
feature-state checks last for the session, across step remounts; nested draft
checks are cleaned up when their draft closes. The sequence controller does not
own dirty-state.

Local Up asks only about the Detail it discards. Workbench Cancel and
collection select/New check the aggregate and all open nested drafts, then ask
once before abandoning the session; the collapsed first-step return receives
the same protection. Back/Next preserves drafts and does not prompt.
*/

import { createSignal, onCleanup } from '@solid-js'
import type { Accessor } from '@solid-js'
import type { DrillReturnControl } from '@ux/shell/panel/drill-contract.ts'
import type { PanelFeedback } from '@ux/shell/panel/panel-contract.ts'
import type { PanelStepContext } from '@ux/shell/panel/panel-sequence-contract.ts'
import type { PanelSequenceControl } from '@ux/shell/panel/panel-sequence.tsx'
import type { UiActionButtonProps } from '@ux/ui'

/** Workbench-owned step services, return controls, trailing action, and aggregate dirty state. */
type WorkbenchContext = {
  context: PanelStepContext
  drillReturn: Accessor<DrillReturnControl | null>
  trailingAction: () => UiActionButtonProps | undefined
  isDirty: () => boolean
}

/** Bind contextual services to the lifetime of one workbench draft. */
export const createWorkbenchContext = (
  sequence: PanelSequenceControl,
  feedback: (value: PanelFeedback | null) => void,
  busy: () => boolean
): WorkbenchContext => {
  const checks = new Set<() => boolean>()
  const [drillReturn, setDrillReturn] = createSignal<DrillReturnControl | null>(null)
  const [trailingAction, setTrailingAction] = createSignal<
    (() => UiActionButtonProps | undefined) | null
  >(null)
  onCleanup(() => checks.clear())
  const context: PanelStepContext = {
    registerValidation: sequence.registerValidation,
    registerDrillReturn: setDrillReturn,
    registerTrailingAction: (action: (() => UiActionButtonProps | undefined) | null): void => {
      setTrailingAction(() => action)
    },
    registerDirty: (check: () => boolean): () => void => {
      checks.add(check)
      return (): void => {
        checks.delete(check)
      }
    },
    feedback,
    busy
  }
  return {
    context,
    drillReturn,
    trailingAction: (): UiActionButtonProps | undefined => trailingAction()?.(),
    isDirty: (): boolean => [...checks].some(check => check())
  }
}
