/**
 * Job protocol validator
 */

import {
  type Dictionary,
  isCompositionOne,
  isCompositionPositive,
  isId,
  isPositiveNumber,
  isWhen
} from '@core-std'
import type { Location } from '@domain/abstractions/common.ts'
import { USER_ROLES } from '@domain/abstractions/user.ts'
import type { UserRole } from '@domain/abstractions/user.ts'
import type { Answer } from '@domain/abstractions/workflow.ts'
import type {
  JobAssessmentCreateInput,
  JobAssessmentUpdateInput,
  JobCreateInput,
  JobPlanAssignmentCreateInput,
  JobPlanAssignmentUpdateInput,
  JobPlanChemicalCreateInput,
  JobPlanChemicalUpdateInput,
  JobPlanCreateInput,
  JobPlanUpdateInput,
  JobUpdateInput,
  JobWorkCreateInput,
  JobWorkflowCreateInput,
  JobWorkflowUpdateInput,
  JobWorkLogEntryCreateInput
} from '@domain/protocols/job-protocol.ts'

const JOB_STATUSES = [
  'open',
  'assessing',
  'planning',
  'preparing',
  'executing',
  'finalizing',
  'closed',
  'cancelled'
] as const
const CHEMICAL_UNITS = ['gallon', 'liter', 'pound', 'kilogram'] as const

// ────────────────────────────────────────────────────────────────────────────
// VALIDATORS
// ────────────────────────────────────────────────────────────────────────────

/** Validates JobCreateInput; returns error message or null. */
export const validateJobCreate = (input: JobCreateInput): string | null => {
  if (!isId(input.customerId)) return 'customerId must be a valid Id'
  return null
}

/** Validates JobUpdateInput; returns error message or null. */
export const validateJobUpdate = (input: JobUpdateInput): string | null => {
  if (!isId(input.id)) return 'id must be a valid Id'
  if (input.status !== undefined && !JOB_STATUSES.includes(input.status)) {
    return `status must be one of: ${JOB_STATUSES.join(', ')}`
  }
  return null
}

/** Validates JobAssessmentCreateInput; returns error message or null. */
export const validateJobAssessmentCreate = (
  input: JobAssessmentCreateInput
): string | null => {
  if (!isId(input.jobId)) return 'jobId must be a valid Id'
  if (!isId(input.assessorId)) return 'assessorId must be a valid Id'
  if (!isCompositionPositive(input.locations, isLocation)) {
    return 'locations must be a non-empty array of valid locations'
  }
  return null
}

/** Validates JobAssessmentUpdateInput; returns error message or null. */
export const validateJobAssessmentUpdate = (
  input: JobAssessmentUpdateInput
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

/** Validates JobWorkflowCreateInput; returns error message or null. */
export const validateJobWorkflowCreate = (
  input: JobWorkflowCreateInput
): string | null => {
  if (!isId(input.jobId)) return 'jobId must be a valid Id'
  if (!isPositiveNumber(input.sequence)) return 'sequence must be a positive number'
  if (!isId(input.basisWorkflowId)) return 'basisWorkflowId must be a valid Id'
  return null
}

/** Validates JobWorkflowUpdateInput; returns error message or null. */
export const validateJobWorkflowUpdate = (
  input: JobWorkflowUpdateInput
): string | null => {
  if (!isId(input.id)) return 'id must be a valid Id'
  if (input.sequence !== undefined && !isPositiveNumber(input.sequence)) {
    return 'sequence must be a positive number'
  }
  if (input.modifiedWorkflowId !== undefined && !isId(input.modifiedWorkflowId)) {
    return 'modifiedWorkflowId must be a valid Id'
  }
  return null
}

/** Validates JobPlanCreateInput; returns error message or null. */
export const validateJobPlanCreate = (input: JobPlanCreateInput): string | null => {
  if (!isId(input.jobId)) return 'jobId must be a valid Id'
  if (!isWhen(input.scheduledStart)) return 'scheduledStart must be a valid When'
  return null
}

/** Validates JobPlanUpdateInput; returns error message or null. */
export const validateJobPlanUpdate = (input: JobPlanUpdateInput): string | null => {
  if (!isId(input.id)) return 'id must be a valid Id'
  if (input.scheduledStart !== undefined && !isWhen(input.scheduledStart)) {
    return 'scheduledStart must be a valid When'
  }
  if (input.scheduledEnd !== undefined && !isWhen(input.scheduledEnd)) {
    return 'scheduledEnd must be a valid When'
  }
  return null
}

/** Validates JobPlanAssignmentCreateInput; returns error message or null. */
export const validateJobPlanAssignmentCreate = (
  input: JobPlanAssignmentCreateInput
): string | null => {
  if (!isId(input.planId)) return 'planId must be a valid Id'
  if (!isId(input.userId)) return 'userId must be a valid Id'
  if (!isUserRole(input.role)) return `role must be one of: ${USER_ROLES.join(', ')}`
  return null
}

/** Validates JobPlanAssignmentUpdateInput; returns error message or null. */
export const validateJobPlanAssignmentUpdate = (
  input: JobPlanAssignmentUpdateInput
): string | null => {
  if (!isId(input.id)) return 'id must be a valid Id'
  if (input.role !== undefined && !isUserRole(input.role)) {
    return `role must be one of: ${USER_ROLES.join(', ')}`
  }
  return null
}

/** Validates JobPlanChemicalCreateInput; returns error message or null. */
export const validateJobPlanChemicalCreate = (
  input: JobPlanChemicalCreateInput
): string | null => {
  if (!isId(input.planId)) return 'planId must be a valid Id'
  if (!isId(input.chemicalId)) return 'chemicalId must be a valid Id'
  if (!isPositiveNumber(input.amount)) return 'amount must be a positive number'
  if (!CHEMICAL_UNITS.includes(input.unit)) {
    return `unit must be one of: ${CHEMICAL_UNITS.join(', ')}`
  }
  return null
}

/** Validates JobPlanChemicalUpdateInput; returns error message or null. */
export const validateJobPlanChemicalUpdate = (
  input: JobPlanChemicalUpdateInput
): string | null => {
  if (!isId(input.id)) return 'id must be a valid Id'
  if (input.amount !== undefined && !isPositiveNumber(input.amount)) {
    return 'amount must be a positive number'
  }
  if (input.unit !== undefined && !CHEMICAL_UNITS.includes(input.unit)) {
    return `unit must be one of: ${CHEMICAL_UNITS.join(', ')}`
  }
  return null
}

/** Validates JobWorkCreateInput; returns error message or null. */
export const validateJobWorkCreate = (input: JobWorkCreateInput): string | null => {
  if (!isId(input.jobId)) return 'jobId must be a valid Id'
  if (!isCompositionPositive(input.work, isId)) {
    return 'work must be a non-empty array of valid Ids'
  }
  if (!isWhen(input.startedAt)) return 'startedAt must be a valid When'
  if (!isId(input.startedById)) return 'startedById must be a valid Id'
  return null
}

/** Validates JobWorkLogEntryCreateInput; returns error message or null. */
export const validateJobWorkLogEntryCreate = (
  input: JobWorkLogEntryCreateInput
): string | null => {
  if (!isId(input.jobId)) return 'jobId must be a valid Id'
  if (!isId(input.userId)) return 'userId must be a valid Id'
  if (!isCompositionOne([input.answer], isAnswer)) return 'answer must be a valid Answer'
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

const isUserRole = (v: unknown): v is UserRole => USER_ROLES.includes(v as UserRole)
