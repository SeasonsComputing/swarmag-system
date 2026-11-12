/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Admin application                                                            ║
║ swarmAg administration application entrypoint.                               ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

// initialize config 1st
import '@front/config/ux-config.ts'

// bootstrap
import { BackgroundTaskWarnings } from '@ux/shell/runtime/background-task-warnings.ts'
import { bootstrap } from '@ux/shell/runtime/bootstrap.tsx'

import { DocumentDrain } from './document-drain.ts'

// shell bindings
import { api } from '@front/api/api.ts'
import { AssetTypeManager } from '@front/app-admin/asset-types/asset-type-manager.tsx'
import { AssetManager } from '@front/app-admin/assets/asset-manager.tsx'
import { ChemicalManager } from '@front/app-admin/chemicals/chemical-manager.tsx'
import { CustomerManager } from '@front/app-admin/customers/customer-manager.tsx'
import { FieldBinderManager } from '@front/app-admin/field-binder/field-binder-manager.tsx'
import { OnboardingWizard } from '@front/app-admin/onboarding/onboarding-wizard.tsx'
import { ServiceManager } from '@front/app-admin/services/service-manager.tsx'
import { UserManager } from '@front/app-admin/users/user-manager.tsx'
import { FieldBinderHelm } from '@front/app/shell/field-binder-helm.ts'
import { FieldBinder } from '@front/app/shell/field-binder.tsx'
import { rootServices } from '@front/app/shell/root-services.ts'
import { SessionCoordinator } from '@front/app/shell/session-coordinator.ts'
import { makeAnonymousShell, makeDashboardShell } from '@front/app/shell/shell-makers.tsx'
import { AppWidgetRegistry } from '@front/app/widgets/widget-registry.ts'
import { Routes } from '@ux/shell/runtime/shell.ts'
import { makeHelmWidget } from '@ux/widgets/make-helm-widget.tsx'
import { UxWidgetRegistry } from '@ux/widgets/widget-registry.ts'

// application specialized dashboard
import dashboardSeed from './dashboard-admin.json' with { type: 'json' }

// bootstrap application
void bootstrap(
  Routes.application(
    [
      makeAnonymousShell(),
      makeDashboardShell(
        dashboardSeed,
        {
          ...UxWidgetRegistry,
          ...AppWidgetRegistry,
          HelmWidget: makeHelmWidget(FieldBinderHelm)
        },
        [
          Routes.workbench('/onboarding', OnboardingWizard),
          Routes.workbench('/users', UserManager),
          Routes.workbench('/customers', CustomerManager),
          Routes.workbench('/asset-types', AssetTypeManager),
          Routes.workbench('/assets', AssetManager),
          Routes.workbench('/chemicals', ChemicalManager),
          Routes.workbench('/services', ServiceManager),
          Routes.workbench('/field-binder-manager', FieldBinderManager),
          Routes.workbench('/field-binder', FieldBinder)
        ]
      )
    ],
    SessionCoordinator
  ),
  rootServices(
    api.FieldBinder.start,
    BackgroundTaskWarnings.start,
    DocumentDrain.start
  )
)
