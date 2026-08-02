/**
 * swarmAg Operations Application
 */

// bootstrap -- must be first
import { bootstrap } from '@front/ux/shell/bootstrap.tsx'

// shell bindings
import { anonymousShell, dashboardShell } from '@front/ux/shell/shell-registry.tsx'
import { application } from '@front/ux/shell/shell.ts'
import { widgetRegistry } from '@front/ux/widgets/widget-registry.ts'
import dashboardSeed from './dashboard-ops.json' with { type: 'json' }

// bootstrap application
void bootstrap(
  application([
    anonymousShell(),
    dashboardShell('/dashboard', dashboardSeed, widgetRegistry(), [])
  ])
)
