/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Workflow protocol types                                                      ║
║ Boundary payload contracts for workflow topic abstractions.                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines create and update protocol payload shapes for workflow abstractions.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
TaskCreate          Create payload for Task.
TaskUpdate          Update payload for Task.
TaskQuestionCreate  Create payload for TaskQuestion junction.
TaskQuestionUpdate  Update payload for TaskQuestion junction.
WorkflowCreate      Create payload for Workflow.
WorkflowUpdate      Update payload for Workflow.
WorkflowTaskCreate  Create payload for WorkflowTask junction.
WorkflowTaskUpdate  Update payload for WorkflowTask junction.
*/

import type { CreateFromInstantiable, UpdateFromInstantiable } from '@core/std'
import type { Task, TaskQuestion, Workflow, WorkflowTask } from '@domain/abstractions/workflow.ts'

/* Task protocol */
export type TaskCreate = CreateFromInstantiable<Task>
export type TaskUpdate = UpdateFromInstantiable<Task>

/* TaskQuestion protocol */
export type TaskQuestionCreate = TaskQuestion
export type TaskQuestionUpdate = TaskQuestion

/* Workflow protocol */
export type WorkflowCreate = CreateFromInstantiable<Workflow>
export type WorkflowUpdate = UpdateFromInstantiable<Workflow>

/* WorkflowTask protocol */
export type WorkflowTaskCreate = WorkflowTask
export type WorkflowTaskUpdate = WorkflowTask
