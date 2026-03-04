/**
 * Job protocol validator.
 */

import {
  type Dictionary,
  isCompositionMany,
  isCompositionOne,
  isCompositionPositive,
  isId,
  isNonEmptyString,
  isPositiveNumber,
  isWhen
} from '@core-std'
import {
  JOB_PLAN_CHEMICAL_UNITS,
  JOB_PLAN_TARGET_AREA_UNITS,
  JOB_STATUSES,
  type JobPlanChemicalUnit,
  type JobPlanTargetAreaUnit,
  type JobStatus
} from '@domain/abstractions/job.ts'
import { USER_ROLES, type UserRole } from '@domain/abstractions/user.ts'
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
  JobWorkLogEntryCreate,
  JobWorkUpdate
} from '@domain/protocols/job-protocol.ts'
import {
  isAnswer,
  isNote
} from '@domain/validators/common-validator.ts'

// ────────────────────────────────────────────────────────────────────────────
// VALIDATORS
// ────────────────────────────────────────────────────────────────────────────

/** Validates JobCreate; returns error message or null. */
export const validateJobCreate = (input: JobCreate): string | null => {
  if (!isId(input.customerId)) return 'customerId must be a valid Id'
  if (!JOB_STATUSES.includes(input.status as JobStatus)) {
    return 'status must be a valid JobStatus'
  }
  return null
}

/** Validates JobUpdate; returns error message or null. */
export const validateJobUpdate = (input: JobUpdate): string | null => {
  if (!isId(input.id)) return 'id must be a valid Id'
  if (input.customerId !== undefined && !isId(input.customerId)) {
    return 'customerId must be a valid Id when provided'
  }
  if (input.status !== undefined && !JOB_STATUSES.includes(input.status as JobStatus)) {
    return 'status must be a valid JobStatus when provided'
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
    return 'locations must be a non-empty array of valid Location values'
  }
  if (!isCompositionMany(input.risks, isNote)) {
    return 'risks must be an array of valid Note values'
  }
  if (!isCompositionMany(input.notes, isNote)) {
    return 'notes must be an array of valid Note values'
  }
  return null
}

/** Validates JobAssessmentUpdate; returns error message or null. */
export const validateJobAssessmentUpdate = (
  input: JobAssessmentUpdate
): string | null => {
  if (!isId(input.id)) return 'id must be a valid Id'

  if (input.jobId !== undefined && !isId(input.jobId)) {
    return 'jobId must be a valid Id when provided'
  }
  if (input.assessorId !== undefined && !isId(input.assessorId)) {
    return 'assessorId must be a valid Id when provided'
  }
  if (
    input.locations !== undefined && !isCompositionPositive(input.locations, isLocation)
  ) {
    return 'locations must be a non-empty array of valid Location values when provided'
  }
  if (input.risks !== undefined && !isCompositionMany(input.risks, isNote)) {
    return 'risks must be an array of valid Note values when provided'
  }
  if (input.notes !== undefined && !isCompositionMany(input.notes, isNote)) {
    return 'notes must be an array of valid Note values when provided'
  }

  return null
}

/** Validates JobWorkflowCreate; returns error message or null. */
export const validateJobWorkflowCreate = (input: JobWorkflowCreate): string | null => {
  if (!isId(input.jobId)) return 'jobId must be a valid Id'
  if (!isId(input.basisWorkflowId)) return 'basisWorkflowId must be a valid Id'
  if (input.modifiedWorkflowId !== undefined && !isId(input.modifiedWorkflowId)) {
    return 'modifiedWorkflowId must be a valid Id when provided'
  }
  return null
}

/** Validates JobWorkflowUpdate; returns error message or null. */
export const validateJobWorkflowUpdate = (input: JobWorkflowUpdate): string | null => {
  if (!isId(input.id)) return 'id must be a valid Id'
  if (input.jobId !== undefined && !isId(input.jobId)) {
    return 'jobId must be a valid Id when provided'
  }
  if (input.basisWorkflowId !== undefined && !isId(input.basisWorkflowId)) {
    return 'basisWorkflowId must be a valid Id when provided'
  }
  if (input.modifiedWorkflowId !== undefined && !isId(input.modifiedWorkflowId)) {
    return 'modifiedWorkflowId must be a valid Id when provided'
  }
  return null
}

