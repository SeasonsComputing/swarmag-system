/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Field Binder picker                                                          ║
║ A button that opens a sheet of declared levels for choosing a document.      ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Owns everything a Binder picker presents: the opening button, the sheet titled
by it with Close, a card holding the drill-down host, the path and Back on the
card's title, and every level's table with its loading and empty rows. A row
that opens a level drills into it and shows a right arrow; a row that chooses
closes the sheet, then runs. A concrete picker only declares its levels.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
PickerLevel             One level: its columns, its rows, and its empty text.
├ column                The rows' heading.
├ detail                Optional right-aligned second column heading.
├ empty                 What an empty level says.
└ load                  Reads the level's rows.
PickerRow               One row: a branch or a leaf, never both or neither.
PickerRowBase           What every row shows.
├ label                 The row's text.
└ detail                Optional second-column text.
PickerBranch            A row that drills; extends PickerRowBase.
└ open                  The level it drills into.
PickerLeaf              A row that chooses; extends PickerRowBase.
└ choose                What choosing it does.
FieldBinderPickerProps  Picker inputs.
├ label                 The opening button's label and the sheet's title.
├ title                 The card's heading and the root level's title.
├ disabled              The host is busy.
└ root                  The first level.
FieldBinderPicker       Opening button and sheet.
*/

import { createResource, createSignal, For, Show } from '@solid-js'
import type {
  DrillContract,
  DrillHostContext,
  DrillReturnControl
} from '@ux/shell/panel/drill-contract.ts'
import { DrillDown } from '@ux/shell/panel/drill-down.tsx'
import { PanelHeaderTitle } from '@ux/shell/panel/panel-header-title.tsx'
import { PanelList } from '@ux/shell/panel/panel-list.tsx'
import { PanelSheet } from '@ux/shell/panel/panel-sheet.tsx'
import {
  UiActionButton,
  UiDialog,
  UiLayout,
  UiSpinner,
  UiTable,
  UiTableBody,
  UiTableCell,
  UiTableHeader,
  UiTableRow
} from '@ux/ui'
import type { UiActionButtonProps, UiComponent } from '@ux/ui'

import './field-binder-picker.css'

/** One level of a picker: its column headings, its rows, and what an empty level says. */
export type PickerLevel = {
  column: string
  detail?: string
  empty: string
  load: () => Promise<readonly PickerRow[]>
}

/** One row: a row that opens drills deeper and shows the arrow; a row that chooses ends it. */
export type PickerRow = PickerBranch | PickerLeaf

/** What every row shows. */
export type PickerRowBase = { label: string; detail?: string }

/** A row that drills into another level; it shows the arrow. */
export type PickerBranch = PickerRowBase & { open: () => PickerLevel }

/** A row that chooses; choosing closes the sheet, then runs. */
export type PickerLeaf = PickerRowBase & { choose: () => void }

/** The button and sheet labels, the host's busy state, and the first level. */
export type FieldBinderPickerProps = {
  label: string
  title: string
  disabled: boolean
  root: PickerLevel
}

/** A button that opens the picker sheet; choosing a row closes it. */
export const FieldBinderPicker = (props: FieldBinderPickerProps): UiComponent => {
  const [open, setOpen] = createSignal(false)
  const [drillReturn, setDrillReturn] = createSignal<DrillReturnControl | null>(null)
  const close = (): void => {
    setOpen(false)
  }
  // The card's title owns the drill return, as a sequence header does.
  const context: DrillHostContext = {
    registerDrillReturn: control => setDrillReturn(() => control)
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
                leading: <PanelHeaderTitle title={props.title} path={path()} command={command()} />
              }}
            >
              <DrillDown
                rootTitle={props.title}
                context={context}
                root={drill => <PickerTable level={props.root} drill={drill} close={close} />}
              />
            </PanelList>
          </PanelSheet>
        </UiDialog>
      </Show>
    </UiLayout>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// LEVELS
// ────────────────────────────────────────────────────────────────────────────

/** One level's table: loading, then its rows or its empty text. */
const PickerTable = (
  props: { level: PickerLevel; drill: DrillContract; close: () => void }
): UiComponent => {
  const [rows] = createResource(() => props.level, level => level.load())
  const activate = (row: PickerRow): void => {
    if ('open' in row) {
      props.drill.open(
        () => <PickerTable level={row.open()} drill={props.drill} close={props.close} />,
        row.label
      )
      return
    }
    props.close()
    row.choose()
  }
  return (
    <Show when={!rows.loading} fallback={<UiSpinner aria-label={`Loading ${props.level.column}`} />}>
      <UiTable>
        <UiTableHeader>
          <UiTableCell>{props.level.column}</UiTableCell>
          <UiTableCell align='end'>{props.level.detail}</UiTableCell>
        </UiTableHeader>
        <UiTableBody>
          <For each={rows()} fallback={<EmptyRow message={props.level.empty} />}>
            {row => (
              <UiTableRow onActivate={() => activate(row)}>
                <UiTableCell>{row.label}</UiTableCell>
                <UiTableCell align='end'>
                  <Show when={'open' in row} fallback={row.detail}>
                    <span
                      data-app='field-binder-drill-mark'
                      data-ui-icon='chevron-right'
                      aria-hidden='true'
                    />
                  </Show>
                </UiTableCell>
              </UiTableRow>
            )}
          </For>
        </UiTableBody>
      </UiTable>
    </Show>
  )
}

/** A read-only row that says a level is empty. */
const EmptyRow = (props: { message: string }): UiComponent => (
  <UiTableRow>
    <UiTableCell>{props.message}</UiTableCell>
  </UiTableRow>
)
