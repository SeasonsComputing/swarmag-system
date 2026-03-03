/**
 * Domain models for workflows and task sequencing.
 */

import type {
  AssociationJunction,
  CompositionMany,
  Instantiable
} from '@core-std'
import type { Note } from '@domain/abstractions/common.ts'

/** Reusable named grouping of questions. */
export type Task = Instantiable & {
  title: string
  description?: string
  notes: CompositionMany<Note>
}

/** m:m junction between tasks and questions with explicit ordering. */
export type TaskQuestion = {
  taskId: AssociationJunction<Task>
  questionId: AssociationJunction<import('@domain/abstractions/common.ts').Question>
  sequence: number
}

/** Reusable versioned execution template. */
export type Workflow = Instantiable & {
  name: string
  description?: string
  version: number
  tags: CompositionMany<string>
  notes: CompositionMany<Note>
}

/** m:m junction between workflows and tasks with explicit ordering. */
export type WorkflowTask = {
  workflowId: AssociationJunction<Workflow>
  taskId: AssociationJunction<Task>
  sequence: number
}
