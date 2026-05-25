/**
 * swarmAg Administrative Application
 */

import { bootstrap } from '@ux/common/components/shell/bootstrap.tsx'

import '@ux/common/assets/css/tokens.css'
import '@ux/common/assets/css/themes.css'
import '@ux/common/assets/css/base.css'
import '@ux/common/assets/css/controls.css'

import dashboardSeed from './dashboard-admin.json' with { type: 'json' }

void bootstrap(dashboardSeed)
