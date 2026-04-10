![swarmAg Operations System](../swarmag-ops-logo.png)

# swarmAg Operations System — Architecture UX

## 1. Overview

This document defines UX-layer architecture for swarmAg applications. It governs UX integration boundaries, architectural composition, and application-specific UX architecture contracts.

### 1.1 Authority Chain

| Document                      | File                        | Intent                                                                                    |
| ----------------------------- | --------------------------- | ----------------------------------------------------------------------------------------- |
| **Canonical Authority Chain** | `architecture-core.md §1.1` | Defines global documentation precedence for the system                                    |
| --> **Architecture UX**       | _(this file)_               | UX-layer architecture contracts, integration boundaries, and app-specific UX architecture |

### 1.2 Scope Boundary of Governing Documents

| Document                   | File                        | Scope Ownership                                                           |
| -------------------------- | --------------------------- | ------------------------------------------------------------------------- |
| **Architecture Core**      | `architecture-core.md`      | System boundary, platform constraints, dependency direction               |
| **Domain Model**           | `domain-model.md`           | Domain meaning consumed by UX architecture                                |
| **Domain Data Dictionary** | `domain-data-dictionary.md` | Canonical namespace and field-level references used by UX contracts       |
| **Domain Archetypes**      | `domain-archetypes.md`      | Domain artifact implementation patterns consumed by UX integrations       |
| **UX Design Language**     | `ux-design-language.md`     | Normative UX language and cross-application interaction patterns          |
| **Architecture UX**        | _(this file)_               | UX-layer boundaries, composition contracts, and app-specific architecture |

## 2. Application Runtime Profiles

| App          | Runtime                      | Storage                            | Deployment        |
| ------------ | ---------------------------- | ---------------------------------- | ----------------- |
| **Admin**    | Browser (desktop/tablet PWA) | Supabase SDK                       | Netlify CDN (PWA) |
| **Ops**      | Browser (mobile PWA)         | IndexedDB offline, Supabase online | Netlify CDN (PWA) |
| **Customer** | Browser (desktop/tablet PWA) | Supabase SDK                       | Netlify CDN (PWA) |

## 3. Technology Stack

| Layer         | Technology                      |
| ------------- | ------------------------------- |
| Framework     | SolidJS (reactive, compiled)    |
| Routing       | TanStack Solid-Router           |
| Data Fetching | TanStack Query                  |
| UI Primitives | Kobalte (accessible components) |
| Styling       | Vanilla CSS (no preprocessor)   |
| Build         | Vite                            |
| Runtime       | Modern browsers (ES2022+)       |

## 4. Key Principles

1. **Apps consume, don't configure** — API namespace pre-composed, just import and use
2. **Types flow from domain** — All data structures defined in `@domain/abstractions/`; UX view types in `@ux/common/views/`
3. **Storage is transparent** — Client makers handle Supabase, IndexedDB, HTTP
4. **Import discipline enforced** — Architectural guards prevent boundary violations
5. **UX design language** — All applications conform to a unified design-language

## 5. Application Suite

The system includes three SolidJS applications:

| Application  | Purpose                           | Primary Users    |
| ------------ | --------------------------------- | ---------------- |
| **Admin**    | Management and configuration      | Leadership staff |
| **Ops**      | Field execution                   | Operations crews |
| **Customer** | Scheduling and status (read-only) | Customers        |

All apps use SolidJS + TanStack + Kobalte + Vanilla CSS. Shared infrastructure lives in `source/ux/common/`.

## 6. API Namespace Integration

### 6.1 Single Composed API

All UX applications consume the **same API namespace** defined in `source/ux/api/api.ts`:

```typescript
import { api } from '@ux/api'

// Auth
await api.Auth.signInWithOtp({ email })

// CRUD — direct to Supabase
const user = await api.Users.get(userId)
const jobs = await api.Jobs.list()

// Offline — IndexedDB
const localJob = await api.JobsLocal.get(jobId)

// Business rules
const title = await api.createJobTitle(jobDefinition)
await api.deepCloneJob.run({ jobId })
```

