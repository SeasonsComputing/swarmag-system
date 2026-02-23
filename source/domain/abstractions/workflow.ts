/**
 * Domain abstractions for workflows in the swarmAg system.
 * Workflows are versioned execution templates directing how work is performed.
 */

import type { Id, When } from '@core-std'
import type { Note } from '@domain/abstractions/common.ts'

/** Supported question input modes. */
export type QuestionType =
  | 'text'
  | 'number'
  | 'boolean'
  | 'single-select'
  | 'multi-select'

/** Selectable option metadata. */
export type QuestionOption = {
  value: string
  label?: string
  requiresNote?: boolean
}

/** Workflow checklist prompt. */
export type Question = {
  id: Id
  prompt: string
  type: QuestionType
  helpText?: string
  required?: boolean
  options: [QuestionOption?, ...QuestionOption[]]
}

/** Permitted answer value payloads. */
export type AnswerValue =
  | string
  | number
  | boolean
  | string[]

/** Captured response instance; notes carry crew annotations and attachments. */
export type Answer = {
  questionId: Id
  value: AnswerValue
  capturedAt: When
  capturedById: Id
  notes: [Note?, ...Note[]]
}

/** Atomic executable step; checklist must be non-empty. */
export type Task = {
  id: Id
  title: string
  description?: string
  checklist: [Question, ...Question[]]
}

/** Versioned execution template; read-only except for administrator role. */
export type Workflow = {
  id: Id
  name: string
  description?: string
  version: number
  tags: [string?, ...string[]]
  tasks: [Task, ...Task[]]
  createdAt: When
  updatedAt: When
  deletedAt?: When
}
