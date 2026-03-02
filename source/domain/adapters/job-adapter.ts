/**
 * Adapters for the job domain area: Job, JobAssessment, JobWorkflow, JobPlan,
 * JobPlanAssignment, JobPlanChemical, JobPlanAsset, JobWork, JobWorkLogEntry.
 */

import type { Dictionary, Id, When } from '@core-std'
import { notValid } from '@core-std'
import type {
  Job,
  JobAssessment,
  JobPlan,
  JobPlanAsset,
  JobPlanAssignment,
  JobPlanChemical,
  JobStatus,
  JobWork,
  JobWorkflow,
  JobWorkLogEntry,
  PlannedChemicalUnit,
  TargetAreaUnit
} from '@domain/abstractions/job.ts'
import type { UserRole } from '@domain/abstractions/user.ts'
import {
  fromAnswer,
  fromLocation,
  fromNote,
  toAnswer,
  toLocation,
  toNote
} from '@domain/adapters/common-adapter.ts'

/** Create a Job instance from dictionary representation. */
export const toJob = (dict: Dictionary): Job => {
  if (!dict.id) return notValid('Job dictionary missing required field: id')
  if (!dict.customer_id) {
    return notValid('Job dictionary missing required field: customer_id')
  }
  return {
    id: dict.id as string,
    customerId: dict.customer_id as string,
    status: dict.status as JobStatus,
    createdAt: dict.created_at as When,
    updatedAt: dict.updated_at as When,
    deletedAt: dict.deleted_at as When | undefined
  }
}

/** Create a dictionary representation of a Job instance. */
export const fromJob = (job: Job): Dictionary => ({
  id: job.id,
  customer_id: job.customerId,
  status: job.status,
  created_at: job.createdAt,
  updated_at: job.updatedAt,
  deleted_at: job.deletedAt
})

/** Create a JobAssessment instance from dictionary representation. */
export const toJobAssessment = (dict: Dictionary): JobAssessment => {
  if (!dict.id) return notValid('JobAssessment dictionary missing required field: id')
  if (!dict.job_id) {
    return notValid('JobAssessment dictionary missing required field: job_id')
  }
  if (!dict.assessor_id) {
    return notValid('JobAssessment dictionary missing required field: assessor_id')
  }
  return {
    id: dict.id as string,
    jobId: dict.job_id as string,
    assessorId: dict.assessor_id as string,
    locations: (dict.locations as Dictionary[]).map(toLocation),
    risks: (dict.risks as Dictionary[]).map(toNote),
    notes: (dict.notes as Dictionary[]).map(toNote),
    createdAt: dict.created_at as When,
    updatedAt: dict.updated_at as When,
    deletedAt: dict.deleted_at as When | undefined
  }
}

/** Create a dictionary representation of a JobAssessment instance. */
export const fromJobAssessment = (assessment: JobAssessment): Dictionary => ({
  id: assessment.id,
  job_id: assessment.jobId,
  assessor_id: assessment.assessorId,
  locations: assessment.locations.map(fromLocation),
  risks: assessment.risks.map(fromNote),
  notes: assessment.notes.map(fromNote),
  created_at: assessment.createdAt,
  updated_at: assessment.updatedAt,
  deleted_at: assessment.deletedAt
})

/** Create a JobWorkflow instance from dictionary representation. */
export const toJobWorkflow = (dict: Dictionary): JobWorkflow => {
  if (!dict.id) return notValid('JobWorkflow dictionary missing required field: id')
  if (!dict.job_id) {
    return notValid('JobWorkflow dictionary missing required field: job_id')
  }
  if (!dict.basis_workflow_id) {
    return notValid('JobWorkflow dictionary missing required field: basis_workflow_id')
  }
  return {
    id: dict.id as string,
    jobId: dict.job_id as string,
    basisWorkflowId: dict.basis_workflow_id as string,
    modifiedWorkflowId: dict.modified_workflow_id as string | undefined,
    createdAt: dict.created_at as When,
    updatedAt: dict.updated_at as When,
    deletedAt: dict.deleted_at as When | undefined
  }
}