The API namespace is composed once using client makers (Supabase SDK, IndexedDB, HTTP). Applications consume it directly without configuration or provider selection.

### 6.2 API Namespace Inventory

All entries in `source/ux/api/api.ts`:

| Entry                | Kind                 | Purpose                                              |
| -------------------- | -------------------- | ---------------------------------------------------- |
| `api.Auth`           | `ApiAuthContract`    | Passwordless OTP auth; session management            |
| `api.Users`          | `ApiCrudContract`    | User CRUD via Supabase                               |
| `api.Assets`         | `ApiCrudContract`    | Asset CRUD via Supabase                              |
| `api.Chemicals`      | `ApiCrudContract`    | Chemical CRUD via Supabase                           |
| `api.Customers`      | `ApiCrudContract`    | Customer CRUD via Supabase                           |
| `api.Services`       | `ApiCrudContract`    | Service CRUD via Supabase                            |
| `api.Workflows`      | `ApiCrudContract`    | Workflow CRUD via Supabase                           |
| `api.Jobs`           | `ApiCrudContract`    | Job CRUD via Supabase                                |
| `api.JobsLocal`      | `ApiCrudContract`    | Job aggregate CRUD via IndexedDB (field execution)   |
| `api.deepCloneJob`   | `ApiBusRuleContract` | Clone job aggregate to IndexedDB for field execution |
| `api.uploadJobLogs`  | `ApiBusRuleContract` | Bulk append field logs to remote                     |
| `api.createJobTitle` | method               | Derive display title string from a `JobDefinition`   |

#### 6.2.1 `api.createJobTitle`

```typescript
api.createJobTitle(job: JobDefinition): string
```

Returns a display title derived from the job's current status and available phase data. This is a pure client-side computation — no network call. The derivation algorithm is status-driven and defined during jobs UI generation. For the scaffold phase, the method may be stubbed.

`JobDefinition` is defined in `source/ux/common/views/job.ts`.

### 6.3 Provided Infrastructure

The foundation provides:

#### 6.3.1 Type Safety

- Import domain archetypes from `@domain` — abstractions, protocols, adapters,
  validators
- All API operations return typed domain objects
- TypeScript strict mode enforced

#### 6.3.2 Storage Abstraction

- Direct database access via RLS (no HTTP for CRUD)
- Offline storage via IndexedDB (Ops app)
- Orchestration via edge functions (complex operations)
- Client makers handle all serialization

#### 6.3.3 Offline Capability

- `api.JobsLocal` (IndexedDB client) available to all apps
- Ops app uses for field execution
- Deep clone via `api.deepCloneJob` business rule
- Log upload via `api.uploadJobLogs` business rule

## 7. Architectural Boundaries

### 7.1 Import Discipline

#### 7.1.1 UX applications MAY import

**Convenience Barrels**

- `@core/std` — Standard types (Id, When, Dictionary)
- `@ux/api` — Composed API namespace

**Aliases**

- `@core/*` — Core modules
- `@domain/*` — Domain modules
- `@ux/common/*` — Shared UX modules
- `@ux/config/*` — Configuration module
- `@ux/app-{admin|ops|customer}/*` — Application modules

#### 7.1.2 Violations

Violations detected by architectural guards are build failures.

### 7.2 Configuration Pattern

All applications import `Config` from `@ux/config/ux-config.ts` — never directly from `@core/cfg/config.ts`. Direct core imports in app files are a guard violation.

- Update `ux-config.ts` keys and aliases as required env variables expand
- Environment files are app-specific per deployment package:
  - `source/ux/config/app-{admin|ops|customer}-{local|stage|prod}.env(.example)`

### 7.3 Reactive Store Module Pattern

The Reactive Store Module Pattern is the required architecture for UX reactive state modules.

- Export a **single namespace object** (for example `SessionState`), not raw primitives.
- Keep framework internals (`createStore`, setter functions, signals) **module-private**.
- Expose:
  - `store` for read access
  - intent-based mutation methods (`setAuth`, `setUser`, `setReady`, `clear`)
- Mutation methods must be **domain-intent names**, not framework/mechanical names.
  - Use `setAuth`, not `setSessionStore`.
