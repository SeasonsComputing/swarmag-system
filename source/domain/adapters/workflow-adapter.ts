/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Workflow domain adapter                                                      ║
║ Serialization for workflow topic abstractions.                               ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Serializes between Dictionary and Task, TaskQuestion, Workflow, and
WorkflowTask domain types.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
toTask              Deserialize Task from a storage dictionary.
fromTask            Serialize Task to a storage dictionary.
toTaskQuestion      Deserialize TaskQuestion junction from a storage dictionary.
fromTaskQuestion    Serialize TaskQuestion junction to a storage dictionary.
toWorkflow          Deserialize Workflow from a storage dictionary.
fromWorkflow        Serialize Workflow to a storage dictionary.
toWorkflowTask      Deserialize WorkflowTask junction from a storage dictionary.
fromWorkflowTask    Serialize WorkflowTask junction to a storage dictionary.
*/

import type { AssociationJunction, CompositionMany, Dictionary, Id, When } from '@core/std'
import type { Note, Question } from '@domain/abstractions/common.ts'
import type {
  Task,
  TaskQuestion,
  Workflow,
  WorkflowTask
} from '@domain/abstractions/workflow.ts'
import { fromNote, toNote } from '@domain/adapters/common-adapter.ts'

/** Deserialize Task from a storage dictionary. */
export const toTask = (dict: Dictionary): Task => ({
  id: dict.id as Id,
  createdAt: dict.created_at as When,
  updatedAt: dict.updated_at as When,
  deletedAt: dict.deleted_at as When | undefined,
  notes: (dict.notes as Dictionary[]).map(toNote) as CompositionMany<Note>,
  label: dict.label as string,
  description: dict.description as string | undefined
})

/** Serialize Task to a storage dictionary. */
export const fromTask = (task: Task): Dictionary => ({
  id: task.id,
  created_at: task.createdAt,
  updated_at: task.updatedAt,
  deleted_at: task.deletedAt,
  notes: task.notes.map(fromNote),
  label: task.label,
  description: task.description
})

/** Deserialize TaskQuestion junction from a storage dictionary. */
export const toTaskQuestion = (dict: Dictionary): TaskQuestion => ({
  taskId: dict.task_id as AssociationJunction<Task>,
  questionId: dict.question_id as AssociationJunction<Question>,
  sequence: dict.sequence as number
})

/** Serialize TaskQuestion junction to a storage dictionary. */
export const fromTaskQuestion = (junction: TaskQuestion): Dictionary => ({
  task_id: junction.taskId,
  question_id: junction.questionId,
  sequence: junction.sequence
})

/** Deserialize Workflow from a storage dictionary. */
export const toWorkflow = (dict: Dictionary): Workflow => ({
  id: dict.id as Id,
  createdAt: dict.created_at as When,
  updatedAt: dict.updated_at as When,
  deletedAt: dict.deleted_at as When | undefined,
  notes: (dict.notes as Dictionary[]).map(toNote) as CompositionMany<Note>,
  name: dict.name as string,
  description: dict.description as string | undefined,
  version: dict.version as number,
  tags: dict.tags as CompositionMany<string>
})

/** Serialize Workflow to a storage dictionary. */
export const fromWorkflow = (workflow: Workflow): Dictionary => ({
  id: workflow.id,
  created_at: workflow.createdAt,
  updated_at: workflow.updatedAt,
  deleted_at: workflow.deletedAt,
  notes: workflow.notes.map(fromNote),
  name: workflow.name,
  description: workflow.description,
  version: workflow.version,
  tags: workflow.tags
})

/** Deserialize WorkflowTask junction from a storage dictionary. */
export const toWorkflowTask = (dict: Dictionary): WorkflowTask => ({
  workflowId: dict.workflow_id as AssociationJunction<Workflow>,
  taskId: dict.task_id as AssociationJunction<Task>,
  sequence: dict.sequence as number
})

/** Serialize WorkflowTask junction to a storage dictionary. */
export const fromWorkflowTask = (junction: WorkflowTask): Dictionary => ({
  workflow_id: junction.workflowId,
  task_id: junction.taskId,
  sequence: junction.sequence
})
