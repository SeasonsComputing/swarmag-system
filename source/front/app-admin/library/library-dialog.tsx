/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Library dialog                                                               ║
║ Catalog manager launchers and Library documents in one sheet.                ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Launches catalog managers and browses Library documents. Document activation
opens a secondary window and keeps the sheet open, reporting failures locally.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
LibraryDialogProps  Sheet wiring.
└ onCancel          Close the sheet.
LibraryDialog       Catalog launchers and document navigation.
*/

import type { Attachment } from '@domain/abstractions/common.ts'
import { api } from '@front/api/api.ts'
import { DrillNavigator } from '@front/app/shell/retrieval/drill-navigator.tsx'
import { LibraryLevels } from '@front/app/shell/retrieval/library-levels.ts'
import { createSignal, Show } from '@solid-js'
import { PanelSheet } from '@ux/shell/panel/panel-sheet.tsx'
import { useShellNavigate } from '@ux/shell/runtime/use-shell-navigate.ts'
import { UiActionButton, UiAlert, UiLayout, UiWindow } from '@ux/ui'
import type { UiComponent } from '@ux/ui'

/** Sheet close action supplied by its route. */
export type LibraryDialogProps = { onCancel: () => void }

/** Launch catalog managers and activate Library documents without closing. */
export const LibraryDialog = (props: LibraryDialogProps): UiComponent => {
  const { redirect } = useShellNavigate()
  const [error, setError] = createSignal('')
  const open = async (attachment: Attachment): Promise<void> => {
    setError('')
    try {
      await UiWindow.openResolved(
        async () => (await api.Attachments.link(attachment)).url,
        'Allow a secondary window to open this document.'
      )
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to open document.')
    }
  }
  const root = LibraryLevels.root(attachment => void open(attachment))
  return (
    <PanelSheet title='Library' onCancel={props.onCancel}>
      <UiLayout variant='block-fill'>
        <UiLayout variant='cluster-wrap'>
          <UiActionButton
            align='start'
            density='dense'
            icon='layers'
            label='Asset Types'
            labelMode='visible'
            onClick={() => void redirect('/asset-types')}
          />
          <UiActionButton
            align='start'
            density='dense'
            icon='cube'
            label='Assets'
            labelMode='visible'
            onClick={() => void redirect('/assets')}
          />
          <UiActionButton
            align='start'
            density='dense'
            icon='opacity'
            label='Chemicals'
            labelMode='visible'
            onClick={() => void redirect('/chemicals')}
          />
          <UiActionButton
            align='start'
            density='dense'
            icon='target'
            label='Services'
            labelMode='visible'
            onClick={() => void redirect('/services')}
          />
        </UiLayout>
        <Show when={error()}>
          <UiAlert variant='danger'>{error()}</UiAlert>
        </Show>
        <DrillNavigator title='Documents' root={root} />
      </UiLayout>
    </PanelSheet>
  )
}
