/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Workflow domain abstractions                                                 ║
║ Reusable task and workflow templates.                                        ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines Task, TaskQuestion, Workflow, and WorkflowTask abstractions for
describing how work is generally performed through ordered sequences of
tasks and questions.

EXPORTED APIs & TYPEs
───────────────────────────────────────────────────────────────────────────────
Task          Reusable named grouping of ordered questions.
TaskQuestion  Junction — tasks to questions with explicit ordering.
Workflow      Versioned template of ordered tasks.
WorkflowTask  Junction — ordered tasks that define a workflow.
*/

import type {
  AssociationJunction,
  CompositionMany,
  Instantiable
} from '@core-std'
import type { Note, Question } from '@domain/abstractions/common.ts'

/** Reusable named grouping of ordered questions. */
export type Task = Instantiable & {
  notes: CompositionMany<Note>
  label: string
  description?: string
}

/** Junction — tasks to questions with explicit ordering; hard delete only. */
export type TaskQuestion = {
  taskId: AssociationJunction<Task>
  questionId: AssociationJunction<Question>
  sequence: number
}

/** Versioned template of ordered tasks; read-only except for administrator role. */
export type Workflow = Instantiable & {
  notes: CompositionMany<Note>
  name: string
  description?: string
  version: number
  tags: CompositionMany<string>
}

/** Junction — ordered tasks that define a workflow; hard delete only. */
export type WorkflowTask = {
  workflowId: AssociationJunction<Workflow>
  taskId: AssociationJunction<Task>
  sequence: number
}
