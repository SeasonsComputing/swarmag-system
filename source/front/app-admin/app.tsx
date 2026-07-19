/**
 * swarmAg Administration Application
 */

// bootstrap -- must be first
import { bootstrap } from '@front/ux/shell/bootstrap.tsx'

// shell bindings
import { UserManager } from '@front/app-admin/users/user-manager.tsx'
import { ActionWidget } from '@front/ux/widgets/action-widget.tsx'
import { BrandWidget } from '@front/ux/widgets/brand-widget.tsx'
import dashboardSeed from './dashboard-admin.json' with { type: 'json' }

void bootstrap(dashboardSeed, {
  widgets: { BrandWidget, ActionWidget },
  dialogs: [
    {
      path: '/users',
      component: UserManager,
      dialog: { size: 'workbench' }
    }
  ]
})
