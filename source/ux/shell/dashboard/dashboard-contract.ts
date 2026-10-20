/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Dashboard contract                                                           ║
║ UX projection types for dashboard layout configuration and rendering.        ║
╚══════════════════════════════════════════════════════════════════════════════╝

PUBLIC
───────────────────────────────────────────────────────────────────────────────
DashboardWidgetSettings  Widget layout and component settings.
└ shape                  Compact or landscape.
DashboardWidget          Widget reference.
├ type                   Component type.
└ settings               Widget settings.
DashboardRowHeader       Row header.
├ size                   Standard or short.
└ label                  Row label.
DashboardWidgets         Widget collection.
└ widgets                Widgets in display order.
DashboardRow             Row header with its widgets.
DashboardHeader          Header widget strip.
DashboardSettings        Dashboard feature settings.
Dashboard                Settings, header strip, and rows.
├ settings               Feature settings.
├ header                 Header widget strip.
└ rows                   Rows in display order.
*/

import type { Dictionary } from '@core/std'

/** Dashboard widget layout and component settings. */
export type DashboardWidgetSettings = Dictionary & {
  shape: 'compact' | 'landscape'
}

/** A single dashboard widget reference with component type and settings. */
export type DashboardWidget = {
  type: string
  settings: DashboardWidgetSettings
}

/** A dashboard row header with display size height and label */
export type DashboardRowHeader = {
  size: 'standard' | 'short'
  label: string
}

/** Widget collection */
export type DashboardWidgets = {
  widgets: DashboardWidget[]
}

/** A dashboard row is a union of a row header and widget set  */
export type DashboardRow = DashboardRowHeader & DashboardWidgets

/** The dashboard header is a special row of widgets */
export type DashboardHeader = DashboardWidgets

/** Dashboard feature settings. */
export type DashboardSettings = Dictionary

/** Dashboard — settings, header widget strip, and row collection. */
export type Dashboard = {
  settings: DashboardSettings
  header: DashboardHeader
  rows: DashboardRow[]
}
