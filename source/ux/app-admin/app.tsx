/**
 * swarmAg Administration Application
 */

import { bootstrap } from '@ux/common/shell/bootstrap.tsx'
import dashboardSeed from './dashboard-admin.json' with { type: 'json' }

void bootstrap(dashboardSeed)
