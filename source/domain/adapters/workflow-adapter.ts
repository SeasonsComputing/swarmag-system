/*
╔═════════════════════════════════════════════════════════════════════════════╗
║ Workflow domain adapters                                                    ║
║ Dictionary serialization for workflow topic abstractions                    ║
╚═════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Serializes workflow topic abstractions between Dictionary and domain shapes.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
toTask                              Deserialize Task from Dictionary.
fromTask                            Serialize Task to Dictionary.
toTaskQuestion                      Deserialize TaskQuestion from Dictionary.
fromTaskQuestion                    Serialize TaskQuestion to Dictionary.
toWorkflow                          Deserialize Workflow from Dictionary.
fromWorkflow                        Serialize Workflow to Dictionary.
toWorkflowTask                      Deserialize WorkflowTask from Dictionary.
fromWorkflowTask                    Serialize WorkflowTask to Dictionary.
*/

import type { Dictionary, Id, When } from '@core/std'
import type {
  Task,
  TaskQuestion,
  Workflow,
  WorkflowTask
} from '@domain/abstractions/workflow.ts'
import { fromNote, toNote } from '@domain/adapters/common-adapter.ts'

/** Deserialize Task from Dictionary. */
export const toTask = (dict: Dictionary): Task => ({
  id: dict.id as Id,
  createdAt: dict.created_at as When,
  updatedAt: dict.updated_at as When,
  deletedAt: dict.deleted_at as When | undefined,
  notes: (dict.notes as Dictionary[]).map(toNote),
  label: dict.label as string,
  description: dict.description as string | undefined
})

/** Serialize Task to Dictionary. */
export const fromTask = (task: Task): Dictionary => ({
  id: task.id,
  created_at: task.createdAt,
  updated_at: task.updatedAt,
  deleted_at: task.deletedAt,
  notes: task.notes.map(fromNote),
  label: task.label,
  description: task.description
})

/** Deserialize TaskQuestion from Dictionary. */
export const toTaskQuestion = (dict: Dictionary): TaskQuestion => ({
  taskId: dict.task_id as Id,
  questionId: dict.question_id as Id,
  sequence: dict.sequence as number
})

/** Serialize TaskQuestion to Dictionary. */
export const fromTaskQuestion = (taskQuestion: TaskQuestion): Dictionary => ({
  task_id: taskQuestion.taskId,
  question_id: taskQuestion.questionId,
  sequence: taskQuestion.sequence
})

/** Deserialize Workflow from Dictionary. */
export const toWorkflow = (dict: Dictionary): Workflow => ({
  id: dict.id as Id,
  createdAt: dict.created_at as When,
  updatedAt: dict.updated_at as When,
  deletedAt: dict.deleted_at as When | undefined,
  notes: (dict.notes as Dictionary[]).map(toNote),
  name: dict.name as string,
  description: dict.description as string | undefined,
  version: dict.version as number,
  tags: dict.tags as string[]
})

/** Serialize Workflow to Dictionary. */
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

/** Deserialize WorkflowTask from Dictionary. */
export const toWorkflowTask = (dict: Dictionary): WorkflowTask => ({
  workflowId: dict.workflow_id as Id,
  taskId: dict.task_id as Id,
  sequence: dict.sequence as number
})

/** Serialize WorkflowTask to Dictionary. */
export const fromWorkflowTask = (workflowTask: WorkflowTask): Dictionary => ({
  workflow_id: workflowTask.workflowId,
  task_id: workflowTask.taskId,
  sequence: workflowTask.sequence
})
