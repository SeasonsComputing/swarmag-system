import type { JobAssessment, JobLogEntry } from '@domain/job'
import { id } from '@utils/identifier'

const serviceId = id()
const customerId = id()
const contactId = id()
const assessorId = id()
const assessmentAttachmentId = id()
const waterwaysAttachmentId = id()
const assessmentId = id()

export const ranchMappingAssessment: JobAssessment = {
  id: assessmentId,
  serviceId,
  customerId,
  contactId,
  assessor: {
    id: assessorId,
    displayName: 'Morgan Diaz',
    roles: ['operations'],
    role: 'Assessment Lead',
  },
  assessedAt: '2025-01-12T14:00:00Z',
  locations: [
    {
      coordinate: { latitude: 31.9686, longitude: -99.9018 },
      description: 'North pasture, Blue Mesa Ranch',
    },
    {
      coordinate: { latitude: 31.9789, longitude: -99.9142 },
      description: 'South mesquite grove, Blue Mesa Ranch',
    },
  ],
  questions: [],
  notes: [],
  attachments: [
    {
      id: assessmentAttachmentId,
      filename: 'north-pasture-map.tif',
      url: `https://storage.swarmag.com/job-assessments/${assessmentId}/maps/base.tif`,
      kind: 'map',
      uploadedAt: '2025-01-12T14:05:00Z',
      uploadedBy: {
        id: assessorId,
        displayName: 'Morgan Diaz',
        roles: ['operations'],
        role: 'Assessment Lead',
      },
    },
    {
      id: waterwaysAttachmentId,
      filename: 'waterways-annotation.geojson',
      url: `https://storage.swarmag.com/job-assessments/${assessmentId}/maps/waterways.geojson`,
      kind: 'map',
      uploadedAt: '2025-01-12T14:08:00Z',
      uploadedBy: {
        id: id(),
        displayName: 'Priya Mehta',
        roles: ['gis'],
        role: 'GIS Analyst',
      },
    },
  ],
  createdAt: '2025-01-12T14:00:00Z',
  updatedAt: '2025-01-12T14:10:00Z',
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
  createdBy: {
    id: jobLogAuthorId,
    displayName: 'Evan Cole',
    roles: ['operations'],
    role: 'Crew Lead',
  },
  location: {
    coordinate: { latitude: 32.2144, longitude: -97.1234 },
    recordedAt: '2025-01-18T16:21:00Z',
  },
  attachments: [
    {
      id: beforeAttachmentId,
      filename: 'block3-before.jpg',
      url: `https://storage.swarmag.com/jobs/${jobId}/photos/block3-before.jpg`,
      kind: 'photo',
      uploadedAt: '2025-01-18T16:21:05Z',
      uploadedBy: {
        id: jobLogAuthorId,
        displayName: 'Evan Cole',
        roles: ['operations'],
        role: 'Crew Lead',
      },
    },
    {
      id: afterAttachmentId,
      filename: 'block3-after.jpg',
      url: `https://storage.swarmag.com/jobs/${jobId}/photos/block3-after.jpg`,
      kind: 'photo',
      uploadedAt: '2025-01-18T16:21:10Z',
      uploadedBy: {
        id: jobLogAuthorId,
        displayName: 'Evan Cole',
        roles: ['operations'],
        role: 'Crew Lead',
      },
    },
  ],
  payload: {
    sprayBlock: 3,
    coverage: 'complete',
  },
}

export const jobSamples = {
  assessment: ranchMappingAssessment,
  logEntry: fieldPhotoLogEntry,
}
