/**
 * Protocol input shapes for Workflow boundary operations.
 */

import type { Task } from '@domain/abstractions/workflow.ts'

/** Input for creating a Workflow. */
export type WorkflowCreate = {
  name: string
  description?: string
  version: number
  tags: string[]
  tasks: Task[]
}
