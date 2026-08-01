/**
 * swarmAg Customer Application
 */

// bootstrap -- must be first
import { bootstrap } from '@front/ux/shell/bootstrap.tsx'

// shell bindings
import { BrandWidget } from '@front/ux/widgets/brand-widget.tsx'
import { HelmWidget } from '@front/ux/widgets/helm-widget.tsx'
import dashboardSeed from './dashboard-customer.json' with { type: 'json' }

void bootstrap(dashboardSeed, { widgets: { BrandWidget, HelmWidget } })
