/**
 * Domain models for workflows in the swarmAg system.
 * Workflows define the steps for executing services.
 */

import type { ID } from '@utils/identifier.ts'
import type { When } from '@utils/datetime.ts'
import type { Location, Note, Question } from '@domain/common.ts'

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

/** A version of the workflow with effective dates. */
export interface WorkflowVersion {
  version: number
  effectiveFrom: When
  steps: WorkflowStep[]
}

/** Represents a workflow in the swarmAg system. */
export interface Workflow {
  id: ID
  serviceId: ID
  name: string
  description?: string
  locationsRequired?: Location[]
  versions: WorkflowVersion[]
  createdAt: When
  updatedAt: When
}
