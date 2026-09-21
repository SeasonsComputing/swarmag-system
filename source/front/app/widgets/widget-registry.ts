/** swarmAg-suite widget catalog, composed explicitly by each application root. */

import type { WidgetRegistry } from '@ux/shell/dashboard/widget-contract.ts'
import { BrandWidget } from './brand-widget.tsx'

/** Create the suite widget registry. */
export const widgetRegistry = (): WidgetRegistry => ({ BrandWidget })
