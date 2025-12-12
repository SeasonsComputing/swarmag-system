import type { Asset, AssetType } from '@domain/asset'

export const assetTypeSamples: AssetType[] = [
  { id: '01TYPE-TRANSPORT-TRUCK', name: 'Transport Truck' },
  { id: '01TYPE-SKIDSTEER', name: 'Skidsteer Vehicle' },
  { id: '01TYPE-TOOLCAT', name: 'Toolcat Vehicle' },
  { id: '01TYPE-VEHICLE-ATTACH', name: 'Vehicle Tool Attachment' },
  { id: '01TYPE-MAP-DRONE', name: 'Mapping Drone' },
  { id: '01TYPE-DISPENSE-DRONE', name: 'Dispensing Drone' },
  { id: '01TYPE-SPRAY-TANK', name: 'Drone Spray Tank' },
  { id: '01TYPE-GRAN-HOPPER', name: 'Drone Granular Hopper' },
]

export const droneAssetSample: Asset = {
  id: '01J0N9ASSET00000000000001',
  label: 'DJI Agras T40 #3',
  description: 'High-capacity agricultural drone optimized for large acreage spraying.',
  serialNumber: 'DJI-T40-0003',
  type: '01TYPE-DISPENSE-DRONE',
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
  serialNumber: 'RAM-5500-RIG-2024-01',
  type: '01TYPE-TRANSPORT-TRUCK',
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
