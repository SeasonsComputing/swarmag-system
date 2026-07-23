# swarmAg Operations System — Genesis: Dashboard + User Management

**CE Spec · Ephemeral · Feature Mode**

## 1. Goal

Deliver the dashboard foundation and user management page for `app-admin`. This is the first feature session after a validated login. When complete, an authenticated admin can view the dashboard, navigate to the Users page, and list, edit, deactivate, and soft-delete users.

## 2. Operating Mode

**Feature Mode.** All work is additive inside established architecture. No domain model changes, no migration, no shared contract changes. If any of the below reveal a need to change architecture or shared contracts, stop and escalate to Foundation Mode.

## 3. Scope

### 3.1 Create

| File                                                    | Purpose                                        |
| ------------------------------------------------------- | ---------------------------------------------- |
| `source/front/ux/shell/abstraction-manager-contract.ts` | Provider interface                             |
| `source/front/ux/shell/abstraction-manager.tsx`         | Generic list+dialog manager component          |
| `source/front/ux/shell/widget-provider.tsx`             | WidgetProvider context + useWidgets hook       |
| `source/front/ux/shell/widgets-header-catalog.ts`       | Header widget sub-catalog                      |
| `source/front/ux/shell/widgets-catalog.ts`              | Widget catalog barrel                          |
| `source/front/ux/shell/dashboard.tsx`                   | Dashboard root component                       |
| `source/front/ux/shell/dashboard.css`                   | Feature-layer CSS for dashboard                |
| `source/front/ux/widgets/brand-widget.tsx`              | BrandWidget                                    |
| `source/front/ux/widgets/action-widget.tsx`             | ActionWidget                                   |
| `source/front/app-admin/users/user-manager.tsx`         | UserManager — AbstractionManagerContract<User> |
| `source/front/app-admin/users/users.css`                | Feature-layer CSS for users page               |

### 3.2 Modify

| File                                          | Change                                                                               |
| --------------------------------------------- | ------------------------------------------------------------------------------------ |
| `source/front/ux/shell/bootstrap.tsx`         | Wrap app in WidgetProvider; add dashboard + users routes to tree; export `rootRoute` |
| `source/front/app-admin/app.tsx`              | Add usersRoute; call `bootstrap(dashboardSeed, [usersRoute])`                        |
| `source/front/app-admin/dashboard-admin.json` | Add `settings`; add BrandWidget + ActionWidget to header                             |

## 4. Architectural Decisions

### 4.1 Dashboard Layout

Dashboard renders its rows in order. `Dashboard.settings` remains available for
dashboard-specific configuration that does not alter this presentation structure.

**Row layout (default):**

```
[data-ui='dashboard']
  ├── [data-ui='dashboard-header']    ← fixed height, card-panel surface, X-scrolling flex row
  ├── [data-ui='dashboard-body']      ← flex-grow, Y-scrolling column of rows
  │     └── [data-ui='dashboard-row'] ← per row: labeled header + X-scrolling widget strip (tall)
  └── UiFooter
```

### 4.2 WidgetProvider

Mirrors RouterProvider. `bootstrap()` wraps the application in `WidgetProvider` with `WidgetCatalog` as the registry value. `Dashboard` calls `useWidgets()` to resolve widget type strings to component functions. No widget registry parameter on `bootstrap()`.

```
Application
  └─ WidgetProvider (registry={WidgetCatalog})
       └─ RouterProvider (router={router})
```

### 4.3 Widget Catalog Layering

```
widgets-catalog-{category}.ts    ← future
  ↑
widgets-catalog.ts               ← barrel, merges sub-catalogs → WidgetCatalog
```

### 4.4 AbstractionManager Pattern

`AbstractionManager` is a generic component that takes a provider implementing `AbstractionManagerContract<T>`. All forms must be reactive from side-by-side to panel-to-panel.

## 5. Code Contracts

### 5.1 Types

```typescript
// widget-provider.tsx
export type WidgetComponent = (props: { settings: Dictionary }) => UiComponent
export type WidgetRegistry = Dictionary<WidgetComponent>
```

### 5.2 AbstractionManagerContract

```typescript
// common/shell/abstraction-manager-contract.ts
import type { Instance } from '@core/std'
import type { UiComponent } from '@front/ux/ui'

export interface AbstractionManagerContract<T extends Instance> {
  entityLabel: string
  listColumns: string[]
  list: () => T[]
  isListLoading: () => boolean
  renderListRow: (item: T) => UiComponent
  renderForm: (item: T | null, onClose: () => void) => UiComponent
}
```

### 5.3 WidgetProvider

```typescript
// common/shell/widget-provider.tsx
const WidgetContext = createContext<WidgetRegistry>({})

export const WidgetProvider = (props: { registry: WidgetRegistry; children: UiComponent }) => (
  <WidgetContext.Provider value={props.registry}>{props.children}</WidgetContext.Provider>
)

export const useWidgets = (): WidgetRegistry => useContext(WidgetContext)
```

### 5.4 Widget Catalog

```typescript
// widgets-catalog.ts
import { ActionWidget } from '@front/ux/widgets/action-widget.tsx'
import { BrandWidget } from '@front/ux/widgets/brand-widget.tsx'

export const WidgetCatalog: WidgetRegistry = { BrandWidget, ActionWidget }
```

