/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Asset fixtures                                                               ║
║ Shared asset types and assets for domain contract tests.                     ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Asset fixture samples for tests.

Shared asset types and assets for domain contract tests.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AssetSamples  Shared fixture samples.
├ types                   Asset type catalog.
├ drone                   Active dispensing drone.
│ ├ Instantiable           Inherited Instantiable fields.
│ ├ type                   Asset type reference.
│ ├ notes                  Note collection.
│ ├ label                  Display label.
│ ├ description            Optional descriptive text.
│ ├ serialNumber           Optional equipment serial number.
│ └ status                 Lifecycle status.
├ sprayerTruck            Spray truck awaiting maintenance.
│ ├ Instantiable           Inherited Instantiable fields.
│ ├ type                   Asset type reference.
│ ├ notes                  Note collection.
│ ├ label                  Display label.
│ ├ description            Optional descriptive text.
│ ├ serialNumber           Optional equipment serial number.
│ └ status                 Lifecycle status.
└ all                     All asset records.
*/

import { id, toWhen } from '@core/std'
import type { Asset, AssetType } from '@domain/abstractions/asset.ts'

const TRANSPORT_TRUCK_TYPE_ID = id()
const SKIDSTEER_TYPE_ID = id()
const TOOLCAT_TYPE_ID = id()
const VEHICLE_ATTACHMENT_TYPE_ID = id()
const MAPPING_DRONE_TYPE_ID = id()
const DISPENSING_DRONE_TYPE_ID = id()
const SPRAY_TANK_TYPE_ID = id()
const GRANULAR_HOPPER_TYPE_ID = id()

const ASSET_TYPES: AssetType[] = [{
  id: TRANSPORT_TRUCK_TYPE_ID,
  label: 'Transport Truck',
  active: true,
  createdAt: toWhen('2024-11-01T00:00:00Z'),
  updatedAt: toWhen('2025-01-01T00:00:00Z')
}, {
  id: SKIDSTEER_TYPE_ID,
  label: 'Skidsteer Vehicle',
  active: true,
  createdAt: toWhen('2024-11-01T00:00:00Z'),
  updatedAt: toWhen('2025-01-01T00:00:00Z')
}, {
  id: TOOLCAT_TYPE_ID,
  label: 'Toolcat Vehicle',
  active: true,
  createdAt: toWhen('2024-11-01T00:00:00Z'),
  updatedAt: toWhen('2025-01-01T00:00:00Z')
}, {
  id: VEHICLE_ATTACHMENT_TYPE_ID,
  label: 'Vehicle Tool Attachment',
  active: true,
  createdAt: toWhen('2024-11-01T00:00:00Z'),
  updatedAt: toWhen('2025-01-01T00:00:00Z')
}, {
  id: MAPPING_DRONE_TYPE_ID,
  label: 'Mapping Drone',
  active: true,
  createdAt: toWhen('2024-11-01T00:00:00Z'),
  updatedAt: toWhen('2025-01-01T00:00:00Z')
}, {
  id: DISPENSING_DRONE_TYPE_ID,
  label: 'Dispensing Drone',
  active: true,
  createdAt: toWhen('2024-11-01T00:00:00Z'),
  updatedAt: toWhen('2025-01-01T00:00:00Z')
}, {
  id: SPRAY_TANK_TYPE_ID,
  label: 'Drone Spray Tank',
  active: true,
  createdAt: toWhen('2024-11-01T00:00:00Z'),
  updatedAt: toWhen('2025-01-01T00:00:00Z')
}, {
  id: GRANULAR_HOPPER_TYPE_ID,
  label: 'Drone Granular Hopper',
  active: true,
  createdAt: toWhen('2024-11-01T00:00:00Z'),
  updatedAt: toWhen('2025-01-01T00:00:00Z')
}]

const Drone: Asset = {
  id: id(),
  label: 'DJI Agras T40 #3',
  description: 'High-capacity agricultural drone optimized for large acreage spraying.',
  serialNumber: 'DJI-T40-0003',
  type: DISPENSING_DRONE_TYPE_ID,
  status: 'active',
  notes: [],
  createdAt: toWhen('2024-12-01T00:00:00Z'),
  updatedAt: toWhen('2025-01-18T15:24:00Z')
}

const SprayerTruck: Asset = {
  id: id(),
  label: 'Ram 5500 Spray Rig',
  description: 'Dual-tank spray truck configured for mixed ground applications.',
  serialNumber: 'RAM-5500-RIG-2024-01',
  type: TRANSPORT_TRUCK_TYPE_ID,
  status: 'maintenance',
  notes: [],
  createdAt: toWhen('2024-11-15T00:00:00Z'),
  updatedAt: toWhen('2025-01-15T11:00:00Z')
}

const ALL: Asset[] = [Drone, SprayerTruck]

/** Shared fixture samples. */
export const AssetSamples = {
  types: ASSET_TYPES,
  drone: Drone,
  sprayerTruck: SprayerTruck,
  all: ALL
}