- No module outside the store may call reactive setters directly.
- Components and app shells consume state through `StoreNamespace.store` and mutate through `StoreNamespace.<intentMethod>()`.

**Example Reactive Store Module:**

```typescript
// thing-state.ts

export type ThingStore = {
  field: number
}

const [thingStore, setThingStore] = createStore<ThingStore>({ field: 1971 })

const setField = (field: number) => setThingStore({ field })
const clear = () => setThingStore({ field: 1971 })

const ThingState = {
  store: thingStore,
  setField,
  clear
}

export { ThingState }
```

## 8. Application Runtime Patterns

### 8.1 Application Shell Structure

Each app root (`source/ux/app-{admin|customer|ops}/app.tsx`) composes the same shell primitives from `common/`:

```text
app.tsx
└── bootstrap()
    ├── Login              — unauthenticated entry point
    ├── AuthGuard          — session enforcement, redirect to /login
    ├── Content            — authenticated page frame
    └── Dashboard          — primary navigation surface
```

`Login`, `AuthGuard`, `Content`, and shared stores live in `source/ux/common/`. App packages provide only dashboard configuration (`dashboard-default.json`) and app-specific routes, widgets, and features.

Dashboard harness is shared and belongs in `source/ux/common/components/dashboard/`.

#### 8.1.1 Auth Guard

The shell root reads `SessionState.store.isAuthenticated` before rendering any authenticated content. Unauthenticated users are redirected to login. This is the only authorization check in the UX layer — all data authorization is enforced by RLS at the database layer.

#### 8.1.2 Dashboard as Primary Navigation

There is no navigation menu in any app. The dashboard is the primary interface and the primary navigation surface. Dashboard widgets and cards are the entry points into domain pages. Navigation is:

```text
dashboard → domain page → back to dashboard
```

### 8.2 Routing

Common routes (`/`, `/login`, `/dashboard`) are provided by `bootstrap()` in `source/ux/common/components/shell/app.tsx`. Each app root extends the route tree in its own `app.tsx` as pages are added. There is no shared route registry.

A **page** is a routable, context-scoped, auth-guarded UX module. Pages may be a **domain page** — a standard list or object view — or a **feature page** — a specialized guided interface. There is no architectural distinction between them — `{page}` in the route shape below refers to either.

#### 8.2.1 Route Shape

```text
/                          → redirect to /dashboard or /login
/login                     → login (unauthenticated)
/dashboard                 → dashboard (auth-guarded)
/{page}                    → page (auth-guarded)
/{page}/{id}               → item-scoped page (auth-guarded)
/{page}/{operation}        → operation-scoped page (auth-guarded)
/{page}/{operation}/{id}   → item-scoped operation page (auth-guarded)
```

The first three routes are provided by `bootstrap()` and are common to all apps. App-local `app.tsx` files extend the tree with app-specific pages as the application is built out.

Examples: `/user/list`, `/user/get/{id}`, `/job-runner/{id}`.

#### 8.2.2 Protected Routes

Protected routes wrap content in the auth guard component. The guard is a route-level concern, not a per-component concern.

### 8.3 Authentication

Authentication is handled by `auth-supabase-client.ts` — a singleton module that directly implements `ApiAuthContract`. It is not a maker; there is exactly one auth implementation.

```text
source/core/client/auth-supabase-client.ts
```

It is composed into the API namespace as `api.Auth`:

```typescript
import { AuthSupabaseClient } from '@core/client/auth-supabase-client.ts'

export const api = {
  Auth: AuthSupabaseClient,
  ...
}
```

#### 8.3.1 Auth State Binding

`auth-supabase-client.ts` exposes Supabase `onAuthStateChange` through `api.Auth`. Each app shell registers the listener in `app.tsx` during `onMount`. On auth events, the shell writes to `SessionState` via named methods (`setAuth`, `setUser`, `setReady`, `clear`). This keeps Supabase Auth isolated to the auth client and shell boot layer. No component touches Supabase Auth directly.