### 5.5 Dashboard CSS

```css
/* dashboard.css */

[data-ui='dashboard'] {
  display: flex;
  flex-direction: column;
  block-size: 100dvh;
  overflow: hidden;
}

[data-ui='dashboard-header'] {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: var(--sa-rhythm-gap);
  padding-inline: var(--sa-rhythm-pad);
  background: var(--sa-card-panel-bg);
  border-block-end: var(--sa-card-panel-border);
  box-shadow: var(--sa-card-panel-shadow);
  overflow-x: auto;
}

/* Row layout (default) */
[data-ui='dashboard-body'] {
  flex: 1 1 auto;
  overflow-y: auto;
  padding: var(--sa-rhythm-pad);
  display: flex;
  flex-direction: column;
  gap: var(--sa-rhythm-gap);
}

[data-ui='dashboard-row'] {
  display: flex;
  flex-direction: column;
  gap: var(--sa-rhythm-gap);
}

[data-ui='dashboard-row-label'] {
  ...
}

[data-ui='dashboard-row-widgets'] {
  display: flex;
  flex-direction: row;
  gap: var(--sa-rhythm-gap);
  overflow-x: auto;
}
```

### 5.6 ActionWidget Settings

```json
{
  "type": "ActionWidget",
  "settings": {
    "shape": "landscape",
    "actions": ["/users", "/logout"],
    "labels": ["User Management", "Logout"],
    "icons": ["person", "exit"]
  }
}
```

ActionWidget zips `settings.actions` and `settings.labels`, renders one `UiButton variant='secondary'` per pair, uses `useNavigate()` from `@tanstack/solid-router`.

### 5.7 BrandWidget

No props. Calls `getShellIdentity()` from `@front/ux/shell/shell-metadata.ts`. Renders `productName` and `applicationName`. No `UiCard` wrapper — header surface is already card-panel. `UiLayout variant='block-fit'` for internal stacking.

### 5.8 bootstrap.tsx Changes

- Signature stays `bootstrap(seed: unknown, routes: AnyRoute[] = [])`
- Import `WidgetCatalog` from `widgets-catalog.ts`
- Wrap `Application` in `WidgetProvider` above `RouterProvider`
- Export `rootRoute` so `app.tsx` can reference it via `getParentRoute`
- Route tree: `rootRoute.addChildren([indexRoute, loginRoute, logoutRoute, dashboardRoute, ...routes])`

### 5.9 app.tsx (app-admin)

```typescript
import { UserManager } from '@front/app-admin/users/user-manager.tsx'
import { AuthGuard } from '@front/ux/shell/auth-guard.tsx'
import { bootstrap, rootRoute } from '@front/ux/shell/bootstrap.tsx'
import { Content } from '@front/ux/shell/content.tsx'
import { createRoute } from '@tanstack/solid-router'
import dashboardSeed from './dashboard-admin.json' with { type: 'json' }

const usersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users',
  component: () => (
    <AuthGuard>
      <Content>
        <UserManager />
      </Content>
    </AuthGuard>
  )
})

void bootstrap(dashboardSeed, [usersRoute])
```

### 5.10 dashboard-admin.json

Add `settings` at the top level. Add BrandWidget and ActionWidget to header:

```json
{
  "settings": {},
  "header": {
    "widgets": [
      { "type": "BrandWidget", "settings": { "shape": "landscape" } },
      {
        "type": "ActionWidget",
        "settings": {
          "shape": "landscape",
          "actions": ["/users", "/logout"],
          "labels": ["User Management", "Logout"]
        }
      }
    ]
  },
  "rows": []
}
```

### 5.11 UserManager Provider

```typescript
// app-admin/users/user-manager.tsx
const provider: AbstractionManagerContract<User> = {
  entityLabel: 'User',
  listColumns: ['Name', 'Email', 'Roles', 'Status'],
  list: () => usersQuery.data ?? [],
  isListLoading: () => usersQuery.isLoading,
  renderListRow: (user) => (
    // UiTableRow
    // UiBadge per role
    // UiBadge variant='success' for active, variant='warning' for inactive
  ),
  renderForm: (user, onClose) => (
    // UiCard variant='workflow'
    // UiField + UiInput: name (editable), phone (editable)
    // Email: read-only text — auth.users sync deferred
    // UiField variant='caption' + UiMultiSelect: roles (USER_ROLES)
    // UiField + UiSingleSelect: status (USER_STATUSES)
    // UiFormActions: Save (primary), Cancel (ghost), Deactivate/Activate (secondary), Delete (danger)
  )
}

const roleOptions: UiOption[] = USER_ROLES.map(r => ({ value: r }))
const statusOptions: UiOption[] = USER_STATUSES.map(s => ({ value: s }))
```

### 5.12 Authentication Synchronization

- `api.userUpdateSynchAuth()` — update user, keeping authentication in sync with auth.users
- `api.userCreateSynchAuth()` — create new user, keeping authentication in sync with auth.users
- `api.userRevokeAuth()` — remove user from authentication, leaving their data in the database
