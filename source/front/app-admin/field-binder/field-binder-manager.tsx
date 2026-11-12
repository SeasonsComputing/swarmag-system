/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Field Binder Manager                                                         ║
║ Stock Manager over the remote Binder source and existing upload pair.        ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Edits source inventory metadata and chosen files independently of the local
reader. Uses the stock non-domain Manager, one Detail Step, and ordinary source
publication. Save does not prepare the reader. Cleanup problems remain visible
without turning a confirmed publication into an apparently failed Save.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
FieldBinderManagerProps  Workbench route props.
└ onCancel             Close the workbench.
FieldBinderManager       Remote-source collection and metadata editor.
*/

import { ApiError } from '@core/stdx'
import { api } from '@front/api/api.ts'
import { FieldBinderMetadata } from '@front/api/field-binder-inventory.ts'
import type { FieldBinderEntry } from '@front/api/field-binder-inventory.ts'
import { createEffect, onCleanup } from '@solid-js'
import { createQuery } from '@tanstack/solid-query'
import { PanelRowIdentity } from '@ux/shell/panel/panel-row-identity.tsx'
import type { ManagerContract } from '@ux/shell/workbench/manager-contract.ts'
import { Manager } from '@ux/shell/workbench/manager.tsx'
import type { UiComponent } from '@ux/ui'
import { createFieldBinderState } from './field-binder-state.ts'
import type { FieldBinderDraft, FieldBinderState } from './field-binder-state.ts'
import { FieldBinderStepDetail } from './field-binder-step-detail.tsx'

/** The one report key for this Manager's source failures. */
const SOURCE_FAILURE_KEY = 'field-binder-source-feedback'

/** Workbench route input, independent of the local reader. */
export type FieldBinderManagerProps = { onCancel: () => void }

/** Source changes use the existing Uploads pair and ordinary immutable inventory publication. */
export const FieldBinderManager = (props: FieldBinderManagerProps): UiComponent => {
  const source = api.FieldBinderSource
  const query = createQuery(() => ({
    queryKey: ['field-binder-source'],
    queryFn: async () => await source.read() ?? null
  }))
  let editor: FieldBinderState
  createEffect(() => {
    const error = source.warning()
    if (error) reportSourceFailure('Field Binder source', error)
    else api.BackgroundTasks.clear(SOURCE_FAILURE_KEY)
  })
  const provider: ManagerContract<FieldBinderEntry, FieldBinderDraft> = {
    formTitle: 'Field Binder Manager',
    entityLabel: 'document',
    itemLabel: entry => entry.description,
    listColumns: [{
      label: 'Document',
      render: entry => (
        <PanelRowIdentity
          title={entry.description}
          subtitle={entry.url ? new URL(entry.url).host : 'Uploaded'}
        />
      )
    }],
    list: () => [...(query.data?.inventory.entries ?? [])],
    isListLoading: () => query.isPending,
    listError: () => query.error,
    refresh: async () => {
      await query.refetch()
    },
    create: draft => editor.save(draft),
    update: (_entry, draft) => editor.save(draft),
    actions: [{
      name: 'open',
      label: 'Open source',
      icon: 'external-link',
      handler: async entry => {
        const viewer = globalThis.open('', '_blank')
        if (!viewer) {
          reportSourceFailure('Open Binder source', 'Allow a new browser tab to open this document.')
          return
        }
        viewer.opener = null
        try {
          const link = await source.link(entry)
          viewer.location.href = link.url
        } catch (error) {
          viewer.close()
          reportSourceFailure(
            'Open Binder source',
            error instanceof Error ? error.message : 'Unable to open the document.'
          )
          if (!(error instanceof ApiError)) {
            queueMicrotask(() => {
              throw error
            })
          }
        }
      }
    }, {
      name: 'remove',
      label: 'Remove',
      icon: 'minus',
      confirmation: {
        title: 'Remove Binder document?',
        message: entry =>
          `Remove ${entry.description} from the source collection? Local copies change after Sync.`
      },
      handler: async entry => {
        await source.remove(
          entry.id,
          query.data ? FieldBinderMetadata.address(query.data.document.id) : undefined
        )
      }
    }],
    detail: item => {
      const state = createFieldBinderState(
        source,
        item,
        query.data ? FieldBinderMetadata.address(query.data.document.id) : undefined
      )
      editor = state
      onCleanup(() => {
        void state.discard().catch(error =>
          reportSourceFailure(
            'Binder file cleanup',
            error instanceof Error ? error.message : 'Unable to discard the staged file.'
          )
        )
      })
      return {
        steps: [{
          name: 'detail',
          title: 'Document details',
          render: context => <FieldBinderStepDetail state={state} context={context} />
        }],
        draft: state.draft
      }
    }
  }
  return <Manager provider={provider} onCancel={props.onCancel} />
}

/** Publish a non-blocking failed report for a source operation. */
const reportSourceFailure = (label: string, error: string): void => {
  api.BackgroundTasks.publish(SOURCE_FAILURE_KEY, { label, phase: 'failed', blocksExit: false, error })
}
