/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Service protocol types                                                       ║
║ Boundary payload contracts for service topic abstractions.                   ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines create and update protocol payload shapes for service abstractions.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
ServiceCreate                   Create payload for Service.
ServiceUpdate                   Update payload for Service.
ServiceRequiredAssetTypeCreate  Create payload for required asset junction.
*/

import type { CreateFromInstantiable, UpdateFromInstantiable } from '@core/std'
import type { Service, ServiceRequiredAssetType } from '@domain/abstractions/service.ts'

/* Service protocol */
export type ServiceCreate = CreateFromInstantiable<Service>
export type ServiceUpdate = UpdateFromInstantiable<Service>

/* ServiceRequiredAssetType protocol*/
export type ServiceRequiredAssetTypeCreate = ServiceRequiredAssetType
