<img src="../../swarmag-ops-logo.png" title="" alt="swarmAg Operations System" data-align="center">

# swarmAg Operations System — Architecture Front

## 1. Overview

This document defines UX-layer architecture for swarmAg applications. It governs UX integration boundaries, architectural composition, and application-specific UX architecture contracts.

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
│   │   └── widget-registry.ts       — exports UxWidgetRegistry; generic-tier catalog only
│   └── ui/                          — portable shared UI foundation
│       ├── components/              — Ui{Control} primitives (ui-{name}.tsx, barreled by ui.ts)
│       ├── charts/                  — reserved chart primitive directory
│       ├── css/                     — CSS barrel, tokens, roles, themes, base, ui, icons
│       ├── fonts/                   — self-hosted font assets
│       └── icons/                   — shared icon assets
└── front/
    ├── api/
    │   ├── api.ts                   — API client and request/response types
    │   ├── scopes.ts                — declared form write scopes (§7.4)
    │   ├── queries.ts               — declared typed list queries (§7.4)
    │   └── make-auth-users.ts       — Users client over the edge functions (§7.2.3)
    ├── config/
    ├── app/                         — swarmAg-suite-wide, shared across all three apps, not generic
    │   ├── assets/                  — swarmAg brand assets (logo files, flat — one asset kind today)
    │   ├── components/              — swarmAg-specific reusable UI controls (placeholder — none yet)
    │   ├── stores/                  — swarmAg-suite state beyond the toolkit baseline (facets-state.ts)
    │   ├── views/                   — swarmAg domain projections (job-views.ts)
    │   ├── widgets/                 — swarmAg-suite widgets (e.g. BrandWidget)
    │   │   └── widget-registry.ts   — exports AppWidgetRegistry; app-tier catalog only
    │   └── shell/                   — branded chrome and application wiring (*)
    │       ├── notes-editor.tsx     — stock notes Index-Detail editor
    │       ├── user-picker.tsx      — role-filtered User assignment
    │       └── user-provider.ts     — prepared domain User proxy
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

(*) `shell/` holds `about-box`, `brand-hero`, `login`, `notes-editor`, `user-picker`, and
`user-provider`; the maker wrapper binding `ux/shell`'s generic makers to swarmAg branding;
and `session-coordinator.ts`.

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
api.Users.list(options?: ListOptions<User>): Promise<ListResult<User>>
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

Offline execution, deep clone, log upload, and session preparation policy are defined in
`architecture-core.md` §9. The API operations are cataloged in §7.2.3.

### 7.4 Form-Scope Integration

The form layer owns a domain-shaped draft and the projections for create and update, so feature
code does not restate the fields or persistence rules. The layer chain is defined in
`architecture-core.md` §5.2.1, and the scope rules in `CONVENTIONS.md` §10.4.

`front/api/scopes.ts` hosts the `scopes` housing object parallel to `api.ts`; the projection
semantics are stated in the `@core/std/make-scope.ts` header.

Declared list queries are hosted in `front/api/queries.ts`, beside the scopes. Application callers
build a readonly query and pass it as `api.Users.list({ query, limit, cursor })`. `Users.byRole`
filters roles and status, searches display name, primary email, and phone number, and orders by
display name. It supplies the User picker contract; the picker itself is a separate feature.

Managers and the facet catalog collect `listAll(client)` through `Array.fromAsync`; paging stays
inside the shared iterator until the cursor is null. The list contract,
operator set, cursor rejection, search bounds, and store-specific ordering are stated in the
`@core/std/make-query.ts` and `@core/std/api-contracts.ts` headers. Changing a filter requires starting without a cursor.

## 8. Architectural Boundaries

### 8.1 Import Discipline

#### 8.1.1 UX applications MAY import

**Convenience Barrels**

| Import       | Purpose                                                   |
| ------------ | --------------------------------------------------------- |
| `@core/std`  | Standard types (Id, When, Dictionary)                     |
| `@core/stdx` | Contracts, makers, and wrappers built from standard types |

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

Reactive state modules follow the reactive store module pattern (CONVENTIONS §16.3).

### 8.4 Query State Pattern

Shared, read-mostly server data follows the query state module pattern (CONVENTIONS §16.3);
`front/app/stores/facets-state.ts` is swarmAg's instance.

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

The shell composition is described in CONVENTIONS §16.1. `Login` is swarmAg-branded presentation
in `source/front/app/shell/`; `source/front/app/shell/shell-makers.tsx` re-exports the generic
makers pre-bound to swarmAg's `Login` and `AboutBox`, and every app root imports the app-tier
maker. Each app package declares a complete `Application`: a common anonymous shell, a dashboard
shell receiving its app-local dashboard configuration (`app-{admin|ops|customer}-dashboard.json`),
the merged widget registry (§10.3), and app-specific route presentations, plus the
application-owned session coordinator.

#### 9.1.1 UX Metaphors

Feature work starts from an existing archetype and its supporting library
(`ux-design-archetypes.md` §6).

#### 9.1.2 Auth Guard

