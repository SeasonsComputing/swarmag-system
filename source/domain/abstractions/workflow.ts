/**
 * Domain models for workflows in the swarmAg system.
 * A Workflow is a versioned, reusable template describing how work is generally
 * performed. It is structured as a non-empty sequence of Tasks, each with a
 * non-empty checklist of Questions. Workflow masters are read-only except for
 * the administrator role; modification during assessment or planning is achieved
 * exclusively by cloning.
 */

import type { CompositionMany, CompositionPositive, Instantiable } from '@core-std'
import type { Note } from '@domain/abstractions/common.ts'

/**
 * Supported question input modes.
 * internal is reserved for system-generated log entries such as telemetry,
 * GPS coordinates, and operational metadata.
 */
export type QuestionType =
  | 'text'
  | 'number'
  | 'boolean'
  | 'single-select'
  | 'multi-select'
  | 'internal'

/** Selectable option metadata for single-select and multi-select questions. */
export type QuestionOption = {
  value: string
  label?: string
  requiresNote?: boolean
}

/** Workflow checklist prompt. */
export type Question = {
  id: string
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
  questionId: string
  value: AnswerValue
  capturedAt: string
  capturedById: string
  notes: CompositionMany<Note>
}

/** Atomic executable step; checklist must be non-empty. */
export type Task = {
  id: string
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
