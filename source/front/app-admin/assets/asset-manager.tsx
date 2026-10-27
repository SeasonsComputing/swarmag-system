/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Asset manager                                                                ║
║ Composes stock CRUD, draft projections, and confirmed soft deletion.         ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Composes stock CRUD, draft projections, and confirmed soft deletion.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
ASSETS_QUERY_KEY  Collection query key.
AssetManagerProps  Route workbench inputs.
└ onCancel  Return to the dashboard.
AssetManager  Collection and detail host.
*/

import { listAll } from '@core/stdx'
import type { Asset, AssetStatus } from '@domain/abstractions/asset.ts'
import { api } from '@front/api/api.ts'
import { scopes } from '@front/api/scopes.ts'
import { StatusBadge } from '@front/app/shell/status-badge.tsx'
import { createQuery } from '@tanstack/solid-query'
import type { AbstractionManagerContract } from '@ux/shell/workbench/abstraction-manager-contract.ts'
import { AbstractionManager } from '@ux/shell/workbench/abstraction-manager.tsx'
import { UiText } from '@ux/ui'
import type { UiBadgeVariant, UiComponent } from '@ux/ui'
import { assetDraft, createAssetState } from './asset-state.ts'
import type { AssetDraft } from './asset-state.ts'
import { AssetStepDetail } from './asset-step-detail.tsx'

import './asset-manager.css'

/** Query key for the Asset collection. */
export const ASSETS_QUERY_KEY = ['assets'] as const

/** Workbench route inputs. */
export type AssetManagerProps = {
  onCancel: () => void
}

/** Compose the Asset collection, detail draft, and confirmed soft deletion. */
export const AssetManager = (props: AssetManagerProps): UiComponent => {
  const scope = scopes.Assets.detail
  const query = createQuery(() => ({
    queryKey: ASSETS_QUERY_KEY,
    queryFn: () => Array.fromAsync(listAll(api.Assets))
  }))
  const provider: AbstractionManagerContract<Asset, AssetDraft> = {
    formTitle: 'Asset Manager',
    entityLabel: 'Asset',
    listColumns: [
      { label: 'Asset', render: item => <span>{item.label}</span> },
      {
        label: 'Status',
        align: 'center',
        render: item => (
          <StatusBadge
            variant={AssetStatusBadges[item.status].variant}
            icon={AssetStatusBadges[item.status].icon}
            label={UiText.label(item.status)}
          />
        )
      }
    ],
    list: () => query.data ?? [],
    isListLoading: () => query.isPending,
    listError: () => query.error,
    refresh: async () => {
      await query.refetch()
    },
    itemLabel: item => item.label,
    create: draft => api.Assets.create(scope.toCreate(draft)),
    update: (item, draft) => api.Assets.update(scope.adapter, scope.toUpdate(item.id, draft)),
    actions: [{
      name: 'delete',
      label: 'Delete',
      icon: 'minus',
      confirmation: {
        title: 'Delete asset?',
        message: item => `Delete ${item.label}? This removes the asset from active records.`
      },
      handler: async item => {
        await api.Assets.delete(item.id)
      }
    }],
    detail: item => {
      const state = createAssetState(item)
      return {
        steps: [{
          name: 'detail',
          title: 'Asset details',
          render: context => <AssetStepDetail state={state} context={context} />
        }],
        draft: () => assetDraft(state)
      }
    }
  }
  return (
    <div data-app='assets-page'>
      <AbstractionManager provider={provider} onCancel={props.onCancel} />
    </div>
  )
}

/** Every Asset status has a named tone and glyph. */
const AssetStatusBadges: Record<AssetStatus, { variant: UiBadgeVariant; icon: string }> = {
  active: { variant: 'success', icon: 'check' },
  maintenance: { variant: 'warning', icon: 'gear' },
  retired: { variant: 'info', icon: 'minus' },
  reserved: { variant: 'info', icon: 'clock' }
}
