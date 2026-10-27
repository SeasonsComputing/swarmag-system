/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Asset Type manager                                                           ║
║ Composes stock CRUD, draft projections, and confirmed soft deletion.         ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Composes stock CRUD, draft projections, and confirmed soft deletion.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AssetTypeManagerProps  Route workbench inputs.
└ onCancel  Return to the dashboard.
AssetTypeManager  Collection and detail host.
*/

import type { AssetType } from '@domain/abstractions/asset.ts'
import { api } from '@front/api/api.ts'
import { scopes } from '@front/api/scopes.ts'
import { StatusBadge } from '@front/app/shell/status-badge.tsx'
import { useAssetTypes } from '@front/app/stores/asset-types-state.ts'
import type { AbstractionManagerContract } from '@ux/shell/workbench/abstraction-manager-contract.ts'
import { AbstractionManager } from '@ux/shell/workbench/abstraction-manager.tsx'
import type { UiComponent } from '@ux/ui'
import { assetTypeDraft, createAssetTypeState } from './asset-type-state.ts'
import type { AssetTypeDraft } from './asset-type-state.ts'
import { AssetTypeStepDetail } from './asset-type-step-detail.tsx'

import './asset-type-manager.css'

/** Workbench route inputs. */
export type AssetTypeManagerProps = {
  onCancel: () => void
}

/** Compose the Asset Type collection, detail draft, and confirmed soft deletion. */
export const AssetTypeManager = (props: AssetTypeManagerProps): UiComponent => {
  const scope = scopes.AssetTypes.detail
  const catalog = useAssetTypes()
  const provider: AbstractionManagerContract<AssetType, AssetTypeDraft> = {
    formTitle: 'Asset Type Manager',
    entityLabel: 'Asset Type',
    listColumns: [
      { label: 'Asset Type', render: item => <span>{item.label}</span> },
      {
        label: 'Active',
        align: 'center',
        render: item => (
          <StatusBadge
            variant={item.active ? 'success' : 'warning'}
            icon={item.active ? 'check' : 'minus'}
            label={item.active ? 'Active' : 'Inactive'}
          />
        )
      }
    ],
    list: () => [...catalog.records()],
    isListLoading: () => !catalog.ready() && !catalog.failed(),
    listError: catalog.error,
    refresh: catalog.refresh,
    itemLabel: item => item.label,
    create: draft => api.AssetTypes.create(scope.toCreate(draft)),
    update: (item, draft) => api.AssetTypes.update(scope.adapter, scope.toUpdate(item.id, draft)),
    actions: [{
      name: 'delete',
      label: 'Delete',
      icon: 'minus',
      confirmation: {
        title: 'Delete asset type?',
        message: item => `Delete ${item.label}? This removes the asset type from active records.`
      },
      handler: async item => {
        await api.AssetTypes.delete(item.id)
      }
    }],
    detail: item => {
      const state = createAssetTypeState(item)
      return {
        steps: [{
          name: 'detail',
          title: 'Asset Type details',
          render: context => <AssetTypeStepDetail state={state} context={context} />
        }],
        draft: () => assetTypeDraft(state)
      }
    }
  }
  return (
    <div data-app='asset-types-page'>
      <AbstractionManager provider={provider} onCancel={props.onCancel} />
    </div>
  )
}
