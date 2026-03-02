/**
 * Common question/answer fixtures for tests.
 */

import { id } from '@core-std'
import type { Question } from '@domain/abstractions/common.ts'

export const preflightInspectionQuestion: Question = {
  id: id(),
  prompt: 'Has the drone passed the preflight inspection?',
  type: 'single-select',
  required: true,
  options: [{ value: 'pass', label: 'Pass' }, {
    value: 'fail',
    label: 'Fail',
    requiresNote: true
  }],
  createdAt: '2024-11-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z'
}

export const chemicalMixRatioQuestion: Question = {
  id: id(),
  prompt: 'Recorded mix ratio (oz/gal)',
  type: 'number',
  helpText: 'Enter the actual ounces per gallon observed during mixing.',
  createdAt: '2024-11-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z'
}

export const ppeVerificationQuestion: Question = {
  id: id(),
  prompt: 'Select every crew member who completed PPE verification',
  type: 'multi-select',
  options: [{ value: 'lead', label: 'Crew Lead' }, {
    value: 'technician',
    label: 'Field Technician'
  }, { value: 'observer', label: 'Observer', requiresNote: true }],
  createdAt: '2024-11-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z'
}

export const sharedQuestionSamples: Question[] = [
  preflightInspectionQuestion,
  chemicalMixRatioQuestion,
  ppeVerificationQuestion
]
