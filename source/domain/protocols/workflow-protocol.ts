/**
 * Protocols for the workflow domain area: Task and Workflow create and update shapes.
 * Workflow is read-only master — no WorkflowUpdate.
 * TaskQuestion and WorkflowTask are junction types — no protocol entries.
 */

import type { CreateFromInstantiable, UpdateFromInstantiable } from '@core-std'
import type { Task, Workflow } from '@domain/abstractions/workflow.ts'

/** Input for creating a Task. */
export type TaskCreate = CreateFromInstantiable<Task>

/** Input for updating a Task. */
export type TaskUpdate = UpdateFromInstantiable<Task>

/** Input for creating a Workflow; no update — Workflow is a read-only master. */
export type WorkflowCreate = CreateFromInstantiable<Workflow>
