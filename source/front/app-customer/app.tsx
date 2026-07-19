/**
 * swarmAg Customer Application
 */

// bootstrap -- must be first
import { bootstrap } from '@front/ux/shell/bootstrap.tsx'

// shell bindings
import { ActionWidget } from '@front/ux/widgets/action-widget.tsx'
import { BrandWidget } from '@front/ux/widgets/brand-widget.tsx'
import dashboardSeed from './dashboard-customer.json' with { type: 'json' }

void bootstrap(dashboardSeed, { widgets: { BrandWidget, ActionWidget } })
