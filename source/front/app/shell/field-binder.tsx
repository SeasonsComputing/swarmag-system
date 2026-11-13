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
FieldBinder       View-only local document Lister.
*/

import { api } from '@front/api/api.ts'
import type { FieldBinderEntry } from '@front/api/field-binder-inventory.ts'
import { onMount } from '@solid-js'
import { PanelRowIdentity } from '@ux/shell/panel/panel-row-identity.tsx'
import type { CollectionContract } from '@ux/shell/workbench/collection-contract.ts'
import { Lister } from '@ux/shell/workbench/lister.tsx'
import { UiWindow } from '@ux/ui'
import type { UiComponent } from '@ux/ui'

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
  const open = (entry: FieldBinderEntry): Promise<void> =>
    UiWindow.openResolved(
      async () => (await binder.link(entry)).url,
      'Allow a new browser tab to open this document.'
    )
  const provider: CollectionContract<FieldBinderEntry> = {
    formTitle: 'Field Binder',
    entityLabel: 'Document',
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
  return <Lister provider={provider} onCancel={props.onCancel} activate={open} />
}
