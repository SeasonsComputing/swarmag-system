/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Asset type picker                                                            ║
║ Active choices with the original stored reference retained.                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Offers active catalog entries and resolves a missing stored type separately.
The stored type remains available after changing the editable selection.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AssetTypePickerProps  Controlled type selection and validation inputs.
├ storedId            Original type, independent of the editable value.
├ value               Editable type; blank until explicitly selected.
├ onChange            Accept a selected type.
└ error               Form validation state.
AssetTypePicker       Required type selection and catalog feedback.
*/

import type { Id } from '@core/std'
import type { AssetType } from '@domain/abstractions/asset.ts'
import { api } from '@front/api/api.ts'
import { ASSET_TYPES_QUERY_KEY, useAssetTypes } from '@front/app/stores/asset-types-state.ts'
import { Show } from '@solid-js'
import { createQuery } from '@tanstack/solid-query'
import { UiAlert, UiLayout, UiSingleSelect } from '@ux/ui'
import type { UiComponent, UiOption } from '@ux/ui'

/** Required assignment, retaining the original stored reference. */
export type AssetTypePickerProps = {
  storedId: Id | undefined
  value: Id
  onChange: (value: Id) => void
  error: boolean
}

/** Offer active types and preserve an inactive or deleted original assignment. */
export const AssetTypePicker = (props: AssetTypePickerProps): UiComponent => {
  const catalog = useAssetTypes()
  const needsStored = (): boolean =>
    props.storedId !== undefined && catalog.ready()
    && !catalog.records().some(type => type.id === props.storedId)
  const stored = createQuery(() => ({
    queryKey: [...ASSET_TYPES_QUERY_KEY, 'stored', props.storedId],
    queryFn: () => api.AssetTypes.get(props.storedId!),
    enabled: needsStored()
  }))
  const options = (): UiOption[] => {
    const types = [...catalog.active()]
    const original = catalog.records().find(type => type.id === props.storedId)
      ?? (needsStored() ? stored.data : undefined)
    if (original && !types.some(type => type.id === original.id)) types.push(original)
    return types.sort((a, b) => a.label.localeCompare(b.label, 'en-US') || a.id.localeCompare(b.id))
      .map(type => ({ value: type.id, label: typeLabel(type) }))
  }
  const failed = (): boolean => catalog.failed() || (needsStored() && stored.isError)
  const loading = (): boolean =>
    !catalog.ready() && !catalog.failed()
    || (needsStored() && stored.isLoading)
  return (
    <UiLayout variant='block-fit'>
      <UiSingleSelect
        name='type'
        options={options()}
        value={props.value}
        onChange={props.onChange}
        placeholder={loading() ? 'Loading asset types…' : 'Select an asset type'}
        loading={loading()}
        disabled={failed()}
        error={props.error || failed()}
      />
      <Show when={failed()}>
        <UiAlert variant='danger'>Unable to load asset types. Reopen the step to retry.</UiAlert>
      </Show>
      <Show when={!loading() && !failed() && options().length === 0}>
        <UiAlert variant='info'>Create an active Asset Type before assigning an Asset.</UiAlert>
      </Show>
    </UiLayout>
  )
}

const typeLabel = (type: AssetType): string => {
  if (type.deletedAt !== undefined) return `${type.label} (deleted)`
  if (!type.active) return `${type.label} (inactive)`
  return type.label
}
