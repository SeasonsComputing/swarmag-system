/**
 * swarmAg Administration Application
 */

// Package configuration must initialize before application dependencies.
import '@front/config/ux-config.ts'

// bootstrap
import { bootstrap } from '@ux/shell/runtime/bootstrap.tsx'

// shell bindings
import { Onboarding } from '@front/app-admin/onboarding/onboarding.tsx'
import { UserManager } from '@front/app-admin/users/user-manager.tsx'
import { SessionCoordinator } from '@front/app/shell/session-coordinator.ts'
import { makeAnonymousShell, makeDashboardShell } from '@front/app/shell/shell-makers.tsx'
import { widgetRegistry as appWidgetRegistry } from '@front/app/widgets/widget-registry.ts'
import { Routes } from '@ux/shell/runtime/shell.ts'
import { widgetRegistry as uxWidgetRegistry } from '@ux/widgets/widget-registry.ts'

// application specialalized dashboard
import dashboardSeed from './dashboard-admin.json' with { type: 'json' }

// bootstrap application
void bootstrap(
  Routes.application([
    makeAnonymousShell(),
    makeDashboardShell(dashboardSeed, { ...uxWidgetRegistry(), ...appWidgetRegistry() }, [
      Routes.workbench('/onboarding', Onboarding),
      Routes.workbench('/users', UserManager)
    ])
  ], SessionCoordinator)
)
