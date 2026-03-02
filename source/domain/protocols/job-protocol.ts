/**
 * Protocols for the job domain area: create and update shapes for all job types.
 * JobPlanAsset is a junction type — no protocol entry.
 * JobWork is an immutable manifest — no JobWorkUpdate.
 * JobWorkLogEntry is append-only — no update shape.
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

/** Input for creating a Job. */
export type JobCreate = CreateFromInstantiable<Job>

/** Input for updating a Job. */
export type JobUpdate = UpdateFromInstantiable<Job>

/** Input for creating a JobAssessment. */
export type JobAssessmentCreate = CreateFromInstantiable<JobAssessment>

/** Input for updating a JobAssessment. */
export type JobAssessmentUpdate = UpdateFromInstantiable<JobAssessment>

/** Input for creating a JobWorkflow. */
export type JobWorkflowCreate = CreateFromInstantiable<JobWorkflow>

/** Input for updating a JobWorkflow. */
export type JobWorkflowUpdate = UpdateFromInstantiable<JobWorkflow>

/** Input for creating a JobPlan. */
export type JobPlanCreate = CreateFromInstantiable<JobPlan>

/** Input for updating a JobPlan. */
export type JobPlanUpdate = UpdateFromInstantiable<JobPlan>

/** Input for creating a JobPlanAssignment. */
export type JobPlanAssignmentCreate = CreateFromInstantiable<JobPlanAssignment>

/** Input for updating a JobPlanAssignment. */
export type JobPlanAssignmentUpdate = UpdateFromInstantiable<JobPlanAssignment>

/** Input for creating a JobPlanChemical. */
export type JobPlanChemicalCreate = CreateFromInstantiable<JobPlanChemical>

/** Input for updating a JobPlanChemical. */
export type JobPlanChemicalUpdate = UpdateFromInstantiable<JobPlanChemical>

/** Input for creating a JobWork; no update — execution manifest is immutable. */
export type JobWorkCreate = CreateFromInstantiable<JobWork>

/** Input for creating a JobWorkLogEntry; append-only, no update. */
export type JobWorkLogEntryCreate = Pick<JobWorkLogEntry, 'jobId' | 'userId' | 'answer'>