Session termination events — token expiry, idle timeout, browser close — all flow through `onAuthStateChange`. The shell callback calls `SessionState.clear()`, and the auth guard redirects to login.

#### 8.3.2 OTP Flow

All apps use passwordless email OTP. No passwords are stored or transmitted.

```text
user submits email
  → api.Auth.sendOtp(email)
  → Supabase delivers one-time code to email address
  → user submits code
  → api.Auth.verifyOtp(email, code)
  → returns Session { userId }
  → onAuthStateChange fires
  → app shell calls SessionState.setAuth(userId)
  → auth guard reacts → renders dashboard
  → app shell calls api.Users.get(userId)
  → result passed to SessionState.setUser(user)
  → app shell marks ready via SessionState.setReady()
```

#### 8.3.3 Logout Flow

```text
user triggers logout
  → api.Auth.logout()
  → Supabase signOut
  → onAuthStateChange fires
  → app shell calls SessionState.clear()
  → auth guard reacts → renders login
```

### 8.4 Session State Store

The session state store is a SolidJS store shared across all apps via `source/ux/common/stores/session-state.ts` and conforms to `7.3 Reactive Store Module Pattern`

```typescript
type SessionStore = {
  userId: Id | null
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  isDataReady: boolean
}
```

- `isLoading` prevents a flash of the login screen for already-authenticated
  users on page load — the shell renders nothing until the boot check resolves
- `userId` is set immediately from `Session` on auth; `user` is populated after
  `api.Users.get(userId)` resolves
- `isDataReady` is set `true` by Admin and Customer immediately on session
  establishment; set `true` by Ops only after the IndexedDB job manifest load
  completes
- No component reads from Supabase Auth directly — all session state is
  consumed from this store

#### 8.4.1 Session Store Write Interface

`session-state.ts` keeps `setSessionStore` private and exports a singleton `SessionState` interface. Callers read from `SessionState.store` and mutate only through named methods.

```typescript
const [sessionStore, setSessionStore] = createStore<SessionStore>({
  userId: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isDataReady: false
})

const setSessionAuth = (userId: Id): void =>
  setSessionStore({ userId, isAuthenticated: true, isLoading: false })

const clearSession = (): void =>
  setSessionStore({
    userId: null,
    user: null,
    isAuthenticated: false,
    isLoading: false,
    isDataReady: false
  })

const setSessionUser = (user: User): void => setSessionStore('user', user)
const setDataReady = (): void => setSessionStore('isDataReady', true)

const SessionState = {
  store: sessionStore,
  setAuth: setSessionAuth,
  setUser: setSessionUser,
  setReady: setDataReady,
  clear: clearSession
}

export { SessionState }
```

### 8.5 IndexedDb Usage

IndexedDb is the browser-side persistent store for all offline-data concerns.

#### 8.5.1 IndexedDB Database Names

IndexedDB usage is split into two layers:

- Database namespace (physical DB name), `Config.get('LOCAL_DB_NAME')`, per deployment package.
- Object Store names are not shared implicitly; they must be registered with `@core/db/indexeddb.ts` using `IndexedDb.registerStore('storeName')`
  - Object Store's for domain abstractions are named for the abstraction, for example, `Job` or `Workflow`.
- A CRUD/List maker is provided to standardize usage of the local database with `@core/client/make-indexeddb-client.ts` conforming to `ApiCrudContract` in `@core/api/api-contract.ts`

**IndexedDB Database Names**

| Database Name          | App      | Content                                               |
| ---------------------- | -------- | ----------------------------------------------------- |
| `swarmag-app-admin`    | Admin    | dashboard layout, panel config, theme                 |
| `swarmag-app-ops`      | Ops      | dashboard layout, panel config, theme, job aggregates |
| `swarmag-app-customer` | Customer | dashboard layout, theme                               |

#### 8.5.2 Application Preferences

`AppState` (`@ux/common/stores/app-state.ts`) manages per-app preferences — persisted key/value pairs backed by a named IndexedDB object store. Conforms to the Reactive Store Module Pattern (§7.3).

