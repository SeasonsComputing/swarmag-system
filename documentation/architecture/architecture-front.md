<img src="../../swarmag-ops-logo.png" title="" alt="swarmAg Operations System" data-align="center">

# swarmAg Operations System — Architecture Front

## 1. Overview

This document defines UX-layer architecture for swarmAg applications. It governs UX integration boundaries, architectural composition, and application-specific UX architecture contracts.

### 1.1 Authority Chain

| Document                      | File                        | Intent                                                                                       |
| ----------------------------- | --------------------------- | -------------------------------------------------------------------------------------------- |
| **Canonical Authority Chain** | `architecture-core.md §1.1` | Defines global documentation precedence for the system                                       |
| └→ **Architecture Front**     | _(this file)_               | Front-layer architecture contracts, integration boundaries, and app-specific UX architecture |

### 1.2 Scope Boundary of Governing Documents

| Document                   | File                        | Scope Ownership                                                              |
| -------------------------- | --------------------------- | ---------------------------------------------------------------------------- |
| **Architecture Core**      | `architecture-core.md`      | System boundary, platform constraints, dependency direction                  |
| **Domain Model**           | `domain-model.md`           | Domain meaning consumed by UX architecture                                   |
| **Domain Data Dictionary** | `domain-data-dictionary.md` | Canonical namespace and field-level references used by UX contracts          |
| **Domain Archetypes**      | `domain-archetypes.md`      | Domain artifact implementation patterns consumed by UX integrations          |
| **UX Design Language**     | `ux-design-language.md`     | Normative UX language and cross-application interaction patterns             |
| **Architecture Front**     | _(this file)_               | Front-layer boundaries, composition contracts, and app-specific architecture |

## 2. Directory Structure

The following is the normative target structure. Directories not yet present are created as pages are built.

```text
source/
├── ux/                              — generic UX toolkit, portable beyond swarmAg
│   ├── shell/                       — generic shell framework
│   │   ├── runtime/                 — bootstrap, routing, session, preferences, metadata
│   │   ├── dashboard/               — dashboard host, state, and widget contracts
│   │   ├── panel/                   — panel foundation, collections, and drill-down
│   │   └── workbench/               — manager, wizard, and supporting form behavior
│   ├── views/                       — generic UX projection types (placeholder — none yet)
│   ├── widgets/                     — app-neutral widgets (e.g. HelmWidget)
│   │   └── widget-registry.ts       — exports widgetRegistry(); generic-tier catalog only
│   └── ui/                          — portable shared UI foundation
│       ├── components/              — Ui{Control} primitives (ui-{name}.tsx, barreled by ui.ts)
│       ├── charts/                  — reserved chart primitive directory
│       ├── css/                     — CSS barrel, tokens, roles, themes, base, ui, icons
│       ├── fonts/                   — self-hosted font assets
│       └── icons/                   — shared icon assets
└── front/
    ├── api/
    │   ├── api.ts                   — API client and request/response types
    │   ├── form-scopes.ts           — declared form write scopes (§7.4)
    │   └── make-auth-users.ts       — Users client over the edge functions (§7.2.3)
    ├── config/
    ├── app/                         — swarmAg-suite-wide, shared across all three apps, not generic
    │   ├── assets/                  — swarmAg brand assets (logo files, flat — one asset kind today)
    │   ├── components/              — swarmAg-specific reusable UI controls (placeholder — none yet)
    │   ├── stores/                  — swarmAg-suite state beyond the toolkit baseline (facets-state.ts)
    │   ├── views/                   — swarmAg domain projections (job-views.ts)
    │   ├── widgets/                 — swarmAg-suite widgets (e.g. BrandWidget)
    │   │   └── widget-registry.ts   — exports widgetRegistry(); app-tier catalog only
    │   └── shell/                   — branded chrome and application wiring (*)
    │       └── notes-editor.tsx      — stock notes Index-Detail editor
    ├── app-admin/
    │   ├── app.tsx
    │   ├── dashboard-admin.json     — default dashboard layout for app-admin
    │   ├── index.html
    │   ├── manifest.webmanifest
    │   ├── sw.js
    │   ├── vite.config.ts
    │   ├── users/                   — user manager
    │   ├── customers/               — customer manager and its steps
    │   ├── onboarding/              — guided new customer intake (COW)
    │   ├── workflow-builder/        — workflow authoring/editing
    │   ├── job-assessment/          — guided onsite detailed assessment (maps, photos, workflow mods)
    │   └── job-planning/            — workflow mods + crew + equipment + chemical assignment
    ├── app-customer/
    │   ├── app.tsx
    │   ├── dashboard-customer.json  — default dashboard layout for app-customer
    │   ├── index.html
    │   ├── manifest.webmanifest
    │   ├── sw.js
    │   ├── vite.config.ts
    │   └── customer-report/         — specialized report for customer
    ├── app-ops/
    │   ├── app.tsx
    │   ├── dashboard-ops.json       — default dashboard layout for app-ops
    │   ├── index.html
    │   ├── manifest.webmanifest
    │   ├── sw.js
    │   ├── vite.config.ts
    │   ├── stores/
    │   │   └── jobs-store.ts        — local job manifest store
    │   └── job-runner/              — guided job execution engine
    └── app-style-guide/             — design-system demonstration harness
```

(*) `shell/` holds `about-box`, `brand-hero`, `login`, and `notes-editor`; the maker wrapper binding `ux/shell`'s
generic makers to swarmAg branding; and `session-coordinator.ts`.

Everything in `source/ux/` must be adaptive and portable beyond swarmAg — mobile-only or desktop-only components do not belong there, and neither does anything that assumes swarmAg branding or swarmAg's own domain. `source/front/app/` carries that narrower scope instead: adaptive across all three swarmAg apps and all viewport sizes, but not required to generalize past swarmAg itself.

Authentication and client makers are part of the core runtime and are sourced from `source/core/cli/`.

## 3. Application Runtime Profiles

| App          | Runtime                      | Storage                            | Deployment        |
| ------------ | ---------------------------- | ---------------------------------- | ----------------- |
| **Admin**    | Browser (desktop/tablet PWA) | Supabase SDK                       | Netlify CDN (PWA) |
| **Ops**      | Browser (mobile PWA)         | IndexedDB offline, Supabase online | Netlify CDN (PWA) |
| **Customer** | Browser (desktop/tablet PWA) | Supabase SDK                       | Netlify CDN (PWA) |

UX applications are static bundles. Their remote backend is selected by the
configuration embedded at package/build time, not by the static host that serves
the files. For Supabase-backed UX apps, the concrete binding is the Supabase
endpoint, public key, and browser client mode embedded in the bundle.

Serving a stage-bound `app-admin` bundle locally is therefore still a stage-bound
Admin client. Local serving is a tooling concern; it is not a separate remote
backend environment axis.

`documentation/architecture/architecture-devops.md` specifies the devops architecture including deployment strategy.

## 4. Technology Stack

| Layer         | Technology                    |
| ------------- | ----------------------------- |
| Framework     | SolidJS (reactive, compiled)  |
| Routing       | TanStack Solid-Router         |
| Data Fetching | TanStack Query                |
| Primitives    | Kobalte                       |
| Charting      | Chart.js                      |
| Styling       | Vanilla CSS (no preprocessor) |
| Build         | Vite                          |
| Runtime       | Modern browsers (ES2022+)     |

