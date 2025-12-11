import type { Question } from '@domain/common'

export const preflightInspectionQuestion: Question = {
  id: '01J0QEXAMPLE00000000000001',
  prompt: 'Has the drone passed the preflight inspection?',
  type: 'single-select',
  required: true,
  options: [
    { value: 'pass', label: 'Pass' },
    { value: 'fail', label: 'Fail', requiresNote: true },
  ],
}

export const chemicalMixRatioQuestion: Question = {
  id: '01J0QEXAMPLE00000000000002',
  prompt: 'Recorded mix ratio (oz/gal)',
  type: 'number',
  helpText: 'Enter the actual ounces per gallon observed during mixing.',
}

export const ppeVerificationQuestion: Question = {
  id: '01J0QEXAMPLE00000000000003',
  prompt: 'Select every crew member who completed PPE verification',
  type: 'multi-select',
  options: [
    { value: 'lead', label: 'Crew Lead' },
    { value: 'technician', label: 'Field Technician' },
    { value: 'observer', label: 'Observer', requiresNote: true },
  ],
}

export const sharedQuestionSamples: Question[] = [
  preflightInspectionQuestion,
  chemicalMixRatioQuestion,
  ppeVerificationQuestion,
]
