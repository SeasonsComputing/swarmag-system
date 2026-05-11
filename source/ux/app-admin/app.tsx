/**
 * swarmAg Administrative Application
 */

import { bootstrap } from '@ux/common/components/shell/bootstrap.tsx'
import dashboardSeed from './dashboard-admin.json' with { type: 'json' }

void bootstrap(dashboardSeed)
