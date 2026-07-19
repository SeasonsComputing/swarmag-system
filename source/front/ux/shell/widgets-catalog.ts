/**
 * Dashboard widget catalog barrel.
 */

import { ActionWidget } from '@front/ux/widgets/action-widget.tsx'
import { BrandWidget } from '@front/ux/widgets/brand-widget.tsx'
import type { WidgetRegistry } from './dashboard-provider.tsx'

/** Dashboard widget registry. */
export const WidgetCatalog: WidgetRegistry = { BrandWidget, ActionWidget }
