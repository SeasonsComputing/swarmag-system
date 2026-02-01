/**
 * Domain models for workflows in the swarmAg system.
 * Workflows define the steps for executing services.
 */

import type { ID, When } from '@utils'
import type { Note } from './common.ts'

/** A step in a workflow, including checklists and requirements. */
export interface WorkflowStep {
  id: ID
  title: string
  description?: string
  checklist: Question[]
  requiresLocationCapture?: boolean
  requiresPhoto?: boolean
  notes?: Note[]
}

/** Represents a workflow in the swarmAg system. */
export interface Workflow {
  id: ID
  serviceId: ID
  name: string
  description?: string
  version: number
  effectiveFrom: When
  steps: WorkflowStep[]
  locationsRequired?: Location[]
  createdAt: When
  updatedAt: When
}

/** The types of questions that can be asked. */
export type QuestionType =
  | 'text'
  | 'number'
  | 'boolean'
  | 'single-select'
  | 'multi-select'

/** An option for a multiple choice question. */
export interface QuestionOption {
  value: string
  label?: string
  requiresNote?: boolean
}

/** Represents a question in an assessment or form. */
export interface Question {
  id: ID
  prompt: string
  type: QuestionType
  helpText?: string
  required?: boolean
  options?: QuestionOption[]
}

/** The value of an answer. */
export type AnswerValue =
  | string
  | number
  | boolean
  | string[]

/** An answer to a question. */
export interface Answer {
  questionId: ID
  value: AnswerValue
  capturedAt: When
  capturedById: ID
  note?: Note
}
