/**
 * Asset fixture samples for tests.
 */

import type { Asset, AssetType } from '@domain/abstractions/asset.ts'
import { id } from '@utils'

const transportTruckTypeId = id()
const skidsteerTypeId = id()
const toolcatTypeId = id()
const vehicleAttachmentTypeId = id()
const mappingDroneTypeId = id()
const dispensingDroneTypeId = id()
const sprayTankTypeId = id()
const granularHopperTypeId = id()

export const assetTypeSamples: AssetType[] = [{ id: transportTruckTypeId, label: 'Transport Truck', active: true,
  createdAt: '2024-11-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' }, { id: skidsteerTypeId,
  label: 'Skidsteer Vehicle', active: true, createdAt: '2024-11-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' }, {
  id: toolcatTypeId,
  label: 'Toolcat Vehicle',
  active: true,
  createdAt: '2024-11-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z'
}, { id: vehicleAttachmentTypeId, label: 'Vehicle Tool Attachment', active: true, createdAt: '2024-11-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z' }, { id: mappingDroneTypeId, label: 'Mapping Drone', active: true,
  createdAt: '2024-11-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' }, { id: dispensingDroneTypeId,
  label: 'Dispensing Drone', active: true, createdAt: '2024-11-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' }, {
  id: sprayTankTypeId,
  label: 'Drone Spray Tank',
  active: true,
  createdAt: '2024-11-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z'
}, { id: granularHopperTypeId, label: 'Drone Granular Hopper', active: true, createdAt: '2024-11-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z' }]

export const droneAssetSample: Asset = { id: id(), label: 'DJI Agras T40 #3',
  description: 'High-capacity agricultural drone optimized for large acreage spraying.', serialNumber: 'DJI-T40-0003',
  type: dispensingDroneTypeId, status: 'active',
  attachments: [{ id: id(), filename: 'agras-t40-manual.pdf',
    url: 'https://storage.swarmag.com/assets/agras-t40/manual.pdf', contentType: 'application/pdf',
    uploadedAt: '2024-12-01T00:00:00Z', uploadedById: id() }, { id: id(), filename: 'preflight-checklist.jpg',
    url: 'https://storage.swarmag.com/assets/agras-t40/photos/preflight.jpg', contentType: 'image/jpeg',
    uploadedAt: '2025-01-18T15:20:00Z', uploadedById: id() }], createdAt: '2024-12-01T00:00:00Z',
  updatedAt: '2025-01-18T15:24:00Z' }

export const sprayerTruckSample: Asset = { id: id(), label: 'Ram 5500 Spray Rig',
  description: 'Dual-tank spray truck configured for mixed ground applications.', serialNumber: 'RAM-5500-RIG-2024-01',
  type: transportTruckTypeId, status: 'maintenance',
  attachments: [{ id: id(), filename: 'sprayer-ram5500-maintenance-log.pdf',
    url: 'https://storage.swarmag.com/assets/ram5500/maintenance-log.pdf', contentType: 'application/pdf',
    uploadedAt: '2024-12-15T00:00:00Z', uploadedById: id() }], createdAt: '2024-11-15T00:00:00Z',
  updatedAt: '2025-01-15T11:00:00Z' }

export const assetSamples: Asset[] = [droneAssetSample, sprayerTruckSample]
