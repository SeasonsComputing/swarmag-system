/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Wizard contract                                                              ║
║ One composed sequence and one aggregate commit.                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
A Wizard provider supplies its aggregate draft, composed steps, and commit.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
WizardContract  Provider contract for a guided sequence.
├ formTitle     Title of the complete workflow.
├ steps         Composed sequence of reusable steps.
├ draft         Current aggregate draft projection.
├ commit        Persist the aggregate once, at Finish.
└ feedback      Optional workflow feedback.

SEMANTICS
───────────────────────────────────────────────────────────────────────────────
Wizard snapshots the supplied draft on mount and owns its aggregate discard
check. Providers supply plain, cloneable drafts; steps register only their
local drafts. The provider owns persistence through commit.
*/

import type { PanelFeedback } from '@ux/shell/panel/panel-contract.ts'
import type { PanelSequence } from '@ux/shell/panel/panel-sequence-contract.ts'

/** Provider contract for a wizard that commits once at Finish. */
export type WizardContract<Draft> = {
  formTitle: string
  steps: PanelSequence
  draft: () => Draft
  commit: () => void | Promise<void>
  feedback?: () => PanelFeedback | null
}
