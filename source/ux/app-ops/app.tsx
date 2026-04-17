/**
 * swarmAg Operations Application
 */

import { bootstrap } from '@ux/common/components/shell/app-root.tsx'
import dashboardSeed from './app-ops-dashboard.json' with { type: 'json' }

void bootstrap(dashboardSeed)
