/**
 * UX-local shared view types for job display.
 * Display projections only — not domain types. No infrastructure imports.
 */

import type { Id } from '@core/std'
import type { Job, JobAssessment, JobPlan, JobStatus } from '@domain/abstractions/job.ts'

/** Lightweight job manifest entry — device-local display projection. */
export type JobSummary = {
  id: Id
  status: JobStatus
  title: string
}

/**
 * UX composite for job display and navigation across all lifecycle phases.
 * All phase fields are optional — availability depends on job status.
 */
export type JobDefinition = {
  job: Job
  assessment?: JobAssessment
  plan?: JobPlan
  summary?: JobSummary
}
