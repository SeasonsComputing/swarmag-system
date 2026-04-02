![swarmAg Operations System](../swarmag-ops-logo.png)

# swarmAg Operations System — Architecture UX

## 1. Overview

This document defines how UX applications integrate with the swarmAg system architecture. It focuses on **what the UX layer receives from the foundation**, not implementation patterns.

UX architectural patterns (component structure, state management, routing, etc.) will be documented after initial iteration with the stack. See `documentation/` for current application requirements.

**Prerequisites:** Read `architecture-core.md` to understand the API namespace pattern and system boundaries.

## 2. UX Applications

The system includes three SolidJS applications:

| Application  | Purpose                           | Primary Users    |
| ------------ | --------------------------------- | ---------------- |
| **Admin**    | Management and configuration      | Leadership staff |
| **Ops**      | Field execution                   | Operations crews |
| **Customer** | Scheduling and status (read-only) | Customers        |

All apps use SolidJS + TanStack + Kobalte + Vanilla CSS. Shared infrastructure lives in `source/ux/common/`.

## 3. API Namespace Integration

### 3.1 Single Composed API

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

### 3.2 API Namespace Inventory

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

#### 3.2.1 `api.createJobTitle`

```typescript
api.createJobTitle(job: JobDefinition): string
```

Returns a display title derived from the job's current status and available phase data. This is a pure client-side computation — no network call. The derivation algorithm is status-driven and defined during jobs UI generation. For the scaffold phase, the method may be stubbed.

`JobDefinition` is defined in `source/ux/common/views/job.ts`.

### 3.3 Provided Infrastructure

The foundation provides:

#### 3.3.1 Type Safety

- Import domain archetypes from `@domain` — abstractions, protocols, adapters,
  validators
- All API operations return typed domain objects
- TypeScript strict mode enforced

#### 3.3.2 Storage Abstraction

- Direct database access via RLS (no HTTP for CRUD)
- Offline storage via IndexedDB (Ops app)
- Orchestration via edge functions (complex operations)
- Client makers handle all serialization

#### 3.3.3 Offline Capability

- `api.JobsLocal` (IndexedDB client) available to all apps
- Ops app uses for field execution
- Deep clone via `api.deepCloneJob` business rule
- Log upload via `api.uploadJobLogs` business rule

## 4. Architectural Boundaries

### 4.1 Import Discipline

#### 4.1.1 UX applications MAY import

**Convenience Barrels**

- `@core/std` — Standard types (Id, When, Dictionary)
- `@ux/api` — Composed API namespace

**Aliases**

- `@core/*` — Core modules
- `@domain/*` — Domain modules
- `@ux/common/*` — Shared UX modules
- `@ux/config/*` — Configuration module
- `@ux/app-{admin|ops|customer}/*` — Application modules

#### 4.1.2 Violations

Violations detected by architectural guards are build failures.

### 4.2 Configuration Pattern

All applications import `Config` from `@ux/config/ux-config.ts` — never directly from `@core/cfg/config.ts`. Direct core imports in app files are a guard violation.

- Update `ux-config.ts` keys and aliases as required env variables expand
- Environment file stored with deployment package.

### 4.3 Reactive Store Module Pattern

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

## 5. Application-Specific Notes

| App          | Runtime                      | Storage                            | Deployment           |
| ------------ | ---------------------------- | ---------------------------------- | -------------------- |
| **Admin**    | Browser (desktop/tablet PWA) | Supabase SDK                       | Netlify CDN (PWA)    |
| **Ops**      | Browser (mobile PWA)         | IndexedDB offline, Supabase online | Netlify CDN (PWA)    |
| **Customer** | Browser (static site)        | Supabase SDK (read-only)           | Netlify CDN (static) |

## 6. UX Application Patterns

### 6.1 Application Shell Structure

Each application follows a three-layer shell:

```text
app
├── shell            # auth guard + content frame
│   ├── login        # unauthenticated entry point
│   └── dashboard    # authenticated root; primary nav surface
└── pages            # route-driven content panels
```

The shell is app-specific. `login`, `auth-guard`, `content`, and all stores are shared via `source/ux/common/`.

#### 6.1.1 Auth Guard

The shell root reads `SessionState.store.isAuthenticated` before rendering any authenticated content. Unauthenticated users are redirected to login. This is the only authorization check in the UX layer — all data authorization is enforced by RLS at the database layer.