The shell root asks `SessionState.isPrepared()` before rendering any authenticated content. Unauthenticated users are redirected to login. This is the only authorization check in the UX layer — all data authorization is enforced by RLS at the database layer.

#### 9.1.3 Dashboard as Primary Navigation

The dashboard is the primary navigation surface (`ux-design-archetypes.md` §4.3, Chassis-Part).

### 9.2 Routing

Routing follows the shell route grammar (CONVENTIONS §16.2). Common routes come from the shared
makers, which app roots import pre-bound from `source/front/app/shell/shell-makers.tsx`. Each app
root declares its complete shell collection in `app.tsx`, including app-specific dashboard
presentations. Examples: `/user/list`, `/user/get/{id}`, `/job-runner/{id}`.

### 9.3 Authentication

`AuthSupabaseClient` (`source/core/cli/auth-supabase-client.ts`) is a singleton that directly
implements `ApiAuthContract` (`source/core/std/auth-contract.ts`). It is not a maker; there is
exactly one auth implementation. It is composed into the API namespace as `api.Auth`.

Its methods are listed in the `@core/std/auth-contract.ts` header.

`ApiAuthContract` is transport-oriented: it carries sessions, not domain users, and has no
domain `validateUser` method.

#### 9.3.1 Application-Owned Session Coordination

The generic session contracts and their life cycle are in CONVENTIONS §16.4 and the
`@ux/shell/runtime/session-contracts.ts` header.

The application supplies `SessionCoordinator` from `source/front/app/shell/session-coordinator.ts`.
`init()` starts persisted-session resolution, subscribes to `api.Auth.onAuthStateChange`, and
registers cleanup with the current Solid owner: unsubscribe, then `clear()`. `clear()` clears
`UserProvider` before clearing `SessionState`. The coordinator owns user hydration and eligibility;
the shell owns the lifecycle invocation and baseline session state.

The application supplies the concrete `UserProvider` from `front/app/shell/user-provider.ts`, a
reactive proxy over its domain User. Session preparation policy is defined in
`architecture-core.md` §9.5.

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
7. An inactive or soft-deleted user is signed out through `api.Auth.logout()`, and the coordinator
   clears even if remote sign-out fails.
8. An eligible User is held with `UserProvider.set(user)`.
9. `SessionState.setReady(UserProvider)` holds the provider and marks application data ready.

The prepared identity is read from `UserProvider.id()`. The User and its roles refresh at the next
session preparation, not during the prepared session. `isDataReady` is the application-readiness
signal. A missing domain record is an integrity error and propagates; it is not treated as an
inactive user.

#### 9.3.3 Logout

The generic `logout(auth)` is described in CONVENTIONS §16.4. The app-tier shell maker wraps it so that `SessionCoordinator.clear()` also runs even if
remote sign-out fails. Auth sign-out events clear the coordinator too. The `/logout` route
transition to `/login` belongs to the generic shell (`makeAnonymousShell`).

### 9.4 Session State

`SessionState` (`source/ux/shell/runtime/session-state.ts`) is the baseline session module
(CONVENTIONS §16.4); its fields and intents are in its header. The session coordinator (§9.3.1)
publishes identity, the prepared user, and readiness; logout (§9.3.3) also clears it. The
application-facing API re-exports `SessionState` and `AppState`.

### 9.5 IndexedDb Usage

IndexedDb is the browser-side persistent store for all offline-data concerns.

#### 9.5.1 IndexedDB Database Names

IndexedDB usage is split into two layers:

- Database namespace (physical DB name), `Config.get('LOCAL_DB_NAME')`, per deployment package.
- Object Store names are not shared implicitly; they must be registered with `@core/db/indexeddb.ts` using `IndexedDb.registerStore('storeName')`
- A CRUD/List maker is provided to standardize usage of the local database with `@core/cli/make-indexeddb-client.ts` conforming to `ApiCrudContract` in `@core/stdx`

**IndexedDB Database Names**

| Database Name          | App      | Content                                                      |
| ---------------------- | -------- | ------------------------------------------------------------ |
| `swarmag-app-admin`    | Admin    | dashboard configuration, panel config, theme                 |
| `swarmag-app-ops`      | Ops      | dashboard configuration, panel config, theme, job aggregates |
| `swarmag-app-customer` | Customer | dashboard configuration, theme                               |

#### 9.5.2 Application Preferences

`AppState` (CONVENTIONS §16.3) holds each app's persisted preferences:

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

Draft copying is in the `@ux/shell/workbench/workbench-draft.ts` header, and the state rules are in
CONVENTIONS §16.3.

## 10. Shared Application Features

### 10.1 Common Component Boundaries

Three tiers, not two. `source/ux/` is the generic UX toolkit — portable to any future
Seasons Computing project, not just swarmAg. `source/front/app/` is swarmAg-suite-wide: shared
across all three apps, reactive and adaptive by default like `ux/`, but under no obligation to
generalize past swarmAg itself. Each `app-{admin|ops|customer}/` is the single-application tier.

#### 10.1.1 The `ux/` toolkit

The `ux/` toolkit's structure is described in CONVENTIONS §16.1.

#### 10.1.2 swarmAg-suite foundation (`app/`)

