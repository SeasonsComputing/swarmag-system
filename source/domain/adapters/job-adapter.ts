/**
 * Adapter for converting between Dictionary (storage) and Job domain abstractions.
 * Maps snake_case column names to camelCase domain fields and back.
 */
import type { Dictionary } from '@core-std'
import type {
  Job,
  JobStatus,
  JobAssessment,
  JobWorkflow,
  JobPlanAssignment,
  JobPlanChemical,
  JobPlanAsset,
  JobPlan,
  JobWork,
  JobWorkLogEntry,
} from '@domain/abstractions/job.ts'

/** Converts a storage dictionary to a Job domain object. */
export const toJob = (dict: Dictionary): Job => {
  if (!dict['id']) throw new Error('Job dictionary missing required field: id')
  if (!dict['customer_id']) throw new Error('Job dictionary missing required field: customer_id')
  if (!dict['status']) throw new Error('Job dictionary missing required field: status')
  if (!dict['created_at']) throw new Error('Job dictionary missing required field: created_at')
  if (!dict['updated_at']) throw new Error('Job dictionary missing required field: updated_at')

  return {
    id: dict['id'] as string,
    customerId: dict['customer_id'] as string,
    status: dict['status'] as JobStatus,
    createdAt: dict['created_at'] as string,
    updatedAt: dict['updated_at'] as string,
    deletedAt: dict['deleted_at'] as string | undefined,
  }
}

/** Converts a Job domain object to a storage dictionary. */
export const fromJob = (job: Job): Dictionary => ({
  id: job.id,
  customer_id: job.customerId,
  status: job.status,
  created_at: job.createdAt,
  updated_at: job.updatedAt,
  deleted_at: job.deletedAt,
})

/** Converts a storage dictionary to a JobAssessment domain object. */
export const toJobAssessment = (dict: Dictionary): JobAssessment => {
  if (!dict['id']) throw new Error('JobAssessment dictionary missing required field: id')
  if (!dict['job_id']) throw new Error('JobAssessment dictionary missing required field: job_id')
  if (!dict['assessor_id']) throw new Error('JobAssessment dictionary missing required field: assessor_id')
  if (!dict['locations']) throw new Error('JobAssessment dictionary missing required field: locations')
  if (!dict['created_at']) throw new Error('JobAssessment dictionary missing required field: created_at')
  if (!dict['updated_at']) throw new Error('JobAssessment dictionary missing required field: updated_at')

  return {
    id: dict['id'] as string,
    jobId: dict['job_id'] as string,
    assessorId: dict['assessor_id'] as string,
    locations: dict['locations'] as JobAssessment['locations'],
    risks: (dict['risks'] ?? []) as JobAssessment['risks'],
    notes: (dict['notes'] ?? []) as JobAssessment['notes'],
    createdAt: dict['created_at'] as string,
    updatedAt: dict['updated_at'] as string,
    deletedAt: dict['deleted_at'] as string | undefined,
  }
}

/** Converts a JobAssessment domain object to a storage dictionary. */
export const fromJobAssessment = (assessment: JobAssessment): Dictionary => ({
  id: assessment.id,
  job_id: assessment.jobId,
  assessor_id: assessment.assessorId,
  locations: assessment.locations,
  risks: assessment.risks,
  notes: assessment.notes,
  created_at: assessment.createdAt,
  updated_at: assessment.updatedAt,
  deleted_at: assessment.deletedAt,
})

/** Converts a storage dictionary to a JobWorkflow domain object. */
export const toJobWorkflow = (dict: Dictionary): JobWorkflow => {
  if (!dict['id']) throw new Error('JobWorkflow dictionary missing required field: id')
  if (!dict['job_id']) throw new Error('JobWorkflow dictionary missing required field: job_id')
  if (dict['sequence'] === undefined || dict['sequence'] === null) throw new Error('JobWorkflow dictionary missing required field: sequence')
  if (!dict['basis_workflow_id']) throw new Error('JobWorkflow dictionary missing required field: basis_workflow_id')
  if (!dict['created_at']) throw new Error('JobWorkflow dictionary missing required field: created_at')
  if (!dict['updated_at']) throw new Error('JobWorkflow dictionary missing required field: updated_at')

  return {
    id: dict['id'] as string,
    jobId: dict['job_id'] as string,
    sequence: dict['sequence'] as number,
    basisWorkflowId: dict['basis_workflow_id'] as string,
    modifiedWorkflowId: dict['modified_workflow_id'] as string | undefined,
    createdAt: dict['created_at'] as string,
    updatedAt: dict['updated_at'] as string,
    deletedAt: dict['deleted_at'] as string | undefined,
  }
}

