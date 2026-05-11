/**
 * swarmAg Customer Application
 */

import { bootstrap } from '@ux/common/components/shell/bootstrap.tsx'
import dashboardSeed from './dashboard-customer.json' with { type: 'json' }

void bootstrap(dashboardSeed)