/** Validates JobPlanCreate; returns error message or null. */
export const validateJobPlanCreate = (input: JobPlanCreate): string | null => {
  if (!isId(input.jobId)) return 'jobId must be a valid Id'
  if (!isWhen(input.scheduledStart)) return 'scheduledStart must be a valid When'
  if (input.scheduledEnd !== undefined && !isWhen(input.scheduledEnd)) {
    return 'scheduledEnd must be a valid When when provided'
  }
  if (!isCompositionMany(input.notes, isNote)) {
    return 'notes must be an array of valid Note values'
  }
  return null
}

/** Validates JobPlanUpdate; returns error message or null. */
export const validateJobPlanUpdate = (input: JobPlanUpdate): string | null => {
  if (!isId(input.id)) return 'id must be a valid Id'
  if (input.jobId !== undefined && !isId(input.jobId)) {
    return 'jobId must be a valid Id when provided'
  }
  if (input.scheduledStart !== undefined && !isWhen(input.scheduledStart)) {
    return 'scheduledStart must be a valid When when provided'
  }
  if (input.scheduledEnd !== undefined && !isWhen(input.scheduledEnd)) {
    return 'scheduledEnd must be a valid When when provided'
  }
  if (input.notes !== undefined && !isCompositionMany(input.notes, isNote)) {
    return 'notes must be an array of valid Note values when provided'
  }
  return null
}

/** Validates JobPlanAssignmentCreate; returns error message or null. */
export const validateJobPlanAssignmentCreate = (
  input: JobPlanAssignmentCreate
): string | null => {
  if (!isId(input.planId)) return 'planId must be a valid Id'
  if (!isId(input.userId)) return 'userId must be a valid Id'
  if (!USER_ROLES.includes(input.role as UserRole)) {
    return 'role must be a valid UserRole'
  }
  if (!isCompositionMany(input.notes, isNote)) {
    return 'notes must be an array of valid Note values'
  }
  return null
}

/** Validates JobPlanAssignmentUpdate; returns error message or null. */
export const validateJobPlanAssignmentUpdate = (
  input: JobPlanAssignmentUpdate
): string | null => {
  if (!isId(input.id)) return 'id must be a valid Id'

  if (input.planId !== undefined && !isId(input.planId)) {
    return 'planId must be a valid Id when provided'
  }
  if (input.userId !== undefined && !isId(input.userId)) {
    return 'userId must be a valid Id when provided'
  }
  if (input.role !== undefined && !USER_ROLES.includes(input.role as UserRole)) {
    return 'role must be a valid UserRole when provided'
  }
  if (input.notes !== undefined && !isCompositionMany(input.notes, isNote)) {
    return 'notes must be an array of valid Note values when provided'
  }

  return null
}

/** Validates JobPlanChemicalCreate; returns error message or null. */
export const validateJobPlanChemicalCreate = (
  input: JobPlanChemicalCreate
): string | null => {
  if (!isId(input.planId)) return 'planId must be a valid Id'
  if (!isId(input.chemicalId)) return 'chemicalId must be a valid Id'
  if (!isPositiveNumber(input.amount)) return 'amount must be a positive number'
  if (!JOB_PLAN_CHEMICAL_UNITS.includes(input.unit as JobPlanChemicalUnit)) {
    return 'unit must be a valid JobPlanChemicalUnit'
  }
  if (input.targetArea !== undefined && !isPositiveNumber(input.targetArea)) {
    return 'targetArea must be a positive number when provided'
  }
  if (
    input.targetAreaUnit !== undefined
    && !JOB_PLAN_TARGET_AREA_UNITS.includes(input.targetAreaUnit as JobPlanTargetAreaUnit)
  ) {
    return 'targetAreaUnit must be a valid JobPlanTargetAreaUnit when provided'
  }

  return null
}

