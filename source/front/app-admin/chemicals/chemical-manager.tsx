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
import { StatusBadge } from '@front/app/shell/display/status-badge.tsx'
import { makeAttachmentSave } from '@front/app/shell/notes/make-attachment-save.ts'
import type { AttachmentSave } from '@front/app/shell/notes/make-attachment-save.ts'
import { onCleanup } from '@solid-js'
import { createQuery } from '@tanstack/solid-query'
import { PanelRowIdentity } from '@ux/shell/panel/panel-row-identity.tsx'
import type { AbstractionManagerContract } from '@ux/shell/workbench/abstraction-manager-contract.ts'
import { AbstractionManager } from '@ux/shell/workbench/abstraction-manager.tsx'
import { UiText } from '@ux/ui'
import type { UiBadgeColor, UiComponent } from '@ux/ui'
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
  let save: AttachmentSave<Chemical, ChemicalDraft>
  const provider: AbstractionManagerContract<Chemical, ChemicalDraft> = {
    formTitle: 'Chemical Manager',
    entityLabel: 'Chemical',
    listColumns: [
      {
        label: 'Chemical',
        render: item => (
          <PanelRowIdentity
            pill={
              <StatusBadge
                color={ChemicalSignalColors[item.signalWord]}
                label={UiText.label(item.signalWord)}
              />
            }
            title={item.name}
          />
        )
      },
      { label: 'Usage', render: item => <span>{UiText.label(item.usage)}</span> }
    ],
    list: () => query.data ?? [],
    isListLoading: () => query.isPending,
    listError: () => query.error,
    refresh: async () => {
      await query.refetch()
    },
    itemLabel: item => item.name,
    create: draft => save.create(draft),
    update: (record, draft) => save.update(record, draft),
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
      save = makeAttachmentSave<Chemical, ChemicalDraft>({
        create: draft => api.Chemicals.create(scope.toCreate(draft)),
        update: (item, draft) => api.Chemicals.update(scope.adapter, scope.toUpdate(item.id, draft)),
        address: async (owner, draft) => ({
          ...draft,
          notes: await api.Attachments.Chemicals.address(owner, draft.notes)
        }),
        reconcile: draft => state.setNotes(draft.notes)
      })
      const editorSave = save
      onCleanup(() => {
        void editorSave.discard()
      })
      return {
        steps: [{
          name: 'detail',
          title: 'Chemical details',
          render: context => (
            <ChemicalStepDetail attach={editorSave.stage} state={state} context={context} />
          )
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

/** Every signal word has its hazard color: DANGER red, WARNING orange, CAUTION yellow. */
const ChemicalSignalColors: Record<ChemicalSignalWord, UiBadgeColor> = {
  none: 'gray',
  danger: 'red',
  warning: 'orange',
  caution: 'yellow'
}
