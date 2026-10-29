/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Service required asset types                                                 ║
║ Inline membership selection with original references retained.               ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Offers active asset types and all originally stored partners, resolving deleted
partners separately. Options do not depend on the current editable selection.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
ServiceAssetTypesProps  Membership selection inputs.
├ stored                Original partner ids.
├ value                 Current selection.
└ onChange              Accept the next selection.
ServiceAssetTypes       Inline membership control and catalog feedback.
*/

import type { Id } from '@core/std'
import { ASSET_TYPES_QUERY_KEY, useAssetTypes } from '@front/app/stores/asset-types-state.ts'
import { Show } from '@solid-js'
import { createQuery } from '@tanstack/solid-query'
import { UiAlert, UiLayout, UiMultiSelect } from '@ux/ui'
import type { UiComponent } from '@ux/ui'
import { resolveServiceAssetTypes, serviceAssetTypeOptions } from './service-data.ts'

/** Controlled membership and the independent original partners. */
export type ServiceAssetTypesProps = {
  stored: readonly Id[]
  value: Id[]
  onChange: (value: Id[]) => void
}

/** Resolve original references and offer stable, label-sorted choices. */
export const ServiceAssetTypes = (props: ServiceAssetTypesProps): UiComponent => {
  const catalog = useAssetTypes()
  const stored = createQuery(() => ({
    queryKey: [...ASSET_TYPES_QUERY_KEY, 'service-stored', props.stored],
    queryFn: () => resolveServiceAssetTypes(props.stored, catalog.records()),
    enabled: catalog.ready()
  }))
  const failed = (): boolean => catalog.failed() || stored.isError
  const loading = (): boolean => !failed() && (!catalog.ready() || stored.isPending)
  const options = () => serviceAssetTypeOptions(catalog.records(), stored.data ?? [])
  return (
    <UiLayout>
      <UiMultiSelect
        name='requiredAssetTypes'
        value={props.value}
        onChange={props.onChange}
        options={options()}
        loading={loading()}
        disabled={failed()}
        error={failed()}
      />
      <Show when={failed()}>
        <UiAlert variant='danger'>Unable to load asset types. Reopen the step to retry.</UiAlert>
      </Show>
      <Show when={!loading() && !failed() && options().length === 0}>
        <UiAlert variant='info'>No active Asset Types are available.</UiAlert>
      </Show>
    </UiLayout>
  )
}
