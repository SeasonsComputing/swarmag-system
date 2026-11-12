/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Lister                                                                       ║
║ Standalone Collection sheet with consumer-owned activation.                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Presents a Collection alone in a PanelSheet. Activations run one at a time,
with failures reported in the Collection, and Close waits for the one in
flight. Hosts route their Lister through Routes.sheet and decide what
activating an Item does.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
ListerProps  Props for a standalone Collection sheet.
├ onCancel   Closes the sheet.
├ provider   Collection projection and loading provider.
└ activate   Performs the consumer's Item activation.
Lister       Standalone Collection sheet.
*/

import type { Instance } from '@core/std'
import { createSignal } from '@solid-js'
import { PanelSheet } from '@ux/shell/panel/panel-sheet.tsx'
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

  return (
    <PanelSheet title={props.provider.formTitle} onCancel={props.onCancel} busy={pending()}>
      <CollectionTable
        provider={props.provider}
        activate={item => void activate(item)}
        error={error()}
      />
    </PanelSheet>
  )
}
