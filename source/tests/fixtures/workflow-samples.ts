/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Workflow fixtures                                                            ║
║ Shared single-select, numeric, and multi-select questions.                   ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Workflow question fixtures for tests.

Shared single-select, numeric, and multi-select questions.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
WorkflowSamples  Shared fixture samples.
├ preflightInspection     Required preflight selection.
│ ├ BaseQuestion           Inherited BaseQuestion fields.
│ ├ type                   Question response format.
│ └ options                Selectable answers.
├ chemicalMixRatio        Numeric mix-ratio capture.
│ ├ BaseQuestion           Inherited BaseQuestion fields.
│ └ type                   Question response format.
├ ppeVerification         Multiple crew-member selection.
│ ├ BaseQuestion           Inherited BaseQuestion fields.
│ ├ type                   Question response format.
│ └ options                Selectable answers.
└ all                     All shared questions.
*/

import { id, toWhen } from '@core/std'
import type { Question } from '@domain/abstractions/workflow.ts'

const PreflightInspection: Question = {
  id: id(),
  prompt: 'Has the drone passed the preflight inspection?',
  type: 'single-select',
  required: true,
  options: [{ value: 'pass', label: 'Pass' }, {
    value: 'fail',
    label: 'Fail',
    requiresNote: true
  }],
  createdAt: toWhen('2024-11-01T00:00:00Z'),
  updatedAt: toWhen('2025-01-01T00:00:00Z')
}

const ChemicalMixRatio: Question = {
  id: id(),
  prompt: 'Recorded mix ratio (oz/gal)',
  type: 'number',
  helpText: 'Enter the actual ounces per gallon observed during mixing.',
  createdAt: toWhen('2024-11-01T00:00:00Z'),
  updatedAt: toWhen('2025-01-01T00:00:00Z')
}

const PpeVerification: Question = {
  id: id(),
  prompt: 'Select every crew member who completed PPE verification',
  type: 'multi-select',
  options: [{ value: 'lead', label: 'Crew Lead' }, {
    value: 'technician',
    label: 'Field Technician'
  }, { value: 'observer', label: 'Observer', requiresNote: true }],
  createdAt: toWhen('2024-11-01T00:00:00Z'),
  updatedAt: toWhen('2025-01-01T00:00:00Z')
}

const ALL: Question[] = [
  PreflightInspection,
  ChemicalMixRatio,
  PpeVerification
]

/** Shared fixture samples. */
export const WorkflowSamples = {
  preflightInspection: PreflightInspection,
  chemicalMixRatio: ChemicalMixRatio,
  ppeVerification: PpeVerification,
  all: ALL
}
