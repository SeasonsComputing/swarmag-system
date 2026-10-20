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
TaskCreate                Create payload for Task.
TaskUpdate                Update payload for Task.
QuestionCreate            Union create payload for Question variants.
├ InternalQuestionCreate  Create payload for internal questions.
├ ScalarQuestionCreate    Create payload for scalar questions.
└ SelectQuestionCreate    Create payload for select questions.
QuestionUpdate            Union update payload for Question variants.
├ InternalQuestionUpdate  Update payload for internal questions.
├ ScalarQuestionUpdate    Update payload for scalar questions.
└ SelectQuestionUpdate    Update payload for select questions.
TaskQuestionCreate        Create payload for TaskQuestion junction.
TaskQuestionUpdate        Update payload for TaskQuestion junction.
WorkflowCreate            Create payload for Workflow.
WorkflowUpdate            Update payload for Workflow.
WorkflowTaskCreate        Create payload for WorkflowTask junction.
WorkflowTaskUpdate        Update payload for WorkflowTask junction.
*/

import type { CreateFromInstantiable, UpdateFromInstantiable } from '@core/std'
import type {
  InternalQuestion,
  ScalarQuestion,
  SelectQuestion,
  Task,
  TaskQuestion,
  Workflow,
  WorkflowTask
} from '@domain/abstractions/workflow.ts'

/* Task protocol */
export type TaskCreate = CreateFromInstantiable<Task>
export type TaskUpdate = UpdateFromInstantiable<Task>

/* Question protocol */
export type InternalQuestionCreate = CreateFromInstantiable<InternalQuestion>
export type ScalarQuestionCreate = CreateFromInstantiable<ScalarQuestion>
export type SelectQuestionCreate = CreateFromInstantiable<SelectQuestion>
export type QuestionCreate =
  | InternalQuestionCreate
  | ScalarQuestionCreate
  | SelectQuestionCreate
export type InternalQuestionUpdate = UpdateFromInstantiable<InternalQuestion>
export type ScalarQuestionUpdate = UpdateFromInstantiable<ScalarQuestion>
export type SelectQuestionUpdate = UpdateFromInstantiable<SelectQuestion>
export type QuestionUpdate =
  | InternalQuestionUpdate
  | ScalarQuestionUpdate
  | SelectQuestionUpdate

/* TaskQuestion protocol */
export type TaskQuestionCreate = TaskQuestion
export type TaskQuestionUpdate = TaskQuestion

/* Workflow protocol */
export type WorkflowCreate = CreateFromInstantiable<Workflow>
export type WorkflowUpdate = UpdateFromInstantiable<Workflow>

/* WorkflowTask protocol */
export type WorkflowTaskCreate = WorkflowTask
export type WorkflowTaskUpdate = WorkflowTask
