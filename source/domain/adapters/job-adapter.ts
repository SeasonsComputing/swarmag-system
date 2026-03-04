/**
 * Job domain adapters.
 */

import type { Dictionary, When } from '@core-std'
import { notValid } from '@core-std'
import type { Note } from '@domain/abstractions/common.ts'
import type {
  Job,
  JobAssessment,
  JobPlan,
  JobPlanAsset,
  JobPlanAssignment,
  JobPlanChemical,
  JobPlanChemicalUnit,
  JobPlanTargetAreaUnit,
  JobStatus,
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

/** Create a Job from its dictionary representation. */
export const toJob = (dict: Dictionary): Job => {
  if (!dict.id) return notValid('Job dictionary missing required field: id')
  if (!dict.customer_id) {
    return notValid('Job dictionary missing required field: customer_id')
  }
  if (!dict.status) return notValid('Job dictionary missing required field: status')
  if (!dict.created_at) {
    return notValid('Job dictionary missing required field: created_at')
  }
  if (!dict.updated_at) {
    return notValid('Job dictionary missing required field: updated_at')
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

/** Create a dictionary representation from a Job. */
export const fromJob = (job: Job): Dictionary => ({
  id: job.id,
  customer_id: job.customerId,
  status: job.status,
  created_at: job.createdAt,
  updated_at: job.updatedAt,
  deleted_at: job.deletedAt
})

/** Create a JobAssessment from its dictionary representation. */
export const toJobAssessment = (dict: Dictionary): JobAssessment => {
  if (!dict.id) return notValid('JobAssessment dictionary missing required field: id')
  if (!dict.job_id) {
    return notValid('JobAssessment dictionary missing required field: job_id')
  }
  if (!dict.assessor_id) {
    return notValid('JobAssessment dictionary missing required field: assessor_id')
  }
  if (!dict.locations) {
    return notValid('JobAssessment dictionary missing required field: locations')
  }
  if (!dict.risks) {
    return notValid('JobAssessment dictionary missing required field: risks')
  }
  if (!dict.notes) {
    return notValid('JobAssessment dictionary missing required field: notes')
  }
  if (!dict.created_at) {
    return notValid('JobAssessment dictionary missing required field: created_at')
  }
  if (!dict.updated_at) {
    return notValid('JobAssessment dictionary missing required field: updated_at')
  }

  return {
    id: dict.id as string,
    jobId: dict.job_id as string,
    assessorId: dict.assessor_id as string,
    locations: (dict.locations as Dictionary[]).map(toLocation),
    risks: (dict.risks as Note[]).map(toNote),
    notes: (dict.notes as Note[]).map(toNote),
    createdAt: dict.created_at as When,
    updatedAt: dict.updated_at as When,
    deletedAt: dict.deleted_at as When | undefined
  }
}

/** Create a dictionary representation from a JobAssessment. */
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

/** Create a JobWorkflow from its dictionary representation. */
export const toJobWorkflow = (dict: Dictionary): JobWorkflow => {
  if (!dict.id) return notValid('JobWorkflow dictionary missing required field: id')
  if (!dict.job_id) {
    return notValid('JobWorkflow dictionary missing required field: job_id')
  }
  if (!dict.basis_workflow_id) {
    return notValid('JobWorkflow dictionary missing required field: basis_workflow_id')
  }
  if (!dict.created_at) {
    return notValid('JobWorkflow dictionary missing required field: created_at')
  }
  if (!dict.updated_at) {
    return notValid('JobWorkflow dictionary missing required field: updated_at')
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

/** Create a dictionary representation from a JobWorkflow. */
export const fromJobWorkflow = (jobWorkflow: JobWorkflow): Dictionary => ({
  id: jobWorkflow.id,
  job_id: jobWorkflow.jobId,
  basis_workflow_id: jobWorkflow.basisWorkflowId,
  modified_workflow_id: jobWorkflow.modifiedWorkflowId,
  created_at: jobWorkflow.createdAt,
  updated_at: jobWorkflow.updatedAt,
  deleted_at: jobWorkflow.deletedAt
})

/** Create a JobPlan from its dictionary representation. */
export const toJobPlan = (dict: Dictionary): JobPlan => {
  if (!dict.id) return notValid('JobPlan dictionary missing required field: id')
  if (!dict.job_id) return notValid('JobPlan dictionary missing required field: job_id')
  if (!dict.scheduled_start) {
    return notValid('JobPlan dictionary missing required field: scheduled_start')
  }
  if (!dict.notes) return notValid('JobPlan dictionary missing required field: notes')
  if (!dict.created_at) {
    return notValid('JobPlan dictionary missing required field: created_at')
  }
  if (!dict.updated_at) {
    return notValid('JobPlan dictionary missing required field: updated_at')
  }

  return {
    id: dict.id as string,
    jobId: dict.job_id as string,
    scheduledStart: dict.scheduled_start as When,
    scheduledEnd: dict.scheduled_end as When | undefined,
    notes: (dict.notes as Note[]).map(toNote),
    createdAt: dict.created_at as When,
    updatedAt: dict.updated_at as When,
    deletedAt: dict.deleted_at as When | undefined
  }
}

/** Create a dictionary representation from a JobPlan. */
export const fromJobPlan = (jobPlan: JobPlan): Dictionary => ({
  id: jobPlan.id,
  job_id: jobPlan.jobId,
  scheduled_start: jobPlan.scheduledStart,
  scheduled_end: jobPlan.scheduledEnd,
  notes: jobPlan.notes.map(fromNote),
  created_at: jobPlan.createdAt,
  updated_at: jobPlan.updatedAt,
  deleted_at: jobPlan.deletedAt
})

/** Create a JobPlanAssignment from its dictionary representation. */
export const toJobPlanAssignment = (dict: Dictionary): JobPlanAssignment => {
  if (!dict.id) return notValid('JobPlanAssignment dictionary missing required field: id')
  if (!dict.plan_id) {
    return notValid('JobPlanAssignment dictionary missing required field: plan_id')
  }
  if (!dict.user_id) {
    return notValid('JobPlanAssignment dictionary missing required field: user_id')
  }
  if (!dict.role) {
    return notValid('JobPlanAssignment dictionary missing required field: role')
  }
  if (!dict.notes) {
    return notValid('JobPlanAssignment dictionary missing required field: notes')
  }
  if (!dict.created_at) {
    return notValid('JobPlanAssignment dictionary missing required field: created_at')
  }
  if (!dict.updated_at) {
    return notValid('JobPlanAssignment dictionary missing required field: updated_at')
  }

  return {
    id: dict.id as string,
    planId: dict.plan_id as string,
    userId: dict.user_id as string,
    role: dict.role as import('@domain/abstractions/user.ts').UserRole,
    notes: (dict.notes as Note[]).map(toNote),
    createdAt: dict.created_at as When,
    updatedAt: dict.updated_at as When,
    deletedAt: dict.deleted_at as When | undefined
  }
}

/** Create a dictionary representation from a JobPlanAssignment. */
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

/** Create a JobPlanChemical from its dictionary representation. */
export const toJobPlanChemical = (dict: Dictionary): JobPlanChemical => {
  if (!dict.id) return notValid('JobPlanChemical dictionary missing required field: id')
  if (!dict.plan_id) {
    return notValid('JobPlanChemical dictionary missing required field: plan_id')
  }
  if (!dict.chemical_id) {
    return notValid('JobPlanChemical dictionary missing required field: chemical_id')
  }
  if (dict.amount === undefined) {
    return notValid('JobPlanChemical dictionary missing required field: amount')
  }
  if (!dict.unit) {
    return notValid('JobPlanChemical dictionary missing required field: unit')
  }
  if (!dict.created_at) {
    return notValid('JobPlanChemical dictionary missing required field: created_at')
  }
  if (!dict.updated_at) {
    return notValid('JobPlanChemical dictionary missing required field: updated_at')
  }

  return {
    id: dict.id as string,
    planId: dict.plan_id as string,
    chemicalId: dict.chemical_id as string,
    amount: dict.amount as number,
    unit: dict.unit as JobPlanChemicalUnit,
    targetArea: dict.target_area as number | undefined,
    targetAreaUnit: dict.target_area_unit as JobPlanTargetAreaUnit | undefined,
    createdAt: dict.created_at as When,
    updatedAt: dict.updated_at as When,
    deletedAt: dict.deleted_at as When | undefined
  }
}

/** Create a dictionary representation from a JobPlanChemical. */
export const fromJobPlanChemical = (planChemical: JobPlanChemical): Dictionary => ({
  id: planChemical.id,
  plan_id: planChemical.planId,
  chemical_id: planChemical.chemicalId,
  amount: planChemical.amount,
  unit: planChemical.unit,
  target_area: planChemical.targetArea,
  target_area_unit: planChemical.targetAreaUnit,
  created_at: planChemical.createdAt,
  updated_at: planChemical.updatedAt,
  deleted_at: planChemical.deletedAt
})

/** Create a JobPlanAsset from its dictionary representation. */
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

/** Create a dictionary representation from a JobPlanAsset. */
export const fromJobPlanAsset = (planAsset: JobPlanAsset): Dictionary => ({
  plan_id: planAsset.planId,
  asset_id: planAsset.assetId
})

/** Create a JobWork from its dictionary representation. */
export const toJobWork = (dict: Dictionary): JobWork => {
  if (!dict.id) return notValid('JobWork dictionary missing required field: id')
  if (!dict.job_id) return notValid('JobWork dictionary missing required field: job_id')
  if (!dict.started_by_id) {
    return notValid('JobWork dictionary missing required field: started_by_id')
  }
  if (!dict.work) return notValid('JobWork dictionary missing required field: work')
  if (!dict.started_at) {
    return notValid('JobWork dictionary missing required field: started_at')
  }
  if (!dict.created_at) {
    return notValid('JobWork dictionary missing required field: created_at')
  }
  if (!dict.updated_at) {
    return notValid('JobWork dictionary missing required field: updated_at')
  }

  return {
    id: dict.id as string,
    jobId: dict.job_id as string,
    startedById: dict.started_by_id as string,
    work: (dict.work as string[]).map(value => value),
    startedAt: dict.started_at as When,
    completedAt: dict.completed_at as When | undefined,
    createdAt: dict.created_at as When,
    updatedAt: dict.updated_at as When,
    deletedAt: dict.deleted_at as When | undefined
  }
}

/** Create a dictionary representation from a JobWork. */
export const fromJobWork = (jobWork: JobWork): Dictionary => ({
  id: jobWork.id,
  job_id: jobWork.jobId,
  started_by_id: jobWork.startedById,
  work: jobWork.work.map(value => value),
  started_at: jobWork.startedAt,
  completed_at: jobWork.completedAt,
  created_at: jobWork.createdAt,
  updated_at: jobWork.updatedAt,
  deleted_at: jobWork.deletedAt
})

/** Create a JobWorkLogEntry from its dictionary representation. */
export const toJobWorkLogEntry = (dict: Dictionary): JobWorkLogEntry => {
  if (!dict.id) return notValid('JobWorkLogEntry dictionary missing required field: id')
  if (!dict.job_id) {
    return notValid('JobWorkLogEntry dictionary missing required field: job_id')
  }
  if (!dict.user_id) {
    return notValid('JobWorkLogEntry dictionary missing required field: user_id')
  }
  if (!dict.answer) {
    return notValid('JobWorkLogEntry dictionary missing required field: answer')
  }
  if (!dict.created_at) {
    return notValid('JobWorkLogEntry dictionary missing required field: created_at')
  }

  return {
    id: dict.id as string,
    jobId: dict.job_id as string,
    userId: dict.user_id as string,
    answer: (dict.answer as Dictionary[]).map(toAnswer),
    createdAt: dict.created_at as When
  }
}

/** Create a dictionary representation from a JobWorkLogEntry. */
export const fromJobWorkLogEntry = (entry: JobWorkLogEntry): Dictionary => ({
  id: entry.id,
  job_id: entry.jobId,
  user_id: entry.userId,
  answer: entry.answer.map(fromAnswer),
  created_at: entry.createdAt
})