The following technologies are used as implementation details of system APIs. DevOps architecture guards enforce they are not part of the public API surface nor imported outside the API surface.

| Layer      | API Surface | Private Implementation |
| ---------- | ----------- | ---------------------- |
| Routing    | ux/shell    | TanStack Solid-Router  |
| Primitives | ux/ui       | Kobalte                |
| Charting   | ux/charts   | Charts.js              |

## 5. Key Principles

1. **Apps consume, don't configure** — API namespace pre-composed, just import and use
2. **Types flow from domain** — All data structures defined in `@domain/abstractions/`; generic UX view types in `@ux/views/`, swarmAg domain projections (e.g. `job-views.ts`) in `@front/app/views/`
3. **Storage is transparent** — Client makers handle Supabase, IndexedDB, HTTP
4. **Import discipline enforced** — Architectural guards prevent boundary violations
5. **UX design language** — All applications conform to a unified design-language

## 6. Application Suite

The system includes three SolidJS applications:

| Application  | Purpose                       | Primary Users    |
| ------------ | ----------------------------- | ---------------- |
| **Admin**    | Management and configuration  | Leadership staff |
| **Ops**      | Field execution               | Operations crews |
| **Customer** | Scheduling, status, reporting | Customers        |

## 7. API Namespace Integration

### 7.1 Single Composed API

All UX applications consume the **same API namespace** defined in `source/front/api/api.ts`:

```typescript
import { api } from '@front/api/api.ts'

// Auth
await api.Auth.sendOtp(email)

// Users API
const user = await api.Users.get(userId)
const canLogin = await api.Users.hasAccess(email)

// CRUD — direct to Supabase where no orchestration is required
const jobs = await api.Jobs.list()

// Offline — IndexedDB
const localJob = await api.JobsLocal.get(jobId)

// Business rules
const title = await api.createJobTitle(jobDefinition)
await api.deepCloneJob.run({ jobId })
```

The API namespace is composed once using client makers (Supabase SDK, IndexedDB, HTTP). Applications consume it directly without configuration or provider selection.

### 7.2 API Namespace Inventory

All entries in `source/front/api/api.ts`:

#### 7.2.1 Session Management

| Singleton  | Purpose                                                           |
| ---------- | ----------------------------------------------------------------- |
| `api.Auth` | Passwordless OTP auth; session lifecycle and post-auth validation |

#### 7.2.2 Domain Persistence Singletons

| Singleton       | Purpose                                                   |
| --------------- | --------------------------------------------------------- |
| `api.Users`     | User CRUD via Supabase with Auth synchronization via edge |
| `api.Assets`    | Asset CRUD via Supabase                                   |
| `api.Chemicals` | Chemical CRUD via Supabase                                |
| `api.Customers` | Customer CRUD via Supabase                                |
| `api.Services`  | Service CRUD via Supabase                                 |
| `api.Workflows` | Workflow CRUD via Supabase                                |
| `api.Jobs`      | Job CRUD via Supabase                                     |
| `api.JobsLocal` | Job aggregate CRUD via IndexedDB (field execution)        |

#### 7.2.3 Domain Operations

| Operation            | Purpose                                              |
| -------------------- | ---------------------------------------------------- |
| `api.deepCloneJob`   | Clone job aggregate to IndexedDB for field execution |
| `api.uploadJobLogs`  | Bulk append field logs to remote                     |
| `api.createJobTitle` | Derive display title string from a `JobHub`          |

**`api.Users`**

```typescript
api.Users.get(id: Id): Promise<User>
api.Users.list(options?: ListOptions): Promise<ListResult<User>>
api.Users.create(input: UserCreate): Promise<User>
api.Users.update<K>(source: ScopedUpdate<User, K>): Promise<User>
api.Users.delete(id: Id): Promise<DeleteResult>
api.Users.eject(id: Id): Promise<User>
api.Users.hasAccess(email: string): Promise<boolean>
```

`api.Users` is the user topic boundary. Callers do not know whether an operation
uses direct Supabase CRUD, an RPC, or a Supabase Edge function.

`get` and `list` use the direct Supabase table client. `hasAccess` hides the
existing `user_has_access` RPC behind the Users topic API. `create`, `update`,
`delete`, and `eject` invoke authenticated Supabase Edge functions because they
must synchronize `public.users` with Supabase Auth.

`hasAccess` returns whether the submitted email belongs to a registered, active
swarmAg user. It is used before OTP delivery so the login flow does not send
one-time codes to unknown or inactive users.

**`api.deepCloneJob`**

```typescript
api.deepCloneJob.run({ jobId: Id }): Promise<JobHub>
```

Creates a complete field-execution copy of a job aggregate for local IndexedDB
storage. The clone includes the job, phase records, finalized or preparatory
workflow context, and referenced operational data required for offline execution.

The returned `JobHub` is defined in `source/front/app/views/job-views.ts`.

**`api.uploadJobLogs`**

```typescript
api.uploadJobLogs.run({ jobId: Id, logs: JobWorkLogEntry[] }): Promise<void>
```

Bulk appends locally captured field-execution log entries to the remote job log
after connectivity returns. This is a one-way append operation, not a sync or
merge operation; uploaded entries preserve their captured timestamps, user
identity, answers, notes, attachments, and operational metadata.

`JobWorkLogEntry` is defined in `source/domain/abstractions/job.ts`.

**`api.createJobTitle`**

```typescript
api.createJobTitle(job: JobHub): string
```

Returns a display title derived from the job's current status and available phase data. This is a pure client-side computation — no network call. The derivation algorithm is status-driven and defined during jobs UI generation. For the scaffold phase, the method may be stubbed.

`JobHub` is defined in `source/front/app/views/job-views.ts`.

### 7.3 Provided Infrastructure

The foundation provides:

#### 7.3.1 Type Safety

- Import domain archetypes from `@domain` — abstractions, protocols, adapters,
  validators
- All API operations return typed domain objects
- TypeScript strict mode enforced

#### 7.3.2 Storage Abstraction

- Direct database access via RLS (no HTTP for CRUD)
- Offline storage via IndexedDB (Ops app)
- Orchestration via edge functions (complex operations)
- Client makers handle all serialization

#### 7.3.3 Offline Capability

- `api.JobsLocal` (IndexedDB client) available to all apps
- Ops app uses for field execution
- Deep clone via `api.deepCloneJob` business rule
- Log upload via `api.uploadJobLogs` business rule

### 7.4 Form-Scope Integration

The form layer owns a domain-shaped draft and the projections for create and update, so feature
code does not restate the fields or persistence rules. The layer chain and scope rules are defined
in `architecture-core.md` §5.2.6.

`@core/stdx` (`core/std/make-scope.ts`) exports `makeScope`, `makeAdaptedScope`, `Scope`,
`AdaptedScope`, `ScopeDraft`, and `DraftOf`.
`front/api/form-scopes.ts` hosts the `scopes` housing object parallel to `api.ts`.
Both makers infer from adapter field metadata without type arguments.
`ScopeDraft<T, K>` selects the scope's domain attributes, preserving domain optionality.
`DraftOf<typeof scope>` derives that draft without restating its fields. The declaration exposes
`toCreate(draft)` and `toUpdate(id, draft)`; an Adapted declaration also exposes `adapter`.

