/**
 * UX projection types for dashboard layout configuration and rendering.
 */

import { Dictionary } from '@core/std'

/** A single dashboard widget reference with display size and component type. */
export type DashboardWidget =  {
  size: 'square' | 'landscape'
  type: string
  settings: Dictionary
}

/** Map of id to widget */
export type DashboardWidgetMap = { [key: string]: DashboardWidget }

/** A dashboard row with display size, label, and widget map. */
export type DashboardRow =  {
  size: 'standard' | 'short'
  label: string
  widgets: DashboardWidgetMap
}

/** Map of id to row */
export type DashboardRowMap = { [key: string]: DashboardRow }

/** Default dashboard view — header widget strip and row collection. */
export type DashboardView = {
  header: DashboardWidgetMap
  rows: DashboardRowMap
}
