/**
 * Domain models for jobs in the swarmAg system.
 * Jobs represent operational tasks related to services.
 */

import type { ID } from '@utils/identifier.ts'
import type { When } from '@utils/datetime.ts'
import type { Answer, Attachment, Author, Location, Note } from '@domain/common.ts'

/** The possible statuses of a job. */
export type JobStatus =
  | 'draft'
  | 'ready'
  | 'scheduled'
  | 'in-progress'
  | 'completed'
  | 'cancelled'

/** Represents an assessment performed for a potential job. */
export interface JobAssessment {
  id: ID
  serviceId: ID
  customerId: ID
  contactId?: ID
  assessor: Author
  assessedAt: When
  locations: [Location, ...Location[]]
  questions: Answer[]
  risks?: Note[]
  notes?: Note[]
  attachments?: Attachment[]
  createdAt: When
  updatedAt: When
}

/** Represents an assignment of a team member to a job plan, including their role. */
export interface JobAssignment {
  memberId: ID
  role: string
  notes?: string
}

/** The planned use of a chemical in a job. */
export interface JobChemicalPlan {
  chemicalId: ID
  amount: number
  unit: 'gallon' | 'liter' | 'pound' | 'kilogram'
  targetArea?: number
  targetAreaUnit?: 'acre' | 'hectare'
}

/** The detailed plan for executing a job. */
export interface JobPlan {
  id: ID
  jobId: ID
  workflowId: ID
  status: JobStatus
  scheduledStart: When
  scheduledEnd?: When
  targetLocations: Location[]
  assignments: JobAssignment[]
  assets: ID[]
  chemicals: JobChemicalPlan[]
  notes?: Note[]
  createdAt: When
  updatedAt: When
}

/** The types of log entries for a job. */
export type JobLogType =
  | 'status'
  | 'checkpoint'
  | 'note'
  | 'telemetry'
  | 'exception'

/** Payload for job log entries. */
export type JobLogPayload = Record<string, unknown>

/** Represents a log entry for a job, such as status updates or telemetry. */
export interface JobLogEntry {
  id: ID
  jobId: ID
  planId: ID
  type: JobLogType
  message: string
  occurredAt: When
  createdAt: When
  createdBy: Author
  location?: Location
  attachments?: Attachment[]
  payload?: JobLogPayload
}

/** Represents a job in the system. */
export interface Job {
  id: ID
  assessmentId: ID
  planId: ID
  serviceId: ID
  customerId: ID
  status: JobStatus
  createdAt: When
  updatedAt: When
}
