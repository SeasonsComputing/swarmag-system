/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Service draft state                                                          ║
║ Holds owned Service fields and required asset type membership.               ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Opens isolated drafts with membership already present before the host snapshots
its baseline. The Service scope projects only Service fields, not the junction.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
ServiceRecord                                A Service loaded with its required asset type ids.
└ requiredAssetTypes                         Stored membership.
ServiceDraft                                 Scoped fields plus editable membership.
├ category                                   Unchosen until selected for a new Service.
└ requiredAssetTypes                         Draft membership.
ServiceState                                 Reactive fields and setters.
├ storedAssetTypes                           Original membership retained throughout the edit.
├ name, setName                              Read and edit name.
├ sku, setSku                                Read and edit SKU.
├ description, setDescription                Read and edit description.
├ category, setCategory                      Read and edit category.
├ notes, setNotes                            Read and edit notes.
└ requiredAssetTypes, setRequiredAssetTypes  Read and edit membership.
serviceDraft                                 Project normalized fields and isolated membership.
createServiceState                           Open one isolated editor draft.
*/

import { StringSet, toTrimmed } from '@core/std'
import type { Id } from '@core/std'
import type { DraftOf } from '@core/stdx'
import type { Note } from '@domain/abstractions/common.ts'
import type { Service, ServiceCategory } from '@domain/abstractions/service.ts'
import type { scopes } from '@front/api/scopes.ts'
import { createSignal } from '@solid-js'
import type { Accessor, Setter } from '@solid-js'
import { copyDraft } from '@ux/shell/workbench/workbench-draft.ts'
import { UiText } from '@ux/ui/components/ui-helpers.ts'

/** A Service with complete membership loaded before its editor opens. */
export type ServiceRecord = Service & { requiredAssetTypes: Id[] }

/** Owned Service fields and the separately persisted junction membership. */
export type ServiceDraft = Omit<DraftOf<typeof scopes.Services.detail>, 'category'> & {
  category: ServiceCategory | undefined
  requiredAssetTypes: Id[]
}

/** Reactive state for one editor session. */
export type ServiceState = {
  readonly storedAssetTypes: readonly Id[]
  name: Accessor<string>
  setName: Setter<string>
  sku: Accessor<string>
  setSku: Setter<string>
  description: Accessor<string>
  setDescription: Setter<string>
  category: Accessor<ServiceCategory | undefined>
  setCategory: Setter<ServiceCategory | undefined>
  notes: Accessor<readonly Note[]>
  setNotes: (value: readonly Note[]) => void
  requiredAssetTypes: Accessor<Id[]>
  setRequiredAssetTypes: (value: readonly Id[]) => void
}

/** Project trimmed fields, copied notes, and canonical set membership. */
export const serviceDraft = (state: ServiceState): ServiceDraft =>
  copyDraft({
    name: toTrimmed(state.name()),
    sku: toTrimmed(state.sku()),
    description: UiText.optional(toTrimmed(state.description())),
    category: state.category(),
    notes: state.notes(),
    requiredAssetTypes: [...new StringSet(state.requiredAssetTypes())].sort()
  })

/** Open an isolated draft with original membership available synchronously. */
export const createServiceState = (record: ServiceRecord | null = null): ServiceState => {
  const [name, setName] = createSignal(record?.name ?? '')
  const [sku, setSku] = createSignal(record?.sku ?? '')
  const [description, setDescription] = createSignal(record?.description ?? '')
  const [category, setCategory] = createSignal<ServiceCategory | undefined>(record?.category)
  const [notes, setNotes] = createSignal<readonly Note[]>(copyDraft(record?.notes ?? []))
  const storedAssetTypes = copyDraft(record?.requiredAssetTypes ?? [])
  const [requiredAssetTypes, setRequiredAssetTypes] = createSignal<Id[]>(copyDraft(storedAssetTypes))
  return {
    storedAssetTypes,
    name,
    setName,
    sku,
    setSku,
    description,
    setDescription,
    category,
    setCategory,
    notes,
    setNotes: value => setNotes(copyDraft(value)),
    requiredAssetTypes,
    setRequiredAssetTypes: value => setRequiredAssetTypes(copyDraft([...value]))
  }
}
