/**
 * swarmAg Administrative Application
 */

import { bootstrap } from '@ux/common/components/shell/app-root.tsx'
import dashboard from './app-admin-dashboard.json' with { type: 'json' }

void bootstrap(dashboard)