| Key                | Admin | Ops | Customer |
| ------------------ | ----- | --- | -------- |
| `theme`            | ✓     | ✓   | ✓        |
| `dashboard:layout` | ✓     | ✓   | ✓        |
| `dashboard:panels` | ✓     | ✓   | —        |

### 8.6 State Management

| Concern         | Mechanism       | Location                         |
| --------------- | --------------- | -------------------------------- |
| auth / session  | SolidJS store   | `common/stores/session-state.ts` |
| app preferences | IndexedDB       | `common/stores/app-state.ts`     |
| server data     | TanStack Query  | per-page query hooks             |
| local ui state  | SolidJS signals | component-local                  |
| ops field data  | IndexedDB       | `app-ops/stores/jobs-store.ts`   |

#### 8.6.1 Rules

- Signals for local, transient UI state — inputs, open/close, hover
- Stores for shared cross-component state — session, app preferences
- TanStack Query for all server data — caching, loading, error states
- No prop-drilling of session or user — read from session store directly

## 9. Shared Application Features

### 9.1 Common Component Boundaries

`source/ux/common/` is the swarmAg design system foundation. All components in `common/` are reactive and adaptive by default.

#### 9.1.1 Belongs in `common/`

- `views/` — UX-local shared types consumed by two or more apps
- `login` — designed brand experience, not a generic form instance
- `auth-guard` — route-level session check
- `form-panel` — general adaptive form container (full-screen mobile, modal-centered desktop)
- `content` — main content frame
- session store
- app state store
- dashboard state store + dashboard harness
- shared guided UX features in `common/features/{feature}` (for example `workflow-builder`)

#### 9.1.2 Stays in the app

- dashboard default configuration and app-specific widget composition
- domain pages
- app-specific route tree
- specialized features in `{app}/{feature}`
- app-specific IndexedDB store instance

#### 9.1.3 Specialized Feature — Ops Crew Job Work Engine

The ops crew `job-work` engine is a purpose-built specialized feature in `source/ux/app-ops/{feature}/job-work/`, not derived from `form-panel` or standard shell components. It is launched from the ops dashboard. It renders `Workflow -> Task -> Question` traversal for execution. Design principles: app is invisible, crew stays focused on job and safety, large touch targets, minimal cognitive load.

#### 9.1.4 Rule

A component moves to `common/` when a second app needs it — not before.

Premature generalization is a violation.

### 9.2 Source Directory Structure

The following is the normative target structure. Directories not yet present are created as pages are built.

```text
source/
└── ux/
    ├── api/
    │   └── api.ts
    ├── config/
    ├── common/
    │   ├── assets/                  — static assets used by applications
    │   │   ├── css/                 — style sheets & design tokens
    │   │   ├── fonts/               — font typography
    │   │   └── icons/               — icon library
    │   ├── views/                   — UX projection types (domain → display shape)
    │   ├── stores/                  — reactive stores
    │   │   ├── app-state.ts
    │   │   ├── session-state.ts
    │   │   └── dashboard-state.ts
    │   └── components/
    │       ├── shell/               — auth-guard, content
    │       ├── controls/            — Kobalte-based UI primitives
    │       ├── charts/              — PieChart, BarChart, LineChart, Sparkline
    │       ├── dashboard/           — shared dashboard harness + layout foundation
    │       └── widgets/             — widget catalog
    ├── app-admin/
    │   ├── app.tsx
    │   ├── dashboard-default.json   — default dashboard layout for app-admin
    │   ├── workflow-builder/        — workflow authoring/editing
    │   ├── job-assessment/          — guided onsite detailed assessment (maps, photos, workflow mods)
    │   ├── job-planning/            — workflow mods + crew + equipment + chemical assignment
    │   └── customer-prospect/       — guided new customer + new job + initial assessment
    ├── app-customer/
    │   ├── app.tsx
    │   ├── dashboard-default.json   — default dashboard layout for app-customer
    │   └── customer-report          — specialized report for customer
    └── app-ops/
        ├── app.tsx
        ├── dashboard-default.json   — default dashboard layout for app-ops
        └── job-runner/              — guided job execution engine
```

Everything in `source/ux/common/` must be adaptive — usable across all three apps and all viewport sizes. Mobile-only or desktop-only components do not belong in `common/`.

