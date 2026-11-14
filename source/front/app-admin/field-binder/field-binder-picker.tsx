/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Field Binder picker                                                          ║
║ A button that opens a sheet of drill-down content for choosing a document.   ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Owns what every Binder picker shares: the opening button, the sheet titled by
it with Close, and a card holding the drill-down host, as a Lister presents.
The card's title carries the path and the return control, as other headers do.
The consumer supplies the content as the drill-down's root, and receives close
to call once a document is chosen.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
FieldBinderPickerProps  Picker inputs.
├ label                 The opening button's label and the sheet's title.
├ title                 The card's heading and the drill-down's root title.
├ disabled              The host is busy.
└ root                  The content, given the drill-down and close.
FieldBinderPicker       Opening button and sheet.
PickerDrillCell         Trailing cell marking a row that opens another level.
*/

import { createSignal, Show } from '@solid-js'
import type { DrillContract, DrillReturnControl } from '@ux/shell/panel/drill-contract.ts'
import { DrillDown } from '@ux/shell/panel/drill-down.tsx'
import { PanelHeaderTitle } from '@ux/shell/panel/panel-header-title.tsx'
import { PanelList } from '@ux/shell/panel/panel-list.tsx'
import type { PanelStepContext } from '@ux/shell/panel/panel-sequence-contract.ts'
import { PanelSheet } from '@ux/shell/panel/panel-sheet.tsx'
import { UiActionButton, UiDialog, UiLayout, UiTableCell } from '@ux/ui'
import type { UiActionButtonProps, UiComponent } from '@ux/ui'

import './field-binder-picker.css'

/** The button and sheet labels, the host's busy state, and the sheet's content. */
export type FieldBinderPickerProps = {
  label: string
  title: string
  disabled: boolean
  root: (drill: DrillContract, close: () => void) => UiComponent
}

/** A button that opens the picker sheet; the content closes it on a choice. */
export const FieldBinderPicker = (props: FieldBinderPickerProps): UiComponent => {
  const [open, setOpen] = createSignal(false)
  const [drillReturn, setDrillReturn] = createSignal<DrillReturnControl | null>(null)
  const close = (): void => {
    setOpen(false)
  }
  // The card's title owns the drill return, as a sequence header does; a picker
  // has no validation, drafts, feedback, or trailing action.
  const context: PanelStepContext = {
    registerValidation: () => () => {},
    registerDrillReturn: control => setDrillReturn(() => control),
    registerTrailingAction: () => {},
    registerDirty: () => () => {},
    feedback: () => {},
    busy: () => false
  }
  const path = (): readonly string[] | undefined => {
    const control = drillReturn()
    return control ? [props.title, ...control.path()] : undefined
  }
  const command = (): UiActionButtonProps | undefined => {
    const control = drillReturn()
    if (!control) return undefined
    return { icon: 'arrow-left', label: 'Back', onClick: control.returnToIndex }
  }
  return (
    <UiLayout variant='inline-fit'>
      <UiActionButton
        icon='plus'
        label={props.label}
        labelMode='visible'
        align='start'
        density='dense'
        disabled={props.disabled}
        onClick={() => setOpen(true)}
      />
      <Show when={open()}>
        <UiDialog open size='sheet' onOpenChange={next => !next && close()}>
          <PanelSheet title={props.label} onCancel={close}>
            <PanelList
              header={{
                leading: (
                  <PanelHeaderTitle
                    title={props.title}
                    path={path()}
                    command={command()}
                  />
                )
              }}
            >
              <DrillDown
                rootTitle={props.title}
                context={context}
                root={drill => props.root(drill, close)}
              />
            </PanelList>
          </PanelSheet>
        </UiDialog>
      </Show>
    </UiLayout>
  )
}

/** A row that opens another level ends in a right arrow; a row that chooses does not. */
export const PickerDrillCell = (): UiComponent => (
  <UiTableCell align='end'>
    <span data-app='field-binder-drill-mark' data-ui-icon='chevron-right' aria-hidden='true' />
  </UiTableCell>
)