Defaults supply the required out-of-scope create attributes. The generic constraint rejects
scoped, lifecycle, and unknown default keys, including keys supplied through typed variables.
`toCreate` constructs its payload from declared defaults and selected draft fields; it never
spreads the draft. `toUpdate` selects the same fields and converts absent or `undefined` values
to `null`. Required properties may admit `undefined`, as optional associations do; required
values that do not admit absence remain unchanged. Both projections exclude unowned draft
attributes supplied through structurally compatible variables. Compositions pass through whole.
For an Adapted declaration, the scoped adapter translates the projected update; a Direct client
receives the projection untranslated.

## 8. Architectural Boundaries

### 8.1 Import Discipline

#### 8.1.1 UX applications MAY import

**Convenience Barrels**

| Import       | Purpose                                                         |
| ------------ | --------------------------------------------------------------- |
| `@core/std`  | Standard types (Id, When, Dictionary)                           |
| `@core/stdx` | Makers and wrappers to runtime project code from standard types |

**Aliases**

| Alias                                 | Purpose                            |
| ------------------------------------- | ---------------------------------- |
| `@core/*`                             | Core modules                       |
| `@domain/*`                           | Domain modules                     |
| `@ux/*`                               | Generic UX toolkit modules         |
| `@front/app/*`                        | Shared swarmAg application modules |
| `@front/config/*`                     | Configuration module               |
| `@front/app-{admin\|ops\|customer}/*` | App-local modules (own app only)   |

#### 8.1.2 Violations

Violations detected by architectural guards are build failures.

### 8.2 Configuration Pattern

Each application root imports `@front/config/ux-config.ts` before application dependencies to initialize the package configuration. Generic `ux/` modules consume `Config` from `@core/cfg/config.ts`; they never import package configuration. Application consumers use the package configuration module. Configuration-property ownership is deferred; this boundary governs imports and initialization only.

- Update `ux-config.ts` keys and aliases as required env variables expand
- Environment file naming and placeholder conventions: see `architecture-devops.md §4`

### 8.3 Reactive Store Module Pattern

The Reactive Store Module Pattern is the required architecture for UX reactive state modules.

- Export a **single namespace object** (for example `SessionState`), not raw primitives.
- Keep framework internals (`createStore`, setter functions, signals) **module-private**.
- Expose:
  - `store` for read access
  - intent-based mutation methods (`setAuth`, `setReady`, `clear`)
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

### 8.4 Query State Pattern

The Query State Pattern is the required architecture for shared, read-mostly server data that many
components consume, such as a curated catalog. It applies §8.3's information hiding to data the
server owns, which §9.6.1 assigns to TanStack Query.

- Export a **single hook**, `use{Name}(): {Name}State`, not a query object.
- Keep the query key, the loader, and any derived index **module-private**. Consumers never
  import TanStack Query.
- `{Name}State` exposes intent-named reads, plus:
  - `ready()`, true once the data has loaded, distinguishing loading from empty;
  - `failed()`, true when the load failed, distinguishing failure from loading;
  - `refresh()`, invalidating the query after the data is edited elsewhere.
- The hook is called inside the component tree, where bootstrap provides the `QueryClient`
  (§10.2). Every caller shares one cached query.

**Example Query State Module:**

```typescript
// facets-state.ts

export type FacetsState = {
  ready: () => boolean
  failed: () => boolean
  schemes: () => readonly string[]
  codes: (scheme: string) => readonly string[]
  label: (scheme: string, code: string) => string
  labelRef: (ref: string) => string
  labelRefs: (refs: readonly string[]) => readonly string[]
  refresh: () => Promise<void>
}

const FACETS_QUERY_KEY = ['facets'] as const

export const useFacets = (): FacetsState => {
  const client = useQueryClient()
  const query = createQuery(() => ({
    queryKey: FACETS_QUERY_KEY,
    queryFn: loadFacets,
    staleTime: Infinity
  }))
  const facets = (): readonly Facet[] => query.data ?? []
  const label = (scheme: string, code: string): string =>
    facets().find(facet => facet.scheme === scheme && facet.code === code)?.label
      ?? `${scheme}:${code}`
  const labelRef = (ref: string): string => {
    const [scheme, code] = ref.split(':')
    return label(scheme, code)
  }
  return {
    ready: () => query.isSuccess,
    failed: () => query.isError,
    schemes: () => [...new Set(facets().map(facet => facet.scheme))].sort(),
    codes: scheme =>
      facets().filter(facet => facet.scheme === scheme && facet.active).map(facet => facet.code).sort(),
    label,
    labelRef,
    labelRefs: refs => refs.map(labelRef),
    refresh: () => client.invalidateQueries({ queryKey: FACETS_QUERY_KEY })
  }
}
```

## 9. Application Runtime Patterns

### 9.1 Application Shell Structure

Each app root (`source/front/app-{admin|customer|ops}/app.tsx`) composes the same shell primitives from `ux/`:

```text
app.tsx
└── bootstrap()
    ├── Login              — unauthenticated entry point
    ├── AuthGuard          — session enforcement, redirect to /login
    └── Dashboard          — primary navigation surface
```

Authenticated routes render their primary application surface inside a semantic
`main` landmark. `main` is required accessibility plumbing, not a UX metaphor or
shared shell primitive.

`AuthGuard` and `Dashboard` live in `source/ux/shell` — fully generic. `Login` is swarmAg-branded presentation and lives in `source/front/app/shell/`; `source/ux/shell/runtime/shell-makers.tsx`'s `makeAnonymousShell()`/`makeDashboardShell()` take it (and `AboutBox`) as route-component parameters rather than importing them directly, and `source/front/app/shell/shell-makers.tsx` re-exports both names pre-bound to swarmAg's versions — every app root imports the app-tier maker, not the generic one. Each app package declares a complete `Application`: a common anonymous shell plus a dashboard shell, and the application-owned session coordinator. The dashboard shell receives its app-local dashboard configuration (`app-{admin|ops|customer}-dashboard.json`), the merged widget registry (`§10.3`), and app-specific route presentations before shared bootstrap mounts it.

#### 9.1.1 UX Metaphors

All feature work should use an existing UX metaphor when one fits:

| Metaphor                | Purpose                                                          |
| ----------------------- | ---------------------------------------------------------------- |
| **Dashboard**           | Authenticated hub and primary navigation surface                 |
| **Widget**              | Dashboard surface unit for status, data, and action entry points |
| **Abstraction Manager** | Standard domain "collection-detail" management experience        |
| **Wizard**              | Complex user interface decomposed into a multi-step wizard       |
| **Job Runner**          | Specialized, sequenced task surface for infield operational work |

#### 9.1.2 Auth Guard

The shell root reads `SessionState.store.isAuthenticated` before rendering any authenticated content. Unauthenticated users are redirected to login. This is the only authorization check in the UX layer — all data authorization is enforced by RLS at the database layer.

#### 9.1.3 Dashboard as Primary Navigation

There is no navigation menu in any app. The dashboard is the primary interface and the primary navigation surface. Dashboard widgets and cards are the entry points into domain pages. Navigation is:

```text
dashboard → domain page → back to dashboard
```

### 9.2 Routing

Common routes are supplied by `makeAnonymousShell()` and `makeDashboardShell()`, generic in `source/ux/shell/runtime/shell-makers.tsx` and re-exported pre-bound to swarmAg branding from `source/front/app/shell/shell-makers.tsx` — app roots import the latter. Each app root declares its complete shell collection in `app.tsx`, including app-specific dashboard presentations. `bootstrap()` compiles that collection; it does not accept raw route extensions or optional composition fragments.

