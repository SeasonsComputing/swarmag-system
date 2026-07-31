/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Workflow domain abstractions                                                 ║
║ Canonical types for questions, tasks, workflows, and ordering junctions.     ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines reusable questions, tasks, and workflow abstractions with ordered junctions.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
QUESTION_TYPES          Supported question input modes.
QuestionType            Question type derived from QUESTION_TYPES.
SCALAR_QUESTION_TYPES   Scalar question discriminator values.
ScalarQuestionType      Scalar question type derived from SCALAR_QUESTION_TYPES.
SELECT_QUESTION_TYPES   Select question discriminator values.
SelectQuestionType      Select question type derived from SELECT_QUESTION_TYPES.
BaseQuestion            Common shape shared by all question constituents.
InternalQuestion        System-generated question variant.
ScalarQuestion          Scalar input question variant.
SelectOption            Selectable option metadata.
SelectQuestion          Select input question variant.
Question                Discriminated union of all question variants.
Answer                  Captured response to a question.
Task                    Reusable named grouping of ordered questions.
TaskQuestion            Junction from task to question with sequence.
Workflow                Versioned template of ordered tasks.
WorkflowTask            Junction from workflow to task with sequence.
*/

import type {
  AssociationJunction,
  AssociationOne,
  CompositionMany,
  CompositionPositive,
  Instantiable,
  When
} from '@core/std'
import type { Note } from '@domain/abstractions/common.ts'

/** Supported question input modes. */
export const QUESTION_TYPES = [
  'internal',
  'text',
  'number',
  'boolean',
  'single-select',
  'multi-select'
] as const
export type QuestionType = (typeof QUESTION_TYPES)[number]

/** Scalar question discriminator values. */
export const SCALAR_QUESTION_TYPES = ['text', 'number', 'boolean'] as const
export type ScalarQuestionType = (typeof SCALAR_QUESTION_TYPES)[number]

/** Select question discriminator values. */
export const SELECT_QUESTION_TYPES = ['single-select', 'multi-select'] as const
export type SelectQuestionType = (typeof SELECT_QUESTION_TYPES)[number]

/** Common shape shared by all question constituents. */
export type BaseQuestion = Instantiable & {
  type: QuestionType
  prompt: string
  helpText?: string
  required?: boolean
}

/** System-generated question variant. */
export type InternalQuestion = BaseQuestion & {
  type: 'internal'
}

/** Scalar input question variant. */
export type ScalarQuestion = BaseQuestion & {
  type: ScalarQuestionType
}

/** Selectable option metadata. */
export type SelectOption = {
  value: string
  label?: string
  requiresNote?: boolean
}

/** Select input question variant with required options. */
export type SelectQuestion = BaseQuestion & {
  type: SelectQuestionType
  options: CompositionPositive<SelectOption>
}

/** Discriminated union of all question variants. */
export type Question = InternalQuestion | ScalarQuestion | SelectQuestion

/** Captured response to a question. */
export type Answer = {
  questionId: AssociationOne<Question>
  notes: CompositionMany<Note>
  value: string | number | boolean | string[]
  capturedAt: When
}

/** Reusable named grouping of ordered questions. */
export type Task = Instantiable & {
  notes: CompositionMany<Note>
  label: string
  description?: string
}

/** Junction from task to question with sequence. */
export type TaskQuestion = {
  taskId: AssociationJunction<Task>
  questionId: AssociationJunction<Question>
  sequence: number
}

/** Versioned template of ordered tasks. */
export type Workflow = Instantiable & {
  notes: CompositionMany<Note>
  name: string
  description?: string
  version: number
  tags: CompositionMany<string>
}

/** Junction from workflow to task with sequence. */
export type WorkflowTask = {
  workflowId: AssociationJunction<Workflow>
  taskId: AssociationJunction<Task>
  sequence: number
}
