/**
 * Domain models for workflows in the swarmAg system.
 * Workflows are versioned execution templates guiding field operations.
 */

import type {
  AssociationOne,
  CompositionMany,
  CompositionPositive,
  Id,
  Instantiable
} from '@core-std'
import type { Note } from '@domain/abstractions/common.ts'
import type { User } from '@domain/abstractions/user.ts'

/** Supported question input modes; internal is reserved for system-generated log entries. */
export const QUESTION_TYPES = [
  'text',
  'number',
  'boolean',
  'single-select',
  'multi-select',
  'internal'
] as const
export type QuestionType = (typeof QUESTION_TYPES)[number]

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
  options: CompositionMany<QuestionOption>
}

/** Permitted answer value payloads. */
export type AnswerValue = string | number | boolean | string[]

/** Captured response instance; notes carry crew annotations and attachments. */
export type Answer = {
  questionId: Id
  value: AnswerValue
  capturedAt: string
  capturedById: AssociationOne<User>
  notes: CompositionMany<Note>
}

/** Atomic executable step; checklist must be non-empty. */
export type Task = {
  id: Id
  title: string
  description?: string
  checklist: CompositionPositive<Question>
}

/** Versioned execution template; read-only except for administrator role. */
export type Workflow = Instantiable & {
  name: string
  description?: string
  version: number
  tags: CompositionMany<string>
  tasks: CompositionPositive<Task>
}
