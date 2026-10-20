/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Widget registry                                                              ║
║ swarmAg-suite widget catalog, composed by each application root.             ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import type { WidgetRegistry } from '@ux/shell/dashboard/widget-contract.ts'
import { BrandWidget } from './brand-widget.tsx'

/** swarmAg-suite widget catalog. */
export const AppWidgetRegistry: WidgetRegistry = { BrandWidget }
