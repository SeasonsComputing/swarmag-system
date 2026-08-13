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
WizardStage     One stage strategy: render, validity gate, optional commit.
WizardContract  Provider contract for a guided, linear wizard flow.
*/

import type { UiComponent } from '@front/ux/ui'
import type { PanelFeedback } from './panel-contract.ts'

/** A single stage strategy within a guided, dependency-ordered flow. */
export type WizardStage = {
  name: string
  title: string
  render: () => UiComponent
  canAdvance: () => boolean
  /**
   * Show the stage's own field-level errors and report validity. Called when the
   * user presses Next, so an incomplete stage explains itself rather than
   * presenting a dead control. Omit it and Next simply gates on `canAdvance`.
   */
  validate?: () => boolean
  commit?: () => void | Promise<void>
}

/** Provider contract for guided, linear wizard flows. */
export interface WizardContract {
  formTitle: string
  stages: WizardStage[]
  feedback?: () => PanelFeedback | null
}
