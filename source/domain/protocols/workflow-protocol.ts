/*
╔═════════════════════════════════════════════════════════════════════════════╗
║ Workflow protocol contracts                                                 ║
║ Create and update payload contracts for workflow abstractions               ║
╚═════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines boundary payload contracts for workflow persisted abstractions.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
TaskCreate                         Create payload contract for Task.
TaskUpdate                         Update payload contract for Task.
TaskQuestionCreate                 Create payload contract for TaskQuestion.
WorkflowCreate                     Create payload contract for Workflow.
WorkflowUpdate                     Update payload contract for Workflow.
WorkflowTaskCreate                 Create payload contract for WorkflowTask.
*/

import type { CreateFromInstantiable, UpdateFromInstantiable } from '@core/std'
import type { Task, TaskQuestion, Workflow, WorkflowTask } from '@domain/abstractions/workflow.ts'

/** Create payload contract for Task. */
export type TaskCreate = CreateFromInstantiable<Task>

/** Update payload contract for Task. */
export type TaskUpdate = UpdateFromInstantiable<Task>

/** Create payload contract for TaskQuestion. */
export type TaskQuestionCreate = TaskQuestion

/** Create payload contract for Workflow. */
export type WorkflowCreate = CreateFromInstantiable<Workflow>

/** Update payload contract for Workflow. */
export type WorkflowUpdate = UpdateFromInstantiable<Workflow>

/** Create payload contract for WorkflowTask. */
export type WorkflowTaskCreate = WorkflowTask
