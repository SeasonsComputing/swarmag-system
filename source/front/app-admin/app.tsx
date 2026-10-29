/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Admin application                                                            ║
║ swarmAg administration application entrypoint.                               ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

// initialize config 1st
import '@front/config/ux-config.ts'

// bootstrap
import { bootstrap } from '@ux/shell/runtime/bootstrap.tsx'

// shell bindings
import { AssetTypeManager } from '@front/app-admin/asset-types/asset-type-manager.tsx'
import { AssetManager } from '@front/app-admin/assets/asset-manager.tsx'
import { ChemicalManager } from '@front/app-admin/chemicals/chemical-manager.tsx'
import { CustomerManager } from '@front/app-admin/customers/customer-manager.tsx'
import { OnboardingWizard } from '@front/app-admin/onboarding/onboarding-wizard.tsx'
import { ServiceManager } from '@front/app-admin/services/service-manager.tsx'
import { UserManager } from '@front/app-admin/users/user-manager.tsx'
import { SessionCoordinator } from '@front/app/shell/session-coordinator.ts'
import { makeAnonymousShell, makeDashboardShell } from '@front/app/shell/shell-makers.tsx'
import { AppWidgetRegistry } from '@front/app/widgets/widget-registry.ts'
import { Routes } from '@ux/shell/runtime/shell.ts'
import { UxWidgetRegistry } from '@ux/widgets/widget-registry.ts'

// application specialalized dashboard
import dashboardSeed from './dashboard-admin.json' with { type: 'json' }

// bootstrap application
void bootstrap(
  Routes.application([
    makeAnonymousShell(),
    makeDashboardShell(dashboardSeed, { ...UxWidgetRegistry, ...AppWidgetRegistry }, [
      Routes.workbench('/onboarding', OnboardingWizard),
      Routes.workbench('/users', UserManager),
      Routes.workbench('/customers', CustomerManager),
      Routes.workbench('/asset-types', AssetTypeManager),
      Routes.workbench('/assets', AssetManager),
      Routes.workbench('/chemicals', ChemicalManager),
      Routes.workbench('/services', ServiceManager)
    ])
  ], SessionCoordinator)
)
