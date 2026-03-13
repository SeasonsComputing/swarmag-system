/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Job protocol shapes                                                          ║
║ Create and update payloads for job topic abstractions.                       ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines create and update protocol shapes for all job-related abstractions:
Job, JobAssessment, JobWorkflow, JobPlan, JobPlanAssignment, JobPlanChemical,
JobPlanAsset, JobWork, and JobWorkLogEntry. Junction and InstantiableOnly
types have create protocols only.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
JobCreate                 Create payload for a Job.
JobUpdate                 Update payload for a Job.
JobAssessmentCreate       Create payload for a JobAssessment.
JobAssessmentUpdate       Update payload for a JobAssessment.
JobWorkflowCreate         Create payload for a JobWorkflow.
JobWorkflowUpdate         Update payload for a JobWorkflow.
JobPlanCreate             Create payload for a JobPlan.
JobPlanUpdate             Update payload for a JobPlan.
JobPlanAssignmentCreate   Create payload for a JobPlanAssignment.
JobPlanAssignmentUpdate   Update payload for a JobPlanAssignment.
JobPlanChemicalCreate     Create payload for a JobPlanChemical.
JobPlanChemicalUpdate     Update payload for a JobPlanChemical.
JobPlanAssetCreate        Create payload for a JobPlanAsset junction.
JobWorkCreate             Create payload for a JobWork.
JobWorkUpdate             Update payload for a JobWork.
JobWorkLogEntryCreate     Create payload for a JobWorkLogEntry.
*/

import type {
  AssociationJunction,
  CreateFromInstantiable,
  InstantiableOnly,
  UpdateFromInstantiable
} from '@core/std'
import type { Asset } from '@domain/abstractions/asset.ts'
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

// ────────────────────────────────────────────────────────────────────────────
// PROTOCOL
// ────────────────────────────────────────────────────────────────────────────

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

/** Junction create — no update protocol; junctions are created and hard-deleted only. */
export type JobPlanAssetCreate = {
  planId: AssociationJunction<JobPlan>
  assetId: AssociationJunction<Asset>
}

export type JobWorkCreate = CreateFromInstantiable<JobWork>
export type JobWorkUpdate = UpdateFromInstantiable<JobWork>

/** InstantiableOnly create — no update protocol; log entries are append-only. */
export type JobWorkLogEntryCreate = Omit<JobWorkLogEntry, keyof InstantiableOnly>
