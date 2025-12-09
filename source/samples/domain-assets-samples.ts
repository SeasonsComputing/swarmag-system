import type { Asset } from '@domain/asset'

export const droneAssetSample: Asset = {
  id: '01J0N9ASSET00000000000001',
  label: 'DJI Agras T40 #3',
  description: 'High-capacity agricultural drone optimized for large acreage spraying.',
  type: 'dispensing-drone',
  status: 'active',
  attachments: [
    {
      id: '01J0ATTACHMENT0000000001',
      filename: 'agras-t40-manual.pdf',
      url: 'https://storage.swarmag.com/assets/agras-t40/manual.pdf',
      kind: 'document',
      uploadedAt: '2024-12-01T00:00:00Z',
      uploadedBy: {
        id: '01HZDOCS001',
        displayName: 'Documentation Bot',
        roles: ['system'],
      },
    },
    {
      id: '01J0ATTACHMENT0000000002',
      filename: 'preflight-checklist.jpg',
      url: 'https://storage.swarmag.com/assets/agras-t40/photos/preflight.jpg',
      kind: 'photo',
      uploadedAt: '2025-01-18T15:20:00Z',
      uploadedBy: {
        id: '01HZTECH002',
        displayName: 'Noah Price',
        roles: ['maintenance'],
        role: 'Field Tech',
      },
    },
  ],
  createdAt: '2024-12-01T00:00:00Z',
  updatedAt: '2025-01-18T15:24:00Z',
}

export const sprayerTruckSample: Asset = {
  id: '01J0N9ASSET00000000000002',
  label: 'Ram 5500 Spray Rig',
  description: 'Dual-tank spray truck configured for mixed ground applications.',
  type: 'vehicle-tool',
  status: 'maintenance',
  attachments: [
    {
      id: '01J0ATTACHMENT0000000003',
      filename: 'sprayer-ram5500-maintenance-log.pdf',
      url: 'https://storage.swarmag.com/assets/ram5500/maintenance-log.pdf',
      kind: 'document',
      uploadedAt: '2024-12-15T00:00:00Z',
      uploadedBy: {
        id: '01HZADMIN001',
        displayName: 'Yara Singh',
        roles: ['operations'],
        role: 'Fleet Manager',
      },
    },
  ],
  createdAt: '2024-11-15T00:00:00Z',
  updatedAt: '2025-01-15T11:00:00Z',
}

export const assetSamples: Asset[] = [droneAssetSample, sprayerTruckSample]