/** Converts a JobWorkflow domain object to a storage dictionary. */
export const fromJobWorkflow = (jobWorkflow: JobWorkflow): Dictionary => ({
  id: jobWorkflow.id,
  job_id: jobWorkflow.jobId,
  sequence: jobWorkflow.sequence,
  basis_workflow_id: jobWorkflow.basisWorkflowId,
  modified_workflow_id: jobWorkflow.modifiedWorkflowId,
  created_at: jobWorkflow.createdAt,
  updated_at: jobWorkflow.updatedAt,
  deleted_at: jobWorkflow.deletedAt,
})

/** Converts a storage dictionary to a JobPlanAssignment domain object. */
export const toJobPlanAssignment = (dict: Dictionary): JobPlanAssignment => {
  if (!dict['plan_id']) throw new Error('JobPlanAssignment dictionary missing required field: plan_id')
  if (!dict['user_id']) throw new Error('JobPlanAssignment dictionary missing required field: user_id')
  if (!dict['role']) throw new Error('JobPlanAssignment dictionary missing required field: role')

  return {
    planId: dict['plan_id'] as string,
    userId: dict['user_id'] as string,
    role: dict['role'] as string,
    notes: (dict['notes'] ?? []) as JobPlanAssignment['notes'],
    deletedAt: dict['deleted_at'] as string | undefined,
  }
}

/** Converts a JobPlanAssignment domain object to a storage dictionary. */
export const fromJobPlanAssignment = (assignment: JobPlanAssignment): Dictionary => ({
  plan_id: assignment.planId,
  user_id: assignment.userId,
  role: assignment.role,
  notes: assignment.notes,
  deleted_at: assignment.deletedAt,
})

/** Converts a storage dictionary to a JobPlanChemical domain object. */
export const toJobPlanChemical = (dict: Dictionary): JobPlanChemical => {
  if (!dict['plan_id']) throw new Error('JobPlanChemical dictionary missing required field: plan_id')
  if (!dict['chemical_id']) throw new Error('JobPlanChemical dictionary missing required field: chemical_id')
  if (dict['amount'] === undefined || dict['amount'] === null) throw new Error('JobPlanChemical dictionary missing required field: amount')
  if (!dict['unit']) throw new Error('JobPlanChemical dictionary missing required field: unit')

  return {
    planId: dict['plan_id'] as string,
    chemicalId: dict['chemical_id'] as string,
    amount: dict['amount'] as number,
    unit: dict['unit'] as JobPlanChemical['unit'],
    targetArea: dict['target_area'] as number | undefined,
    targetAreaUnit: dict['target_area_unit'] as JobPlanChemical['targetAreaUnit'],
    deletedAt: dict['deleted_at'] as string | undefined,
  }
}

/** Converts a JobPlanChemical domain object to a storage dictionary. */
export const fromJobPlanChemical = (chemical: JobPlanChemical): Dictionary => ({
  plan_id: chemical.planId,
  chemical_id: chemical.chemicalId,
  amount: chemical.amount,
  unit: chemical.unit,
  target_area: chemical.targetArea,
  target_area_unit: chemical.targetAreaUnit,
  deleted_at: chemical.deletedAt,
})

/** Converts a storage dictionary to a JobPlanAsset domain object. */
export const toJobPlanAsset = (dict: Dictionary): JobPlanAsset => {
  if (!dict['plan_id']) throw new Error('JobPlanAsset dictionary missing required field: plan_id')
  if (!dict['asset_id']) throw new Error('JobPlanAsset dictionary missing required field: asset_id')

  return {
    planId: dict['plan_id'] as string,
    assetId: dict['asset_id'] as string,
    deletedAt: dict['deleted_at'] as string | undefined,
  }
}

/** Converts a JobPlanAsset domain object to a storage dictionary. */
export const fromJobPlanAsset = (asset: JobPlanAsset): Dictionary => ({
  plan_id: asset.planId,
  asset_id: asset.assetId,
  deleted_at: asset.deletedAt,
})

