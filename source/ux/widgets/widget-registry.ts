/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Widget registry                                                              ║
║ Generic widget catalog, bound by each application composition root.          ║
╚══════════════════════════════════════════════════════════════════════════════╝

PUBLIC
───────────────────────────────────────────────────────────────────────────────
UxWidgetRegistry  Generic widget catalog.
└ HelmWidget      Dashboard header navigation controls.
*/

import type { WidgetRegistry } from '@ux/shell/dashboard/widget-contract.ts'
import { HelmWidget } from './helm-widget.tsx'

/** Generic widget catalog. */
export const UxWidgetRegistry: WidgetRegistry = { HelmWidget }
