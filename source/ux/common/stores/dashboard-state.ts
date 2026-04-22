/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Dashboard state store                                                        ║
║ Reactive dashboard layout state and IndexedDB persistence orchestration.     ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Single source of truth for dashboard header widgets and row/widget layout
state. All dashboard mutations flow through this module and persist through
@core/db/indexeddb.ts --> browser IndexedDB.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
DashboardState - Dashboard state and mutation methods
├ store          Reactive dashboard view snapshot.
├ init(seed)     Hydrate dashboard state from seed or IndexedDB.
├ headerWidgets  Header widget mutation contract.
├ rows           Dashboard row mutation contract.
└ rowWidgets     Row widget mutation contract.
*/

import { ApiError, apiError } from '@core/api/api-contract.ts'
import { IndexedDb } from '@core/db/indexeddb.ts'
import { type Dictionary, id, type Instance } from '@core/std'
import { createStore, produce } from '@solid-js/store'
import type { DashboardRowHeader, DashboardWidget } from '@ux/common/views/dashboard-views.ts'
import { Config } from '@ux/config/ux-config.ts'

// ───────────────────────────────────────────────────────────────────────────────
// DASHBOARD STATE STORE & CONTRACT
// ───────────────────────────────────────────────────────────────────────────────

/** Dashboard state store  */
export type DashboardStoreWidget = Instance & DashboardWidget
export type DashboardStoreWidgets = { widgets: DashboardStoreWidget[] }
export type DashboardStoreHeader = DashboardStoreWidgets
export type DashboardStoreRow = Instance & DashboardRowHeader & DashboardStoreWidgets
export type DashboardStoreView = Instance & {
  header: DashboardStoreHeader
  rows: DashboardStoreRow[]
}

/** Movement of widgets in the layout */
export type MoveDirection = 'backward' | 'forward'

/** Widget contract */
export interface DashboardWidgetsContract {
  add(rowId: string | null, widget: DashboardWidget): Promise<DashboardStoreWidget>
  update(rowId: string | null, widget: DashboardStoreWidget): Promise<void>
  remove(rowId: string | null, widgetId: string): Promise<void>
  move(rowId: string | null, widgetId: string, direction: MoveDirection): Promise<void>
}

/** Header contract */
export interface DashboardHeaderContract {
  add(widget: DashboardWidget): Promise<DashboardStoreWidget>
  update(widget: DashboardStoreWidget): Promise<void>
  remove(widgetId: string): Promise<void>
  move(widgetId: string, direction: MoveDirection): Promise<void>
}

/** Row contract */
export interface DashboardRowsContract {
  add(row: DashboardRowHeader): Promise<DashboardStoreRow>
  remove(rowId: string): Promise<void>
  move(rowId: string, direction: MoveDirection): Promise<void>
}

// ───────────────────────────────────────────────────────────────────────────────
// DASHBOARD STATE IMPLEMENTATION
// ───────────────────────────────────────────────────────────────────────────────

/** Dashboard store */
const DASHBOARD_STORE = 'DashboardStore'
const DASHBOARD_ID = '019daa39-2d7c-76fb-877f-495169374178'

/** Initializa local and transient stores */
IndexedDb.registerStore(DASHBOARD_STORE)
const [dashboardStore, setDashboardStore] = createStore<DashboardStoreView>({
  id: '',
  header: { widgets: [] },
  rows: []
})

/** Initialize store from db or seed */
async function dashboardInit(seed: unknown): Promise<void> {
  try {
    const db = await IndexedDb.connection()
    let dashboard = await db.get(DASHBOARD_STORE, DASHBOARD_ID)
    if (!dashboard) {
      dashboard = toDashboardStoreView(seed)
      await db.put(DASHBOARD_STORE, dashboard)
    }
    setDashboardStore(dashboard)
  } catch (error) {
    if (apiError(error)) Config.fail((error as ApiError).message)
    else Config.fail(`Dashboard init failed: ${IndexedDb.errorToStatus(error)}`)
  }
}

/** Persist dashboard to local store */
async function dashboardSave(): Promise<void> {
  try {
    const idb = await IndexedDb.connection()
    await idb.put(DASHBOARD_STORE, dashboardStore)
  } catch (error) {
    if (apiError(error)) console.error((error as ApiError).message)
    else console.error(`Dashboard init failed: ${IndexedDb.errorToStatus(error)}`)
  }
}

/** Widgets contract provider */
const dashboardWidgets: DashboardWidgetsContract = {
  /** Create and persist a widget, then append to local store. */
  add: async (rowId, widget): Promise<DashboardStoreWidget> => {
    if (rowId && !dashboardStore.rows.some(row => row.id === rowId)) {
      throw new ApiError('Dashboard row not found', 404)
    }

    const storeWidget: DashboardStoreWidget = { id: id(), ...widget }
    setDashboardStore(
      produce(store => {
        const widgets = rowId
          ? store.rows.find(row => row.id === rowId)?.widgets
          : store.header.widgets
        if (!widgets) return

        widgets.push(storeWidget)
      })
    )
    await dashboardSave()
    return storeWidget
  },

  /** Persist widget updates and keep store in sync. */
  update: async (rowId, widget): Promise<void> => {
    setDashboardStore(
      produce(store => {
        const widgets = rowId
          ? store.rows.find(row => row.id === rowId)?.widgets
          : store.header.widgets
        if (!widgets) return

        const index = widgets.findIndex(item => item.id === widget.id)
        if (index < 0) widgets.push(widget)
        else widgets[index] = widget
      })
    )
    await dashboardSave()
  },

  /** Delete widget from store and persistence layer. */
  remove: async (rowId, id): Promise<void> => {
    setDashboardStore(
      produce(store => {
        const widgets = rowId
          ? store.rows.find(row => row.id === rowId)?.widgets
          : store.header.widgets
        if (!widgets) return

        const index = widgets.findIndex(widget => widget.id === id)
        if (index < 0) return
        widgets.splice(index, 1)
      })
    )
    await dashboardSave()
  },

  /** Reorder widgets by swapping positional/sort fields. */
  move: async (rowId, id, direction): Promise<void> => {
    setDashboardStore(
      produce(store => {
        const widgets = rowId
          ? store.rows.find(row => row.id === rowId)?.widgets
          : store.header.widgets
        if (!widgets) return

        const index = widgets.findIndex(widget => widget.id === id)
        if (index < 0) return

        const target = direction === 'backward' ? index - 1 : index + 1
        if (target < 0 || target >= widgets.length) return

        const [current] = widgets.splice(index, 1)
        widgets.splice(target, 0, current)
      })
    )
    await dashboardSave()
  }
}

