/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Workflow domain adapters                                                     ║
║ Dictionary serialization for workflow topic abstractions.                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Maps storage dictionaries to workflow abstractions and back.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
toTask(dict)  Deserialize Task from dictionary.
fromTask(task)  Serialize Task to dictionary.
toTaskQuestion(dict)  Deserialize TaskQuestion from dictionary.
fromTaskQuestion(record)  Serialize TaskQuestion to dictionary.
toWorkflow(dict)  Deserialize Workflow from dictionary.
fromWorkflow(workflow)  Serialize Workflow to dictionary.
toWorkflowTask(dict)  Deserialize WorkflowTask from dictionary.
fromWorkflowTask(record)  Serialize WorkflowTask to dictionary.
*/

import type { Dictionary } from '@core/std'
import type { Task, TaskQuestion, Workflow, WorkflowTask } from '@domain/abstractions/workflow.ts'
import { fromNote, toNote } from '@domain/adapters/common-adapter.ts'

// ────────────────────────────────────────────────────────────────────────────
// PUBLIC
// ────────────────────────────────────────────────────────────────────────────

export const toTask = (dict: Dictionary): Task => ({
  id: dict.id as string,
  createdAt: dict.created_at as string,
  updatedAt: dict.updated_at as string,
  deletedAt: dict.deleted_at as string | undefined,
  notes: (dict.notes as Dictionary[] | undefined ?? []).map(toNote),
  label: dict.label as string,
  description: dict.description as string | undefined
})

export const fromTask = (task: Task): Dictionary => ({
  id: task.id,
  created_at: task.createdAt,
  updated_at: task.updatedAt,
  deleted_at: task.deletedAt,
  notes: task.notes.map(fromNote),
  label: task.label,
  description: task.description
})

export const toTaskQuestion = (dict: Dictionary): TaskQuestion => ({
  taskId: dict.task_id as string,
  questionId: dict.question_id as string,
  sequence: dict.sequence as number
})

export const fromTaskQuestion = (record: TaskQuestion): Dictionary => ({
  task_id: record.taskId,
  question_id: record.questionId,
  sequence: record.sequence
})

export const toWorkflow = (dict: Dictionary): Workflow => ({
  id: dict.id as string,
  createdAt: dict.created_at as string,
  updatedAt: dict.updated_at as string,
  deletedAt: dict.deleted_at as string | undefined,
  notes: (dict.notes as Dictionary[] | undefined ?? []).map(toNote),
  name: dict.name as string,
  description: dict.description as string | undefined,
  version: dict.version as number,
  tags: (dict.tags as string[] | undefined) ?? []
})

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

export const toWorkflowTask = (dict: Dictionary): WorkflowTask => ({
  workflowId: dict.workflow_id as string,
  taskId: dict.task_id as string,
  sequence: dict.sequence as number
})

export const fromWorkflowTask = (record: WorkflowTask): Dictionary => ({
  workflow_id: record.workflowId,
  task_id: record.taskId,
  sequence: record.sequence
})
