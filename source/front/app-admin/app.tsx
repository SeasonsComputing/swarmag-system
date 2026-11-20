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
import { api } from '@front/api/api.ts'
import { AssetTypeManager } from '@front/app-admin/asset-types/asset-type-manager.tsx'
import { AssetManager } from '@front/app-admin/assets/asset-manager.tsx'
import { ChemicalManager } from '@front/app-admin/chemicals/chemical-manager.tsx'
import { CustomerManager } from '@front/app-admin/customers/customer-manager.tsx'
import { FieldBinderManager } from '@front/app-admin/field-binder/field-binder-manager.tsx'
import { LibraryDialog } from '@front/app-admin/library/library-dialog.tsx'
import { OnboardingWizard } from '@front/app-admin/onboarding/onboarding-wizard.tsx'
import { ServiceManager } from '@front/app-admin/services/service-manager.tsx'
import { UserManager } from '@front/app-admin/users/user-manager.tsx'
import { FieldBinderDialog } from '@front/app/shell/field-binder/field-binder-dialog.tsx'
import { FieldBinderHelm } from '@front/app/shell/field-binder/field-binder-helm.ts'
import { rootServices } from '@front/app/shell/startup/root-services.ts'
import { SessionCoordinator } from '@front/app/shell/startup/session-coordinator.ts'
import { makeAnonymousShell, makeDashboardShell } from '@front/app/shell/startup/shell-makers.tsx'
import { AppWidgetRegistry } from '@front/app/widgets/widget-registry.ts'
import { BackgroundTaskWarnings } from '@ux/shell/runtime/background-task-warnings.ts'
import { Routes } from '@ux/shell/runtime/shell.ts'
import { makeHelmWidget } from '@ux/widgets/make-helm-widget.tsx'
import { UxWidgetRegistry } from '@ux/widgets/widget-registry.ts'
import { AppDrain } from './app-drain.tsx'

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
          Routes.workbench('/onboarding', OnboardingWizard, { surface: 'frameless' }),
          Routes.workbench('/users', UserManager, { surface: 'frameless' }),
          Routes.workbench('/customers', CustomerManager, { surface: 'frameless' }),
          Routes.workbench('/asset-types', AssetTypeManager, { surface: 'frameless' }),
          Routes.workbench('/assets', AssetManager, { surface: 'frameless' }),
          Routes.workbench('/chemicals', ChemicalManager, { surface: 'frameless' }),
          Routes.workbench('/services', ServiceManager, { surface: 'frameless' }),
          Routes.workbench('/field-binder-manager', FieldBinderManager, { surface: 'frameless' }),
          Routes.sheet('/field-binder', FieldBinderDialog, { surface: 'frameless' }),
          Routes.sheet('/library', LibraryDialog, { surface: 'frameless' })
        ]
      )
    ],
    SessionCoordinator
  ),
  rootServices(
    api.FieldBinder.start,
    BackgroundTaskWarnings.start,
    AppDrain.start
  )
)
