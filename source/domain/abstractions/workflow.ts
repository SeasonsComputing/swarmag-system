/**
 * Workflow domain abstractions.
 */

import type { AssociationJunction, CompositionMany, Instantiable } from '@core-std'
import type { Note, Question } from '@domain/abstractions/common.ts'

/** Reusable named grouping of questions. */
export type Task = Instantiable & {
  notes: CompositionMany<Note>
  label: string
  description?: string
}

/** Junction mapping task questions with explicit ordering. */
export type TaskQuestion = {
  taskId: AssociationJunction<Task>
  questionId: AssociationJunction<Question>
  sequence: number
}

/** Reusable versioned execution template. */
export type Workflow = Instantiable & {
  notes: CompositionMany<Note>
  name: string
  description?: string
  version: number
  tags: CompositionMany<string>
}

/** Junction mapping workflow tasks with explicit ordering. */
export type WorkflowTask = {
  workflowId: AssociationJunction<Workflow>
  taskId: AssociationJunction<Task>
  sequence: number
}
