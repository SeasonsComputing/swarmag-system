/**
 * Job protocol validators.
 */

import { isCompositionOne, isCompositionPositive, isId, isWhen } from '@core-std'
import type { Dictionary } from '@core-std'
import type { Location } from '@domain/abstractions/common.ts'
import { CHEMICAL_UNITS, JOB_STATUSES } from '@domain/abstractions/job.ts'
import type { ChemicalUnit, JobStatus } from '@domain/abstractions/job.ts'
import { USER_ROLES } from '@domain/abstractions/user.ts'
import type { UserRole } from '@domain/abstractions/user.ts'
import type { Answer } from '@domain/abstractions/workflow.ts'
import type { JobPlanAsset } from '@domain/abstractions/job.ts'
import type {
  JobAssessmentCreate,
  JobAssessmentUpdate,
  JobCreate,
  JobPlanAssignmentCreate,
  JobPlanAssignmentUpdate,
  JobPlanChemicalCreate,
  JobPlanChemicalUpdate,
  JobPlanCreate,
  JobPlanUpdate,
  JobUpdate,
  JobWorkCreate,
  JobWorkflowCreate,
  JobWorkflowUpdate,
  JobWorkLogEntryCreate
} from '@domain/protocols/job-protocol.ts'

// ────────────────────────────────────────────────────────────────────────────
// VALIDATORS
// ────────────────────────────────────────────────────────────────────────────

/** Validates JobCreate; returns error message or null. */
export const validateJobCreate = (input: JobCreate): string | null => {
  if (!isId(input.customerId)) return 'customerId must be a valid Id'
  return null
}

/** Validates JobUpdate; returns error message or null. */
export const validateJobUpdate = (input: JobUpdate): string | null => {
  if (!isId(input.id)) return 'id must be a valid Id'
  if (input.status !== undefined && !JOB_STATUSES.includes(input.status as JobStatus)) {
    return 'status must be a valid JobStatus'
  }
  return null
}

/** Validates JobAssessmentCreate; returns error message or null. */
export const validateJobAssessmentCreate = (
  input: JobAssessmentCreate
): string | null => {
  if (!isId(input.jobId)) return 'jobId must be a valid Id'
  if (!isId(input.assessorId)) return 'assessorId must be a valid Id'
  if (!isCompositionPositive(input.locations, isLocation)) {
    return 'locations must be a non-empty array of valid locations'
  }
  return null
}

/** Validates JobAssessmentUpdate; returns error message or null. */
export const validateJobAssessmentUpdate = (
  input: JobAssessmentUpdate
): string | null => {
  if (!isId(input.id)) return 'id must be a valid Id'
  if (input.assessorId !== undefined && !isId(input.assessorId)) {
    return 'assessorId must be a valid Id'
  }
  if (
    input.locations !== undefined && !isCompositionPositive(input.locations, isLocation)
  ) return 'locations must be a non-empty array of valid locations'
  return null
}

/** Validates JobWorkflowCreate; returns error message or null. */
export const validateJobWorkflowCreate = (input: JobWorkflowCreate): string | null => {
  if (!isId(input.jobId)) return 'jobId must be a valid Id'
  if (typeof input.sequence !== 'number' || input.sequence < 0) {
    return 'sequence must be a non-negative number'
  }
  if (!isId(input.basisWorkflowId)) return 'basisWorkflowId must be a valid Id'
  return null
}

/** Validates JobWorkflowUpdate; returns error message or null. */
export const validateJobWorkflowUpdate = (input: JobWorkflowUpdate): string | null => {
  if (!isId(input.id)) return 'id must be a valid Id'
  return null
}

/** Validates JobPlanCreate; returns error message or null. */
export const validateJobPlanCreate = (input: JobPlanCreate): string | null => {
  if (!isId(input.jobId)) return 'jobId must be a valid Id'
  if (!isWhen(input.scheduledStart)) return 'scheduledStart must be a valid When'
  return null
}

