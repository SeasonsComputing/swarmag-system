/*
╔═════════════════════════════════════════════════════════════════════════════╗
║ Workflow domain adapters                                                   ║
║ Dictionary <-> domain serialization for workflow topic abstractions.       ║
╚═════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Converts between persisted dictionary payloads and workflow domain
abstractions.

EXPORTED APIs & TYPEs
───────────────────────────────────────────────────────────────────────────────
toTask(dict) / fromTask(task)
  Convert Task dictionaries and domain objects.

toTaskQuestion(dict) / fromTaskQuestion(taskQuestion)
  Convert TaskQuestion dictionaries and domain objects.

toWorkflow(dict) / fromWorkflow(workflow)
  Convert Workflow dictionaries and domain objects.

toWorkflowTask(dict) / fromWorkflowTask(workflowTask)
  Convert WorkflowTask dictionaries and domain objects.
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

// ────────────────────────────────────────────────────────────────────────────
// PUBLIC EXPORTS
// ────────────────────────────────────────────────────────────────────────────

/** Create a Task from its dictionary representation. */
export const toTask = (dict: Dictionary): Task => {
  if (!dict.id) return notValid('Task dictionary missing required field: id')
  if (!dict.notes) return notValid('Task dictionary missing required field: notes')
  if (!dict.label) return notValid('Task dictionary missing required field: label')
  if (!dict.created_at) {
    return notValid('Task dictionary missing required field: created_at')
  }
  if (!dict.updated_at) {
    return notValid('Task dictionary missing required field: updated_at')
  }

  return {
    id: dict.id as string,
    notes: (dict.notes as Dictionary[]).map(toNote),
    label: dict.label as string,
    description: dict.description as string | undefined,
    createdAt: dict.created_at as When,
    updatedAt: dict.updated_at as When,
    deletedAt: dict.deleted_at as When | undefined
  }
}

/** Create a dictionary representation from a Task. */
export const fromTask = (task: Task): Dictionary => ({
  id: task.id,
  notes: task.notes.map(fromNote),
  label: task.label,
  description: task.description,
  created_at: task.createdAt,
  updated_at: task.updatedAt,
  deleted_at: task.deletedAt
})

/** Create a TaskQuestion from its dictionary representation. */
export const toTaskQuestion = (dict: Dictionary): TaskQuestion => {
  if (!dict.task_id) {
    return notValid('TaskQuestion dictionary missing required field: task_id')
  }
  if (!dict.question_id) {
    return notValid('TaskQuestion dictionary missing required field: question_id')
  }
  if (dict.sequence === undefined) {
    return notValid('TaskQuestion dictionary missing required field: sequence')
  }

  return {
    taskId: dict.task_id as string,
    questionId: dict.question_id as string,
    sequence: dict.sequence as number
  }
}

/** Create a dictionary representation from a TaskQuestion. */
export const fromTaskQuestion = (taskQuestion: TaskQuestion): Dictionary => ({
  task_id: taskQuestion.taskId,
  question_id: taskQuestion.questionId,
  sequence: taskQuestion.sequence
})

/** Create a Workflow from its dictionary representation. */
export const toWorkflow = (dict: Dictionary): Workflow => {
  if (!dict.id) return notValid('Workflow dictionary missing required field: id')
  if (!dict.notes) return notValid('Workflow dictionary missing required field: notes')
  if (!dict.name) return notValid('Workflow dictionary missing required field: name')
  if (dict.version === undefined) {
    return notValid('Workflow dictionary missing required field: version')
  }
  if (!dict.tags) return notValid('Workflow dictionary missing required field: tags')
  if (!dict.created_at) {
    return notValid('Workflow dictionary missing required field: created_at')
  }
  if (!dict.updated_at) {
    return notValid('Workflow dictionary missing required field: updated_at')
  }

  return {
    id: dict.id as string,
    notes: (dict.notes as Dictionary[]).map(toNote),
    name: dict.name as string,
    description: dict.description as string | undefined,
    version: dict.version as number,
    tags: (dict.tags as string[]).map(value => value),
    createdAt: dict.created_at as When,
    updatedAt: dict.updated_at as When,
    deletedAt: dict.deleted_at as When | undefined
  }
}

/** Create a dictionary representation from a Workflow. */
export const fromWorkflow = (workflow: Workflow): Dictionary => ({
  id: workflow.id,
  notes: workflow.notes.map(fromNote),
  name: workflow.name,
  description: workflow.description,
  version: workflow.version,
  tags: workflow.tags.map(value => value),
  created_at: workflow.createdAt,
  updated_at: workflow.updatedAt,
  deleted_at: workflow.deletedAt
})

/** Create a WorkflowTask from its dictionary representation. */
export const toWorkflowTask = (dict: Dictionary): WorkflowTask => {
  if (!dict.workflow_id) {
    return notValid('WorkflowTask dictionary missing required field: workflow_id')
  }
  if (!dict.task_id) {
    return notValid('WorkflowTask dictionary missing required field: task_id')
  }
  if (dict.sequence === undefined) {
    return notValid('WorkflowTask dictionary missing required field: sequence')
  }

  return {
    workflowId: dict.workflow_id as string,
    taskId: dict.task_id as string,
    sequence: dict.sequence as number
  }
}

/** Create a dictionary representation from a WorkflowTask. */
export const fromWorkflowTask = (workflowTask: WorkflowTask): Dictionary => ({
  workflow_id: workflowTask.workflowId,
  task_id: workflowTask.taskId,
  sequence: workflowTask.sequence
})
