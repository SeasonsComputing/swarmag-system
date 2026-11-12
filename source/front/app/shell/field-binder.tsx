/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Field Binder reader                                                          ║
║ View-only Lister over a complete prepared local document collection.         ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Opens only verified local Binder bytes. The source URL is descriptive metadata,
never a fallback for unavailable local content. Preparation is an explicit
application command, independent of this reader's route and refresh operation.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
FieldBinderProps  Workbench route props.
└ onCancel             Close the workbench.
FieldBinder       View-only local document Lister and preparation status.
*/

import { api } from '@front/api/api.ts'
import type { FieldBinderEntry } from '@front/api/field-binder-inventory.ts'
import { onMount } from '@solid-js'
import { PanelRowIdentity } from '@ux/shell/panel/panel-row-identity.tsx'
import type { CollectionContract } from '@ux/shell/workbench/collection-contract.ts'
import { Lister } from '@ux/shell/workbench/lister.tsx'
import type { UiComponent } from '@ux/ui'

import './field-binder.css'

/** Reader route input; no editable-reader mode exists. */
export type FieldBinderProps = { onCancel: () => void }

/** Project the last complete local snapshot independently of remote availability. */
export const FieldBinder = (props: FieldBinderProps): UiComponent => {
  const binder = api.FieldBinder
  onMount(() => {
    void binder.load().catch(error => {
      queueMicrotask(() => {
        throw error
      })
    })
  })
  const provider: CollectionContract<FieldBinderEntry> = {
    formTitle: 'Field Binder',
    entityLabel: 'document',
    listColumns: [{
      label: 'Document',
      render: entry => (
        <PanelRowIdentity
          title={entry.description}
          subtitle={entry.url ? new URL(entry.url).host : 'Uploaded'}
          annotation={binder.store.syncedAt
            ? `Copied ${new Date(binder.store.syncedAt).toLocaleString()}`
            : undefined}
        />
      )
    }],
    list: () => [...binder.store.entries],
    isListLoading: () => binder.store.loading,
    listError: () => binder.store.error,
    refresh: () => binder.load()
  }
  return (
    <div data-app='field-binder'>
      <p aria-live='polite'>{binder.status()}</p>
      <Lister
        provider={provider}
        onCancel={props.onCancel}
        activate={async entry => {
          const viewer = globalThis.open('', '_blank')
          if (!viewer) throw new Error('Allow a new browser tab to open this document.')
          viewer.opener = null
          try {
            const link = await binder.link(entry)
            viewer.location.href = link.url
          } catch (error) {
            viewer.close()
            throw error
          }
        }}
      />
    </div>
  )
}
