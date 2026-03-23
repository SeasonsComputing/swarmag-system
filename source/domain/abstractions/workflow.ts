/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Workflow domain abstractions                                                 ║
║ Canonical types for tasks, workflows, and ordering junctions.                ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines reusable task and workflow abstractions with ordered junction records.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
Task          Reusable named grouping of ordered questions.
TaskQuestion  Junction from task to question with sequence.
Workflow      Versioned template of ordered tasks.
WorkflowTask  Junction from workflow to task with sequence.
*/

import type { AssociationJunction, CompositionMany, Instantiable } from '@core/std'
import type { Note, Question } from '@domain/abstractions/common.ts'

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
