/*
╔═════════════════════════════════════════════════════════════════════════════╗
║ Workflow domain abstractions                                                ║
║ Workflow/task abstractions and sequencing junctions                         ║
╚═════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines reusable workflow and task abstractions with sequencing junctions.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
Task                               Reusable named grouping of questions.
TaskQuestion                       Junction linking tasks to ordered questions.
Workflow                           Versioned workflow template abstraction.
WorkflowTask                       Junction linking workflows to ordered tasks.
*/

import type { AssociationJunction, CompositionMany, Instantiable } from '@core/std'
import type { Note, Question } from '@domain/abstractions/common.ts'

/** Reusable named grouping of ordered questions. */
export type Task = Instantiable & {
  notes: CompositionMany<Note>
  label: string
  description?: string
}

/** Junction mapping tasks to ordered questions. */
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

/** Junction mapping workflows to ordered tasks. */
export type WorkflowTask = {
  workflowId: AssociationJunction<Workflow>
  taskId: AssociationJunction<Task>
  sequence: number
}
