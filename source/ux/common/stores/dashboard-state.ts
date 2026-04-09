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
├ store   Reactive dashboard view snapshot.
├ init()  Hydrate dashboard state from seed or IndexedDB.
├
└
*/

import { IndexedDb } from '@core/db/indexeddb.ts'
import { createStore, produce } from '@solid-js/store'
import type {
  DashboardRow,
  DashboardView,
  DashboardWidget
} from '@ux/common/views/dashboard-views.ts'

// ───────────────────────────────────────────────────────────────────────────────
// DASHBOARD STATE CONTRACT
// ───────────────────────────────────────────────────────────────────────────────

/** Movement of widgets in the layout */
type MoveDirection = 'backward' | 'forward'

/** Widget contract */
interface DashboardWidgetsContract {
  add(rowId: string | null, widget: DashboardWidget): Promise<void>
  update(rowId: string | null, widget: DashboardWidget): Promise<void>
  remove(rowId: string | null, key: string): Promise<void>
  move(rowId: string | null, key: string, direction: MoveDirection): Promise<void>
}

/** Header contract */
interface DashboardHeaderContract {
  add(widget: DashboardWidget): Promise<void>
  update(widget: DashboardWidget): Promise<void>
  remove(key: string): Promise<void>
  move(key: string, direction: MoveDirection): Promise<void>
}

/** Row contract */
interface DashboardRowContract {
  add(row: DashboardRow): Promise<void>
  remove(key: string): Promise<void>
  move(key: string, direction: MoveDirection): Promise<void>
}

// ───────────────────────────────────────────────────────────────────────────────
// DASHBOARD STATE IMPLEMENTATION
// ───────────────────────────────────────────────────────────────────────────────

const DASHBOARD_STORE = 'DashboardViewStore'
const NULL_VIEW: DashboardView = { header: { widgets: [] }, rows: [] }

/** Dashboard in-memory store */
const [dashboardStore, setDashboardStore] = createStore<DashboardView>(NULL_VIEW)

/** Initialize store from db or seed */
async function dashboardInit(seed: DashboardView): Promise<void> {
  IndexedDb.registerStore(DASHBOARD_STORE)
  try {
    const db = await IndexedDb.connection()
    const view = await db.get(DASHBOARD_STORE, DASHBOARD_STORE)
    if (!view) db.put(DASHBOARD_STORE, seed)
    setDashboardStore(view ?? seed)
  } catch (_error) {
    // TODO
  }
}

/** Persist dashboard to local store */
async function dashboardSave(): Promise<void> {
  try {
    const idb = await IndexedDb.connection()
    await idb.put(DASHBOARD_STORE, { ...dashboardStore, key: DASHBOARD_STORE })
  } catch (_error) {
    // TODO
  }
}

/** Widgets contract provider */
const dashboardWidgets: DashboardWidgetsContract = {
  /** Create and persist a widget, then reflect it in local store. */
  add: async (rowId, widget): Promise<void> => {
    await dashboardWidgets.update(rowId, widget)
  },

  /** Persist widget updates and keep store in sync. */
  update: async (rowId, widget): Promise<void> => {
    setDashboardStore(
      produce(store => {
        const widgets = rowId
          ? store.rows.find(row => row.key === rowId)?.widgets
          : store.header.widgets
        if (!widgets) return // TODO

        const index = widgets.findIndex(item => item.key === widget.key)
        if (index < 0) widgets.push(widget)
        else widgets[index] = widget
      })
    )
    await dashboardSave()
  },

  /** Delete widget from store and persistence layer. */
  remove: async (rowId, key): Promise<void> => {
    setDashboardStore(
      produce(store => {
        const widgets = rowId
          ? store.rows.find(row => row.key === rowId)?.widgets
          : store.header.widgets
        if (!widgets) return // TODO

        const index = widgets.findIndex(widget => widget.key === key)
        if (index < 0) return
        widgets.splice(index, 1)
      })
    )
    await dashboardSave()
  },

  /** Reorder widgets by swapping positional/sort fields. */
  move: async (rowId, key, direction): Promise<void> => {
    setDashboardStore(
      produce(store => {
        const widgets = rowId
          ? store.rows.find(row => row.key === rowId)?.widgets
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
const dashboardRows: DashboardRowContract = {
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
