/**
 * Adapters for the workflow domain area: Task, TaskQuestion, Workflow, WorkflowTask.
 * Question adapters live in common-adapter.ts — not here.
 */

import type { Dictionary, When } from '@core-std'
import { notValid } from '@core-std'
import type {
  Task,
  TaskQuestion,
  Workflow,
  WorkflowTask
} from '@domain/abstractions/workflow.ts'
import { fromNote, toNote } from '@domain/adapters/common-adapter.ts'

/** Create a Task instance from dictionary representation. */
export const toTask = (dict: Dictionary): Task => {
  if (!dict.id) return notValid('Task dictionary missing required field: id')
  if (!dict.title) return notValid('Task dictionary missing required field: title')
  return {
    id: dict.id as string,
    title: dict.title as string,
    description: dict.description as string | undefined,
    notes: (dict.notes as Dictionary[]).map(toNote),
    createdAt: dict.created_at as When,
    updatedAt: dict.updated_at as When,
    deletedAt: dict.deleted_at as When | undefined
  }
}

/** Create a dictionary representation of a Task instance. */
export const fromTask = (task: Task): Dictionary => ({
  id: task.id,
  title: task.title,
  description: task.description,
  notes: task.notes.map(fromNote),
  created_at: task.createdAt,
  updated_at: task.updatedAt,
  deleted_at: task.deletedAt
})

/** Create a TaskQuestion instance from dictionary representation. */
export const toTaskQuestion = (dict: Dictionary): TaskQuestion => {
  if (!dict.task_id) {
    return notValid('TaskQuestion dictionary missing required field: task_id')
  }
  if (!dict.question_id) {
    return notValid('TaskQuestion dictionary missing required field: question_id')
  }
  return {
    taskId: dict.task_id as string,
    questionId: dict.question_id as string,
    sequence: dict.sequence as number
  }
}

/** Create a dictionary representation of a TaskQuestion instance. */
export const fromTaskQuestion = (junction: TaskQuestion): Dictionary => ({
  task_id: junction.taskId,
  question_id: junction.questionId,
  sequence: junction.sequence
})

/** Create a Workflow instance from dictionary representation. */
export const toWorkflow = (dict: Dictionary): Workflow => {
  if (!dict.id) return notValid('Workflow dictionary missing required field: id')
  if (!dict.name) return notValid('Workflow dictionary missing required field: name')
  return {
    id: dict.id as string,
    name: dict.name as string,
    description: dict.description as string | undefined,
    version: dict.version as number,
    tags: dict.tags as string[],
    notes: (dict.notes as Dictionary[]).map(toNote),
    createdAt: dict.created_at as When,
    updatedAt: dict.updated_at as When,
    deletedAt: dict.deleted_at as When | undefined
  }
}

/** Create a dictionary representation of a Workflow instance. */
export const fromWorkflow = (workflow: Workflow): Dictionary => ({
  id: workflow.id,
  name: workflow.name,
  description: workflow.description,
  version: workflow.version,
  tags: workflow.tags,
  notes: workflow.notes.map(fromNote),
  created_at: workflow.createdAt,
  updated_at: workflow.updatedAt,
  deleted_at: workflow.deletedAt
})

/** Create a WorkflowTask instance from dictionary representation. */
export const toWorkflowTask = (dict: Dictionary): WorkflowTask => {
  if (!dict.workflow_id) {
    return notValid('WorkflowTask dictionary missing required field: workflow_id')
  }
  if (!dict.task_id) {
    return notValid('WorkflowTask dictionary missing required field: task_id')
  }
  return {
    workflowId: dict.workflow_id as string,
    taskId: dict.task_id as string,
    sequence: dict.sequence as number
  }
}

/** Create a dictionary representation of a WorkflowTask instance. */
export const fromWorkflowTask = (junction: WorkflowTask): Dictionary => ({
  workflow_id: junction.workflowId,
  task_id: junction.taskId,
  sequence: junction.sequence
})
