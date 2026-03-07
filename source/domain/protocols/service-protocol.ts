/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Service protocol shapes                                                      ║
║ Create and update payloads for service topic abstractions.                   ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines create and update protocol shapes for Service and the
ServiceRequiredAssetType junction (create only; no update).

EXPORTED APIs & TYPEs
───────────────────────────────────────────────────────────────────────────────
ServiceCreate                    Create payload for a Service.
ServiceUpdate                    Update payload for a Service.
ServiceRequiredAssetTypeCreate   Create payload for a ServiceRequiredAssetType junction.
*/

import type { AssociationJunction, CreateFromInstantiable, UpdateFromInstantiable } from '@core-std'
import type { AssetType } from '@domain/abstractions/asset.ts'
import type { Service } from '@domain/abstractions/service.ts'

// ────────────────────────────────────────────────────────────────────────────
// PROTOCOL
// ────────────────────────────────────────────────────────────────────────────

export type ServiceCreate = CreateFromInstantiable<Service>
export type ServiceUpdate = UpdateFromInstantiable<Service>

/** Junction create — no update protocol; junctions are created and hard-deleted only. */
export type ServiceRequiredAssetTypeCreate = {
  serviceId: AssociationJunction<Service>
  assetTypeId: AssociationJunction<AssetType>
}