The shell route grammar is the public routing API for all front applications. Applications declare route intent through `Routes` and shell composition contracts. Application, feature, page, and widget code must not import router-vendor APIs directly.

Router libraries are shell runtime implementation details. The current shell runtime uses TanStack Solid Router to execute the shell route grammar, but TanStack route APIs do not define the application routing contract. Direct router-vendor imports are confined to shell runtime implementation files under `source/ux/shell/runtime/`.

Imperative navigation flows through `useShellNavigate()`. Declarative route redirection flows through `ShellRedirect` and `ShellReplace`. This keeps navigation vocabulary owned by the shell and preserves a single implementation point if route behavior is enriched or the runtime substrate changes.

A **page** is a routable, context-scoped, auth-guarded UX module. Pages may be a **domain page** — a standard list or object view — or a **feature page** — a specialized guided interface. There is no architectural distinction between them — `{page}` in the route shape below refers to either.

#### 9.2.1 Route Shape

```text
/                          → dashboard (auth-guarded)
/login                     → login (unauthenticated)
/{page}                    → page (auth-guarded)
/{page}/{id}               → item-scoped page (auth-guarded)
/{page}/{operation}        → operation-scoped page (auth-guarded)
/{page}/{operation}/{id}   → item-scoped operation page (auth-guarded)
```

The first two routes are provided by the shared shell makers and are common to all apps. App-local `app.tsx` files extend the tree with app-specific pages as the application is built out.

Examples: `/user/list`, `/user/get/{id}`, `/job-runner/{id}`.

#### 9.2.2 Protected Routes

Protected routes wrap content in the auth guard component. The guard is a route-level concern, not a per-component concern.

### 9.3 Authentication

`AuthSupabaseClient` (`source/core/cli/auth-supabase-client.ts`) is a singleton that directly
implements `ApiAuthContract` (`source/core/api/api-auth-contract.ts`). It is not a maker; there is
exactly one auth implementation. It is composed into the API namespace as `api.Auth`.

| Method                        | Purpose                                                        |
| ----------------------------- | -------------------------------------------------------------- |
| `sendOtp(email)`              | Send a one-time code; never provisions a new Auth identity     |
| `verifyOtp(email, code)`      | Verify the code and return a normalized `Session`              |
| `logout()`                    | End the remote session                                         |
| `getSession()`                | Resolve the persisted browser session, or `null`               |
| `onAuthStateChange(callback)` | Subscribe to session changes; returns the unsubscribe function |

`ApiAuthContract` is transport-oriented: it carries sessions, not domain users, and has no
domain `validateUser` method.

#### 9.3.1 Application-Owned Session Coordination

`ShellApplication` requires a `session: SessionCoordinatorContract` alongside its shells. The
UX-owned contract (`source/ux/shell/runtime/shell.ts`) has two methods: `init()` and `clear()`.
Bootstrap calls `init()` synchronously during its Solid mount callback; generic bootstrap does not
consume `api`. `Routes.application(shells, session)` assembles the two.

The application supplies `SessionCoordinator` from `source/front/app/shell/session-coordinator.ts`.
`init()` starts persisted-session resolution, subscribes to `api.Auth.onAuthStateChange`, and
registers cleanup with the current Solid owner: unsubscribe, then `clear()`. `clear()` drops the
prepared identity and clears `SessionState`. The coordinator owns user hydration and eligibility;
the shell owns the lifecycle invocation and baseline session state.

#### 9.3.2 OTP and Session Flow

Login (`source/front/app/shell/login.tsx`) is the application's passwordless email OTP surface. It
checks `api.Users.hasAccess` before sending a code, then verifies the submitted code through
`api.Auth.verifyOtp`. Auth events and the initial `getSession()` resolution enter the coordinator
through one path:

1. A null session clears the coordinator.
2. An identity change clears the coordinator before anything else.
3. `SessionState.setAuth(userId)` publishes the authenticated identity.
4. An already-prepared matching user ID stops here; hydration does not repeat.
5. Otherwise `api.Users.get(userId)` loads the domain user.
6. If the identity changed while the user loaded, the result is discarded.
7. An inactive user is signed out through `api.Auth.logout()`, and the coordinator clears even if
   remote sign-out fails.
8. An active user is discarded after validation; only its prepared user ID is kept.
9. `SessionState.setReady()` marks application data ready.

The prepared user ID is private coordinator state, not a domain-user cache. `isDataReady` is a
separate application-readiness signal. A missing domain record is an integrity error and
propagates; it is not treated as an inactive user.

#### 9.3.3 Logout

The generic `logout(auth)` (`source/ux/shell/runtime/logout.ts`) receives `ApiAuthContract`
explicitly, ends the remote session, and always clears `SessionState`, logging a failed remote
sign-out. The app-tier shell maker wraps it so that `SessionCoordinator.clear()` also runs even if
remote sign-out fails. Auth sign-out events clear the coordinator too. The `/logout` route
transition to `/login` belongs to the generic shell (`makeAnonymousShell`).

### 9.4 Session State

`SessionState` (`source/ux/shell/runtime/session-state.ts`) is the baseline session module, a
Reactive Store Module (§8.3) typed by `SessionStateContract`. It holds authentication and readiness
only; domain data about the user belongs to application modules.

| Field             | Meaning                                                                 |
| ----------------- | ----------------------------------------------------------------------- |
| `userId`          | The authenticated user's id, published from the auth session, or `null` |
| `isAuthenticated` | A session is active                                                     |
| `isLoading`       | The initial auth check is unresolved; prevents a login flash            |
| `isDataReady`     | Application data preparation is complete; not the identity sentinel     |

| Intent method     | Effect                                                   |
| ----------------- | -------------------------------------------------------- |
| `setAuth(userId)` | Publish the identity: authenticated, loading cleared     |
| `setReady()`      | Mark application data ready                              |
| `clear()`         | Reset to signed out: no identity, not loading, not ready |

Components consume `SessionState.store`, never Supabase Auth. The session coordinator (§9.3.1)
publishes identity and readiness; logout (§9.3.3) also clears it. Applications that need further
reactive session data define their own Reactive Store Modules. `AppState` is the generic persistent
key/value preference store (§9.5.2). The application-facing API re-exports both stores; UX imports
its own stores directly and never imports `front/api`.

### 9.5 IndexedDb Usage

IndexedDb is the browser-side persistent store for all offline-data concerns.

#### 9.5.1 IndexedDB Database Names

IndexedDB usage is split into two layers:

- Database namespace (physical DB name), `Config.get('LOCAL_DB_NAME')`, per deployment package.
- Object Store names are not shared implicitly; they must be registered with `@core/db/indexeddb.ts` using `IndexedDb.registerStore('storeName')`
  - Object Store's for domain abstractions are named for the abstraction, for example, `Job` or `Workflow`.
- A CRUD/List maker is provided to standardize usage of the local database with `@core/cli/make-indexeddb-client.ts` conforming to `ApiCrudContract` in `@core/api/api-contract.ts`

**IndexedDB Database Names**

| Database Name          | App      | Content                                                      |
| ---------------------- | -------- | ------------------------------------------------------------ |
| `swarmag-app-admin`    | Admin    | dashboard configuration, panel config, theme                 |
| `swarmag-app-ops`      | Ops      | dashboard configuration, panel config, theme, job aggregates |
| `swarmag-app-customer` | Customer | dashboard configuration, theme                               |

