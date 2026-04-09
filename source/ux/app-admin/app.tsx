/**
 * swarmAg Administrative Application
 */

import { bootstrap } from '@ux/common/components/shell/app.tsx'
import seed from './dashboard-default.json' with { type: 'json' }

void bootstrap(seed)
