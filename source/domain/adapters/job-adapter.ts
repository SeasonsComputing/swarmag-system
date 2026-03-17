/*
╔═════════════════════════════════════════════════════════════════════════════╗
║ Job domain adapters                                                         ║
║ Dictionary serialization for job lifecycle topic abstractions               ║
╚═════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Serializes job lifecycle abstractions between Dictionary and domain shapes.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
toJob                               Deserialize Job from Dictionary.
fromJob                             Serialize Job to Dictionary.
toJobAssessment                     Deserialize JobAssessment from Dictionary.
fromJobAssessment                   Serialize JobAssessment to Dictionary.
toJobWorkflow                       Deserialize JobWorkflow from Dictionary.
fromJobWorkflow                     Serialize JobWorkflow to Dictionary.
toJobPlan                           Deserialize JobPlan from Dictionary.
fromJobPlan                         Serialize JobPlan to Dictionary.
toJobPlanAssignment                 Deserialize JobPlanAssignment from Dictionary.
fromJobPlanAssignment               Serialize JobPlanAssignment to Dictionary.
toJobPlanChemical                   Deserialize JobPlanChemical from Dictionary.
fromJobPlanChemical                 Serialize JobPlanChemical to Dictionary.
toJobPlanAsset                      Deserialize JobPlanAsset from Dictionary.
fromJobPlanAsset                    Serialize JobPlanAsset to Dictionary.
toJobWork                           Deserialize JobWork from Dictionary.
fromJobWork                         Serialize JobWork to Dictionary.
toJobWorkLogEntry                   Deserialize JobWorkLogEntry from Dictionary.
fromJobWorkLogEntry                 Serialize JobWorkLogEntry to Dictionary.
*/

import type { Dictionary, Id, When } from '@core/std'
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
import {
  fromAnswer,
  fromLocation,
  fromNote,
  toAnswer,
  toLocation,
  toNote
} from '@domain/adapters/common-adapter.ts'

/** Deserialize Job from Dictionary. */
export const toJob = (dict: Dictionary): Job => ({
  id: dict.id as Id,
  createdAt: dict.created_at as When,
  updatedAt: dict.updated_at as When,
  deletedAt: dict.deleted_at as When | undefined,
  customerId: dict.customer_id as Id,
  status: dict.status as Job['status']
})

/** Serialize Job to Dictionary. */
export const fromJob = (job: Job): Dictionary => ({
  id: job.id,
  created_at: job.createdAt,
  updated_at: job.updatedAt,
  deleted_at: job.deletedAt,
  customer_id: job.customerId,
  status: job.status
})

/** Deserialize JobAssessment from Dictionary. */
export const toJobAssessment = (dict: Dictionary): JobAssessment => ({
  id: dict.id as Id,
  createdAt: dict.created_at as When,
  updatedAt: dict.updated_at as When,
  deletedAt: dict.deleted_at as When | undefined,
  jobId: dict.job_id as Id,
  assessorId: dict.assessor_id as Id,
  scheduledAt: dict.scheduled_at as When,
  startedAt: dict.started_at as When | undefined,
  completedAt: dict.completed_at as When | undefined,
  locations: (dict.locations as Dictionary[]).map(toLocation),
  risks: (dict.risks as Dictionary[]).map(toNote),
  notes: (dict.notes as Dictionary[]).map(toNote)
})

/** Serialize JobAssessment to Dictionary. */
export const fromJobAssessment = (jobAssessment: JobAssessment): Dictionary => ({
  id: jobAssessment.id,
  created_at: jobAssessment.createdAt,
  updated_at: jobAssessment.updatedAt,
  deleted_at: jobAssessment.deletedAt,
  job_id: jobAssessment.jobId,
  assessor_id: jobAssessment.assessorId,
  scheduled_at: jobAssessment.scheduledAt,
  started_at: jobAssessment.startedAt,
  completed_at: jobAssessment.completedAt,
  locations: jobAssessment.locations.map(fromLocation),
  risks: jobAssessment.risks.map(fromNote),
  notes: jobAssessment.notes.map(fromNote)
})

/** Deserialize JobWorkflow from Dictionary. */
export const toJobWorkflow = (dict: Dictionary): JobWorkflow => ({
  id: dict.id as Id,
  createdAt: dict.created_at as When,
  updatedAt: dict.updated_at as When,
  deletedAt: dict.deleted_at as When | undefined,
  jobId: dict.job_id as Id,
  basisWorkflowId: dict.basis_workflow_id as Id,
  modifiedWorkflowId: dict.modified_workflow_id as Id | undefined
})

/** Serialize JobWorkflow to Dictionary. */
export const fromJobWorkflow = (jobWorkflow: JobWorkflow): Dictionary => ({
  id: jobWorkflow.id,
  created_at: jobWorkflow.createdAt,
  updated_at: jobWorkflow.updatedAt,
  deleted_at: jobWorkflow.deletedAt,
  job_id: jobWorkflow.jobId,
  basis_workflow_id: jobWorkflow.basisWorkflowId,
  modified_workflow_id: jobWorkflow.modifiedWorkflowId
})

/** Deserialize JobPlan from Dictionary. */
export const toJobPlan = (dict: Dictionary): JobPlan => ({
  id: dict.id as Id,
  createdAt: dict.created_at as When,
  updatedAt: dict.updated_at as When,
  deletedAt: dict.deleted_at as When | undefined,
  jobId: dict.job_id as Id,
  plannerId: dict.planner_id as Id,
  notes: (dict.notes as Dictionary[]).map(toNote),
  scheduledStart: dict.scheduled_start as When,
  durationEstimate: dict.duration_estimate as number
})

