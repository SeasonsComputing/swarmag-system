/**
 * swarmAg Operations Application
 */

// bootstrap -- must be first
import { bootstrap } from '@front/ux/shell/bootstrap.tsx'

// shell bindings
import { makeAnonymousShell, makeDashboardShell } from '@front/ux/shell/shell-makers.tsx'
import { application } from '@front/ux/shell/shell.ts'
import { widgetRegistry } from '@front/ux/widgets/widget-registry.ts'

// application specialalized dashboard
import dashboardSeed from './dashboard-ops.json' with { type: 'json' }

// bootstrap application
void bootstrap(
  application([
    makeAnonymousShell(),
    makeDashboardShell(dashboardSeed, widgetRegistry(), [])
  ])
)
