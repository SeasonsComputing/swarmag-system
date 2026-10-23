/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Job fixtures                                                                 ║
║ Shared job assessment and work-log records for tests.                        ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Sample job fixtures for tests.

Shared job assessment and work-log records for tests.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
JobSamples  Shared fixture samples.
├ ranchMappingAssessment  Assessment with two locations.
│ ├ Instantiable           Inherited Instantiable fields.
│ ├ scheduledAt            Scheduled assessment time.
│ ├ startedAt              Optional assessment start.
│ ├ completedAt            Optional assessment completion.
│ ├ jobId                  Job reference.
│ ├ assessorId             Assessor reference.
│ ├ locations              Assessment locations.
│ ├ risks                  Risk notes.
│ └ notes                  Note collection.
├ fieldMetadataLogEntry   Work-log entry with an answer.
│ ├ InstantiableOnly       Inherited InstantiableOnly fields.
│ ├ jobId                  Job reference.
│ ├ userId                 User reference.
│ └ answer                 Captured answer.
└ all                     Job fixture collection.
  ├ assessment            Shared assessment record.
  └ logEntry              Shared work-log record.
*/

import { id } from '@core/std'
import type { JobAssessment, JobWorkLogEntry } from '@domain/abstractions/job.ts'

const JOB_ID = id()
const ASSESSMENT_ID = id()
const ASSESSOR_ID = id()
const USER_ID = id()
const TELEMETRY_QUESTION_ID = id()

const RanchMappingAssessment: JobAssessment = {
  id: ASSESSMENT_ID,
  jobId: JOB_ID,
  assessorId: ASSESSOR_ID,
  scheduledAt: '2025-01-12T13:30:00Z',
  locations: [{
    latitude: 31.9686,
    longitude: -99.9018,
    description: 'North pasture, Blue Mesa Ranch'
  }, {
    latitude: 31.9789,
    longitude: -99.9142,
    description: 'South mesquite grove, Blue Mesa Ranch'
  }],
  risks: [],
  notes: [],
  createdAt: '2025-01-12T14:00:00Z',
  updatedAt: '2025-01-12T14:10:00Z'
}

const FieldMetadataLogEntry: JobWorkLogEntry = {
  id: id(),
  jobId: JOB_ID,
  userId: USER_ID,
  answer: [{
    questionId: TELEMETRY_QUESTION_ID,
    value: '32.2144,-97.1234',
    capturedAt: '2025-01-18T16:21:00Z',
    notes: []
  }],
  createdAt: '2025-01-18T16:21:00Z'
}

const All = {
  assessment: RanchMappingAssessment,
  logEntry: FieldMetadataLogEntry
}

/** Shared fixture samples. */
export const JobSamples = {
  ranchMappingAssessment: RanchMappingAssessment,
  fieldMetadataLogEntry: FieldMetadataLogEntry,
  all: All
}