#### 9.5.2 Application Preferences

`AppState` (`@ux/shell/runtime/app-state.ts`) manages per-app preferences — persisted key/value pairs backed by a named IndexedDB object store. Conforms to the Reactive Store Module Pattern (§8.3).

| Key                | Admin | Ops | Customer |
| ------------------ | ----- | --- | -------- |
| `theme`            | ✓     | ✓   | ✓        |
| `dashboard:panels` | ✓     | ✓   | —        |

### 9.6 State Management

| Concern          | Mechanism       | Location                                |
| ---------------- | --------------- | --------------------------------------- |
| auth / session   | SolidJS store   | `ux/shell/runtime/session-state.ts`     |
| app preferences  | IndexedDB       | `ux/shell/runtime/app-state.ts`         |
| dashboard config | IndexedDB       | `ux/shell/dashboard/dashboard-state.ts` |
| server data      | TanStack Query  | per-page query hooks                    |
| shared catalogs  | TanStack Query  | Query State modules (§8.4)              |
| local ui state   | SolidJS signals | component-local                         |
| ops field data   | IndexedDB       | `app-ops/stores/jobs-store.ts`          |

Drafts never share object or array structure with their source, coming in or going out.
Compositions have no identity; draft owners copy their values when opening, accepting changes,
snapshotting a baseline, and projecting a result. `copyDraft<T>(value: T): T` in
`ux/shell/workbench/workbench-draft.ts` uses `structuredClone(unwrap(value))` to copy plain
domain values and Solid store data at every nested level. Draft data must remain plain and
cloneable; functions and class instances do not belong in it.

#### 9.6.1 Rules

- State modules must not import JSX modules, directly or through runtime dependencies, so
  state remains testable without a browser. Type-only imports do not load those modules.
- Signals for local, transient UI state — inputs, open/close, hover
- Stores for shared cross-component state — session, app preferences, dashboard config
- TanStack Query for all server data — caching, loading, error states
- No prop-drilling of session or user — read from session store directly
- A form declares its own update scope as part of its design, submitting a `ScopedUpdate<T, K>`
  rather than the broad `UpdateFromInstantiable<T>` protocol

## 10. Shared Application Features

### 10.1 Common Component Boundaries

Three tiers, not two. `source/ux/` is the generic UX toolkit — portable to any future
Seasons Computing project, not just swarmAg. `source/front/app/` is swarmAg-suite-wide: shared
across all three apps, reactive and adaptive by default like `ux/`, but under no obligation to
generalize past swarmAg itself. Each `app-{admin|ops|customer}/` is the single-application tier.

#### 10.1.1 General-purpose UI foundation (`ux/ui/`)

```text
ux/
└── ui/            — portable shared UI foundation
    ├── components/ — HTML and Kobalte-backed Ui{Control} primitives
    ├── charts/    — reserved chart primitive directory
    ├── css/       — CSS barrel, tokens, roles, themes, base, ui, and icon styles
    ├── fonts/     — self-hosted font assets
    └── icons/     — shared icon assets
```

#### 10.1.2 Generic UX toolkit foundation (`ux/`)

```text
ux/
├── shell/
│   ├── runtime/    — bootstrap, shell composition, routing, session, preferences, metadata
│   ├── dashboard/  — dashboard host, layout state, seed and widget contracts
│   ├── panel/      — panel foundation, headers, collections, drill-down and return controls
│   └── workbench/  — abstraction manager, wizard, provider contracts and form behavior
├── views/    — generic UX projection types (placeholder — none exist yet)
└── widgets/  — app-neutral widget catalog (already parameterized, e.g. HelmWidget)
```

Shell modules are grouped by topic in these four leaf directories. Components, contracts,
state, and companion styles remain together within their topic; consumers import files directly.
`panel/` supplies the shared foundation, including collection and drill-down behavior.
`workbench/` composes responsive working surfaces using that foundation: the abstraction
manager and wizard coordinate interaction and their supporting form behavior. A dialog is
a host for a workbench, not its defining boundary. Existing responsive collapse, sizing,
spacing, rhythm, and presentation behavior remain unchanged.

`shell-makers.tsx`'s `makeAnonymousShell()`/`makeDashboardShell()` take `Login`/`AboutBox` as
route-component parameters rather than importing them directly, so this tier carries no reference to branded
components (`§9.1`).

#### 10.1.3 swarmAg-suite foundation (`app/`)

```text
app/
├── assets/     — swarmAg brand assets (logo files, flat — one asset kind today)
├── components/ — swarmAg-specific reusable UI controls (placeholder — none yet)
├── shell/      — branded chrome and application wiring (*)
│   └── notes-editor.tsx — stock notes Index-Detail editor
├── stores/     — swarmAg-suite state beyond the toolkit baseline (facets-state.ts)
├── views/      — swarmAg domain projections (job-views.ts)
└── widgets/    — swarmAg-suite widget catalog (e.g. BrandWidget)
```

(*) `shell/` holds `about-box`, `brand-hero`, `login`, and `notes-editor`; the maker wrapper binding `ux/shell`'s
generic makers to swarmAg branding; and `session-coordinator.ts`.

#### 10.1.4 Stays in the app

- dashboard default configuration and app-specific widget composition
- domain pages and feature pages
- app-specific route tree
- app-specific IndexedDB store instance

#### 10.1.5 Rule

A component moves from an `app-{name}/` to `app/` when a second swarmAg app needs it — not
before. A component moves from `app/` to `ux/` only when it is generic enough to be useful
outside swarmAg entirely, not merely because all three swarmAg apps already need it — being
shared suite-wide is what `app/` is for, and does not by itself earn a component the toolkit
tier. Premature generalization past the tier a component has actually earned is a violation
either way.

Premature generalization is a violation.

#### 10.1.6 Workbench steps and the shared panel sequence

Both workbenches host a sequence of one or more steps. A step is one panel; a drill-down inside a
step replaces that panel's content and remains the same step. The workbench owns the aggregate
draft and commits it once. Steps never commit.

**Library: `source/ux/shell/panel/`.** The step contract is shared by both workbenches, so it
lives in `panel/`:

| Name                                           | Responsibility                                                                                 |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `PanelStep`                                    | One step: `name`, `title`, optional `validate`, `render(context)`                              |
| `PanelSequence`                                | `readonly PanelStep[]`                                                                         |
| `PanelStepContext`                             | Validation, drill-return, trailing-action, and dirty-check registration; `feedback`; `busy`    |
| `createPanelSequence` / `PanelSequenceControl` | Instance-local cursor, Back, validated Next, completion validation, validation registration    |
| `PanelSequenceStep`                            | Renders the current step and owns the step transition motion                                   |
| `PanelSequenceHeader`                          | The composed header: Back, Next, the advance slot, and the nested Index-Detail hand-off        |
| `PanelSequenceProgress`                        | The horizontal progress indicator for a sequence of more than one step; the Wizard presents it |

The controller has no draft, persistence, or chrome. Advancement validates the current step;
after Back, that step is validated again on the next forward traversal. There is no arbitrary
jump API. `PanelSequenceHeader` follows `ux-design-archetypes.md` §§3.3 and 4.2:

- At a step's Index, Back and Next are live. The final step's advance slot holds the commit
  action the host supplies.
- Inside a nested Detail, those controls are absent. Drill-back is the only ascend control, and
  the innermost Detail's Save takes the advance slot. It validates and returns to its parent
  Index, or stays on failure.