#### 6.1.2 Dashboard as Primary Navigation

There is no navigation menu in any app. The dashboard is the primary interface and the primary navigation surface. Dashboard widgets and cards are the entry points into domain pages. Navigation is:

```text
dashboard → domain page → back to dashboard
```

### 6.2 Routing

Each app defines its own route tree using TanStack Router declared in `app.tsx`. There is no shared route registry.

#### 6.2.1 Route Shape

```text
/             → redirect to /dashboard or /login
/login        → login (unauthenticated)
/dashboard    → dashboard (auth-guarded)
/[domain]     → domain pages (auth-guarded)
```

#### 6.2.2 Protected Routes

Protected routes wrap content in the auth guard component. The guard is a route-level concern, not a per-component concern.

### 6.3 Authentication

Authentication is handled by `auth-supabase-client.ts` — a singleton module that directly implements `ApiAuthContract`. It is not a maker; there is exactly one auth implementation.

```text
source/ux/common/lib/auth-supabase-client.ts
```

It is composed into the API namespace as `api.Auth`:

```typescript
import { AuthSupabaseClient } from '@ux/common/lib/auth-supabase-client.ts'

export const api = {
  Auth: AuthSupabaseClient,
  ...
}
```

#### 6.3.1 Auth State Binding

`auth-supabase-client.ts` exposes Supabase `onAuthStateChange` through `api.Auth`. Each app shell registers the listener in `app.tsx` during `onMount`. On auth events, the shell writes to `SessionState` via named methods (`setAuth`, `setUser`, `setReady`, `clear`). This keeps Supabase Auth isolated to the auth client and shell boot layer. No component touches Supabase Auth directly.

Session termination events — token expiry, idle timeout, browser close — all flow through `onAuthStateChange`. The shell callback calls `SessionState.clear()`, and the auth guard redirects to login.

#### 6.3.2 OTP Flow

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

#### 6.3.3 Logout Flow

```text
user triggers logout
  → api.Auth.logout()
  → Supabase signOut
  → onAuthStateChange fires
  → app shell calls SessionState.clear()
  → auth guard reacts → renders login
```

### 6.4 Session State Store

The session state store is a SolidJS store shared across all apps via `source/ux/common/lib/session-state.ts` and conforms to `4.3 Reactive Store Module Pattern`

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

#### 6.4.1 Session Store Write Interface

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

### 6.5 IndexedDb Usage

IndexedDb is the browser-side persistent store for all offline-data concerns.

#### 6.5.1 IndexedDB Database Names

IndexedDB usage is split into two layers:

- Database namespace (physical DB name), `Config.get('LOCAL_DB_NAME')`, per deployment package.
- Object Store names are not shared implicitly; they must be registered with `@core/db/indexeddb.ts` using `IndexedDb.registerStore('storeName')`
  - Object Store's for domain abstractions are named for the abstraction, for example, `Job` or `Workflow`.
- A CRUD/List maker is provided to standardize usage of the local database with `@core/api/make-indexeddb-client.ts` conforming to `ApiCrudContract` in `@core/api/api-contract.ts`

**IndexedDB Database Names**

| Database Name          | App      | Content                                               |
| ---------------------- | -------- | ----------------------------------------------------- |
| `swarmag-admin-app`    | Admin    | dashboard layout, panel config, theme                 |
| `swarmag-ops-app`      | Ops      | dashboard layout, panel config, theme, job aggregates |
| `swarmag-customer-app` | Customer | dashboard layout, theme                               |

#### 6.5.2 Application Preferences

Application preferences use a dedicated object store within the local DB.

`app-state.ts` (`@ux/common/lib/app-state.ts`) manages per-app preferences using `makeCrudIndexedDbClient<AppStore>` where `AppStore = Dictionary`.

Preference keys following a standard naming convention usage by app:

| Key                | Admin | Ops | Customer |
| ------------------ | ----- | --- | -------- |
| `theme`            | ✓     | ✓   | ✓        |
| `dashboard:layout` | ✓     | ✓   | ✓        |
| `dashboard:panels` | ✓     | ✓   | —        |

### 6.6 State Management

