/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Wizard contract                                                              ║
║ Provider contract for a guided, linear multi-step wizard flow.               ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Declares the wizard provider contract: an ordered set of stage strategies and
the feedback surface a host sequences, gates, commits, and presents.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
WizardFeedback  Feedback surfaced in the wizard chrome.
WizardStage     One stage strategy: render, validity gate, optional commit.
WizardContract  Provider contract for a guided, linear wizard flow.
*/

import type { UiAlertVariant, UiComponent } from '@front/ux/ui'

/** Feedback displayed in the wizard chrome. */
export type WizardFeedback = {
  message: string
  variant: UiAlertVariant
}

/** A single stage strategy within a guided, dependency-ordered flow. */
export type WizardStage = {
  name: string
  title: string
  render: () => UiComponent
  canAdvance: () => boolean
  commit?: () => void | Promise<void>
}

/** Provider contract for guided, linear wizard flows. */
export interface WizardContract {
  formTitle: string
  stages: WizardStage[]
  feedback?: () => WizardFeedback | null
}
