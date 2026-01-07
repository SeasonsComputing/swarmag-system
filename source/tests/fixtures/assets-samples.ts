/**
 * Asset fixture samples for tests.
 */

import type { Asset, AssetType } from '@domain/asset.ts'
import { id } from '@utils/identifier.ts'

const transportTruckTypeId = id()
const skidsteerTypeId = id()
const toolcatTypeId = id()
const vehicleAttachmentTypeId = id()
const mappingDroneTypeId = id()
const dispensingDroneTypeId = id()
const sprayTankTypeId = id()
const granularHopperTypeId = id()

export const assetTypeSamples: AssetType[] = [
  { id: transportTruckTypeId, name: 'Transport Truck' },
  { id: skidsteerTypeId, name: 'Skidsteer Vehicle' },
  { id: toolcatTypeId, name: 'Toolcat Vehicle' },
  { id: vehicleAttachmentTypeId, name: 'Vehicle Tool Attachment' },
  { id: mappingDroneTypeId, name: 'Mapping Drone' },
  { id: dispensingDroneTypeId, name: 'Dispensing Drone' },
  { id: sprayTankTypeId, name: 'Drone Spray Tank' },
  { id: granularHopperTypeId, name: 'Drone Granular Hopper' },
]

export const droneAssetSample: Asset = {
  id: id(),
  label: 'DJI Agras T40 #3',
  description: 'High-capacity agricultural drone optimized for large acreage spraying.',
  serialNumber: 'DJI-T40-0003',
  type: dispensingDroneTypeId,
  status: 'active',
  attachments: [
    {
      id: id(),
      filename: 'agras-t40-manual.pdf',
      url: 'https://storage.swarmag.com/assets/agras-t40/manual.pdf',
      kind: 'document',
      uploadedAt: '2024-12-01T00:00:00Z',
      uploadedBy: {
        id: id(),
        displayName: 'Documentation Bot',
        roles: ['administrator'],
      },
    },
    {
      id: id(),
      filename: 'preflight-checklist.jpg',
      url: 'https://storage.swarmag.com/assets/agras-t40/photos/preflight.jpg',
      kind: 'photo',
      uploadedAt: '2025-01-18T15:20:00Z',
      uploadedBy: {
        id: id(),
        displayName: 'Noah Price',
        roles: ['operations'],
        role: 'field-tech',
      },
    },
  ],
  createdAt: '2024-12-01T00:00:00Z',
  updatedAt: '2025-01-18T15:24:00Z',
}

export const sprayerTruckSample: Asset = {
  id: id(),
  label: 'Ram 5500 Spray Rig',
  description: 'Dual-tank spray truck configured for mixed ground applications.',
  serialNumber: 'RAM-5500-RIG-2024-01',
  type: transportTruckTypeId,
  status: 'maintenance',
  attachments: [
    {
      id: id(),
      filename: 'sprayer-ram5500-maintenance-log.pdf',
      url: 'https://storage.swarmag.com/assets/ram5500/maintenance-log.pdf',
      kind: 'document',
      uploadedAt: '2024-12-15T00:00:00Z',
      uploadedBy: {
        id: id(),
        displayName: 'Yara Singh',
        roles: ['operations'],
        role: 'fleet-manager',
      },
    },
  ],
  createdAt: '2024-11-15T00:00:00Z',
  updatedAt: '2025-01-15T11:00:00Z',
}

export const assetSamples: Asset[] = [droneAssetSample, sprayerTruckSample]
