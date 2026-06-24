/**
 * swarmAg Administration Application
 */

// bootstrap -- must be first
import { bootstrap } from '@ux/common/shell/bootstrap.tsx'

// shell bindings
import { UsersForm } from '@ux/app-admin/users/users-form.tsx'
import dashboardSeed from './dashboard-admin.json' with { type: 'json' }

void bootstrap(dashboardSeed, {
  dialogs: [
    {
      path: '/users',
      component: UsersForm,
      dialog: { size: 'workbench' }
    }
  ]
})