/** Create a dictionary representation of a JobWorkflow instance. */
export const fromJobWorkflow = (jobWorkflow: JobWorkflow): Dictionary => ({
  id: jobWorkflow.id,
  job_id: jobWorkflow.jobId,
  basis_workflow_id: jobWorkflow.basisWorkflowId,
  modified_workflow_id: jobWorkflow.modifiedWorkflowId,
  created_at: jobWorkflow.createdAt,
  updated_at: jobWorkflow.updatedAt,
  deleted_at: jobWorkflow.deletedAt
})

/** Create a JobPlan instance from dictionary representation. */
export const toJobPlan = (dict: Dictionary): JobPlan => {
  if (!dict.id) return notValid('JobPlan dictionary missing required field: id')
  if (!dict.job_id) return notValid('JobPlan dictionary missing required field: job_id')
  if (!dict.scheduled_start) {
    return notValid('JobPlan dictionary missing required field: scheduled_start')
  }
  return {
    id: dict.id as string,
    jobId: dict.job_id as string,
    scheduledStart: dict.scheduled_start as When,
    scheduledEnd: dict.scheduled_end as When | undefined,
    notes: (dict.notes as Dictionary[]).map(toNote),
    createdAt: dict.created_at as When,
    updatedAt: dict.updated_at as When,
    deletedAt: dict.deleted_at as When | undefined
  }
}

/** Create a dictionary representation of a JobPlan instance. */
export const fromJobPlan = (plan: JobPlan): Dictionary => ({
  id: plan.id,
  job_id: plan.jobId,
  scheduled_start: plan.scheduledStart,
  scheduled_end: plan.scheduledEnd,
  notes: plan.notes.map(fromNote),
  created_at: plan.createdAt,
  updated_at: plan.updatedAt,
  deleted_at: plan.deletedAt
})

/** Create a JobPlanAssignment instance from dictionary representation. */
export const toJobPlanAssignment = (dict: Dictionary): JobPlanAssignment => {
  if (!dict.id) return notValid('JobPlanAssignment dictionary missing required field: id')
  if (!dict.plan_id) {
    return notValid('JobPlanAssignment dictionary missing required field: plan_id')
  }
  if (!dict.user_id) {
    return notValid('JobPlanAssignment dictionary missing required field: user_id')
  }
  return {
    id: dict.id as string,
    planId: dict.plan_id as string,
    userId: dict.user_id as string,
    role: dict.role as UserRole,
    notes: (dict.notes as Dictionary[]).map(toNote),
    createdAt: dict.created_at as When,
    updatedAt: dict.updated_at as When,
    deletedAt: dict.deleted_at as When | undefined
  }
}

/** Create a dictionary representation of a JobPlanAssignment instance. */
export const fromJobPlanAssignment = (assignment: JobPlanAssignment): Dictionary => ({
  id: assignment.id,
  plan_id: assignment.planId,
  user_id: assignment.userId,
  role: assignment.role,
  notes: assignment.notes.map(fromNote),
  created_at: assignment.createdAt,
  updated_at: assignment.updatedAt,
  deleted_at: assignment.deletedAt
})

/** Create a JobPlanChemical instance from dictionary representation. */
export const toJobPlanChemical = (dict: Dictionary): JobPlanChemical => {
  if (!dict.id) return notValid('JobPlanChemical dictionary missing required field: id')
  if (!dict.plan_id) {
    return notValid('JobPlanChemical dictionary missing required field: plan_id')
  }
  if (!dict.chemical_id) {
    return notValid('JobPlanChemical dictionary missing required field: chemical_id')
  }
  return {
    id: dict.id as string,
    planId: dict.plan_id as string,
    chemicalId: dict.chemical_id as string,
    amount: dict.amount as number,
    unit: dict.unit as PlannedChemicalUnit,
    targetArea: dict.target_area as number | undefined,
    targetAreaUnit: dict.target_area_unit as TargetAreaUnit | undefined,
    createdAt: dict.created_at as When,
    updatedAt: dict.updated_at as When,
    deletedAt: dict.deleted_at as When | undefined
  }
}

