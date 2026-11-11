/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Lister                                                                       ║
║ Standalone Collection workbench with consumer-owned activation.              ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Presents a Collection alone in the workbench frame. Activations run one at a
time, with failures reported in the Collection. Hosts route their Lister through
Routes.workbench and decide what activating an Item does.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
ListerProps  Props for a standalone Collection workbench.
├ onCancel   Closes the workbench.
├ provider   Collection projection and loading provider.
└ activate   Performs the consumer's Item activation.
Lister       Standalone Collection workbench.
*/

import type { Instance } from '@core/std'
import { createSignal } from '@solid-js'
import { PanelContainer } from '@ux/shell/panel/panel-container.tsx'
import { PanelHeader } from '@ux/shell/panel/panel-header.tsx'
import { UiActionButton } from '@ux/ui'
import type { UiComponent } from '@ux/ui'
import type { CollectionContract } from './collection-contract.ts'
import { CollectionTable } from './collection-table.tsx'

/** Props for a workbench that presents a standalone list. */
export type ListerProps<T extends Instance> = {
  onCancel: () => void
  provider: CollectionContract<T>
  activate: (item: T) => void | Promise<void>
}

/** Presents a standalone Collection with consumer-owned Item activation. */
export const Lister = <T extends Instance>(props: ListerProps<T>): UiComponent => {
  const [pending, setPending] = createSignal(false)
  const [error, setError] = createSignal<string | null>(null)

  const activate = async (item: T): Promise<void> => {
    if (pending()) return
    setPending(true)
    setError(null)
    try {
      await props.activate(item)
    } catch (error) {
      setError(
        error instanceof Error ? error.message : `${props.provider.entityLabel} activation failed.`
      )
    } finally {
      setPending(false)
    }
  }

  const close = (): void => {
    if (!pending()) props.onCancel()
  }

  return (
    <PanelContainer
      feature='lister'
      header={
        <PanelHeader
          leading={<h1>{props.provider.formTitle}</h1>}
          trailing={
            <UiActionButton
              icon='cross-1'
              label='Close'
              labelMode='visible'
              density='dense'
              disabled={pending()}
              onClick={close}
            />
          }
        />
      }
      main={
        <CollectionTable
          provider={props.provider}
          activate={item => void activate(item)}
          error={error()}
        />
      }
    />
  )
}