| Concern         | Mechanism       | Location                       |
| --------------- | --------------- | ------------------------------ |
| auth / session  | SolidJS store   | `common/lib/session-state.ts`  |
| app preferences | IndexedDB       | `common/lib/app-state.ts`      |
| server data     | TanStack Query  | per-page query hooks           |
| local ui state  | SolidJS signals | component-local                |
| ops field data  | IndexedDB       | `app-ops/stores/jobs-store.ts` |

#### 6.6.1 Rules

- Signals for local, transient UI state — inputs, open/close, hover
- Stores for shared cross-component state — session, app preferences
- TanStack Query for all server data — caching, loading, error states
- No prop-drilling of session or user — read from session store directly

### 6.7 Common Component Boundaries

`source/ux/common/` is the swarmAg design system foundation. All components in `common/` are reactive and adaptive by default.

#### 6.7.1 Belongs in `common/`

- `views/` — UX-local shared types consumed by two or more apps
- `login` — designed brand experience, not a generic form instance
- `auth-guard` — route-level session check
- `form-panel` — general adaptive form container (full-screen mobile, modal-centered desktop)
- `content` — main content frame
- session store
- app state store

#### 6.7.2 Stays in the app

- dashboard content and layout
- domain pages
- app-specific route tree
- app-specific IndexedDB store instance

#### 6.7.3 Exception — Ops Crew Workflow Engine

The ops crew workflow/task/checklist engine is a purpose-built UI mode, not derived from `form-panel` or standard shell components. It is launched from the ops dashboard. Design principles: app is invisible, crew stays focused on job and safety, large touch targets, minimal cognitive load.

#### 6.7.4 Rule

A component moves to `common/` when a second app needs it — not before.

Premature generalization is a violation.

### 6.8 File Inventory

```text
source/ux/
├── api/
│   ├── api.ts
│   └── api-auth-contract.ts
├── config/
│   └── ux-config.ts
├── common/
│   ├── views/
│   │   └── job.ts              ← JobSummary, JobDefinition
│   ├── components/
│   │   ├── login/
│   │   │   └── login.tsx
│   │   ├── forms/
│   │   │   └── form-panel.tsx
│   │   └── shell/
│   │       ├── auth-guard.tsx
│   │       └── content.tsx
│   └── lib/
│       ├── auth-supabase-client.ts
│       ├── session-state.ts
│       └── app-state.ts
├── app-admin/
│   ├── index.html
│   ├── vite.config.ts
│   ├── app.tsx
│   └── dashboard/
│       └── dashboard.tsx
├── app-ops/
│   ├── index.html
│   ├── vite.config.ts
│   ├── app.tsx
│   ├── dashboard/
│   │   └── dashboard.tsx
│   └── stores/
│       └── jobs-store.ts
└── app-customer/
    ├── index.html
    ├── vite.config.ts
    ├── app.tsx
    └── dashboard/
        └── dashboard.tsx
```

### 6.9 Build Composition

Each app is an independent Vite build producing a deployable PWA bundle:

```text
swarmag-app-admin    = ux/app-admin    + ux/common + ux/config
swarmag-app-ops      = ux/app-ops      + ux/common + ux/config
swarmag-app-customer = ux/app-customer + ux/common + ux/config
```

- Three Vite configs, one per app
- Three Netlify sites, one per app
- `ux/common/` and `ux/config/` are compile-time inclusions via path aliases — not packages, not runtime imports
- Build output is ephemeral — temp directory, zipped, deployed via Netlify CLI in `devops/scripts/`
- No build artifacts are checked into the repository

## 7. Technology Stack

| Layer         | Technology                      |
| ------------- | ------------------------------- |
| Framework     | SolidJS (reactive, compiled)    |
| Routing       | TanStack Solid-Router           |
| Data Fetching | TanStack Query                  |
| UI Primitives | Kobalte (accessible components) |
| Styling       | Vanilla CSS (no preprocessor)   |
| Build         | Vite                            |
| Runtime       | Modern browsers (ES2022+)       |

## 8. Key Principles

1. **Apps consume, don't configure** — API namespace pre-composed, just import and use
2. **Types flow from domain** — All data structures defined in `@domain/abstractions/`; UX view types in `@ux/common/views/`
3. **Storage is transparent** — Client makers handle Supabase, IndexedDB, HTTP
4. **Import discipline enforced** — Architectural guards prevent boundary violations
5. **UX patterns emerge** — Document architecture after iteration, not before

_End of Architecture UX Document_
