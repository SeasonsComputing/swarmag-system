/**
 * swarmAg Customer Application
 */

// bootstrap -- must be first
import { bootstrap } from '@front/ux/shell/bootstrap.tsx'

// shell bindings
import { anonymousShell, application, dashboardShell } from '@front/ux/shell/shell.tsx'
import { widgetRegistry } from '@front/ux/widgets/widget-registry.ts'
import dashboardSeed from './dashboard-customer.json' with { type: 'json' }

// bootstrap application
void bootstrap(
  application([
    anonymousShell(),
    dashboardShell('/dashboard', dashboardSeed, widgetRegistry(), [])
  ])
)