/** Validates JobPlanUpdate; returns error message or null. */
export const validateJobPlanUpdate = (input: JobPlanUpdate): string | null => {
  if (!isId(input.id)) return 'id must be a valid Id'
  if (input.scheduledStart !== undefined && !isWhen(input.scheduledStart)) {
    return 'scheduledStart must be a valid When'
  }
  if (input.scheduledEnd !== undefined && !isWhen(input.scheduledEnd)) {
    return 'scheduledEnd must be a valid When'
  }
  return null
}

/** Validates JobPlanAssignmentCreate; returns error message or null. */
export const validateJobPlanAssignmentCreate = (
  input: JobPlanAssignmentCreate
): string | null => {
  if (!isId(input.planId)) return 'planId must be a valid Id'
  if (!isId(input.userId)) return 'userId must be a valid Id'
  if (!USER_ROLES.includes(input.role as UserRole)) return 'role must be a valid UserRole'
  return null
}

/** Validates JobPlanAssignmentUpdate; returns error message or null. */
export const validateJobPlanAssignmentUpdate = (
  input: JobPlanAssignmentUpdate
): string | null => {
  if (!isId(input.id)) return 'id must be a valid Id'
  if (input.role !== undefined && !USER_ROLES.includes(input.role as UserRole)) {
    return 'role must be a valid UserRole'
  }
  return null
}

/** Validates JobPlanChemicalCreate; returns error message or null. */
export const validateJobPlanChemicalCreate = (
  input: JobPlanChemicalCreate
): string | null => {
  if (!isId(input.planId)) return 'planId must be a valid Id'
  if (!isId(input.chemicalId)) return 'chemicalId must be a valid Id'
  if (typeof input.amount !== 'number' || input.amount <= 0) {
    return 'amount must be a positive number'
  }
  if (!CHEMICAL_UNITS.includes(input.unit as ChemicalUnit)) {
    return 'unit must be a valid ChemicalUnit'
  }
  return null
}

/** Validates JobPlanChemicalUpdate; returns error message or null. */
export const validateJobPlanChemicalUpdate = (
  input: JobPlanChemicalUpdate
): string | null => {
  if (!isId(input.id)) return 'id must be a valid Id'
  if (
    input.amount !== undefined && (typeof input.amount !== 'number' || input.amount <= 0)
  ) return 'amount must be a positive number'
  if (input.unit !== undefined && !CHEMICAL_UNITS.includes(input.unit as ChemicalUnit)) {
    return 'unit must be a valid ChemicalUnit'
  }
  return null
}

/** Validates JobPlanAssetCreate; returns error message or null. */
export const validateJobPlanAssetCreate = (input: JobPlanAsset): string | null => {
  if (!isId(input.planId)) return 'planId must be a valid Id'
  if (!isId(input.assetId)) return 'assetId must be a valid Id'
  return null
}

/** Validates JobWorkCreate; returns error message or null. */
export const validateJobWorkCreate = (input: JobWorkCreate): string | null => {
  if (!isId(input.jobId)) return 'jobId must be a valid Id'
  if (!isCompositionPositive(input.work, isId)) {
    return 'work must be a non-empty array of valid Ids'
  }
  if (!isWhen(input.startedAt)) return 'startedAt must be a valid When'
  if (!isId(input.startedById)) return 'startedById must be a valid Id'
  return null
}

/** Validates JobWorkLogEntryCreate; returns error message or null. */
export const validateJobWorkLogEntryCreate = (
  input: JobWorkLogEntryCreate
): string | null => {
  if (!isId(input.jobId)) return 'jobId must be a valid Id'
  if (!isId(input.userId)) return 'userId must be a valid Id'
  if (!isCompositionOne(input.answer, isAnswer)) {
    return 'answer must be a composition one of valid Answer'
  }
  return null
}

// ────────────────────────────────────────────────────────────────────────────
// VALIDATOR DECOMPOSITION
// ────────────────────────────────────────────────────────────────────────────

const isLocation = (v: unknown): v is Location => {
  if (!v || typeof v !== 'object') return false
  const l = v as Dictionary
  return typeof l.latitude === 'number' && typeof l.longitude === 'number'
}

const isAnswer = (v: unknown): v is Answer => {
  if (!v || typeof v !== 'object') return false
  const a = v as Dictionary
  return isId(a.questionId as unknown)
    && isWhen(a.capturedAt as unknown)
    && isId(a.capturedById as unknown)
}
