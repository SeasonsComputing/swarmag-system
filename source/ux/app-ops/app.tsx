/**
 * swarmAg Operations Application
 */

import { bootstrap } from '@ux/common/shell/bootstrap.tsx'
import dashboardSeed from './dashboard-ops.json' with { type: 'json' }

void bootstrap(dashboardSeed)
