/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Widget registry                                                              ║
║ Catalog of available widgets.                                                ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Provides the generic widget catalog bound by each application composition root.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
UxWidgetRegistry  Generic widget catalog.
*/

import type { WidgetRegistry } from '@ux/shell/dashboard/widget-contract.ts'
import { HelmWidget } from './helm-widget.tsx'

/** Generic widget catalog. */
export const UxWidgetRegistry: WidgetRegistry = {
  HelmWidget
}
