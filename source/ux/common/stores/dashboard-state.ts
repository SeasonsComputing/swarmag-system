/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Dashboard state store                                                        ║
║ Reactive dashboard layout state and IndexedDB persistence orchestration.     ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Single source of truth for dashboard header widgets and row/widget layout
state. All dashboard mutations flow through this module and persist through
the IndexedDB CRUD clients.

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
import { createStore, produce } from '@solid-js/store'
import type { Dictionary } from '@core/std'
import type { DashboardRow, DashboardView, DashboardWidget } from '@ux/common/views/dashboard-views.ts'
import { Config } from '@ux/config/ux-config.ts'

// ───────────────────────────────────────────────────────────────────────────────
// DASHBOARD STATE CONTRACT
// ───────────────────────────────────────────────────────────────────────────────

/** Movement of widgets in the layout */
export type MoveDirection = 'backward' | 'forward'

/** Widget contract */
export interface DashboardWidgetsContract {
  add(rowKey: string | null, widget: DashboardWidget): Promise<void>
  update(rowKey: string | null, widget: DashboardWidget): Promise<void>
  remove(rowKey: string | null, widgetKey: string): Promise<void>
  move(rowKey: string | null, widgetKey: string, direction: MoveDirection): Promise<void>
}

/** Header contract */
export interface DashboardHeaderContract {
  add(widget: DashboardWidget): Promise<void>
  update(widget: DashboardWidget): Promise<void>
  remove(widgetKey: string): Promise<void>
  move(widgetKey: string, direction: MoveDirection): Promise<void>
}

/** Row contract */
export interface DashboardRowsContract {
  add(row: DashboardRow): Promise<void>
  remove(rowKey: string): Promise<void>
  move(rowKey: string, direction: MoveDirection): Promise<void>
}

// ───────────────────────────────────────────────────────────────────────────────
// DASHBOARD STATE IMPLEMENTATION
// ───────────────────────────────────────────────────────────────────────────────

const DASHBOARD_STORE = 'DashboardViewStore'
const DASHBOARD_SINGLETON = '#dashboardSingleton'
const NULL_VIEW: DashboardView = { header: { widgets: [] }, rows: [] }

/** Dashboard in-memory store */
const [dashboardStore, setDashboardStore] = createStore<DashboardView>(NULL_VIEW)

/** Initialize store from db or seed */
async function dashboardInit(seed: unknown): Promise<void> {
  IndexedDb.registerStore(DASHBOARD_STORE)
  try {
    const dashboard: DashboardView = toDashboardView(seed)
    const db = await IndexedDb.connection()
    const view = await db.get(DASHBOARD_STORE, DASHBOARD_SINGLETON)
    if (!view) await db.put(DASHBOARD_STORE, dashboard, DASHBOARD_SINGLETON)
    setDashboardStore(view ?? dashboard)
  } catch (error) {
    if (apiError(error)) Config.fail((error as ApiError).message)
    else Config.fail(`Dashboard init failed: ${IndexedDb.errorToStatus(error)}`)
  }
}

/** Persist dashboard to local store */
async function dashboardSave(): Promise<void> {
  try {
    const idb = await IndexedDb.connection()
    await idb.put(DASHBOARD_STORE, { ...dashboardStore, key: DASHBOARD_SINGLETON })
  } catch (error) {
    if (apiError(error)) console.error((error as ApiError).message)
    else console.error(`Dashboard init failed: ${IndexedDb.errorToStatus(error)}`)
  }
}

