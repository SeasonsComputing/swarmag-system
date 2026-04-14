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
async function dashboardInit(seed: DashboardView): Promise<void> {
  IndexedDb.registerStore(DASHBOARD_STORE)
  try {
    const db = await IndexedDb.connection()
    const view = await db.get(DASHBOARD_STORE, DASHBOARD_SINGLETON)
    if (!view) await db.put(DASHBOARD_STORE, seed, DASHBOARD_SINGLETON)
    setDashboardStore(view ?? seed)
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

/** Widget contract provider */
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