- The header names the path by kind.

With one step, the header reduces to the host's simple header.
Glyphs, header states, and transition motion are defined here once; no feature restates them.

**Workbenches: `source/ux/shell/workbench/`.**

- `Wizard` takes `WizardContract = { formTitle, steps: PanelSequence, commit, feedback? }`.
  - It commits once, at Finish. The commit may write one abstraction, several, or none.
  - It presents progress with `PanelSequenceProgress` when its sequence has more than one step.
  - Above its container threshold, it also lays the sequence out as a tree in its aside
    (`PanelStepflow`). That tree is Wizard chrome.
- `AbstractionManager` takes `detail: (item: T | null) => AbstractionDetail<Draft>`, where
  `AbstractionDetail<Draft> = { steps: PanelSequence; draft: () => Draft }`.
  - It calls `detail` for each Item it opens; that is how an Item hydrates its steps.
  - It validates through sequence completion and persists through its provider's `create` or
    `update`.
  - Save takes the final advance slot and is offered only when no nested Detail is open.
  - Its aside is always its Collection. It presents no progress, whatever the step count: the
    step title in the header and Next versus Save orient the user within an existing record.
  - Below the threshold, step 1's leading control returns to the Index and later steps show
    Back; nothing reaches the Index from a later step. Above it, selecting another Item or New
    leaves the Detail from any step.
  - The Manager snapshots the draft when it opens an Item. Any exit that would discard a changed
    draft asks first: another Item, New, the collapsed return, and Cancel.

A step containing a drill-down hosts `DrillDown` at its root and supplies its
`PanelStepContext`. Opened panels receive `DrillPanelContext`: `isActive`,
`registerDirty`, `registerSave`, and `returnToParent`. `CollectionPanel` passes that
context to its item renderer. Panel activity is host-owned and independent of depth.
Only the active panel supplies the header Save; a covered panel retains its working
copy and dirty checks. Every open panel contributes to workbench discard protection.
Local drill-back checks only the active panel and asks before discarding changes.
Successful Save validates and updates the parent draft before `returnToParent` returns
without a discard prompt. Closing a panel disposes its registrations and pending draft;
covering it does not. Restoring its parent restores that parent's Save.

`NotesEditor` in `front/app/shell/` is the stock notes Index-Detail pair. It takes
`notes: () => readonly Note[]`, `onChange: (notes: readonly Note[]) => void`, and
`drill: DrillContract`. It edits Content and Visibility, defaults new notes to Internal,
and never persists. Existing timestamps and attachments are preserved. Billing-address
fields and their validation occupy the separate Customer Billing step.

Dirty-state belongs to each draft's context. `PanelStepContext.registerDirty(check)` exposes a
local change check to the workbench and returns its cleanup callback. Retained feature-state
checks last for the session, across step remounts; nested draft checks are cleaned up when their
draft closes. The sequence controller does not own dirty-state. Local Up asks only about the
Detail it discards. Workbench Cancel and collection select/New check the aggregate and all open
nested drafts, then ask once before abandoning the session. The collapsed first-step return
receives the same protection. Back/Next preserves drafts and does not prompt.

Non-dismissible `UiDialog` surfaces block both outside-click and Escape dismissal. Workbenches
therefore exit through their explicit controls and contextual dirty checks. Dismissible dialogs
retain both dismissal paths.

**Features: `source/front/app-admin/`.**

- `customers/` supplies the Customer steps and nothing about their host.
  - `customer-steps.tsx` exports `customerSteps(state)`: Detail, Contact, Billing, and Sites.
  - `customer-state.ts` owns the state, `CustomerDraft`, and the `customerDraft(state)`
    projection.
  - The Customer steps are a fragment. They know nothing of position, progress, or what
    precedes or follows them.
- `CustomerManager` returns `customerSteps(state)` and the draft projection from `detail`. It
  seeds state from the opened Customer, or blank for New.
- `OnboardingWizard` is the only composer of Onboarding's sequence. It builds that sequence from
  `customers/` today, and from Initial Job Assessment's steps later. Its `commit` writes the
  aggregate once, at Finish. Both of the Wizard's progress presentations derive from the
  composed sequence.
- `UserManager` returns the single `user-step-detail` step; `user-state.ts` owns the state,
  `UserDraft`, and the `userDraft(state)` projection.
- Steps are named `{topic}-step-{name}.tsx`, where `detail` names the primary or only step.
  "Editor" is reserved for a reusable form kind, such as the notes editor, or a drill-down
  editor inside a step.

The Customer workbench declares contact, identity, status, address, sites, and notes in
`front/api/form-scopes.ts` through `makeAdaptedScope`, with
`{ accountManagerId: undefined }` as create defaults.
`CustomerDraft` in `customer-state.ts` is `DraftOf<typeof scopes.Customers.detail>`; its state and
projection remain domain-shaped. Customer Manager and Onboarding create through
`scope.toCreate(draft)`. The Manager updates through
`api.Customers.update(scope.adapter, scope.toUpdate(id, draft))`; no caller patches `line2` locally.
Users declares `scopes.Users.detail` through `makeScope` and writes through the Direct update
contract.

Customer Manager is available at `/customers` from the Admin dashboard. It supports New, editing,
and confirmed soft Delete through the existing Customer API.

- Delete is for an account that should not exist. Inactive status is for a real former customer.
- A Jobs dependency guard is deferred to Job Definition.
- Lists match User Manager's first-page `limit: 100`; pagination is separate work.
- `scopes.Customers.detail` in `front/api/form-scopes.ts` covers primary contact,
  identity, status, billing address, sites, and account notes. It excludes account-manager assignment.
- Clearing an optional stored address field uses the existing explicit-null update protocol.

Onboarding inherits the four Customer steps and account-note editing, retaining its create-only
workflow and single commit at Finish.

### 10.2 Build Composition

Each app is an independent Vite build producing a deployable PWA bundle:

```text
swarmag-app-admin    = front/app-admin    + front/app + ux + front/api + front/config
swarmag-app-ops      = front/app-ops      + front/app + ux + front/api + front/config
swarmag-app-customer = front/app-customer + front/app + ux + front/api + front/config
```

- Three Vite configs, one per app
- Three Netlify sites, one per app
- `ux/` and `front/config/` are compile-time inclusions via path aliases — not packages, not runtime imports
- `front/config/` contains two files when packaged: `ux-config.ts` and the target env file
- The target env file binds the static bundle to one backend target; the same
  bundle may be served locally or remotely without changing that binding
- `bootstrap()` owns generic boot-time initialization — CSS barrel (`css.tsx`), preference state, application-supplied session initialization, and shell route runtime mounting. App roots (`app.tsx`) declare a complete `Application` and pass it to `bootstrap(application)`; application roots initialize package configuration first
- Packaging, artifact format, and deployment workflow: see `architecture-devops.md §7`
- No build artifacts are checked into the repository

### 10.3 Dashboard Layout Contract

```text
Dashboard
  ├─ HeaderPresentationRegion
  │  ├─ LeadingIdentityField (shell logo + BrandWidget)
  │  ├─ OrderedHeaderField[]
  │  └─ TerminalActionField
  │     └─ normal/tall or wrapped/short; full inner field when wrapped
  └─ BodyPresentationRegion (vertical scroll)
     └─ DashboardRow[] (ordered body presentation regions)
        └─ Widget[] (presentation shape: compact | landscape)
```

