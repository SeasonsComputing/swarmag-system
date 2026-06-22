/**
 * UX projection types for dashboard layout configuration and rendering.
 */

import type { Dictionary } from '@core/std'

/** Dashboard widget layout and component settings. */
export type DashboardWidgetSettings = Dictionary & {
  shape: 'square' | 'landscape'
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

/** Dashboard layout and display settings. */
export type DashboardSettings = Dictionary & {
  layout: 'rows' | 'masonry'
}

/** Dashboard — settings, header widget strip, and row collection. */
export type Dashboard = {
  settings: DashboardSettings
  header: DashboardHeader
  rows: DashboardRow[]
}