/** Header contract provider */
const dashboardHeader: DashboardHeaderContract = {
  add: async (w): Promise<DashboardStoreWidget> => await dashboardWidgets.add(null, w),
  update: async (w): Promise<void> => await dashboardWidgets.update(null, w),
  remove: async (id): Promise<void> => await dashboardWidgets.remove(null, id),
  move: async (id, dir): Promise<void> => await dashboardWidgets.move(null, id, dir)
}

/** Row contract provider */
const dashboardRows: DashboardRowsContract = {
  /** Create and persist a dashboard row, then append to local store. */
  add: async (row): Promise<DashboardStoreRow> => {
    const storeRow: DashboardStoreRow = { id: id(), ...row, widgets: [] }
    setDashboardStore('rows', produce(rows => rows.push(storeRow)))
    await dashboardSave()
    return storeRow
  },

  /** Remove row from store and persistence; rely on cascading widget cleanup. */
  remove: async (id): Promise<void> => {
    setDashboardStore(
      'rows',
      produce(rows => {
        const index = rows.findIndex(row => row.id === id)
        if (index < 0) return
        rows.splice(index, 1)
      })
    )
    await dashboardSave()
  },

  /** Reorder rows by swapping positional/sort fields and persisting changes. */
  move: async (id, dir): Promise<void> => {
    setDashboardStore(
      produce(store => {
        const index = store.rows.findIndex(row => row.id === id)
        if (index < 0) return

        const target = dir === 'backward' ? index - 1 : index + 1
        if (target < 0 || target >= store.rows.length) return

        const [current] = store.rows.splice(index, 1)
        store.rows.splice(target, 0, current)
      })
    )
    await dashboardSave()
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// DASHBOARD JSON -> VIEW CONVERSION
// ───────────────────────────────────────────────────────────────────────────────

/** Validate and convert input to DashboardView */
function toDashboardStoreView(input: unknown): DashboardStoreView {
  const view = toDictionary(input, 'Dashboard view')
  const header = toDictionary(view['header'], 'Dashboard view.header')
  const rows = toArray(view['rows'], 'Dashboard view.rows')
  return {
    id: DASHBOARD_ID,
    header: { widgets: toDashboardStoreWidgets(header['widgets'], 'Dashboard view.header.widgets') },
    rows: rows.map((r, i) => toDashboardStoreRow(r, `Dashboard view.rows[${i}]`))
  }
}

/** Require an object dictionary. */
function toDictionary(input: unknown, field: string): Dictionary {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    throw new ApiError(`${field} must be an object`, 400)
  }
  return input as Dictionary
}

/** Require an array value. */
function toArray(input: unknown, field: string): unknown[] {
  if (!Array.isArray(input)) throw new ApiError(`${field} must be an array`, 400)
  return input
}

/** Require a non-empty string value. */
function toString(input: unknown, field: string): string {
  if (typeof input !== 'string' || input.trim().length === 0) {
    throw new ApiError(`${field} must be a non-empty string`, 400)
  }
  return input
}

/** Validate one dashboard widget. */
function toDashboardStoreWidget(input: unknown, field: string): DashboardStoreWidget {
  const widget = toDictionary(input, field)
  const shape = toString(widget['shape'], `${field}.shape`)
  const type = toString(widget['type'], `${field}.type`)
  const settings = toDictionary(widget['settings'], `${field}.settings`)
  if (shape !== 'square' && shape !== 'landscape') {
    throw new ApiError(`${field}.shape must be square or landscape`, 400)
  }
  return { id: id(), shape, type, settings }
}

/** Validate a dashboard widget array. */
function toDashboardStoreWidgets(input: unknown, field: string): DashboardStoreWidget[] {
  return toArray(input, field).map((w, i) => toDashboardStoreWidget(w, `${field}[${i}]`))
}

/** Validate one dashboard row. */
function toDashboardStoreRow(input: unknown, field: string): DashboardStoreRow {
  const row = toDictionary(input, field)
  const size = toString(row['size'], `${field}.size`)
  if (size !== 'standard' && size !== 'short') {
    throw new ApiError(`${field}.size must be standard or short`, 400)
  }
  const label = toString(row['label'], `${field}.label`)
  const widgets = toDashboardStoreWidgets(row['widgets'], `${field}.widgets`)
  return { id: id(), size, label, widgets }
}

// ───────────────────────────────────────────────────────────────────────────────
// DASHBOARD STATE
// ───────────────────────────────────────────────────────────────────────────────

const DashboardState = {
  store: dashboardStore,
  init: dashboardInit,
  headerWidgets: dashboardHeader,
  rows: dashboardRows,
  rowWidgets: dashboardWidgets
}

export { DashboardState }