The Dashboard is a responsive presentation field. The shell owns ordered placement,
row rhythm, allocated fields, containment, and responsive expansion. It preserves
visual and keyboard order together. Each allocated field provides a widget's available
inline and block footprint together with its row context. As available space contracts,
widgets may adapt their presentation; when the field needs more space, it adds rows
while retaining ordered placement. The shell does not require horizontal scrolling.

The header provides two deterministic responsive contexts, selected by container
query against the header's own inline size — not the viewport. CSS selects the
context before layout; the shell does not measure rendered positions or mutate
context after mount.

Threshold values are stylesheet-owned and are not restated here: the stacked-header
threshold lives in `dashboard.css`, and the base-scale step lives in `tokens.css`.
Each is expressed as the intrinsic width it protects, so the number can be re-derived
rather than inherited.

`compact` and `landscape` are widget presentation shapes, not shell geometry. A
widget uses its configured shape to express its data within the footprint allocated
by the presentation field; the shell does not impose a fixed width or height from
that shape, or define a finite vocabulary of visual transformations. Widget intrinsic
minimum, optimal, and maximum useful measures remain implementation-local behavior:
no Widget SPI, registry, seed, state, or Dashboard-schema allocation metadata is
introduced.

Shell identity is the intentional exception to ordinary dashboard content. The logo
and brand anchor the highest-priority region, remain legible and non-wrapping, and
do not participate in content-driven transformation. The header and body use the
same placement principles at their respective scales.

**`source/front/app-{admin|ops|customer}/dashboard-{admin|ops|customer}.json`**

Layout is data-driven via app-local dashboard JSON, rendered by the shared dashboard shell/harness, and hydrated into `DashboardState` (`source/ux/shell/dashboard/dashboard-state.ts`). Not hardcoded. The current contract uses one default config per app.

The app-local dashboard JSON conforms to the dashboard seed contract in `source/ux/shell/dashboard/dashboard-contract.ts`. `DashboardState.init(seed)` validates the seed and converts it into `DashboardStoreView` from `source/ux/shell/dashboard/dashboard-state.ts` by assigning stable store identity to the dashboard, rows, and widgets before persisting the layout in IndexedDB.

`makeDashboardShell()` initializes `DashboardState`, then constructs `Dashboard` with the state contract and the app-supplied widget registry as explicit inputs. A registry is the right shape here because the widget type is variant: the dashboard JSON picks a widget by an arbitrary type string, so something has to resolve that string to a component, and neither the JSON author nor the registry author can know the other's exact set in advance. Each app root merges two registries into one — `ux/widgets/widget-registry.ts`'s generic catalog and `app/widgets/widget-registry.ts`'s swarmAg-suite catalog, both exporting the same `widgetRegistry()` name, combined by object spread — alongside its dashboard JSON: the two halves of one dashboard-shell declaration.

The shell is the closed IoC application framework. It owns the widget extension contracts in `source/ux/shell/dashboard/widget-contract.ts` and shared shell services such as `getShellIdentity()`. Concrete widgets implement those contracts and may consume public shell services. The shell never imports the widget catalog or any concrete widget; applications bind concrete widgets at their composition roots. This direction keeps the shell closed when features are added and prevents a shell/widget dependency cycle. `guard:namespaces` enforces the shell-to-widget
prohibition.

Dashboard state remains a Reactive Store Module. The dashboard receives its namespace contract directly and never exposes framework setters. Dashboard state is shell-local UX state and is not part of the composed `source/front/api/api.ts` namespace.

```json
{
  "header": {
    "widgets": [
      { "type": "BrandWidget", "settings": { "...": "..." } },
      { "type": "HelmWidget", "settings": { "...": "..." } }
    ]
  },
  "rows": [
    {
      "size": "standard",
      "label": "...",
      "widgets": [{ "type": "SomeWidget", "settings": { "...": "..." } }]
    }
  ]
}
```

Per-widget `settings` shape is that widget's own contract, not restated here —
see `source/front/app-admin/dashboard-admin.json` for a live, current example.

### 10.4 Views Catalog

UX projection types — shapes that exist because the domain model does not surface cleanly to the UI as-is. No infrastructure imports, no SolidJS imports. Pure types only. Files follow the `{domain}-views.ts` naming convention.

| File                    | Location              | Types                                                             | Purpose                                             |
| ----------------------- | --------------------- | ----------------------------------------------------------------- | --------------------------------------------------- |
| `job-views.ts`          | `app/views/`          | `JobManifest`, `JobHub`                                           | Job display projections                             |
| `dashboard-contract.ts` | `ux/shell/dashboard/` | `Dashboard`, `DashboardHeader`, `DashboardRow`, `DashboardWidget` | Dashboard seed contract types                       |
| `workflow-views.ts`     | `app/views/`          | `WorkflowView`                                                    | Ordered tasks + questions resolved for renderer     |
| `question-views.ts`     | `app/views/`          | `QuestionView`                                                    | Discriminated union flattened for workflow renderer |

`dashboard-contract.ts` sits in `ux/shell/dashboard/` rather than either `views/` directory — it's the
seed contract the generic dashboard host validates against, not a projection type. `job-views.ts`
is swarmAg's own domain projection (`Job`, `JobAssessment`, `JobPlan`), not generic — the same
test places `workflow-views.ts`/`question-views.ts` in `app/views/` once built, since `Workflow`/
`Question` are equally swarmAg domain abstractions.

## 11. Specialized Application Features

The following catalogs describe the target feature set. Components not yet present are created as features are built.

### 11.1 Job Runner Components (app-ops)

All in `source/front/app-ops/job-runner/`. Mobile-only — does not belong in `ux/`.

| Component                          | Purpose                                 |
| ---------------------------------- | --------------------------------------- |
| `runner.tsx`                       | Top-level runner, state machine         |
| `progress.tsx`                     | Route bar — tasks + questions remaining |
| `question-screen.tsx`              | Per-question renderer                   |
| `answers/boolean-answer.tsx`       | Full-width YES/NO buttons               |
| `answers/text-answer.tsx`          | Large text input                        |
| `answers/number-answer.tsx`        | Large stepper / keypad                  |
| `answers/single-select-answer.tsx` | Large tappable tiles                    |
| `answers/multi-select-answer.tsx`  | Tappable tiles with checkmark           |
| `answer-attachment.tsx`            | Camera-first attachment trigger         |
| `nav.tsx`                          | BACK + NEXT, forward-biased             |
| `task-complete.tsx`                | Task arrival screen                     |
| `complete.tsx`                     | Final arrival screen                    |

### 11.2 Job Lifecycle Feature Pages (app-admin)

#### 11.2.1 Device Target

| Phase                       | App         | Feature Page     | Primary Device           |
| --------------------------- | ----------- | ---------------- | ------------------------ |
| Initial assessment (remote) | `app-admin` | `onboarding`     | Desktop, Tablet          |
| Onsite assessment           | `app-admin` | `job-assessment` | Tablet (offline-capable) |
| Job planning                | `app-admin` | `job-planning`   | Desktop, Tablet          |
| Job runner                  | `app-ops`   | `job-runner`     | Mobile                   |

#### 11.2.2 Specialized UX

Job assessment and job plan are purpose-built guided flows, not generic admin forms. Both involve structured data capture in semi-field conditions.

Assessment involves: location capture, photos, risk notes, workflow selection, workflow modification. Tablet is a practical requirement for the onsite phase.

