/**
 * swarmAg Operations Application
 */

// bootstrap -- must be first
import { bootstrap } from '@front/ux/shell/bootstrap.tsx'

// shell bindings
import dashboardSeed from './dashboard-ops.json' with { type: 'json' }

void bootstrap(dashboardSeed)
