/**
 * Protocol input shapes for Workflow create and update operations.
 * Partial shapes for boundary transmission — no domain logic.
 */

import type { Id } from '@core-std'
import type { Workflow, Task } from '@domain/abstractions/workflow.ts'

/** Input shape for creating a Workflow. */
export type WorkflowCreateInput = {
  name: string
  description?: string
  version: number
  tags?: [string?, ...string[]]
  tasks: [Task, ...Task[]]
}

/** Input shape for updating a Workflow. */
export type WorkflowUpdateInput = {
  id: Id
  name?: string
  description?: string
  version?: number
  tags?: [string?, ...string[]]
  tasks?: [Task, ...Task[]]
}
