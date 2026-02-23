/**
 * Protocol input types for Workflow boundary operations.
 */

import type { Id } from '@core-std'
import type { Task } from '@domain/abstractions/workflow.ts'

/** Input for creating a Workflow. */
export type WorkflowCreateInput = {
  name: string
  description?: string
  version: number
  tags?: [string?, ...string[]]
  tasks: [Task, ...Task[]]
}

/** Input for updating a Workflow. */
export type WorkflowUpdateInput = {
  id: Id
  name?: string
  description?: string
  version?: number
  tags?: [string?, ...string[]]
  tasks?: [Task, ...Task[]]
}
