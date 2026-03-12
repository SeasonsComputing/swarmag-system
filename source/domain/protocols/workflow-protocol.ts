/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Workflow protocol shapes                                                     ║
║ Create and update payloads for workflow topic abstractions.                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines create and update protocol shapes for Task, Workflow, and their
junction types (TaskQuestion, WorkflowTask). Junction types have create
protocols only — no update.

EXPORTED APIs & TYPEs
───────────────────────────────────────────────────────────────────────────────
TaskCreate          Create payload for a Task.
TaskUpdate          Update payload for a Task.
TaskQuestionCreate  Create payload for a TaskQuestion junction.
WorkflowCreate      Create payload for a Workflow.
WorkflowUpdate      Update payload for a Workflow.
WorkflowTaskCreate  Create payload for a WorkflowTask junction.
*/

import type {
  AssociationJunction,
  CreateFromInstantiable,
  UpdateFromInstantiable
} from '@core/std'
import type { Question } from '@domain/abstractions/common.ts'
import type { Task, Workflow } from '@domain/abstractions/workflow.ts'

// ────────────────────────────────────────────────────────────────────────────
// PROTOCOL
// ────────────────────────────────────────────────────────────────────────────

export type TaskCreate = CreateFromInstantiable<Task>
export type TaskUpdate = UpdateFromInstantiable<Task>

/** Junction create — no update protocol; junctions are created and hard-deleted only. */
export type TaskQuestionCreate = {
  taskId: AssociationJunction<Task>
  questionId: AssociationJunction<Question>
  sequence: number
}

export type WorkflowCreate = CreateFromInstantiable<Workflow>
export type WorkflowUpdate = UpdateFromInstantiable<Workflow>

/** Junction create — no update protocol; junctions are created and hard-deleted only. */
export type WorkflowTaskCreate = {
  workflowId: AssociationJunction<Workflow>
  taskId: AssociationJunction<Task>
  sequence: number
}