/** Create a dictionary representation of a JobPlanChemical instance. */
export const fromJobPlanChemical = (chemical: JobPlanChemical): Dictionary => ({
  id: chemical.id,
  plan_id: chemical.planId,
  chemical_id: chemical.chemicalId,
  amount: chemical.amount,
  unit: chemical.unit,
  target_area: chemical.targetArea,
  target_area_unit: chemical.targetAreaUnit,
  created_at: chemical.createdAt,
  updated_at: chemical.updatedAt,
  deleted_at: chemical.deletedAt
})

/** Create a JobPlanAsset instance from dictionary representation. */
export const toJobPlanAsset = (dict: Dictionary): JobPlanAsset => {
  if (!dict.plan_id) {
    return notValid('JobPlanAsset dictionary missing required field: plan_id')
  }
  if (!dict.asset_id) {
    return notValid('JobPlanAsset dictionary missing required field: asset_id')
  }
  return {
    planId: dict.plan_id as string,
    assetId: dict.asset_id as string
  }
}

/** Create a dictionary representation of a JobPlanAsset instance. */
export const fromJobPlanAsset = (junction: JobPlanAsset): Dictionary => ({
  plan_id: junction.planId,
  asset_id: junction.assetId
})

/** Create a JobWork instance from dictionary representation. */
export const toJobWork = (dict: Dictionary): JobWork => {
  if (!dict.id) return notValid('JobWork dictionary missing required field: id')
  if (!dict.job_id) return notValid('JobWork dictionary missing required field: job_id')
  if (!dict.started_by_id) {
    return notValid('JobWork dictionary missing required field: started_by_id')
  }
  if (!dict.started_at) {
    return notValid('JobWork dictionary missing required field: started_at')
  }
  return {
    id: dict.id as string,
    jobId: dict.job_id as string,
    startedById: dict.started_by_id as string,
    work: dict.work as Id[],
    startedAt: dict.started_at as When,
    completedAt: dict.completed_at as When | undefined,
    createdAt: dict.created_at as When,
    updatedAt: dict.updated_at as When,
    deletedAt: dict.deleted_at as When | undefined
  }
}

/** Create a dictionary representation of a JobWork instance. */
export const fromJobWork = (jobWork: JobWork): Dictionary => ({
  id: jobWork.id,
  job_id: jobWork.jobId,
  started_by_id: jobWork.startedById,
  work: jobWork.work,
  started_at: jobWork.startedAt,
  completed_at: jobWork.completedAt,
  created_at: jobWork.createdAt,
  updated_at: jobWork.updatedAt,
  deleted_at: jobWork.deletedAt
})

/** Create a JobWorkLogEntry instance from dictionary representation. */
export const toJobWorkLogEntry = (dict: Dictionary): JobWorkLogEntry => {
  if (!dict.id) return notValid('JobWorkLogEntry dictionary missing required field: id')
  if (!dict.job_id) {
    return notValid('JobWorkLogEntry dictionary missing required field: job_id')
  }
  if (!dict.user_id) {
    return notValid('JobWorkLogEntry dictionary missing required field: user_id')
  }
  return {
    id: dict.id as string,
    createdAt: dict.created_at as When,
    jobId: dict.job_id as string,
    userId: dict.user_id as string,
    answer: (dict.answer as Dictionary[]).map(toAnswer)
  }
}

/** Create a dictionary representation of a JobWorkLogEntry instance. */
export const fromJobWorkLogEntry = (entry: JobWorkLogEntry): Dictionary => ({
  id: entry.id,
  created_at: entry.createdAt,
  job_id: entry.jobId,
  user_id: entry.userId,
  answer: entry.answer.map(fromAnswer)
})
