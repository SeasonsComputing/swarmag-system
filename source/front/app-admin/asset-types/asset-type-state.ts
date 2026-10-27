/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ AssetType draft state                                                        ║
║ Holds transient form fields and projects the owned draft.                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Holds transient form fields and projects the owned draft.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AssetTypeDraft  Fields owned by the AssetType form.
assetTypeDraft  Project normalized form state.
AssetTypeState  Reactive draft fields and setters.
├ label, setLabel  Read and edit label.
└ active, setActive  Read and edit active.
createAssetTypeState  Open an isolated draft.
*/

import { toTrimmed } from '@core/std'
import type { DraftOf } from '@core/stdx'
import type { AssetType } from '@domain/abstractions/asset.ts'
import type { scopes } from '@front/api/scopes.ts'
import { createSignal } from '@solid-js'
import type { Accessor, Setter } from '@solid-js'

/** Fields owned by the AssetType form. */
export type AssetTypeDraft = DraftOf<typeof scopes.AssetTypes.detail>

/** Reactive state for one AssetType draft. */
export type AssetTypeState = {
  label: Accessor<string>
  setLabel: Setter<string>
  active: Accessor<boolean>
  setActive: Setter<boolean>
}

/** Project trimmed fields. */
export const assetTypeDraft = (state: AssetTypeState): AssetTypeDraft => {
  return {
    label: toTrimmed(state.label()),
    active: state.active()
  }
}

/** Open a draft without sharing structured values with its source. */
export const createAssetTypeState = (record: AssetType | null = null): AssetTypeState => {
  const [label, setLabel] = createSignal<string>(record?.label ?? '')
  const [active, setActive] = createSignal<boolean>(record?.active ?? true)
  return {
    label,
    setLabel,
    active,
    setActive
  }
}