```text
app/
├── assets/     — swarmAg brand assets (logo files, flat — one asset kind today)
├── components/ — swarmAg-specific reusable UI controls (placeholder — none yet)
├── shell/      — branded chrome and application wiring (*)
│   ├── notes-editor.tsx — stock notes Index-Detail editor
│   ├── user-picker.tsx — role-filtered User assignment
│   └── user-provider.ts — prepared domain User proxy
├── stores/     — swarmAg-suite state beyond the toolkit baseline (facets-state.ts)
├── views/      — swarmAg domain projections (job-views.ts)
└── widgets/    — swarmAg-suite widget catalog (e.g. BrandWidget)
```

(*) `shell/` holds `about-box`, `brand-hero`, `login`, `notes-editor`, `user-picker`, and
`user-provider`; the maker wrapper binding `ux/shell`'s generic makers to swarmAg branding;
and `session-coordinator.ts`.

#### 10.1.3 Stays in the app

- dashboard default configuration and app-specific widget composition
- domain pages and feature pages
- app-specific route tree
- app-specific IndexedDB store instance

#### 10.1.4 Placement

Place a component in the tier that matches its intended reach. Application-specific work belongs
in `app-{name}/`; work meant for the swarmAg suite belongs in `app/`; only what is useful outside
swarmAg entirely belongs in `ux/`. Placement is a design decision made with the component, and a
component moves when its reach changes. Prefer the narrower tier when reach is uncertain:
widening later costs a move, and generalizing early costs an abstraction nobody needed.

#### 10.1.5 Workbench steps and the shared panel sequence

Workbench steps, the shared panel sequence, the Wizard, the Abstraction Manager, and drill-down
are built as CONVENTIONS §17 describes; their behavior is in their module headers.

`NotesEditor` in `front/app/shell/` is the stock notes Index-Detail pair. It takes
`notes: () => readonly Note[]`, `onChange: (notes: readonly Note[]) => void`, and
`drill: DrillContract`. It edits Content and Visibility, defaults new notes to Internal,
and never persists. Existing timestamps and attachments are preserved. Billing-address
fields and their validation occupy the separate Customer Billing step.

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
- Steps follow the naming in CONVENTIONS §4.2.

The Customer workbench declares contact, identity, status, account-manager assignment, address,
sites, and notes in `front/api/scopes.ts` through `makeAdaptedScope`, with `{}` as create defaults.
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
- Lists load all visible rows through keyset pages of up to 100, as User Manager does.
- `scopes.Customers.detail` in `front/api/scopes.ts` covers primary contact,
  identity, status, account-manager assignment, billing address, sites, and account notes.
- Clearing an optional stored address field uses the existing explicit-null update protocol.

`UserPicker` in `front/app/shell/user-picker.tsx` receives a non-empty roles tuple, the stored
assignment separately from the draft value, and a change callback. Customer Detail passes `sales`.
Eligible Users load through the declared role/status query and `listAll` under TanStack Query's
default behavior. `USER_PICKER_QUERY_KEY` is `['users', 'picker']`; eligible keys append
`'eligible'` and the roles tuple, and stored-target keys append `'stored'` and the id. The `users`
prefix intentionally allows User invalidation to refresh both reads. An absent stored manager is
resolved with `api.Users.get` under its own query. Options compose at render: live eligible Users
plus the stored manager when absent, ordered by display name, with a deleted indication when
needed. The stored manager remains available throughout the edit, including after choosing None
or another User. No other ineligible User is offered.

Customer state defaults assignment synchronously through `UserProvider.idWithAnyRole(['sales'])`
only when creating a draft. Existing Customers retain their stored value, including absence.
Selecting None sets the draft assignment to `undefined`; the update projection writes `null`.
The default is established before discard baselines, and None survives step remounts.

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

The dashboard is the Chassis-Part archetype (`ux-design-archetypes.md` §4.3), built as CONVENTIONS
§17.5 describes. The header has two deterministic responsive contexts, selected by container query
against its own inline size, not the viewport; CSS selects the context before layout, and the shell
does not measure rendered positions or change the context after mount. Its geometry is
stylesheet-owned: the stacked-header threshold lives in
`dashboard.css`, and the base-scale step in `tokens.css`.

**`source/front/app-{admin|ops|customer}/dashboard-{admin|ops|customer}.json`**

Layout is data-driven via app-local dashboard JSON, rendered by the shared dashboard shell/harness, and hydrated into `DashboardState` (`source/ux/shell/dashboard/dashboard-state.ts`). Not hardcoded. The current contract uses one default config per app.

`ux/widgets/widget-registry.ts` exports the generic catalog object `UxWidgetRegistry`;
`front/app/widgets/widget-registry.ts` exports the swarmAg-suite catalog object
`AppWidgetRegistry`. Both conform to `WidgetRegistry`. Each app root imports these objects
after package configuration (§8.2) and merges them with
`{ ...UxWidgetRegistry, ...AppWidgetRegistry }`, so app entries take precedence for shared keys.
The merged registry and app-local dashboard JSON form the two halves of one dashboard-shell
declaration.

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
