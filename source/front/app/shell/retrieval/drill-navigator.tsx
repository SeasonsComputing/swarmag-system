/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Drill navigator                                                              ║
║ Declared nested levels and leaf activation within a panel.                   ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Presents declared levels, retaining the path and Back control at every depth.
Leaf activation runs onChoose before the leaf's action.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
DrillLevel           One level's columns, rows, and empty text.
├ column             Main column heading.
├ detail             Optional detail heading.
├ empty              Empty-level message.
└ load               Read the rows.
DrillRow             Branch or leaf.
DrillRowBase         Shared row presentation.
├ label              Row text.
└ detail             Optional detail text.
DrillBranch          Opens a level; extends DrillRowBase.
└ open               Produce the child level.
DrillLeaf            Activates an item; extends DrillRowBase.
└ choose             Run the consumer's action.
DrillNavigatorProps  Navigation inputs.
├ title              Root heading and path title.
├ root               First level.
└ onChoose           Run before a leaf's action.
DrillNavigator       Navigate levels within the host's surface.
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
import { UiIcon, UiSpinner, UiTable, UiTableBody, UiTableCell, UiTableHeader, UiTableRow } from '@ux/ui'
import type { UiActionButtonProps, UiComponent } from '@ux/ui'

import './drill-navigator.css'

/** One level of a picker: its column headings, its rows, and what an empty level says. */
export type DrillLevel = {
  column: string
  detail?: string
  empty: string
  load: () => Promise<readonly DrillRow[]>
}

/** One row: a row that opens drills deeper and shows the arrow; a row that chooses ends it. */
export type DrillRow = DrillBranch | DrillLeaf

/** What every row shows. */
export type DrillRowBase = { label: string; detail?: string }

/** A row that drills into another level; it shows the arrow. */
export type DrillBranch = DrillRowBase & { open: () => DrillLevel }

/** A row that chooses; choosing runs the consumer action. */
export type DrillLeaf = DrillRowBase & { choose: () => void }

/** Navigation inputs and the optional action before a leaf chooses. */
export type DrillNavigatorProps = {
  title: string
  root: DrillLevel
  onChoose?: () => void
}

/** Walk declared levels without owning a dialog. */
export const DrillNavigator = (props: DrillNavigatorProps): UiComponent => {
  const [drillReturn, setDrillReturn] = createSignal<DrillReturnControl | null>(null)
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
    <PanelList
      header={{
        leading: <PanelHeaderTitle title={props.title} path={path()} command={command()} />
      }}
    >
      <DrillDown
        rootTitle={props.title}
        context={context}
        root={drill => <DrillTable level={props.root} drill={drill} onChoose={props.onChoose} />}
      />
    </PanelList>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// LEVELS
// ────────────────────────────────────────────────────────────────────────────

/** One level's table: loading, then its rows or its empty text. */
const DrillTable = (
  props: { level: DrillLevel; drill: DrillContract; onChoose?: () => void }
): UiComponent => {
  const [rows] = createResource(() => props.level, level => level.load())
  const activate = (row: DrillRow): void => {
    if ('open' in row) {
      props.drill.open(
        () => <DrillTable level={row.open()} drill={props.drill} onChoose={props.onChoose} />,
        row.label
      )
      return
    }
    props.onChoose?.()
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
                    <UiIcon name='chevron-right' data-app='drill-mark' />
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