/** Widgets contract provider */
const dashboardWidgets: DashboardWidgetsContract = {
  /** Create and persist a widget, then reflect it in local store. */
  add: async (rowKey, widget): Promise<void> => {
    await dashboardWidgets.update(rowKey, widget)
  },

  /** Persist widget updates and keep store in sync. */
  update: async (rowKey, widget): Promise<void> => {
    setDashboardStore(
      produce(store => {
        const widgets = rowKey
          ? store.rows.find(row => row.key === rowKey)?.widgets
          : store.header.widgets
        if (!widgets) return

        const index = widgets.findIndex(item => item.key === widget.key)
        if (index < 0) widgets.push(widget)
        else widgets[index] = widget
      })
    )
    await dashboardSave()
  },

  /** Delete widget from store and persistence layer. */
  remove: async (rowKey, key): Promise<void> => {
    setDashboardStore(
      produce(store => {
        const widgets = rowKey
          ? store.rows.find(row => row.key === rowKey)?.widgets
          : store.header.widgets
        if (!widgets) return

        const index = widgets.findIndex(widget => widget.key === key)
        if (index < 0) return
        widgets.splice(index, 1)
      })
    )
    await dashboardSave()
  },

  /** Reorder widgets by swapping positional/sort fields. */
  move: async (rowKey, key, direction): Promise<void> => {
    setDashboardStore(
      produce(store => {
        const widgets = rowKey
          ? store.rows.find(row => row.key === rowKey)?.widgets
          : store.header.widgets
        if (!widgets) return

        const index = widgets.findIndex(widget => widget.key === key)
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
  add: async (w): Promise<void> => await dashboardWidgets.add(null, w),
  update: async (w): Promise<void> => await dashboardWidgets.update(null, w),
  remove: async (key): Promise<void> => await dashboardWidgets.remove(null, key),
  move: async (key, dir): Promise<void> => await dashboardWidgets.move(null, key, dir)
}

/** Row contract provider */
const dashboardRows: DashboardRowsContract = {
  /** Create and persist a dashboard row, then append to local store. */
  add: async (state): Promise<void> => {
    setDashboardStore(
      'rows',
      produce(rows => {
        const row = { ...state, key: state.key }
        const index = rows.findIndex(item => item.key === state.key)
        if (index < 0) rows.push(row)
        else rows[index] = row
      })
    )
    await dashboardSave()
  },

  /** Remove row from store and persistence; rely on cascading widget cleanup. */
  remove: async (key): Promise<void> => {
    setDashboardStore(
      'rows',
      produce(rows => {
        const index = rows.findIndex(row => row.key === key)
        if (index < 0) return
        rows.splice(index, 1)
      })
    )
    await dashboardSave()
  },

  /** Reorder rows by swapping positional/sort fields and persisting changes. */
  move: async (key, dir): Promise<void> => {
    setDashboardStore(
      produce(store => {
        const index = store.rows.findIndex(row => row.key === key)
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

const DashboardState = {
  store: dashboardStore,
  init: dashboardInit,
  headerWidgets: dashboardHeader,
  rows: dashboardRows,
  rowWidgets: dashboardWidgets
}

export { DashboardState }

// ───────────────────────────────────────────────────────────────────────────────
// INTERNALS
// ───────────────────────────────────────────────────────────────────────────────

/** Validate and convert input to DashboardView */
function toDashboardView(input: unknown): DashboardView {
  const view = toDictionary(input, 'Dashboard view')
  const header = toDictionary(view['header'], 'Dashboard view.header')
  const rows = toArray(view['rows'], 'Dashboard view.rows')
  return {
    header: { widgets: toDashboardWidgets(header['widgets'], 'Dashboard view.header.widgets') },
    rows: rows.map((row, index) => toDashboardRow(row, `Dashboard view.rows[${index}]`))
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
function toDashboardWidget(input: unknown, field: string): DashboardWidget {
  const widget = toDictionary(input, field)
  const shape = toString(widget['shape'], `${field}.shape`)
  const type = toString(widget['type'], `${field}.type`)
  const settings = toDictionary(widget['settings'], `${field}.settings`)
  if (shape !== 'square' && shape !== 'landscape') {
    throw new ApiError(`${field}.shape must be square or landscape`, 400)
  }

  return {
    key: toString(widget['key'], `${field}.key`),
    shape,
    type,
    settings
  }
}

/** Validate a dashboard widget array. */
function toDashboardWidgets(input: unknown, field: string): DashboardWidget[] {
  return toArray(input, field).map((widget, index) =>
    toDashboardWidget(widget, `${field}[${index}]`)
  )
}

/** Validate one dashboard row. */
function toDashboardRow(input: unknown, field: string): DashboardRow {
  const row = toDictionary(input, field)
  const size = toString(row['size'], `${field}.size`)
  if (size !== 'standard' && size !== 'short') {
    throw new ApiError(`${field}.size must be standard or short`, 400)
  }

  return {
    key: toString(row['key'], `${field}.key`),
    size,
    label: toString(row['label'], `${field}.label`),
    widgets: toDashboardWidgets(row['widgets'], `${field}.widgets`)
  }
}
