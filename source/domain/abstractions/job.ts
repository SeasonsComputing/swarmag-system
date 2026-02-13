/**
 * Domain models for jobs in the swarmAg system.
 * Jobs represent operational tasks related to services.
 */

import type { Dictionary, ID, When } from '@core-std'
import type { Attachment, Location, Note } from './common.ts'
import type { Answer } from './workflow.ts'

/** The possible statuses of a job. */
export type JobStatus =
  | 'opened'
  | 'assessed'
  | 'planned'
  | 'inprogress'
  | 'completed'
  | 'closed'
  | 'cancelled'

/** Represents an assessment performed for a job. */
export interface JobAssessment {
  id: ID
  jobId: ID
  assessorId: ID
  locations: [Location, ...Location[]]
  questions: Answer[]
  risks?: Note[]
  notes?: Note[]
  attachments?: Attachment[]
  createdAt: When
  updatedAt: When
  deletedAt?: When
}

/** Represents an assignment of a team member to a job plan, including their role. */
export interface JobPlanAssignment {
  planId: ID
  userId: ID
  role: string
  notes?: string
  deletedAt?: When
}

/** The planned use of a chemical in a job. */
export interface JobPlanChemical {
  planId: ID
  chemicalId: ID
  amount: number
  unit: 'gallon' | 'liter' | 'pound' | 'kilogram'
  targetArea?: number
  targetAreaUnit?: 'acre' | 'hectare'
  deletedAt?: When
}

/** Represents the assignment of an asset to a job plan. */
export interface JobPlanAsset {
  planId: ID
  assetId: ID
  deletedAt?: When
}

/** The detailed plan for executing a job. */
export interface JobPlan {
  id: ID
  jobId: ID
  workflowId: ID
  scheduledStart: When
  scheduledEnd?: When
  targetLocations: Location[]
  notes?: Note[]
  createdAt: When
  updatedAt: When
  deletedAt?: When
}

/** The types of log entries for a job. */
export type JobLogType =
  | 'status'
  | 'checkpoint'
  | 'note'
  | 'telemetry'
  | 'exception'

/** Payload for job log entries. */
export type JobLogPayload = Dictionary

/** Represents a log entry for a job, such as status updates or telemetry. */
export interface JobLogEntry {
  id: ID
  jobId: ID
  type: JobLogType
  message: string
  occurredAt: When
  createdAt: When
  createdById: ID
  location?: Location
  attachments?: Attachment[]
  payload?: JobLogPayload
}

/** Represents a job in the system. */
export interface Job {
  id: ID
  customerId: ID
  serviceId: ID
  status: JobStatus
  createdAt: When
  updatedAt: When
  deletedAt?: When
}
