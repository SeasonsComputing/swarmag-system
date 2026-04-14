/**
 * UX projection types for dashboard layout configuration and rendering.
 */

import { Dictionary } from '@core/std'

/** A single dashboard widget reference with display size and component type. */
export type DashboardWidget = {
  key: string
  shape: 'square' | 'landscape'
  type: string
  settings: Dictionary
}

/** A dashboard row with display size, label, and widget map. */
export type DashboardRow = {
  key: string
  size: 'standard' | 'short'
  label: string
  widgets: DashboardWidget[]
}

/** The dashboard header and its widgets */
export type DashboardHeader = {
  widgets: DashboardWidget[]
}

/** Default dashboard view — header widget strip and row collection. */
export type DashboardView = {
  header: DashboardHeader
  rows: DashboardRow[]
}
