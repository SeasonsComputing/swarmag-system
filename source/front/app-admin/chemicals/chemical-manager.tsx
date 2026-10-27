/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Chemical manager                                                             ║
║ Composes stock CRUD, draft projections, and confirmed soft deletion.         ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Composes stock CRUD, draft projections, and confirmed soft deletion.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
CHEMICALS_QUERY_KEY  Collection query key.
ChemicalManagerProps  Route workbench inputs.
└ onCancel  Return to the dashboard.
ChemicalManager  Collection and detail host.
*/

import { listAll } from '@core/stdx'
import type { Chemical, ChemicalSignalWord } from '@domain/abstractions/chemical.ts'
import { api } from '@front/api/api.ts'
import { scopes } from '@front/api/scopes.ts'
import { StatusBadge } from '@front/app/shell/status-badge.tsx'
import { createQuery } from '@tanstack/solid-query'
import type { AbstractionManagerContract } from '@ux/shell/workbench/abstraction-manager-contract.ts'
import { AbstractionManager } from '@ux/shell/workbench/abstraction-manager.tsx'
import { UiText } from '@ux/ui'
import type { UiBadgeVariant, UiComponent } from '@ux/ui'
import { chemicalDraft, createChemicalState } from './chemical-state.ts'
import type { ChemicalDraft } from './chemical-state.ts'
import { ChemicalStepDetail } from './chemical-step-detail.tsx'

import './chemical-manager.css'

/** Query key for the Chemical collection. */
export const CHEMICALS_QUERY_KEY = ['chemicals'] as const

/** Workbench route inputs. */
export type ChemicalManagerProps = {
  onCancel: () => void
}

/** Compose the Chemical collection, detail draft, and confirmed soft deletion. */
export const ChemicalManager = (props: ChemicalManagerProps): UiComponent => {
  const scope = scopes.Chemicals.detail
  const query = createQuery(() => ({
    queryKey: CHEMICALS_QUERY_KEY,
    queryFn: () => Array.fromAsync(listAll(api.Chemicals))
  }))
  const provider: AbstractionManagerContract<Chemical, ChemicalDraft> = {
    formTitle: 'Chemical Manager',
    entityLabel: 'Chemical',
    listColumns: [
      { label: 'Chemical', render: item => <span>{item.name}</span> },
      { label: 'Usage', render: item => <span>{UiText.label(item.usage)}</span> },
      {
        label: 'Signal word',
        align: 'center',
        render: item => (
          <StatusBadge
            variant={ChemicalSignalBadges[item.signalWord].variant}
            icon={ChemicalSignalBadges[item.signalWord].icon}
            label={UiText.label(item.signalWord)}
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
    itemLabel: item => item.name,
    create: draft => api.Chemicals.create(scope.toCreate(draft)),
    update: (item, draft) => api.Chemicals.update(scope.adapter, scope.toUpdate(item.id, draft)),
    actions: [{
      name: 'delete',
      label: 'Delete',
      icon: 'minus',
      confirmation: {
        title: 'Delete chemical?',
        message: item => `Delete ${item.name}? This removes the chemical from active records.`
      },
      handler: async item => {
        await api.Chemicals.delete(item.id)
      }
    }],
    detail: item => {
      const state = createChemicalState(item)
      return {
        steps: [{
          name: 'detail',
          title: 'Chemical details',
          render: context => <ChemicalStepDetail state={state} context={context} />
        }],
        draft: () => chemicalDraft(state)
      }
    }
  }
  return (
    <div data-app='chemicals-page'>
      <AbstractionManager provider={provider} onCancel={props.onCancel} />
    </div>
  )
}

/** Signal word presentations cover the complete domain vocabulary. */
const ChemicalSignalBadges: Record<ChemicalSignalWord, { variant: UiBadgeVariant; icon: string }> = {
  none: { variant: 'info', icon: 'minus' },
  danger: { variant: 'danger', icon: 'exclamation-triangle' },
  warning: { variant: 'warning', icon: 'exclamation-triangle' },
  caution: { variant: 'warning', icon: 'exclamation-triangle' }
}
