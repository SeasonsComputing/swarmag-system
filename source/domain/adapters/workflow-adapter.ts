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
TaskAdapter          Deserialize/Serialize Task.
TaskQuestionAdapter  Deserialize/Serialize TaskQuestion.
WorkflowAdapter      Deserialize/Serialize Workflow.
WorkflowTaskAdapter  Deserialize/Serialize WorkflowTask.
*/

import { makeAdapter } from '@core/stdx'
import type { Task, TaskQuestion, Workflow, WorkflowTask } from '@domain/abstractions/workflow.ts'
import { NoteAdapter } from '@domain/adapters/common-adapter.ts'

/** Deserialize/Serialize Task. */
export const TaskAdapter = makeAdapter<Task>({
  id: ['id'],
  createdAt: ['created_at'],
  updatedAt: ['updated_at'],
  deletedAt: ['deleted_at'],
  notes: ['notes', NoteAdapter],
  label: ['label'],
  description: ['description']
})

/** Deserialize/Serialize TaskQuestion. */
export const TaskQuestionAdapter = makeAdapter<TaskQuestion>({
  taskId: ['task_id'],
  questionId: ['question_id'],
  sequence: ['sequence']
})

/** Deserialize/Serialize Workflow. */
export const WorkflowAdapter = makeAdapter<Workflow>({
  id: ['id'],
  createdAt: ['created_at'],
  updatedAt: ['updated_at'],
  deletedAt: ['deleted_at'],
  notes: ['notes', NoteAdapter],
  name: ['name'],
  description: ['description'],
  version: ['version'],
  tags: ['tags']
})

/** Deserialize/Serialize WorkflowTask. */
export const WorkflowTaskAdapter = makeAdapter<WorkflowTask>({
  workflowId: ['workflow_id'],
  taskId: ['task_id'],
  sequence: ['sequence']
})
