import type { AssociationJunction, CompositionMany, Instantiable } from '@core-std'
import type { Note } from '@domain/abstractions/common.ts'

/** Reusable named grouping of questions. */
export type Task = Instantiable & {
  title: string
  description?: string
  notes: CompositionMany<Note>
}

/** Junction linking tasks to question rows with explicit order. */
export type TaskQuestion = {
  taskId: AssociationJunction<Task>
  questionId: AssociationJunction<Instantiable>
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

/** Junction linking workflows to tasks with explicit order. */
export type WorkflowTask = {
  workflowId: AssociationJunction<Workflow>
  taskId: AssociationJunction<Task>
  sequence: number
}
