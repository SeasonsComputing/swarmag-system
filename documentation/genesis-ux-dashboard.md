# swarmAg Operations System — Genesis: Dashboard + User Management

**CE Spec · Ephemeral · Feature Mode**

## 1. Goal

Deliver the dashboard foundation and user management page for `app-admin`. This is the first feature session after a validated login. When complete, an authenticated admin can view the dashboard, navigate to the Users page, and list, edit, deactivate, and soft-delete users.

## 2. Operating Mode

**Feature Mode.** All work is additive inside established architecture. No domain model changes, no migration, no shared contract changes. If any of the below reveal a need to change architecture or shared contracts, stop and escalate to Foundation Mode.

## 3. Scope

### 3.1 Create

| File                                                  | Purpose                                   |
| ----------------------------------------------------- | ----------------------------------------- |
| `source/ux/common/shell/abstraction-form-contract.ts` | Strategy interface                        |
| `source/ux/common/shell/abstraction-form.tsx`         | Generic list+dialog form component        |
| `source/ux/common/shell/widget-provider.tsx`          | WidgetProvider context + useWidgets hook  |
| `source/ux/common/shell/widgets-header-catalog.ts`    | Header widget sub-catalog                 |
| `source/ux/common/shell/widgets-catalog.ts`           | Widget catalog barrel                     |
| `source/ux/common/shell/dashboard.tsx`                | Dashboard root component                  |
| `source/ux/common/shell/dashboard.css`                | Feature-layer CSS for dashboard           |
| `source/ux/common/widgets/brand-widget.tsx`           | BrandWidget                               |
| `source/ux/common/widgets/action-widget.tsx`          | ActionWidget                              |
| `source/ux/app-admin/users/users-form.tsx`            | UsersForm — AbstractionFormContract<User> |
| `source/ux/app-admin/users/users.css`                 | Feature-layer CSS for users page          |

### 3.2 Modify

| File                                         | Change                                                                               |
| -------------------------------------------- | ------------------------------------------------------------------------------------ |
| `source/ux/common/shell/bootstrap.tsx`       | Wrap app in WidgetProvider; add dashboard + users routes to tree; export `rootRoute` |
| `source/ux/app-admin/app.tsx`                | Add usersRoute; call `bootstrap(dashboardSeed, [usersRoute])`                        |
| `source/ux/app-admin/dashboard-admin.json`   | Add `settings`; add BrandWidget + ActionWidget to header                             |

## 4. Architectural Decisions

### 4.1 Dashboard Layout

Dashboard supports two layout modes, toggled via `Dashboard.settings.layout`.

**Row layout (default):**

```
[data-ui='dashboard']
  ├── [data-ui='dashboard-header']    ← fixed height, card-panel surface, X-scrolling flex row
  ├── [data-ui='dashboard-body']      ← flex-grow, Y-scrolling column of rows
  │     └── [data-ui='dashboard-row'] ← per row: labeled header + X-scrolling widget strip (tall)
  └── UiFooter
```

**Masonry alternate** (`settings.layout='masonry'`): rows are flatMapped to a single widget list. layout uses masonry grid

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

### 4.4 AbstractionForm Pattern

`AbstractionForm` is a generic component that takes a strategy implementing `AbstractionFormContract<T>`. All forms must be reactive from side-by-side to panel-to-panel.

## 5. Code Contracts

### 5.1 Types

```typescript
// widget-provider.tsx
export type WidgetComponent = (props: { settings: Dictionary }) => UiComponent
export type WidgetRegistry = Dictionary<WidgetComponent>
```

### 5.2 AbstractionFormContract

```typescript
// common/shell/abstraction-form-contract.ts
import type { Instance } from '@core/std'
import type { UiComponent } from '@ux/common/components/ui'

export interface AbstractionFormContract<T extends Instance> {
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
import { ActionWidget } from '@ux/common/widgets/action-widget.tsx'
import { BrandWidget } from '@ux/common/widgets/brand-widget.tsx'

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

/* Masonry alternate */
[data-ui='dashboard'][data-layout='masonry'] [data-ui='dashboard-body'] {
  ...
}
```

### 5.6 ActionWidget Settings

```json
{
  "type": "ActionWidget",
  "settings": {
    "shape": "landscape",
    "actions": ["/users", "/logout"],
    "labels": ["User Management", "Logout"]
  }
}
```

ActionWidget zips `settings.actions` and `settings.labels`, renders one `UiButton variant='secondary'` per pair, uses `useNavigate()` from `@tanstack/solid-router`.

### 5.7 BrandWidget

No props. Calls `getShellIdentity()` from `@ux/common/shell/shell-metadata.ts`. Renders `productName` and `applicationName`. No `UiCard` wrapper — header surface is already card-panel. `UiLayout variant='block-fit'` for internal stacking.

### 5.8 bootstrap.tsx Changes

- Signature stays `bootstrap(seed: unknown, routes: AnyRoute[] = [])`
- Import `WidgetCatalog` from `widgets-catalog.ts`
- Wrap `Application` in `WidgetProvider` above `RouterProvider`
- Export `rootRoute` so `app.tsx` can reference it via `getParentRoute`
- Route tree: `rootRoute.addChildren([indexRoute, loginRoute, logoutRoute, dashboardRoute, ...routes])`

### 5.9 app.tsx (app-admin)

```typescript
import { createRoute } from '@tanstack/solid-router'
import { UsersForm } from '@ux/app-admin/users/users-form.tsx'
import { AuthGuard } from '@ux/common/shell/auth-guard.tsx'
import { bootstrap, rootRoute } from '@ux/common/shell/bootstrap.tsx'
import { Content } from '@ux/common/shell/content.tsx'
import dashboardSeed from './dashboard-admin.json' with { type: 'json' }

const usersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users',
  component: () => (
    <AuthGuard>
      <Content>
        <UsersForm />
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
  "settings": { "layout": "rows" },
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

### 5.11 UsersForm Strategy

```typescript
// app-admin/users/users-form.tsx
const strategy: AbstractionFormContract<User> = {
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