Authentication and client makers are part of the core runtime and are sourced from `source/core/client/`.

### 9.3 Build Composition

Each app is an independent Vite build producing a deployable PWA bundle:

```text
swarmag-app-admin    = ux/app-admin    + ux/common + ux/config
swarmag-app-ops      = ux/app-ops      + ux/common + ux/config
swarmag-app-customer = ux/app-customer + ux/common + ux/config
```

- Three Vite configs, one per app
- Three Netlify sites, one per app
- `ux/common/` and `ux/config/` are compile-time inclusions via path aliases — not packages, not runtime imports
- Build output is ephemeral — temp directory, zipped, deployed via Netlify CLI in `source/devops/scripts/`
- No build artifacts are checked into the repository

### 9.4 Dashboard Layout Contract

```text
Dashboard
  └─ HeaderRow (fixed height, KPI StatCards)
  └─ ScrollContainer (vertical scroll)
     └─ DashboardRow[] (horizontal swipe, no collapse)
        └─ Widget[] (square | landscape)
```

No row collapse on small viewport. Horizontal swipe per row. Vertical scroll on the outer column.

**`source/ux/app-{admin|ops|customer}/dashboard-default.json`**

Layout is data-driven via app-local `dashboard-default.json`, rendered by the shared dashboard harness in `source/ux/common/components/dashboard/`, and hydrated into `DashboardState` (`source/ux/common/stores/dashboard-state.ts`). Not hardcoded. May be overridden per user in future — for now a single default config per app.

```json
{
  "header": {
    "widgets": [
      { "key": "brand", "type": "BrandWidget", "size": "landscape", "settings": {} }
    ]
  },
  "rows": [
    {
      "key": "at-a-glance",
      "size": "standard",
      "label": "Operations at-a-glance",
      "widgets": [
        { "key": "upcoming-jobs", "type": "UpcomingJobsWidget", "size": "landscape", "settings": {} },
        { "key": "asset-status", "type": "AssetStatusWidget", "size": "square", "settings": {} }
      ]
    }
  ]
}
```

### 9.5 Views Catalog

UX projection types — shapes that exist because the domain model does not surface cleanly to the UI as-is. No infrastructure imports, no SolidJS imports. Pure types only. Files follow the `{domain}-views.ts` naming convention.

| File                 | Types                                                                 | Purpose                                             |
| -------------------- | --------------------------------------------------------------------- | --------------------------------------------------- |
| `job-views.ts`       | `JobSummary`, `JobDefinition`                                         | Job display projections                             |
| `dashboard-views.ts` | `DashboardView`, `DashboardHeader`, `DashboardRow`, `DashboardWidget` | Dashboard layout schema types                       |
| `workflow-views.ts`  | `WorkflowView`                                                        | Ordered tasks + questions resolved for renderer     |
| `question-views.ts`  | `QuestionView`                                                        | Discriminated union flattened for workflow renderer |

## 10. Specialized Application Features

### 10.1 Job Work Execution Components (app-ops)

All in `source/ux/app-ops/{feature}/job-work/`. Mobile-only — does not belong in `common/`.

| Component                          | Purpose                                 |
| ---------------------------------- | --------------------------------------- |
| `job-work-runner.tsx`              | Top-level runner, state machine         |
| `job-work-progress.tsx`            | Route bar — tasks + questions remaining |
| `question-screen.tsx`              | Per-question renderer                   |
| `answers/boolean-answer.tsx`       | Full-width YES/NO buttons               |
| `answers/text-answer.tsx`          | Large text input                        |
| `answers/number-answer.tsx`        | Large stepper / keypad                  |
| `answers/single-select-answer.tsx` | Large tappable tiles                    |
| `answers/multi-select-answer.tsx`  | Tappable tiles with checkmark           |
| `answer-attachment.tsx`            | Camera-first attachment trigger         |
| `job-work-nav.tsx`                 | BACK + NEXT, forward-biased             |
| `task-complete.tsx`                | Task arrival screen                     |
| `job-work-complete.tsx`            | Final arrival screen                    |

