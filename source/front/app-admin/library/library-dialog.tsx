/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Library dialog                                                               ║
║ Catalog launchers and document browsing within one tonal panel.                ║
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
import { createSignal } from '@solid-js'
import { useShellNavigate } from '@ux/shell/runtime/use-shell-navigate.ts'
import { UiActionButton, UiLayout, UiWindow } from '@ux/ui'
import type { UiComponent } from '@ux/ui'

import './library-dialog.css'

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
    <UiLayout variant='block-fill' data-app='library'>
      <DrillNavigator
        variant='tonal-dark'
        contextTitle='Library'
        title='Documents'
        root={root}
        feedback={error() ? { message: error(), variant: 'danger' } : null}
        toolbar={
          <UiLayout variant='inline-fit' data-app='library-toolbar'>
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
        }
        hostActions={
          <UiActionButton
            icon='cross-1'
            label='Close'
            labelMode='hidden'
            decoration='ring'
            density='dense'
            onClick={props.onCancel}
          />
        }
      />
    </UiLayout>
  )
}