/** Converts a storage dictionary to a JobPlan domain object. */
export const toJobPlan = (dict: Dictionary): JobPlan => {
  if (!dict['id']) throw new Error('JobPlan dictionary missing required field: id')
  if (!dict['job_id']) throw new Error('JobPlan dictionary missing required field: job_id')
  if (!dict['scheduled_start']) throw new Error('JobPlan dictionary missing required field: scheduled_start')
  if (!dict['created_at']) throw new Error('JobPlan dictionary missing required field: created_at')
  if (!dict['updated_at']) throw new Error('JobPlan dictionary missing required field: updated_at')

  return {
    id: dict['id'] as string,
    jobId: dict['job_id'] as string,
    scheduledStart: dict['scheduled_start'] as string,
    scheduledEnd: dict['scheduled_end'] as string | undefined,
    notes: (dict['notes'] ?? []) as JobPlan['notes'],
    createdAt: dict['created_at'] as string,
    updatedAt: dict['updated_at'] as string,
    deletedAt: dict['deleted_at'] as string | undefined,
  }
}

/** Converts a JobPlan domain object to a storage dictionary. */
export const fromJobPlan = (plan: JobPlan): Dictionary => ({
  id: plan.id,
  job_id: plan.jobId,
  scheduled_start: plan.scheduledStart,
  scheduled_end: plan.scheduledEnd,
  notes: plan.notes,
  created_at: plan.createdAt,
  updated_at: plan.updatedAt,
  deleted_at: plan.deletedAt,
})

/** Converts a storage dictionary to a JobWork domain object. */
export const toJobWork = (dict: Dictionary): JobWork => {
  if (!dict['id']) throw new Error('JobWork dictionary missing required field: id')
  if (!dict['job_id']) throw new Error('JobWork dictionary missing required field: job_id')
  if (!dict['work']) throw new Error('JobWork dictionary missing required field: work')
  if (!dict['started_at']) throw new Error('JobWork dictionary missing required field: started_at')
  if (!dict['started_by_id']) throw new Error('JobWork dictionary missing required field: started_by_id')
  if (!dict['created_at']) throw new Error('JobWork dictionary missing required field: created_at')
  if (!dict['updated_at']) throw new Error('JobWork dictionary missing required field: updated_at')

  return {
    id: dict['id'] as string,
    jobId: dict['job_id'] as string,
    work: dict['work'] as JobWork['work'],
    startedAt: dict['started_at'] as string,
    startedById: dict['started_by_id'] as string,
    completedAt: dict['completed_at'] as string | undefined,
    createdAt: dict['created_at'] as string,
    updatedAt: dict['updated_at'] as string,
    deletedAt: dict['deleted_at'] as string | undefined,
  }
}

/** Converts a JobWork domain object to a storage dictionary. */
export const fromJobWork = (work: JobWork): Dictionary => ({
  id: work.id,
  job_id: work.jobId,
  work: work.work,
  started_at: work.startedAt,
  started_by_id: work.startedById,
  completed_at: work.completedAt,
  created_at: work.createdAt,
  updated_at: work.updatedAt,
  deleted_at: work.deletedAt,
})

/** Converts a storage dictionary to a JobWorkLogEntry domain object. */
export const toJobWorkLogEntry = (dict: Dictionary): JobWorkLogEntry => {
  if (!dict['id']) throw new Error('JobWorkLogEntry dictionary missing required field: id')
  if (!dict['job_id']) throw new Error('JobWorkLogEntry dictionary missing required field: job_id')
  if (!dict['user_id']) throw new Error('JobWorkLogEntry dictionary missing required field: user_id')
  if (!dict['created_at']) throw new Error('JobWorkLogEntry dictionary missing required field: created_at')

  const base = {
    id: dict['id'] as string,
    jobId: dict['job_id'] as string,
    userId: dict['user_id'] as string,
    createdAt: dict['created_at'] as string,
  }

  const answer = dict['answer'] as JobWorkLogEntry['answer']
  const metadata = dict['metadata'] as JobWorkLogEntry['metadata']

  if (answer !== undefined && answer !== null) {
    return { ...base, answer, metadata: metadata as JobWorkLogEntry['metadata'] }
  }
  if (metadata !== undefined && metadata !== null) {
    return { ...base, answer: answer as JobWorkLogEntry['answer'], metadata }
  }
  throw new Error('JobWorkLogEntry dictionary must have at least one of: answer, metadata')
}

/** Converts a JobWorkLogEntry domain object to a storage dictionary. */
export const fromJobWorkLogEntry = (entry: JobWorkLogEntry): Dictionary => ({
  id: entry.id,
  job_id: entry.jobId,
  user_id: entry.userId,
  created_at: entry.createdAt,
  answer: 'answer' in entry ? entry.answer : undefined,
  metadata: 'metadata' in entry ? entry.metadata : undefined,
})
