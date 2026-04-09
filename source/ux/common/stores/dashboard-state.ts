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
import type { DashboardRow, DashboardView, DashboardWidget } from '@ux/common/views/dashboard-views.ts'
import { apiError } from '@core/api/api-contract.ts'

// ───────────────────────────────────────────────────────────────────────────────
// DASHBOARD STATE CONTRACT
// ───────────────────────────────────────────────────────────────────────────────

/** Movement of widgets in the layout */
type MoveDirection = 'backward' | 'forward'

/** Widget contract */
interface DashboardWidgetsContract {
  add(rowId: string, id: string, row: DashboardWidget): Promise<void>
  update(id: string, widget: DashboardWidget): Promise<void>
  remove(rowId: string, id: string): Promise<void>
  move(rowId: string, id: string, direction: MoveDirection): Promise<void>
}

/** Header contract */
interface DashboardHeaderContract {
  add(id: string, widget: DashboardWidget): Promise<void>
  update(widget: DashboardWidget): Promise<void>
  remove(id: string): Promise<void>
  move(id: string, direction: MoveDirection): Promise<void>
}

/** Row contract */
interface DashboardRowContract {
  add(id: string, row: DashboardRow): Promise<void>
  remove(id: string): Promise<void>
  move(id: string, direction: MoveDirection): Promise<void>
}

// ───────────────────────────────────────────────────────────────────────────────
// DASHBOARD STATE IMPLEMENTATION
// ───────────────────────────────────────────────────────────────────────────────

const DASHBOARD_STORE = 'DashboardViewStore'
const NULL_VIEW: DashboardView = { header: {}, rows: {} }
const [dashboardStore, setDashboardStore] = createStore<DashboardView>(NULL_VIEW)

/** Initialize store from db or seed */
async function dashboardInit(seed: DashboardView): Promise<void> {
  IndexedDb.registerStore(DASHBOARD_STORE)
  try {
    const db = await IndexedDb.connection()
    const view = await db.get(DASHBOARD_STORE, DASHBOARD_STORE)
    if (!view) db.put(DASHBOARD_STORE, seed)
    setDashboardStore(view ?? seed)
  } catch (err) {
    apiError(err)
  }
}

/** TODO */
async function dashboardRowsOrdered(): Promise<[[]]> {
  // TODO
  return []
}

/** TODO */
async function dashboardWidgetsOrdered(rowId: Id): Promise<DashboardWidget[]> {
  // TODO
  return []
}

/** Dashboard header ordered widgets */
async function dashboardHeaderOrdered(): Promise<DashboardWidget[]> {
  return await dashboardWidgetsOrdered(HEADER_ROW_ID)
}

/** Widgets contract provider */
const dashboardWidgets: DashboardWidgetsContract = {
  /** Create and persist a widget, then reflect it in local store. */
  add: async (rowId, state): Promise<void> => {
    // TODO
  },

  /** Persist widget updates and keep store in sync. */
  update: async (rowId, w): Promise<void> => {
    // TODO
  },

  /** Delete widget from store and persistence layer. */
  remove: async (rowId, id): Promise<void> => {
    // TODO
  },

  /** Reorder widgets by swapping positional/sort fields. */
  move: async (rowId, id, direction): Promise<void> => {
    // TODO
  }
}

/** Widget contract provider */
const dashboardHeader: DashboardHeaderContract = {
  /** Delegate row provider. */
  add: async (id, state): Promise<void> => await dashboardWidgets.add(HEADER_ROW_ID, id, state),
  update: async (w): Promise<void> => await dashboardWidgets.update(HEADER_ROW_ID, w),
  remove: async (id): Promise<void> => await dashboardWidgets.remove(HEADER_ROW_ID, id),
  move: async (id, dir): Promise<void> => await dashboardWidgets.move(HEADER_ROW_ID, id, dir)
}

/** Row contract provider */
const dashboardRows: DashboardRowContract = {
  /** Create and persist a dashboard row, then append to local store. */
  add: async (state): Promise<void> => {
    const sequence = Object.entries(dashboardStore.rows).length + 1
    const row = await db.Rows.create({ ...state, sequence })
    setDashboardStore('rows', row.id, {
      id: row.id,
      size: row.size,
      label: row.label,
      widgets: {}
    })
  },

  /** Remove row from store and persistence; rely on cascading widget cleanup. */
  remove: async (id): Promise<void> => {
    setDashboardStore('rows', produce(rows => delete rows[id]))
    await db.Rows.delete(id)
  },

  /** Reorder rows by swapping positional/sort fields and persisting changes. */
  move: async (id, dir): Promise<void> => {
    const rows = await dashboardRowsOrdered()
    const index = rows.findIndex(r => r.id === id)
    if (index < 0) return

    const target = dir === 'backward' ? index - 1 : index + 1
    if (target < 0 || target >= rows.length) return

    // 1. reorder in memory
    const [item] = rows.splice(index, 1)
    rows.splice(target, 0, item)

    // 2. renumber sequences (1..n)
    const updates = rows.map((row, i) => ({ id: row.id, sequence: i + 1 }))

    // 3. persist
    await Promise.all(updates.map(db.Rows.update))
  }
}

const DashboardState = {
  store: dashboardStore,
  init: dashboardInit,
  header: dashboardHeader,
  rows: dashboardRows,
}

export { DashboardState }
