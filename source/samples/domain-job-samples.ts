import type { JobAssessment, JobLogEntry } from '@domain/job'

export const ranchMappingAssessment: JobAssessment = {
  id: '01J0JOBSASSESS00000000001',
  serviceId: '01J0SERVICEHERBICIDE',
  customerId: '01J0CUSTOMER00001',
  contactId: '01J0CONTACT00001',
  assessor: {
    id: '01HZOPS001',
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
      id: '01J0ATTACHMENT0000000100',
      filename: 'north-pasture-map.tif',
      url: 'https://storage.swarmag.com/job-assessments/01J0JOBSASSESS00000000001/maps/base.tif',
      kind: 'map',
      uploadedAt: '2025-01-12T14:05:00Z',
      uploadedBy: {
        id: '01HZOPS001',
        displayName: 'Morgan Diaz',
        roles: ['operations'],
        role: 'Assessment Lead',
      },
    },
    {
      id: '01J0ATTACHMENT0000000101',
      filename: 'waterways-annotation.geojson',
      url: 'https://storage.swarmag.com/job-assessments/01J0JOBSASSESS00000000001/maps/waterways.geojson',
      kind: 'map',
      uploadedAt: '2025-01-12T14:08:00Z',
      uploadedBy: {
        id: '01HZGIS001',
        displayName: 'Priya Mehta',
        roles: ['gis'],
        role: 'GIS Analyst',
      },
    },
  ],
  createdAt: '2025-01-12T14:00:00Z',
  updatedAt: '2025-01-12T14:10:00Z',
}

export const fieldPhotoLogEntry: JobLogEntry = {
  id: '01J0JOBLOG000000000123',
  jobId: '01J0JOB0000000456',
  planId: '01J0JOBPLAN000567',
  type: 'checkpoint',
  message: 'Captured before/after images for spray block 3',
  occurredAt: '2025-01-18T16:20:00Z',
  createdAt: '2025-01-18T16:21:00Z',
  createdBy: {
    id: '01HZOPS010',
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
      id: '01J0ATTACHMENT0000000200',
      filename: 'block3-before.jpg',
      url: 'https://storage.swarmag.com/jobs/01J0JOB0000000456/photos/block3-before.jpg',
      kind: 'photo',
      uploadedAt: '2025-01-18T16:21:05Z',
      uploadedBy: {
        id: '01HZOPS010',
        displayName: 'Evan Cole',
        roles: ['operations'],
        role: 'Crew Lead',
      },
    },
    {
      id: '01J0ATTACHMENT0000000201',
      filename: 'block3-after.jpg',
      url: 'https://storage.swarmag.com/jobs/01J0JOB0000000456/photos/block3-after.jpg',
      kind: 'photo',
      uploadedAt: '2025-01-18T16:21:10Z',
      uploadedBy: {
        id: '01HZOPS010',
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
