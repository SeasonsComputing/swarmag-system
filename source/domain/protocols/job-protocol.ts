/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Job protocol types                                                           ║
║ Boundary payload contracts for job topic abstractions.                       ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines create and update protocol payload shapes for job abstractions.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
JobCreate                 Create payload for Job.
JobUpdate                 Update payload for Job.
JobAssessmentCreate       Create payload for JobAssessment.
JobAssessmentUpdate       Update payload for JobAssessment.
JobWorkflowCreate         Create payload for JobWorkflow.
JobWorkflowUpdate         Update payload for JobWorkflow.
JobPlanCreate             Create payload for JobPlan.
JobPlanUpdate             Update payload for JobPlan.
JobPlanAssignmentCreate   Create payload for JobPlanAssignment.
JobPlanAssignmentUpdate   Update payload for JobPlanAssignment.
JobPlanChemicalCreate     Create payload for JobPlanChemical.
JobPlanChemicalUpdate     Update payload for JobPlanChemical.
JobPlanAssetCreate        Create payload for JobPlanAsset junction.
JobWorkCreate             Create payload for JobWork.
JobWorkUpdate             Update payload for JobWork.
JobWorkLogEntryCreate     Create payload for JobWorkLogEntry.
*/

import type { CreateFromInstantiable, UpdateFromInstantiable } from '@core/std'
import type {
  Job,
  JobAssessment,
  JobPlan,
  JobPlanAsset,
  JobPlanAssignment,
  JobPlanChemical,
  JobWork,
  JobWorkflow,
  JobWorkLogEntry
} from '@domain/abstractions/job.ts'

/* Job protocol */
export type JobCreate = CreateFromInstantiable<Job>
export type JobUpdate = UpdateFromInstantiable<Job>

/* JobAssessment protocol */
export type JobAssessmentCreate = CreateFromInstantiable<JobAssessment>
export type JobAssessmentUpdate = UpdateFromInstantiable<JobAssessment>

/* JobWorkflow protocol */
export type JobWorkflowCreate = CreateFromInstantiable<JobWorkflow>
export type JobWorkflowUpdate = UpdateFromInstantiable<JobWorkflow>

/* JobPlan protocol */
export type JobPlanCreate = CreateFromInstantiable<JobPlan>
export type JobPlanUpdate = UpdateFromInstantiable<JobPlan>

/* JobPlanAssignment protocol */
export type JobPlanAssignmentCreate = CreateFromInstantiable<JobPlanAssignment>
export type JobPlanAssignmentUpdate = UpdateFromInstantiable<JobPlanAssignment>

/* JobPlanChemical protocol */
export type JobPlanChemicalCreate = CreateFromInstantiable<JobPlanChemical>
export type JobPlanChemicalUpdate = UpdateFromInstantiable<JobPlanChemical>

/* JobPlanAsset protocol */
export type JobPlanAssetCreate = JobPlanAsset

/* JobWork protocol */
export type JobWorkCreate = CreateFromInstantiable<JobWork>
export type JobWorkUpdate = UpdateFromInstantiable<JobWork>

/* JobWorkLogEntry Create protocol */
export type JobWorkLogEntryCreate = Omit<JobWorkLogEntry, 'id' | 'createdAt'>