/** Serialize JobPlan to Dictionary. */
export const fromJobPlan = (jobPlan: JobPlan): Dictionary => ({
  id: jobPlan.id,
  created_at: jobPlan.createdAt,
  updated_at: jobPlan.updatedAt,
  deleted_at: jobPlan.deletedAt,
  job_id: jobPlan.jobId,
  planner_id: jobPlan.plannerId,
  notes: jobPlan.notes.map(fromNote),
  scheduled_start: jobPlan.scheduledStart,
  duration_estimate: jobPlan.durationEstimate
})

/** Deserialize JobPlanAssignment from Dictionary. */
export const toJobPlanAssignment = (dict: Dictionary): JobPlanAssignment => ({
  id: dict.id as Id,
  createdAt: dict.created_at as When,
  updatedAt: dict.updated_at as When,
  deletedAt: dict.deleted_at as When | undefined,
  planId: dict.plan_id as Id,
  crewMemberId: dict.crew_member_id as Id,
  notes: (dict.notes as Dictionary[]).map(toNote),
  role: dict.role as JobPlanAssignment['role']
})

/** Serialize JobPlanAssignment to Dictionary. */
export const fromJobPlanAssignment = (jobPlanAssignment: JobPlanAssignment): Dictionary => ({
  id: jobPlanAssignment.id,
  created_at: jobPlanAssignment.createdAt,
  updated_at: jobPlanAssignment.updatedAt,
  deleted_at: jobPlanAssignment.deletedAt,
  plan_id: jobPlanAssignment.planId,
  crew_member_id: jobPlanAssignment.crewMemberId,
  notes: jobPlanAssignment.notes.map(fromNote),
  role: jobPlanAssignment.role
})

/** Deserialize JobPlanChemical from Dictionary. */
export const toJobPlanChemical = (dict: Dictionary): JobPlanChemical => ({
  id: dict.id as Id,
  createdAt: dict.created_at as When,
  updatedAt: dict.updated_at as When,
  deletedAt: dict.deleted_at as When | undefined,
  planId: dict.plan_id as Id,
  chemicalId: dict.chemical_id as Id,
  amount: dict.amount as number,
  unit: dict.unit as JobPlanChemical['unit'],
  targetArea: dict.target_area as number | undefined,
  targetAreaUnit: dict.target_area_unit as JobPlanChemical['targetAreaUnit']
})

/** Serialize JobPlanChemical to Dictionary. */
export const fromJobPlanChemical = (jobPlanChemical: JobPlanChemical): Dictionary => ({
  id: jobPlanChemical.id,
  created_at: jobPlanChemical.createdAt,
  updated_at: jobPlanChemical.updatedAt,
  deleted_at: jobPlanChemical.deletedAt,
  plan_id: jobPlanChemical.planId,
  chemical_id: jobPlanChemical.chemicalId,
  amount: jobPlanChemical.amount,
  unit: jobPlanChemical.unit,
  target_area: jobPlanChemical.targetArea,
  target_area_unit: jobPlanChemical.targetAreaUnit
})

/** Deserialize JobPlanAsset from Dictionary. */
export const toJobPlanAsset = (dict: Dictionary): JobPlanAsset => ({
  planId: dict.plan_id as Id,
  assetId: dict.asset_id as Id
})

/** Serialize JobPlanAsset to Dictionary. */
export const fromJobPlanAsset = (jobPlanAsset: JobPlanAsset): Dictionary => ({
  plan_id: jobPlanAsset.planId,
  asset_id: jobPlanAsset.assetId
})

/** Deserialize JobWork from Dictionary. */
export const toJobWork = (dict: Dictionary): JobWork => ({
  id: dict.id as Id,
  createdAt: dict.created_at as When,
  updatedAt: dict.updated_at as When,
  deletedAt: dict.deleted_at as When | undefined,
  jobId: dict.job_id as Id,
  startedById: dict.started_by_id as Id,
  work: dict.work as Id[],
  startedAt: dict.started_at as When,
  completedAt: dict.completed_at as When | undefined
})

/** Serialize JobWork to Dictionary. */
export const fromJobWork = (jobWork: JobWork): Dictionary => ({
  id: jobWork.id,
  created_at: jobWork.createdAt,
  updated_at: jobWork.updatedAt,
  deleted_at: jobWork.deletedAt,
  job_id: jobWork.jobId,
  started_by_id: jobWork.startedById,
  work: jobWork.work,
  started_at: jobWork.startedAt,
  completed_at: jobWork.completedAt
})

/** Deserialize JobWorkLogEntry from Dictionary. */
export const toJobWorkLogEntry = (dict: Dictionary): JobWorkLogEntry => ({
  id: dict.id as Id,
  createdAt: dict.created_at as When,
  jobId: dict.job_id as Id,
  userId: dict.user_id as Id,
  answer: (dict.answer as Dictionary[]).map(toAnswer)
})

/** Serialize JobWorkLogEntry to Dictionary. */
export const fromJobWorkLogEntry = (jobWorkLogEntry: JobWorkLogEntry): Dictionary => ({
  id: jobWorkLogEntry.id,
  created_at: jobWorkLogEntry.createdAt,
  job_id: jobWorkLogEntry.jobId,
  user_id: jobWorkLogEntry.userId,
  answer: jobWorkLogEntry.answer.map(fromAnswer)
})
