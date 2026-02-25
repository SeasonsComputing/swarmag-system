/**
 * Sample job fixtures for tests.
 */

import { id } from '@core-std'
import type { JobAssessment, JobWorkLogEntry } from '@domain/abstractions/job.ts'

const jobId = id()
const assessmentId = id()
const assessorId = id()
const userId = id()
const telemetryQuestionId = id()

export const ranchMappingAssessment: JobAssessment = {
  id: assessmentId,
  jobId,
  assessorId,
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

export const fieldMetadataLogEntry: JobWorkLogEntry = {
  id: id(),
  jobId,
  userId,
  answer: {
    questionId: telemetryQuestionId,
    value: '32.2144,-97.1234',
    capturedAt: '2025-01-18T16:21:00Z',
    capturedById: userId,
    notes: []
  },
  createdAt: '2025-01-18T16:21:00Z'
}

export const jobSamples = {
  assessment: ranchMappingAssessment,
  logEntry: fieldMetadataLogEntry
}
