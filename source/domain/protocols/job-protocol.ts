/*
╔═════════════════════════════════════════════════════════════════════════════╗
║ Job protocol contracts                                                      ║
║ Create and update payload contracts for job lifecycle abstractions          ║
╚═════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines boundary payload contracts for job persisted abstractions.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
JobCreate                          Create payload contract for Job.
JobUpdate                          Update payload contract for Job.
JobAssessmentCreate                Create payload contract for JobAssessment.
JobAssessmentUpdate                Update payload contract for JobAssessment.
JobWorkflowCreate                  Create payload contract for JobWorkflow.
JobWorkflowUpdate                  Update payload contract for JobWorkflow.
JobPlanCreate                      Create payload contract for JobPlan.
JobPlanUpdate                      Update payload contract for JobPlan.
JobPlanAssignmentCreate            Create payload contract for JobPlanAssignment.
JobPlanAssignmentUpdate            Update payload contract for JobPlanAssignment.
JobPlanChemicalCreate              Create payload contract for JobPlanChemical.
JobPlanChemicalUpdate              Update payload contract for JobPlanChemical.
JobPlanAssetCreate                 Create payload contract for JobPlanAsset.
JobWorkCreate                      Create payload contract for JobWork.
JobWorkUpdate                      Update payload contract for JobWork.
JobWorkLogEntryCreate              Create payload contract for JobWorkLogEntry.
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

/** Create payload contract for Job. */
export type JobCreate = CreateFromInstantiable<Job>

/** Update payload contract for Job. */
export type JobUpdate = UpdateFromInstantiable<Job>

/** Create payload contract for JobAssessment. */
export type JobAssessmentCreate = CreateFromInstantiable<JobAssessment>

/** Update payload contract for JobAssessment. */
export type JobAssessmentUpdate = UpdateFromInstantiable<JobAssessment>

/** Create payload contract for JobWorkflow. */
export type JobWorkflowCreate = CreateFromInstantiable<JobWorkflow>

/** Update payload contract for JobWorkflow. */
export type JobWorkflowUpdate = UpdateFromInstantiable<JobWorkflow>

/** Create payload contract for JobPlan. */
export type JobPlanCreate = CreateFromInstantiable<JobPlan>

/** Update payload contract for JobPlan. */
export type JobPlanUpdate = UpdateFromInstantiable<JobPlan>

/** Create payload contract for JobPlanAssignment. */
export type JobPlanAssignmentCreate = CreateFromInstantiable<JobPlanAssignment>

/** Update payload contract for JobPlanAssignment. */
export type JobPlanAssignmentUpdate = UpdateFromInstantiable<JobPlanAssignment>

/** Create payload contract for JobPlanChemical. */
export type JobPlanChemicalCreate = CreateFromInstantiable<JobPlanChemical>

/** Update payload contract for JobPlanChemical. */
export type JobPlanChemicalUpdate = UpdateFromInstantiable<JobPlanChemical>

/** Create payload contract for JobPlanAsset. */
export type JobPlanAssetCreate = JobPlanAsset

/** Create payload contract for JobWork. */
export type JobWorkCreate = CreateFromInstantiable<JobWork>

/** Update payload contract for JobWork. */
export type JobWorkUpdate = UpdateFromInstantiable<JobWork>

/** Create payload contract for JobWorkLogEntry. */
export type JobWorkLogEntryCreate = Omit<JobWorkLogEntry, 'id' | 'createdAt'>
