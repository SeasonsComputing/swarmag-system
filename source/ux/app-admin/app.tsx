/**
 * swarmAg Administration Application
 */

// bootstrap -- must be first
import { bootstrap } from '@ux/common/shell/bootstrap.tsx'

// shell bindings
import { UserManager } from '@ux/app-admin/users/user-manager.tsx'
import dashboardSeed from './dashboard-admin.json' with { type: 'json' }

void bootstrap(dashboardSeed, {
  dialogs: [
    {
      path: '/users',
      component: UserManager,
      dialog: { size: 'workbench' }
    }
  ]
})