### 10.2 Job Assessment & Plan (app-ops)

#### 10.2.1 Device Target

| Phase                       | App         | Feature Page        | Primary Device           |
| --------------------------- | ----------- | ------------------- | ------------------------ |
| Initial assessment (remote) | `app-admin` | `customer-prospect` | Desktop, Tablet          |
| Onsite assessment           | `app-admin` | `job-assessment`    | Tablet (offline-capable) |
| Job planning                | `app-admin` | `job-planning`      | Desktop, Tablet          |
| Job runner                  | `app-ops`   | `job-runner`        | Mobile                   |

#### 10.2.2 Specialized UX

Job assessment and job plan are purpose-built guided flows, not generic admin forms. Both involve structured data capture in semi-field conditions.

Assessment involves: location capture, photos, risk notes, workflow selection, workflow modification. Tablet is a practical requirement for the onsite phase.

#### 10.2.3 Workflow Editing in Context

Job assessment and job plan may modify job-specific workflow clones. The editor operates on a cloned `Workflow` record (not the canonical template) scoped to the job context. The canonical `Workflow` builder feature lives in `source/ux/common/features/workflow-builder/` and is mounted by app routes where needed.

Per `domain-model.md §2.5`:

- Assessment clones the basis workflow → `JobWorkflow.modifiedWorkflowId`
- Planning may further modify the assessment clone
- At execution start, the manifest is finalized and immutable

### 10.3 Dashboard Components

| Component      | Purpose                                     |
| -------------- | ------------------------------------------- |
| `Dashboard`    | Root layout, row renderer, scroll container |
| `DashboardRow` | Horizontal swipe row (short\|standard)      |
| `Widget`       | Widget container (square\|landscape)        |

### 10.4 Widget Catalog

| Widget                    | Size      | Contents                              |
| ------------------------- | --------- | ------------------------------------- |
| `UpcomingJobsWidget`      | landscape | Job list, status badges               |
| `JobCalendarWidget`       | landscape | Calendar view of scheduled jobs       |
| `CustomersWidget`         | landscape | Customer table, action buttons        |
| `CrewWidget`              | square    | Active crew, availability             |
| `AssetStatusWidget`       | square    | Asset list, status indicators         |
| `ChemicalInventoryWidget` | landscape | Chemical table, signal word badges    |
| `ServicesWidget`          | square    | Service catalog summary               |
| `JobStatusWidget`         | square    | Pie chart — job status distribution   |
| `JobTrendWidget`          | landscape | Line chart — job throughput over time |
| `ChemicalUsageWidget`     | square    | Pie chart — usage by type             |
| `AssetUtilizationWidget`  | square    | Bar chart — utilization rate          |
| `WorkflowLibraryWidget`   | landscape | Workflow + task catalog               |
| `RecentActivityWidget`    | landscape | Append-only activity feed             |

### 10.5 StatCard Catalog

| StatCard                    | Metric                         | Drills to            |
| --------------------------- | ------------------------------ | -------------------- |
| `JobsActiveStatCard`        | Open/executing job count       | Upcoming Jobs widget |
| `JobsUpcomingStatCard`      | Planned jobs this week         | Job Calendar         |
| `AssetsMaintenanceStatCard` | Assets in maintenance/reserved | Asset Status widget  |
| `ChemicalAlertStatCard`     | Low stock / expiring chemicals | Chemical Inventory   |
| `CrewActiveStatCard`        | Active crew today              | Crew widget          |
| `RevenueStatCard`           | Rolling period revenue         | Job Trend widget     |

### 10.6 Management Forms (app-admin)

Standard domain pages follow a list → form pattern. Each root abstraction not subsumed by a feature page gets a domain page in `app-admin`.

| Domain Page | Form           | Key complexity                                |
| ----------- | -------------- | --------------------------------------------- |
| `/user`     | `UserForm`     | Role multi-select, status                     |
| `/asset`    | `AssetForm`    | Type association, status                      |
| `/service`  | `ServiceForm`  | Required asset types, workflow candidate tags |
| `/chemical` | `ChemicalForm` | Signal word severity, restricted use, SDS url |

