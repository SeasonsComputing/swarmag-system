/**
 * UX projection types for dashboard layout configuration and rendering.
 */

import type { Dictionary } from '@core/std'

/** A single dashboard widget reference with display size and component type. */
export type DashboardWidget = {
  shape: 'square' | 'landscape'
  type: string
  settings: Dictionary
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

/** Default dashboard view — header widget strip and row collection. */
export type DashboardView = {
  header: DashboardHeader
  rows: DashboardRow[]
}
