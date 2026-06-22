/**
 * Dashboard widget catalog barrel.
 */

import { ActionWidget } from '@ux/common/widgets/action-widget.tsx'
import { BrandWidget } from '@ux/common/widgets/brand-widget.tsx'
import type { WidgetRegistry } from './widget-provider.tsx'

/** Dashboard widget registry. */
export const WidgetCatalog: WidgetRegistry = { BrandWidget, ActionWidget }
