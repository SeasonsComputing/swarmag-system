/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Field Binder Manager                                                         ║
║ Stock Manager over the remote Binder source and existing upload pair.        ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Edits the source collection independently of the local reader. Uses the stock
non-domain Manager, one Detail Step, and ordinary source publication. Save
does not prepare the reader. A row reads its entry's server document: its name,
or Pending, dimmed, until the document is delivered. Rows re-read when the
Binder drain's remaining count changes; there is no polling. Cleanup problems
remain visible without turning a confirmed publication into a failed Save.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
FieldBinderManagerProps  Workbench route props.
└ onCancel             Close the workbench.
FieldBinderManager       Remote-source collection and metadata editor.
*/

import { ApiError } from '@core/stdx'
import { api } from '@front/api/api.ts'
import { FieldBinderMetadata } from '@front/api/field-binder-inventory.ts'
import type { FieldBinderEntry, FieldBinderUploadSource } from '@front/api/field-binder-inventory.ts'
import { createEffect, createMemo, on, onCleanup } from '@solid-js'
import { createQuery } from '@tanstack/solid-query'
import { PanelRowIdentity } from '@ux/shell/panel/panel-row-identity.tsx'
import type { ManagerContract } from '@ux/shell/workbench/manager-contract.ts'
import { Manager } from '@ux/shell/workbench/manager.tsx'
import { UiBadge, UiWindow } from '@ux/ui'
import type { UiComponent } from '@ux/ui'
import { DocumentDrain } from '../document-drain.ts'
import { createFieldBinderState } from './field-binder-state.ts'
import type { FieldBinderDraft, FieldBinderState } from './field-binder-state.ts'
import { FieldBinderStepDetail } from './field-binder-step-detail.tsx'
import './field-binder-manager.css'

/** The one report key for this Manager's source failures. */
const SOURCE_FAILURE_KEY = 'field-binder-source-feedback'

/** Shown when the browser refuses a secondary window; an expected failure, not a defect. */
const BLOCKED_WINDOW = 'Allow a new browser tab to open this document.'

/** Workbench route input, independent of the local reader. */
export type FieldBinderManagerProps = { onCancel: () => void }

/** Source changes use the existing Uploads pair and ordinary immutable inventory publication. */
export const FieldBinderManager = (props: FieldBinderManagerProps): UiComponent => {
  const source = api.FieldBinderSource
  const query = createQuery(() => ({
    queryKey: ['field-binder-source'],
    queryFn: async () => await source.publication() ?? null
  }))
  const documents = createQuery(() => ({
    queryKey: ['field-binder-source', 'documents', query.data?.document.id.document ?? null],
    queryFn: async () => {
      const entries = query.data?.inventory.entries ?? []
      return new Map(
        await Promise.all(entries.map(async entry => [entry.id, await source.document(entry)] as const))
      )
    }
  }))
  // Delivery shows when the Binder drain's remaining count changes; a running pass is no change,
  // and there is no polling.
  const remaining = createMemo<number | undefined>(previous => {
    const task = api.BackgroundTasks.store[DocumentDrain.taskKeys.binder]
    if (task?.phase === 'running') return previous
    return task?.remaining?.count ?? 0
  }, undefined)
  createEffect(on(remaining, () => void documents.refetch(), { defer: true }))
  const documentOf = (entry: FieldBinderEntry) => documents.data?.get(entry.id)
  let editor: FieldBinderState
  createEffect(() => {
    const error = source.warning()
    if (error) reportSourceFailure('Field Binder source', error)
    else api.BackgroundTasks.clear(SOURCE_FAILURE_KEY)
  })
  const provider: ManagerContract<FieldBinderEntry, FieldBinderDraft> = {
    formTitle: 'Field Binder Manager',
    entityLabel: 'Document',
    itemLabel: entry => entry.description,
    listColumns: [{
      label: 'Document',
      render: entry => (
        <span data-app='field-binder-row' data-app-pending={documentOf(entry) ? undefined : ''}>
          <PanelRowIdentity
            title={entry.description}
            subtitle={documentOf(entry)?.name ?? 'Pending'}
            annotation={
              <UiBadge variant='info'>
                {SOURCE_LABELS[entry.upload.source]}
              </UiBadge>
            }
          />
        </span>
      )
    }],
    list: () => [...(query.data?.inventory.entries ?? [])],
    isListLoading: () => query.isPending,
    listError: () => query.error,
    refresh: async () => {
      await query.refetch()
      await documents.refetch()
    },
    create: draft => editor.save(draft),
    update: (_entry, draft) => editor.save(draft),
    collectionActions: [{
      name: 'open-inventory',
      label: 'Inventory',
      icon: 'external-link',
      handler: () =>
        openSourceWindow('Open Binder inventory', async () => (await source.inventoryLink()).url)
    }],
    actions: [{
      name: 'open',
      label: 'Open source',
      icon: 'external-link',
      handler: entry =>
        openSourceWindow('Open Binder source', async () => (await source.link(entry)).url)
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
        query.data ? FieldBinderMetadata.address(query.data.document.id) : undefined,
        item ? documentOf(item) : undefined
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

/** How each entry's document arrived, as its row's pill says it. */
const SOURCE_LABELS: { [Source in FieldBinderUploadSource]: string } = {
  upload: 'Upload',
  library: 'Library',
  url: 'Chemicals'
}

/** Open a source document in a new window, reporting expected failures and surfacing the rest. */
const openSourceWindow = async (
  label: string,
  resolveUrl: () => Promise<string>
): Promise<void> => {
  try {
    await UiWindow.openResolved(resolveUrl, BLOCKED_WINDOW)
  } catch (error) {
    reportSourceFailure(
      label,
      error instanceof Error ? error.message : 'Unable to open the document.'
    )
    const expected = error instanceof ApiError
      || (error instanceof Error && error.message === BLOCKED_WINDOW)
    if (!expected) {
      queueMicrotask(() => {
        throw error
      })
    }
  }
}

/** Publish a non-blocking failed report for a source operation. */
const reportSourceFailure = (label: string, error: string): void => {
  api.BackgroundTasks.publish(SOURCE_FAILURE_KEY, { label, phase: 'failed', blocksExit: false, error })
}
