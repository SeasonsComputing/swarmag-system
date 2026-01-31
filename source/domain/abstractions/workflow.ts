/**
 * Domain models for workflows in the swarmAg system.
 * Workflows define the steps for executing services.
 */

import type { Location, Note, Question } from '@domain/abstractions/common.ts'
import type { ID, When } from '@utils'

/** A step in a workflow, including checklists and requirements. */
export interface WorkflowStep {
  id: ID
  title: string
  description?: string
  checklist: Question[]
  requiresLocationCapture?: boolean
  requiresPhoto?: boolean
  notes?: Note[]
}

/** Represents a workflow in the swarmAg system. */
export interface Workflow {
  id: ID
  serviceId: ID
  name: string
  description?: string
  version: number
  effectiveFrom: When
  steps: WorkflowStep[]
  locationsRequired?: Location[]
  createdAt: When
  updatedAt: When
}
