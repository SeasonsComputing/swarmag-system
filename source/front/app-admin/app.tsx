/**
 * swarmAg Administration Application
 */

// bootstrap -- must be first
import { bootstrap } from '@front/ux/shell/bootstrap.tsx'

// shell bindings
import { Onboarding } from '@front/app-admin/onboarding/onboarding.tsx'
import { UserManager } from '@front/app-admin/users/user-manager.tsx'
import { anonymousShell, dashboardShell } from '@front/ux/shell/shell-registry.tsx'
import { application, workbench } from '@front/ux/shell/shell.ts'
import { widgetRegistry } from '@front/ux/widgets/widget-registry.ts'
import dashboardSeed from './dashboard-admin.json' with { type: 'json' }

// bootstrap application
void bootstrap(
  application([
    anonymousShell(),
    dashboardShell('/dashboard', dashboardSeed, widgetRegistry(), [
      workbench('/onboarding', Onboarding),
      workbench('/users', UserManager)
    ])
  ])
)