#### 11.2.3 Workflow Editing in Context

Job assessment and job planning may modify job-specific workflow clones. The editor operates on a cloned `Workflow` record (not the canonical template) scoped to the job context. The canonical workflow builder feature lives in `source/front/app-admin/workflow-builder/` and is mounted by app routes where needed.

Per `domain-model.md §2.5`:

- Assessment clones the basis workflow → `JobWorkflow.modifiedWorkflowId`
- Planning may further modify the assessment clone
- At execution start, the manifest is finalized and immutable

### 11.3 Dashboard Components

| Component         | Purpose                                      |
| ----------------- | -------------------------------------------- |
| `Dashboard`       | Root layout, row renderer, scroll container  |
| `DashboardRow`    | Ordered body presentation region             |
| `DashboardWidget` | Widget host and allocated presentation field |

### 11.4 Widget Catalog

| Widget                    | Size      | Contents                              |
| ------------------------- | --------- | ------------------------------------- |
| `UpcomingJobsWidget`      | landscape | Job list, status badges               |
| `JobCalendarWidget`       | landscape | Calendar view of scheduled jobs       |
| `CustomersWidget`         | landscape | Customer table, action buttons        |
| `CrewWidget`              | compact   | Active crew, availability             |
| `AssetStatusWidget`       | compact   | Asset list, status indicators         |
| `ChemicalInventoryWidget` | landscape | Chemical table, signal word badges    |
| `ServicesWidget`          | compact   | Service catalog summary               |
| `JobStatusWidget`         | compact   | Pie chart — job status distribution   |
| `JobTrendWidget`          | landscape | Line chart — job throughput over time |
| `ChemicalUsageWidget`     | compact   | Pie chart — usage by type             |
| `AssetUtilizationWidget`  | compact   | Bar chart — utilization rate          |
| `WorkflowLibraryWidget`   | landscape | Workflow + task catalog               |
| `RecentActivityWidget`    | landscape | Append-only activity feed             |

### 11.5 StatCard Catalog

| StatCard                    | Metric                         | Drills to            |
| --------------------------- | ------------------------------ | -------------------- |
| `JobsActiveStatCard`        | Open/executing job count       | Upcoming Jobs widget |
| `JobsUpcomingStatCard`      | Planned jobs this week         | Job Calendar         |
| `AssetsMaintenanceStatCard` | Assets in maintenance/reserved | Asset Status widget  |
| `ChemicalAlertStatCard`     | Low stock / expiring chemicals | Chemical Inventory   |
| `CrewActiveStatCard`        | Active crew today              | Crew widget          |
| `RevenueStatCard`           | Rolling period revenue         | Job Trend widget     |

### 11.6 Management Forms (app-admin)

Standard domain pages follow a list → form pattern. Each root abstraction not subsumed by a feature page gets a domain page in `app-admin`.

| Domain Page | Form           | Key complexity                                |
| ----------- | -------------- | --------------------------------------------- |
| `/user`     | `UserForm`     | Role multi-select, status                     |
| `/asset`    | `AssetForm`    | Type association, status                      |
| `/service`  | `ServiceForm`  | Required asset types, facets                  |
| `/chemical` | `ChemicalForm` | Signal word severity, restricted use, SDS url |

### 11.7 Job Runner Interaction Contract (app-ops)

A job's work effort is assessed, planned, and executed in a prescribed order. Canonical model: `Job: [JobAssessment, JobPlan, JobWork]`. Colloquial UX hub: `job: [assessment, plan, work]`. Services that swarmAg offer require the physical labor of several crew members, and sometimes multiple crews. Expensive and dangerous vehicles, equipment, tools, and chemicals are essential to those services. Prescribing the order of work, specifying specific tasks to perform, and ensuring protocols for safety and efficiency are followed, with consistent, repeatable results is the mandate of the swarmAg Operations Mobile Application.

To automate and measure as much of the effort as possible a job is subdivided into service workflows. For example, a customer requires pesticide spray service of 2 pastures. swarmAg assigns 2 pilots and 2 drones to the job. Each pilot is assigned job work with several workflows, 3 of those workflows are preflight, chemical-load, and spray. Each of those has steps unique to it. Preflight will check battery capacity for all batteries, connect drone communications, etc. Each of the tasks has a checklist to advise or collect information. Each item in the checklist is just a question. Order is essential of course. You don't want to spray before preflight. You can't connection communications until the drone has power.

#### 11.7.1 Interaction Model Contract

The workflow execution UX follows the **turn-by-turn navigation** mental model
(Google Maps / Apple Maps). The analogy:

| Maps                      | Workflow                    |
| ------------------------- | --------------------------- |
| Current maneuver          | Current question            |
| Street name / instruction | Question prompt             |
| Distance to next turn     | Questions remaining in task |
| Overall ETA               | Tasks remaining in workflow |
| Arrived                   | Task complete               |

#### 11.7.2 Operational Safety Interaction Constraints

The crew member is physically operating dangerous equipment while using this UI.

**Design constraints:**

- **One question per screen** — no scrolling mid-task
- **Large touch targets** — minimum `--sa-touch-target` for interactive elements
- **Maximum contrast** — answers must be unambiguous at a glance
- **Boolean = two full-width buttons** — YES (green) / NO (red), not a toggle
- **Single-select = large tappable option tiles** — not a dropdown
- **Multi-select = same, with checkmark state**
- **Number = large stepper or numeric keypad** — not a free text field
- **Text = last resort** — large input, minimal keyboard friction
- **Progress always visible** — current task, current question, total remaining
- **Forward momentum** — NEXT is the dominant action, BACK is available but not prominent
- **Camera-first attachment** — one tap to camera, returns directly to question

#### 11.7.3 QuestionType-to-UI Mapping Contract

Exhaustively known from the domain `QuestionType`:

| Type            | UI Treatment                               |
| --------------- | ------------------------------------------ |
| `boolean`       | Two full-width buttons — YES/green, NO/red |
| `single-select` | Large tappable option tiles                |
| `multi-select`  | Same, with checkmark state                 |
| `number`        | Large stepper or numeric keypad            |
| `text`          | Large textarea, soft keyboard              |
| `internal`      | System-generated — no UI rendered          |

#### 11.7.4 Attachment Gate Contract

Every question screen has an attachment zone below the answer, above navigation.
Camera is the dominant affordance. `requiresNote` on `SelectOption` gates NEXT
until an attachment or note is provided.

#### 11.7.5 Screen Layout

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
│  📎 Attach  📸 Picture  📍GEO  │
│                                 │
│  ┌───────────────────────────┐  │
│  │          Save -->         │  │
│  └───────────────────────────┘  │
│                                 │
│  Progress                       │
│  [<-]  o o o o o O o o  [===>]  │
└─────────────────────────────────┘
```

## 12. Shell/App Split Bindings

The app-tier shell makers bind Login, About, auth-backed logout, and a footer component.
Dashboard owns footer placement; the supplied component owns content and branding. Generic makers
use `ShellPageView` and `ShellOverlayView` for route components, not rendered `UiComponent` values.
All logo assets live flat in `front/app/assets/`. The style guide owns a separate local logo copy.
Moved presentation imports generic helpers through `@ux/`; only co-located imports stay relative.
`ConfigTable`, `PanelProbe`, and shell metadata remain generic UX modules. Configuration-property
semantics and existing Seasons Computing diagnostic attribution are unchanged by this split.

_End of Architecture UX Document_
