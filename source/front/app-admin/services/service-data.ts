/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Service editor data                                                          ║
║ Loads complete memberships and resolves original asset type references.      ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Loads manager records with complete junction membership before opening drafts.
Resolves original partners independently of the editable selection and combines
them with active choices in label order. Failed reads propagate to the caller.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
loadServices              Read Services with their complete required asset type ids.
resolveServiceAssetTypes  Resolve every original partner from catalog or get.
serviceAssetTypeOptions   Active choices plus original partners, sorted by label.
serviceAssetTypeLabels    Sorted, comma-separated labels for one Service.
createServiceSave         Build one editor's aggregate save delegate.
*/

import { notValid } from '@core/std'
import type { Id } from '@core/std'
import { listAll } from '@core/stdx'
import type { DraftOf } from '@core/stdx'
import type { AssetType } from '@domain/abstractions/asset.ts'
import { api } from '@front/api/api.ts'
import { scopes } from '@front/api/scopes.ts'
import { makeAggregateSave } from '@ux/shell/workbench/workbench-save.ts'
import type { AggregateSave } from '@ux/shell/workbench/workbench-save.ts'
import type { UiOption } from '@ux/ui'
import type { ServiceDraft, ServiceRecord } from './service-state.ts'

/** Build the save delegate when a Service editor session opens. */
export const createServiceSave = (): AggregateSave<ServiceRecord, ServiceDraft> => {
  const scope = scopes.Services.detail
  return makeAggregateSave<ServiceRecord, ServiceDraft>({
    create: async draft => ({
      ...await api.Services.create(scope.toCreate(readServiceFields(draft))),
      requiredAssetTypes: [...draft.requiredAssetTypes]
    }),
    update: async (record, draft) => ({
      ...await api.Services.update(scope.adapter, scope.toUpdate(record.id, readServiceFields(draft))),
      requiredAssetTypes: [...draft.requiredAssetTypes]
    }),
    complete: (record, draft) =>
      api.ServiceRequiredAssetTypes.replace(record.id, draft.requiredAssetTypes)
  })
}

/** Load complete memberships before exposing records to the manager. */
export const loadServices = async (): Promise<ServiceRecord[]> => {
  const services = await Array.fromAsync(listAll(api.Services))
  const memberships = await api.ServiceRequiredAssetTypes.partnersOf(services.map(service => service.id))
  return services.map(service => ({
    ...service,
    requiredAssetTypes: [...memberships.get(service.id)!]
  }))
}

/** Resolve original partners, including soft-deleted targets absent from the catalog. */
export const resolveServiceAssetTypes = (
  stored: readonly Id[],
  catalog: readonly AssetType[]
): Promise<AssetType[]> =>
  Promise.all(
    stored.map(partner => catalog.find(type => type.id === partner) ?? api.AssetTypes.get(partner))
  )

/** Keep original partners available independently of current selection. */
export const serviceAssetTypeOptions = (
  catalog: readonly AssetType[],
  stored: readonly AssetType[]
): UiOption[] => {
  const types = catalog.filter(type => type.active && type.deletedAt === undefined)
  for (const original of stored) {
    if (!types.some(type => type.id === original.id)) types.push(original)
  }
  return types.sort((a, b) => a.label.localeCompare(b.label, 'en-US') || a.id.localeCompare(b.id))
    .map(type => ({
      value: type.id,
      label: serviceAssetTypeLabel(type)
    }))
}

/** Resolve complete membership to a stable, label-sorted line. */
export const serviceAssetTypeLabels = (
  partners: readonly Id[],
  types: readonly AssetType[]
): string =>
  partners.map(partner => types.find(type => type.id === partner)!)
    .sort((a, b) => a.label.localeCompare(b.label, 'en-US') || a.id.localeCompare(b.id))
    .map(serviceAssetTypeLabel).join(', ')

/** Use the same availability indication in the list and membership picker. */
const serviceAssetTypeLabel = (type: AssetType): string => {
  if (type.deletedAt !== undefined) return `${type.label} (deleted)`
  return type.active ? type.label : `${type.label} (inactive)`
}

// A draft may be incomplete while opening; the persisted Service requires a chosen category.
const readServiceFields = (draft: ServiceDraft): DraftOf<typeof scopes.Services.detail> => {
  const category = draft.category
  if (category === undefined) return notValid('Select a category.')
  return { ...draft, category }
}
