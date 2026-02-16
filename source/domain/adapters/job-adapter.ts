/**
 * Mappers for converting between Supabase job rows and domain Jobs.
 */

import type { Dictionary } from '@core-std'
import type {
  Job,
  JobAssessment,
  JobLogEntry,
  JobPlan,
  JobStatus
} from '@domain/abstractions/job.ts'

/**
 * Type guard for job status.
 * @param value - Potential status value.
 * @returns True when the value matches a known status.
 */
export const isJobStatus = (value: unknown): value is JobStatus =>
  value === 'draft'
  || value === 'ready'
  || value === 'scheduled'
  || value === 'in-progress'
  || value === 'completed'
  || value === 'cancelled'

/** Map a domain Job into a Dictionary shape. */
export const fromJob = (job: Job): Dictionary => ({
  id: job.id,
  assessment_id: job.assessmentId,
  plan_id: job.planId,
  service_id: job.serviceId,
  customer_id: job.customerId,
  status: job.status,
  created_at: job.createdAt,
  updated_at: job.updatedAt,
  payload: job
})

/**
 * Convert a Dictionary into a Job domain model.
 * Payload is truth - if present, use it directly.
 * Falls back to column mapping for legacy records.
 * @param dict - The dictionary to convert.
 * @returns The mapped Job object.
 * @throws Error if required fields are missing.
 */
export const toJob = (record: Dictionary): Job => {
  if (!record || typeof record !== 'object') {
    throw new Error('Job dictionary is missing required fields')
  }

  // Payload as truth - direct cast if present
  if (record.payload && typeof record.payload === 'object') {
    const payload = record.payload as Dictionary
    if (
      typeof payload.id === 'string'
      && typeof payload.assessmentId === 'string'
      && typeof payload.planId === 'string'
      && typeof payload.serviceId === 'string'
      && typeof payload.customerId === 'string'
      && isJobStatus(payload.status)
    ) {
      return payload as unknown as Job
    }
  }

  // Legacy fallback - map from columns
  const id = record.id as string
  const assessmentId = (record.assessment_id ?? record.assessmentId) as string
  const planId = (record.plan_id ?? record.planId) as string
  const serviceId = (record.service_id ?? record.serviceId) as string
  const customerId = (record.customer_id ?? record.customerId) as string
  const status = record.status

  if (!id || !assessmentId || !planId || !serviceId || !customerId || !isJobStatus(status)) {
    throw new Error('Job dictionary is missing required fields')
  }

  return {
    id,
    assessmentId,
    planId,
    serviceId,
    customerId,
    status,
    createdAt: (record.created_at ?? record.createdAt) as string,
    updatedAt: (record.updated_at ?? record.updatedAt) as string
  }
}

/** Map a domain JobAssessment into a Dictionary shape. */
export const fromJobAssessment = (assessment: JobAssessment): Dictionary => ({
  id: assessment.id,
  service_id: assessment.serviceId,
  customer_id: assessment.customerId,
  contact_id: assessment.contactId ?? null,
  assessor_id: assessment.assessorId,
  assessed_at: assessment.assessedAt,
  locations: assessment.locations,
  questions: assessment.questions,
  risks: assessment.risks ?? null,
  notes: assessment.notes ?? null,
  attachments: assessment.attachments ?? null,
  created_at: assessment.createdAt,
  updated_at: assessment.updatedAt,
  payload: assessment
})

/**
 * Convert a Dictionary into a JobAssessment domain model.
 * @param dict - The dictionary to convert.
 * @returns The mapped JobAssessment object.
 * @throws Error if required fields are missing.
 */
export const toJobAssessment = (record: Dictionary): JobAssessment => {
  if (!record || typeof record !== 'object') {
    throw new Error('JobAssessment dictionary is missing required fields')
  }

  // Payload as truth - direct cast if present
  if (record.payload && typeof record.payload === 'object') {
    const payload = record.payload as Dictionary
    if (
      typeof payload.id === 'string' && typeof payload.serviceId === 'string' && typeof payload
          .customerId === 'string'
      && typeof payload.assessorId === 'string' && Array.isArray(payload.locations) && payload
          .locations
          .length > 0
    ) {
      return payload as unknown as JobAssessment
    }
  }

  throw new Error('JobAssessment dictionary is missing required fields')
}

/** Map a domain JobPlan into a Dictionary shape. */
export const fromJobPlan = (plan: JobPlan): Dictionary => ({
  id: plan.id,
  job_id: plan.jobId,
  workflow_id: plan.workflowId,
  scheduled_start: plan.scheduledStart,
  scheduled_end: plan.scheduledEnd ?? null,
  target_locations: plan.targetLocations,
  assignments: plan.assignments,
  assets: plan.assets,
  chemicals: plan.chemicals,
  notes: plan.notes ?? null,
  created_at: plan.createdAt,
  updated_at: plan.updatedAt,
  payload: plan
})

/**
 * Convert a Dictionary into a JobPlan domain model.
 * @param dict - The dictionary to convert.
 * @returns The mapped JobPlan object.
 * @throws Error if required fields are missing.
 */
export const toJobPlan = (record: Dictionary): JobPlan => {
  if (!record || typeof record !== 'object') {
    throw new Error('JobPlan dictionary is missing required fields')
  }

  // Payload as truth - direct cast if present
  if (record.payload && typeof record.payload === 'object') {
    const payload = record.payload as Dictionary
    if (
      typeof payload.id === 'string' && typeof payload.jobId === 'string' && typeof payload
          .workflowId === 'string'
      && typeof payload.scheduledStart === 'string'
    ) {
      return payload as unknown as JobPlan
    }
  }

  throw new Error('JobPlan dictionary is missing required fields')
}

/** Map a domain JobLogEntry into a Dictionary shape. */
export const fromJobLogEntry = (entry: JobLogEntry): Dictionary => ({
  id: entry.id,
  job_id: entry.jobId,
  plan_id: entry.planId,
  type: entry.type,
  message: entry.message,
  occurred_at: entry.occurredAt,
  created_at: entry.createdAt,
  created_by_id: entry.createdById,
  location: entry.location ?? null,
  attachments: entry.attachments ?? null,
  payload: entry
})

/**
 * Convert a Dictionary into a JobLogEntry domain model.
 * @param dict - The dictionary to convert.
 * @returns The mapped JobLogEntry object.
 * @throws Error if required fields are missing.
 */
export const toJobLogEntry = (record: Dictionary): JobLogEntry => {
  if (!record || typeof record !== 'object') {
    throw new Error('JobLogEntry dictionary is missing required fields')
  }

  // Payload as truth - direct cast if present
  if (record.payload && typeof record.payload === 'object') {
    const payload = record.payload as Dictionary
    if (
      typeof payload.id === 'string' && typeof payload.jobId === 'string' && typeof payload
          .planId === 'string'
      && typeof payload.type === 'string' && typeof payload.message === 'string'
    ) {
      return payload as unknown as JobLogEntry
    }
  }

  throw new Error('JobLogEntry dictionary is missing required fields')
}
