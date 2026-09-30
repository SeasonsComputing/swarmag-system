/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Panel sequence contracts                                                     ║
║ Shared steps and contextual services for workbench sequences.                ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Declares reusable steps without draft ownership, persistence, or host chrome.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
PanelStep         A renderable, validated step.
PanelSequence     Ordered steps composed by a workbench provider.
PanelStepContext  Workbench services available to step content.
*/

import type { UiActionButtonProps, UiComponent } from '@ux/ui'
import type { DrillReturnControl } from './drill-contract.ts'
import type { PanelFeedback } from './panel-contract.ts'

/** One panel in an ordered sequence. */
export type PanelStep = {
  name: string
  title: string
  validate?: () => boolean
  render: (context: PanelStepContext) => UiComponent
}

/** A complete sequence or a fragment composed into one. */
export type PanelSequence = readonly PanelStep[]

/** Workbench services; registration lifetimes follow the state being registered. */
export type PanelStepContext = {
  registerValidation: (validate: () => boolean) => () => void
  registerDrillReturn: (control: DrillReturnControl | null) => void
  registerTrailingAction: (action: (() => UiActionButtonProps | undefined) | null) => void
  /** Retained state checks survive step unmount; nested drafts call cleanup on close. */
  registerDirty: (check: () => boolean) => () => void
  feedback: (feedback: PanelFeedback | null) => void
  busy: () => boolean
}
