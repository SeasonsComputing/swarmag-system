/**
 * Sample job fixtures for tests.
 */

import type { JobAssessment, JobLogEntry } from '@domain/abstractions/job.ts'
import { id } from '@core-std'

const serviceId = id()
const customerId = id()
const contactId = id()
const assessorId = id()
const assessmentAttachmentId = id()
const waterwaysAttachmentId = id()
const assessmentId = id()
const priyaId = id()

export const ranchMappingAssessment: JobAssessment = {
  id: assessmentId,
  serviceId,
  customerId,
  contactId,
  assessorId,
  assessedAt: '2025-01-12T14:00:00Z',
  locations: [{
    latitude: 31.9686,
    longitude: -99.9018,
    description: 'North pasture, Blue Mesa Ranch'
  }, {
    latitude: 31.9789,
    longitude: -99.9142,
    description: 'South mesquite grove, Blue Mesa Ranch'
  }],
  questions: [],
  notes: [],
  attachments: [{
    id: assessmentAttachmentId,
    filename: 'north-pasture-map.tif',
    url: `https://storage.swarmag.com/job-assessments/${assessmentId}/maps/base.tif`,
    contentType: 'image/tiff',
    uploadedAt: '2025-01-12T14:05:00Z',
    uploadedById: assessorId
  }, {
    id: waterwaysAttachmentId,
    filename: 'waterways-annotation.geojson',
    url: `https://storage.swarmag.com/job-assessments/${assessmentId}/maps/waterways.geojson`,
    contentType: 'application/geo+json',
    uploadedAt: '2025-01-12T14:08:00Z',
    uploadedById: priyaId
  }],
  createdAt: '2025-01-12T14:00:00Z',
  updatedAt: '2025-01-12T14:10:00Z'
}

const jobId = id()
const planId = id()
const jobLogAuthorId = id()
const beforeAttachmentId = id()
const afterAttachmentId = id()

export const fieldPhotoLogEntry: JobLogEntry = {
  id: id(),
  jobId,
  planId,
  type: 'checkpoint',
  message: 'Captured before/after images for spray block 3',
  occurredAt: '2025-01-18T16:20:00Z',
  createdAt: '2025-01-18T16:21:00Z',
  createdById: jobLogAuthorId,
  location: { latitude: 32.2144, longitude: -97.1234, recordedAt: '2025-01-18T16:21:00Z' },
  attachments: [{
    id: beforeAttachmentId,
    filename: 'block3-before.jpg',
    url: `https://storage.swarmag.com/jobs/${jobId}/photos/block3-before.jpg`,
    contentType: 'image/jpeg',
    uploadedAt: '2025-01-18T16:21:05Z',
    uploadedById: jobLogAuthorId
  }, {
    id: afterAttachmentId,
    filename: 'block3-after.jpg',
    url: `https://storage.swarmag.com/jobs/${jobId}/photos/block3-after.jpg`,
    contentType: 'image/jpeg',
    uploadedAt: '2025-01-18T16:21:10Z',
    uploadedById: jobLogAuthorId
  }],
  payload: { sprayBlock: 3, coverage: 'complete' }
}

export const jobSamples = { assessment: ranchMappingAssessment, logEntry: fieldPhotoLogEntry }
