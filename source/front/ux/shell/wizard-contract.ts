/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Wizard contract                                                              ║
║ Provider contract for a guided, linear multi-step wizard flow.               ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Declares the wizard provider contract: an ordered set of stage strategies that
a host sequences, gates, commits, and presents.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
WizardStage         One stage strategy: render, validity gate, optional commit,
                    optional drilled-state trailing action.
WizardStageContext  Host context available to wizard stages.
WizardContract      Provider contract for a guided, linear wizard flow.
*/

import type { UiActionButtonProps, UiComponent } from '@front/ux/ui'
import type { DrillReturnControl } from './drill-contract.ts'
import type { PanelFeedback } from './panel-contract.ts'

/** Host context available to a wizard stage render function. */
export type WizardStageContext = {
  registerDrillReturn: (control: DrillReturnControl | null) => void
}

/** A single stage strategy within a guided, dependency-ordered flow. */
export type WizardStage = {
  name: string
  title: string
  render: (context: WizardStageContext) => UiComponent
  canAdvance: () => boolean
  /**
   * Show the stage's own field-level errors and report validity. Called when the
   * user presses Next, so an incomplete stage explains itself rather than
   * presenting a dead control. Omit it and Next simply gates on `canAdvance`.
   */
  validate?: () => boolean
  commit?: () => void | Promise<void>
  /**
   * Trailing header action while this stage is presenting drilled detail, in place
   * of the wizard's own Next/Finish. Undefined renders nothing. Irrelevant, and
   * never consulted, while the stage is not drilled.
   */
  trailingAction?: () => UiActionButtonProps | undefined
}

/** Provider contract for guided, linear wizard flows. */
export interface WizardContract {
  formTitle: string
  stages: WizardStage[]
  feedback?: () => PanelFeedback | null
}