### 10.7 Job Work Interaction Contract (app-ops)

A job's work effort is assessed, planned, and executed in a prescribed order. Canonical model: `Job: [JobAssessment, JobPlan, JobWork]`. Colloquial UX hub: `job: [assessment, plan, work]`. Services that swarmAg offer require the physical labor of several crew members, and sometimes multiple crews. Expensive and dangerous vehicles, equipment, tools, and chemicals are essential to those services. Prescribing the order of work, specifying specific tasks to perform, and ensuring protocols for safety and efficiency are followed, with consistent, repeatable results is the mandate of the swarmAg Operations Mobile Application.

To automate and measure as much of the effort as possible a job is subdivided into service workflows. For example, a customer requires pesticide spray service of 2 pastures. swarmAg assigns 2 pilots and 2 drones to the job. Each pilot is assigned job work with several workflows, 3 of those workflows are preflight, chemical-load, and spray. Each of those has steps unique to it. Preflight will check battery capacity for all batteries, connect drone communications, etc. Each of the tasks has a checklist to advise or collect information. Each item in the checklist is just a question. Order is essential of course. You don't want to spray before preflight. You can't connection communications until the drone has power.

#### 10.7.1 Interaction Model Contract

The workflow execution UX follows the **turn-by-turn navigation** mental model
(Google Maps / Apple Maps). The analogy:

| Maps                      | Workflow                    |
| ------------------------- | --------------------------- |
| Current maneuver          | Current question            |
| Street name / instruction | Question prompt             |
| Distance to next turn     | Questions remaining in task |
| Overall ETA               | Tasks remaining in workflow |
| Arrived                   | Task complete               |

#### 10.7.2 Operational Safety Interaction Constraints

The crew member is physically operating dangerous equipment while using this UI.

**Design constraints:**

- **One question per screen** — no scrolling mid-task
- **Large touch targets** — minimum `--sa-touch-target` (64px) for interactive elements
- **Maximum contrast** — answers must be unambiguous at a glance
- **Boolean = two full-width buttons** — YES (green) / NO (red), not a toggle
- **Single-select = large tappable option tiles** — not a dropdown
- **Multi-select = same, with checkmark state**
- **Number = large stepper or numeric keypad** — not a free text field
- **Text = last resort** — large input, minimal keyboard friction
- **Progress always visible** — current task, current question, total remaining
- **Forward momentum** — NEXT is the dominant action, BACK is available but not prominent
- **Camera-first attachment** — one tap to camera, returns directly to question

#### 10.7.3 QuestionType-to-UI Mapping Contract

Exhaustively known from the domain `QuestionType`:

| Type            | UI Treatment                               |
| --------------- | ------------------------------------------ |
| `boolean`       | Two full-width buttons — YES/green, NO/red |
| `single-select` | Large tappable option tiles                |
| `multi-select`  | Same, with checkmark state                 |
| `number`        | Large stepper or numeric keypad            |
| `text`          | Large textarea, soft keyboard              |
| `internal`      | System-generated — no UI rendered          |

#### 10.7.4 Attachment Gate Contract

Every question screen has an attachment zone below the answer, above navigation.
Camera is the dominant affordance. `requiresNote` on `SelectOption` gates NEXT
until an attachment or note is provided.

#### 10.7.5 Screen Layout

```
┌─────────────────────────────────┐
│  Workflow / Task / Question     │
│─────────────────────────────────│
│                                 │
│  Question prompt                │
│  Help text (if present)         │
│                                 │
│  [Question-specific widget   ]  │
│                                 │
│  ┌───────────────────────────┐  │
│  │ Note                      │  │
│  │                           │  │
│  │                           │  │
│  └───────────────────────────┘  │
│  📎 Attach  📸 Picture  📍GEO   │
│                                 │
│  ┌───────────────────────────┐  │
│  │          Save -->         │  │
│  └───────────────────────────┘  │
│                                 │
│  Progress                       │
│  [<-]  o o o o o O o o  [===>]  │
└─────────────────────────────────┘
```

_End of Architecture UX Document_
