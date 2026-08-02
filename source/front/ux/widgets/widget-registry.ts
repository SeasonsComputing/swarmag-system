/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Widget registry                                                              ║
║ Catalog of available widgets.                                                ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import { BrandWidget } from './brand-widget.tsx'
import { HelmWidget } from './helm-widget.tsx'
import type { WidgetRegistry } from './widget.tsx'

/** Create the widget registry. */
export const widgetRegistry = (): WidgetRegistry => ({
  'BrandWidget': BrandWidget,
  'HelmWidget': HelmWidget
})
