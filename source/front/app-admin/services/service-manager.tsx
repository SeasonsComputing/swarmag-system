/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Service manager                                                              ║
║ Composes Service CRUD and retryable required asset type membership.          ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Loads membership before opening drafts and delegates aggregate saves to one
session-local save delegate. Uses the stock manager host and notes editor.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
SERVICES_QUERY_KEY   Service collection query key.
ServiceManagerProps  Route workbench inputs.
└ onCancel           Return to the dashboard.
ServiceManager       Collection and detail host.
*/

import { StringSet } from '@core/std'
import { api } from '@front/api/api.ts'
import { ASSET_TYPES_QUERY_KEY, useAssetTypes } from '@front/app/stores/asset-types-state.ts'
import { Show } from '@solid-js'
import { createQuery } from '@tanstack/solid-query'
import { PanelRowIdentity } from '@ux/shell/panel/panel-row-identity.tsx'
import type { AbstractionManagerContract } from '@ux/shell/workbench/abstraction-manager-contract.ts'
import { AbstractionManager } from '@ux/shell/workbench/abstraction-manager.tsx'
import type { AggregateSave } from '@ux/shell/workbench/workbench-save.ts'
import { UiText } from '@ux/ui'
import type { UiComponent } from '@ux/ui'
import {
  createServiceSave,
  loadServices,
  resolveServiceAssetTypes,
  serviceAssetTypeLabels
} from './service-data.ts'
import { createServiceState, serviceDraft } from './service-state.ts'
import type { ServiceDraft, ServiceRecord } from './service-state.ts'
import { ServiceStepDetail } from './service-step-detail.tsx'

import './service-manager.css'

/** Query key for the Service collection and its memberships. */
export const SERVICES_QUERY_KEY = ['services'] as const

/** Workbench route inputs. */
export type ServiceManagerProps = {
  onCancel: () => void
}

/** Compose the Service collection, aggregate drafts, and confirmed soft deletion. */
export const ServiceManager = (props: ServiceManagerProps): UiComponent => {
  const query = createQuery(() => ({ queryKey: SERVICES_QUERY_KEY, queryFn: loadServices }))
  const catalog = useAssetTypes()
  const partners = () =>
    [...new StringSet((query.data ?? []).flatMap(service => service.requiredAssetTypes))].sort()
  const references = createQuery(() => ({
    queryKey: [...ASSET_TYPES_QUERY_KEY, 'service-list', partners()],
    queryFn: () => resolveServiceAssetTypes(partners(), catalog.records()),
    enabled: query.isSuccess && catalog.ready() && partners().length > 0
  }))
  const referenceFailure = (): boolean => catalog.failed() || references.isError
  // The host calls detail before either save callback; each detail replaces this delegate.
  let save: AggregateSave<ServiceRecord, ServiceDraft>
  const provider: AbstractionManagerContract<ServiceRecord, ServiceDraft> = {
    formTitle: 'Service Manager',
    entityLabel: 'Service',
    listColumns: [
      {
        label: 'Service',
        render: item => (
          <PanelRowIdentity
            title={item.name}
            subtitle={UiText.label(item.category)}
            annotation={
              <Show when={item.requiredAssetTypes.length > 0} fallback='No required asset types'>
                <Show when={!referenceFailure()} fallback='Unable to load asset types.'>
                  <Show when={references.isSuccess} fallback='Loading asset types…'>
                    {serviceAssetTypeLabels(item.requiredAssetTypes, references.data!)}
                  </Show>
                </Show>
              </Show>
            }
          />
        )
      },
      { label: 'SKU', align: 'end', render: item => <span>{item.sku}</span> }
    ],
    list: () => query.data ?? [],
    isListLoading: () => query.isPending,
    listError: () => query.error,
    refresh: async () => {
      await query.refetch()
    },
    itemLabel: item => item.name,
    create: draft => save.create(draft),
    update: (item, draft) => save.update(item, draft),
    actions: [{
      name: 'delete',
      label: 'Delete',
      icon: 'minus',
      confirmation: {
        title: 'Delete service?',
        message: item => `Delete ${item.name}? This removes the service from active records.`
      },
      handler: async item => {
        await api.Services.delete(item.id)
      }
    }],
    detail: item => {
      const state = createServiceState(item)
      save = createServiceSave()
      return {
        steps: [{
          name: 'detail',
          title: 'Service details',
          render: context => <ServiceStepDetail state={state} context={context} />
        }],
        draft: () => serviceDraft(state)
      }
    }
  }
  return (
    <div data-app='services-page'>
      <AbstractionManager provider={provider} onCancel={props.onCancel} />
    </div>
  )
}
