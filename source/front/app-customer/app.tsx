/**
 * swarmAg Customer Application
 */

// bootstrap -- must be first
import { bootstrap } from '@front/ux/shell/bootstrap.tsx'

// shell bindings
import dashboardSeed from './dashboard-customer.json' with { type: 'json' }

void bootstrap(dashboardSeed)
