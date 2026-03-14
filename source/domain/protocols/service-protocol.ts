/*
╔═════════════════════════════════════════════════════════════════════════════╗
║ Service protocol contracts                                                  ║
║ Create and update payload contracts for service abstractions                ║
╚═════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines boundary payload contracts for service persisted abstractions.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
ServiceCreate                      Create payload contract for Service.
ServiceUpdate                      Update payload contract for Service.
ServiceRequiredAssetTypeCreate     Create payload contract for service junction.
*/

import type { CreateFromInstantiable, UpdateFromInstantiable } from '@core/std'
import type { Service, ServiceRequiredAssetType } from '@domain/abstractions/service.ts'

/** Create payload contract for Service. */
export type ServiceCreate = CreateFromInstantiable<Service>

/** Update payload contract for Service. */
export type ServiceUpdate = UpdateFromInstantiable<Service>

/** Create payload contract for ServiceRequiredAssetType. */
export type ServiceRequiredAssetTypeCreate = ServiceRequiredAssetType