/** Validates JobPlanChemicalUpdate; returns error message or null. */
export const validateJobPlanChemicalUpdate = (
  input: JobPlanChemicalUpdate
): string | null => {
  if (!isId(input.id)) return 'id must be a valid Id'

  if (input.planId !== undefined && !isId(input.planId)) {
    return 'planId must be a valid Id when provided'
  }
  if (input.chemicalId !== undefined && !isId(input.chemicalId)) {
    return 'chemicalId must be a valid Id when provided'
  }
  if (input.amount !== undefined && !isPositiveNumber(input.amount)) {
    return 'amount must be a positive number when provided'
  }
  if (
    input.unit !== undefined
    && !JOB_PLAN_CHEMICAL_UNITS.includes(input.unit as JobPlanChemicalUnit)
  ) {
    return 'unit must be a valid JobPlanChemicalUnit when provided'
  }
  if (input.targetArea !== undefined && !isPositiveNumber(input.targetArea)) {
    return 'targetArea must be a positive number when provided'
  }
  if (
    input.targetAreaUnit !== undefined
    && !JOB_PLAN_TARGET_AREA_UNITS.includes(input.targetAreaUnit as JobPlanTargetAreaUnit)
  ) {
    return 'targetAreaUnit must be a valid JobPlanTargetAreaUnit when provided'
  }

  return null
}

/** Validates JobWorkCreate; returns error message or null. */
export const validateJobWorkCreate = (input: JobWorkCreate): string | null => {
  if (!isId(input.jobId)) return 'jobId must be a valid Id'
  if (!isId(input.startedById)) return 'startedById must be a valid Id'
  if (!isCompositionPositive(input.work, (value): value is string => isId(value))) {
    return 'work must be a non-empty array of valid Id values'
  }
  if (!isWhen(input.startedAt)) return 'startedAt must be a valid When'
  if (input.completedAt !== undefined && !isWhen(input.completedAt)) {
    return 'completedAt must be a valid When when provided'
  }

  return null
}

/** Validates JobWorkUpdate; returns error message or null. */
export const validateJobWorkUpdate = (input: JobWorkUpdate): string | null => {
  if (!isId(input.id)) return 'id must be a valid Id'

  if (input.jobId !== undefined && !isId(input.jobId)) {
    return 'jobId must be a valid Id when provided'
  }
  if (input.startedById !== undefined && !isId(input.startedById)) {
    return 'startedById must be a valid Id when provided'
  }
  if (
    input.work !== undefined
    && !isCompositionPositive(input.work, (value): value is string => isId(value))
  ) {
    return 'work must be a non-empty array of valid Id values when provided'
  }
  if (input.startedAt !== undefined && !isWhen(input.startedAt)) {
    return 'startedAt must be a valid When when provided'
  }
  if (input.completedAt !== undefined && !isWhen(input.completedAt)) {
    return 'completedAt must be a valid When when provided'
  }

  return null
}

/** Validates JobWorkLogEntryCreate; returns error message or null. */
export const validateJobWorkLogEntryCreate = (
  input: JobWorkLogEntryCreate
): string | null => {
  if (!isId(input.jobId)) return 'jobId must be a valid Id'
  if (!isId(input.userId)) return 'userId must be a valid Id'
  if (!isCompositionOne(input.answer, isAnswer)) {
    return 'answer must be a single-element composition containing a valid Answer'
  }
  return null
}

// ────────────────────────────────────────────────────────────────────────────
// INTERNALS
// ────────────────────────────────────────────────────────────────────────────

const isLocation = (
  value: unknown
): value is import('@domain/abstractions/common.ts').Location => {
  if (typeof value !== 'object' || value === null) return false

  const data = value as Dictionary

  if (typeof data.latitude !== 'number' || !Number.isFinite(data.latitude)) return false
  if (typeof data.longitude !== 'number' || !Number.isFinite(data.longitude)) return false

  if (data.altitudeMeters !== undefined) {
    if (
      typeof data.altitudeMeters !== 'number' || !Number.isFinite(data.altitudeMeters)
    ) return false
  }
  if (data.line1 !== undefined && !isNonEmptyString(data.line1)) return false
  if (data.line2 !== undefined && !isNonEmptyString(data.line2)) return false
  if (data.city !== undefined && !isNonEmptyString(data.city)) return false
  if (data.state !== undefined && !isNonEmptyString(data.state)) return false
  if (data.postalCode !== undefined && !isNonEmptyString(data.postalCode)) return false
  if (data.country !== undefined && !isNonEmptyString(data.country)) return false
  if (data.recordedAt !== undefined && !isWhen(data.recordedAt)) return false
  if (data.accuracyMeters !== undefined) {
    if (
      typeof data.accuracyMeters !== 'number' || !Number.isFinite(data.accuracyMeters)
    ) return false
  }
  if (data.description !== undefined && !isNonEmptyString(data.description)) return false

  return true
}
