/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Drill dialog                                                                 ║
║ A trigger and sheet around declared nested levels.                           ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Opens a navigator in a sheet and closes before running a chosen leaf.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
DrillDialogProps  Trigger and navigation inputs.
├ label           Trigger label and panel context.
├ title           Navigator root heading.
├ disabled        Host busy state.
├ name            Form field identity.
├ error           Field invalid state.
└ root            First level.
DrillDialog       Trigger and sheet.
*/

import { createSignal, Show } from '@solid-js'
import { PanelClose } from '@ux/shell/panel/panel-close.tsx'
import { UiActionButton, UiDialog, UiLayout } from '@ux/ui'
import type { UiComponent } from '@ux/ui'
import { DrillNavigator } from './drill-navigator.tsx'
import type { DrillLevel } from './drill-navigator.tsx'

/** The button and sheet labels, the host's busy state, the field it fills, and the first level. */
export type DrillDialogProps = {
  label: string
  title: string
  disabled: boolean
  name: string
  error: boolean
  root: DrillLevel
}

/** Open a sheet of levels; close it before choosing. */
export const DrillDialog = (props: DrillDialogProps): UiComponent => {
  const [open, setOpen] = createSignal(false)
  const close = (): void => {
    setOpen(false)
  }
  return (
    <UiLayout variant='inline-fit'>
      <UiActionButton
        align='start'
        density='dense'
        disabled={props.disabled}
        error={props.error}
        icon='plus'
        label={props.label}
        labelMode='visible'
        name={props.name}
        onClick={() => setOpen(true)}
      />
      <Show when={open()}>
        <UiDialog open size='sheet' surface='frameless' onOpenChange={next => !next && close()}>
          <DrillNavigator
            variant='tonal-dark'
            contextTitle={props.label}
            title={props.title}
            root={props.root}
            onChoose={close}
            hostActions={
              <PanelClose onClick={close} />
            }
          />
        </UiDialog>
      </Show>
    </UiLayout>
  )
}
