/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Asset draft state                                                            ║
║ Holds transient form fields and projects the owned draft.                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Holds transient form fields and projects the owned draft.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AssetDraft  Fields owned by the Asset form.
assetDraft  Project normalized form state.
AssetState  Reactive draft fields and setters.
├ storedType  Unchanged type reference for resolution.
├ type, setType  Read and edit type.
├ label, setLabel  Read and edit label.
├ description, setDescription  Read and edit description.
├ serialNumber, setSerialNumber  Read and edit serialNumber.
├ status, setStatus  Read and edit status.
└ notes, setNotes  Read and edit notes.
createAssetState  Open an isolated draft.
*/

import { toTrimmed } from '@core/std'
import type { Id } from '@core/std'
import type { DraftOf } from '@core/stdx'
import type { Asset, AssetStatus } from '@domain/abstractions/asset.ts'
import type { Note } from '@domain/abstractions/common.ts'
import type { scopes } from '@front/api/scopes.ts'
import { createSignal } from '@solid-js'
import type { Accessor, Setter } from '@solid-js'
import { copyDraft } from '@ux/shell/workbench/workbench-draft.ts'
import { UiText } from '@ux/ui/components/ui-helpers.ts'

/** Fields owned by the Asset form. */
export type AssetDraft = DraftOf<typeof scopes.Assets.detail>

/** Reactive state for one Asset draft. */
export type AssetState = {
  readonly storedType: Id | undefined
  type: Accessor<Id>
  setType: Setter<Id>
  label: Accessor<string>
  setLabel: Setter<string>
  description: Accessor<string>
  setDescription: Setter<string>
  serialNumber: Accessor<string>
  setSerialNumber: Setter<string>
  status: Accessor<AssetStatus>
  setStatus: Setter<AssetStatus>
  notes: Accessor<readonly Note[]>
  setNotes: (value: readonly Note[]) => void
}

/** Project trimmed fields and isolated notes. */
export const assetDraft = (state: AssetState): AssetDraft => {
  return copyDraft({
    type: state.type(),
    label: toTrimmed(state.label()),
    description: UiText.optional(toTrimmed(state.description())),
    serialNumber: UiText.optional(toTrimmed(state.serialNumber())),
    status: state.status(),
    notes: state.notes()
  })
}

/** Open a draft without sharing structured values with its source. */
export const createAssetState = (record: Asset | null = null): AssetState => {
  const [type, setType] = createSignal<Id>(record?.type ?? '')
  const [label, setLabel] = createSignal<string>(record?.label ?? '')
  const [description, setDescription] = createSignal<string>(record?.description ?? '')
  const [serialNumber, setSerialNumber] = createSignal<string>(record?.serialNumber ?? '')
  const [status, setStatus] = createSignal<AssetStatus>(record?.status ?? 'active')
  const [notes, setNotes] = createSignal<readonly Note[]>(copyDraft(record?.notes ?? []))
  return {
    storedType: record?.type,
    type,
    setType,
    label,
    setLabel,
    description,
    setDescription,
    serialNumber,
    setSerialNumber,
    status,
    setStatus,
    notes,
    setNotes: value => setNotes(copyDraft(value))
  }
}
