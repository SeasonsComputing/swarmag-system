/**
 * Job domain protocols.
 */

import type { CreateFromInstantiable, UpdateFromInstantiable } from '@core-std'
import type {
  Job,
  JobAssessment,
  JobPlan,
  JobPlanAssignment,
  JobPlanChemical,
  JobWork,
  JobWorkflow,
  JobWorkLogEntry
} from '@domain/abstractions/job.ts'

export type JobCreate = CreateFromInstantiable<Job>
export type JobUpdate = UpdateFromInstantiable<Job>
export type JobAssessmentCreate = CreateFromInstantiable<JobAssessment>
export type JobAssessmentUpdate = UpdateFromInstantiable<JobAssessment>
export type JobWorkflowCreate = CreateFromInstantiable<JobWorkflow>
export type JobWorkflowUpdate = UpdateFromInstantiable<JobWorkflow>
export type JobPlanCreate = CreateFromInstantiable<JobPlan>
export type JobPlanUpdate = UpdateFromInstantiable<JobPlan>
export type JobPlanAssignmentCreate = CreateFromInstantiable<JobPlanAssignment>
export type JobPlanAssignmentUpdate = UpdateFromInstantiable<JobPlanAssignment>
export type JobPlanChemicalCreate = CreateFromInstantiable<JobPlanChemical>
export type JobPlanChemicalUpdate = UpdateFromInstantiable<JobPlanChemical>
export type JobWorkCreate = CreateFromInstantiable<JobWork>
export type JobWorkUpdate = UpdateFromInstantiable<JobWork>
export type JobWorkLogEntryCreate = Pick<JobWorkLogEntry, 'jobId' | 'userId' | 'answer'>
