/**
 * Workflow domain protocols.
 */

import type { CreateFromInstantiable, UpdateFromInstantiable } from '@core-std'
import type { Task, Workflow } from '@domain/abstractions/workflow.ts'

export type TaskCreate = CreateFromInstantiable<Task>
export type TaskUpdate = UpdateFromInstantiable<Task>
export type WorkflowCreate = CreateFromInstantiable<Workflow>
export type WorkflowUpdate = UpdateFromInstantiable<Workflow>
