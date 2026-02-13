/**
 * Protocol types for workflow API requests and responses.
 */

import type { WorkflowStep } from '@domain/abstractions/workflow.ts'

/** Input type for creating a workflow. */
export interface WorkflowCreateInput {
  serviceId: string
  name: string
  description?: string
  steps: WorkflowStep[]
}

/** Input type for updating a workflow. */
export interface WorkflowUpdateInput {
  id: string
  name?: string
  description?: string | null
  steps?: WorkflowStep[]
}
