/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Widget registry                                                              ║
║ Catalog of available widgets.                                                ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Creates the concrete widget registry bound by each application composition root.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
widgetRegistry  Creates the concrete widget registry.
*/

import type { WidgetRegistry } from '@front/ux/shell/widget-contract.ts'
import { BrandWidget } from './brand-widget.tsx'
import { HelmWidget } from './helm-widget.tsx'

/** Create the widget registry. */
export const widgetRegistry = (): WidgetRegistry => ({
  BrandWidget,
  HelmWidget
})
