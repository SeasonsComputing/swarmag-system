/**
 * swarmAg Operations Application
 */

// Package configuration must initialize before application dependencies.
import '@front/config/ux-config.ts'

// bootstrap
import { bootstrap } from '@front/ux/shell/bootstrap.tsx'

// shell bindings
import { SessionCoordinator } from '@front/app/shell/session-coordinator.ts'
import { makeAnonymousShell, makeDashboardShell } from '@front/app/shell/shell-makers.tsx'
import { widgetRegistry as appWidgetRegistry } from '@front/app/widgets/widget-registry.ts'
import { Routes } from '@front/ux/shell/shell.ts'
import { widgetRegistry as uxWidgetRegistry } from '@front/ux/widgets/widget-registry.ts'

// application specialalized dashboard
import dashboardSeed from './dashboard-ops.json' with { type: 'json' }

// bootstrap application
void bootstrap(
  Routes.application([
    makeAnonymousShell(),
    makeDashboardShell(dashboardSeed, { ...uxWidgetRegistry(), ...appWidgetRegistry() }, [])
  ], SessionCoordinator)
)
