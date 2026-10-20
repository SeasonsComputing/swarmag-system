/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Job views                                                                    ║
║ UX-local view types for job display.                                         ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Display projections only, not domain types. No infrastructure imports.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
JobManifest   Device-local job manifest entry.
├ id          Job id.
├ status      Job status.
└ title       Display title.
JobHub        Job display composite across lifecycle phases.
├ manifest    Manifest entry.
├ job         The job.
├ assessment  Assessment, once assessed.
└ plan        Plan, once planned.
*/

import type { Id } from '@core/std'
import type { Job, JobAssessment, JobPlan, JobStatus } from '@domain/abstractions/job.ts'

/** Lightweight job manifest entry — device-local display projection. */
export type JobManifest = {
  id: Id
  status: JobStatus
  title: string
}

/**
 * UX composite for job display and navigation across all lifecycle phases.
 * All phase fields are optional — availability depends on job status.
 */
export type JobHub = {
  manifest: JobManifest
  job: Job
  assessment?: JobAssessment
  plan?: JobPlan
}
