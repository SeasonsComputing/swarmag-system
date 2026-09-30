/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Wizard contract                                                              ║
║ One composed sequence and one aggregate commit.                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
A Wizard provider composes steps and owns its aggregate commit operation.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
WizardContract  Provider contract for a guided sequence.
*/

import type { PanelFeedback } from '@ux/shell/panel/panel-contract.ts'
import type { PanelSequence } from '@ux/shell/panel/panel-sequence-contract.ts'

/** Provider contract for a wizard that commits once at Finish. */
export type WizardContract = {
  formTitle: string
  steps: PanelSequence
  commit: () => void | Promise<void>
  feedback?: () => PanelFeedback | null
}
