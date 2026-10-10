![swarmAg Operations System](swarmag-ops-logo.png)

# swarmAg Operations System -- README

The swarmAg Operations System (`swarmAg System`) supports operations across aerial and ground agricultural services. The monorepo is organized around a typed domain core, backend/runtime infrastructure, and user experience applications.

## 1. Repository Structure

### 1.1 Governance Invariants

Four root documents govern all work in this repository, by humans and AI systems alike. They sit
above every specification: [`CONSTITUTION.md` §1](CONSTITUTION.md#1-purpose--authority) sets the order of precedence, and the others bind
within it. Each carries a no-AI-edit mark, and `guard:governance-gate` fails any commit that
changes one.

| File                                 | Description                                              |
| ------------------------------------ | -------------------------------------------------------- |
| [`AGENTS.md`](AGENTS.md)             | AI agent protocol, operating modes, and production gates |
| [`CONSTITUTION.md`](CONSTITUTION.md) | Highest architectural authority and role boundaries      |
| [`CONVENTIONS.md`](CONVENTIONS.md)   | Binding code and content style conventions               |
| [`EFFORT.md`](EFFORT.md)             | Effort lifecycle, tracking, sequencing, and closure      |

### 1.2 Top-level Namespaces

| Path             | Description                                          |
| ---------------- | ---------------------------------------------------- |
| `documentation/` | Foundation and application documentation             |
| `effort/`        | Effort tracking and project management documentation |
| `source/`        | Source code organized into layers                    |
| `supabase/`      | Supabase project configuration and local metadata    |

### 1.3 Documentation (`documentation/`)

Specifications are settled system documents that define architecture, domain
meaning, UX language, and implementation standards in accordance with governance invariants.

| Category        | File                                                                          | Description                                             |
| --------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------- |
| `architecture/` | [`architecture-core.md`](documentation/architecture/architecture-core.md)     | Core architecture principles and system-wide structure  |
|                 | [`architecture-back.md`](documentation/architecture/architecture-back.md)     | Backend architecture, boundaries, and runtime model     |
|                 | [`architecture-front.md`](documentation/architecture/architecture-front.md)   | UX architecture and frontend layering                   |
|                 | [`architecture-devops.md`](documentation/architecture/architecture-devops.md) | Environment configuration, packaging, and guard suite   |
| `domain/`       | [`domain-model.md`](documentation/domain/domain-model.md)                     | Domain solution-space concepts and invariants           |
|                 | [`domain-seed-data.md`](documentation/domain/domain-seed-data.md)             | Controlled vocabularies and canonical seed data         |
|                 | [`domain-data-dictionary.md`](documentation/domain/domain-data-dictionary.md) | Normalized implementation-ready type and relation model |
|                 | [`domain-archetypes.md`](documentation/domain/domain-archetypes.md)           | Domain implementation patterns for archetype artifacts  |
| `ux/`           | [`ux-design-language.md`](documentation/ux/ux-design-language.md)             | Visual language, interaction grammar, and layout rules  |
|                 | [`ux-design-archetypes.md`](documentation/ux/ux-design-archetypes.md)         | UX implementation archetypes and composition patterns   |
|                 | [`ux-components-guide.md`](documentation/ux/ux-components-guide.md)           | Full UX component guide and usage contracts             |
|                 | [`ux-components-guide-lite.md`](documentation/ux/ux-components-guide-lite.md) | Lightweight UX component reference                      |
|                 | [`ux-components-internals.md`](documentation/ux/ux-components-internals.md)   | UX component implementation internals                   |

### 1.4 Effort (`effort/`)

Effort documents capture working project context. Status-bearing effort records live in
`active` while their effort is current work and move to `completed` when it
closes. A brief captured before its effort is chosen waits in `pending`. Record kinds and file
naming are defined in [`EFFORT.md` §2](EFFORT.md#2-the-effort-namespace); the lifecycle in
[§4](EFFORT.md#4-the-brief) and [§5](EFFORT.md#5-the-handoff).

{status} = `active` | `pending` | `completed`

| Category    | File                                                                | Description                                            |
| ----------- | ------------------------------------------------------------------- | ------------------------------------------------------ |
| `{status}/` | `{yyyy-mm-dd}-{topic}-brief.md`                                     | Written design record for one unit of work             |
|             | `{yyyy-mm-dd}-{topic}-handoff.md`                                   | Session-end snapshot of an in-flight effort            |
| `genesis/`  | [`genesis-domain-sdk.md`](effort/genesis/genesis-domain-sdk.md)     | Prompt contract for domain sdk genesis                 |
|             | [`genesis-ux-scaffold.md`](effort/genesis/genesis-ux-scaffold.md)   | Prompt contract for UX applications scaffolding        |
| `project/`  | [`project-backlog.md`](effort/project/project-backlog.md)           | Accepted work whose shape is already known             |
|             | [`project-roadmap.md`](effort/project/project-roadmap.md)           | Intended execution sequence for decided work           |
|             | [`project-parking-lot.md`](effort/project/project-parking-lot.md)   | Deferred features or architectural adjustments         |
|             | [`project-user-stories.md`](effort/project/project-user-stories.md) | Cross-application user stories and scenario narratives |

### 1.5 Source (`source/`)

| Path      | Description                                                           |
| --------- | --------------------------------------------------------------------- |
| `core/`   | Fundamental types and utilities used by all layers                    |
| `back/`   | Backend runtime modules (config, functions, migrations)               |
| `front/`  | swarmAg applications, shared application modules, and API composition |
| `ux/`     | Portable UX toolkit, shell runtime, state, widgets, and UI foundation |
| `domain/` | Domain model and domain-layer contracts                               |
| `devops/` | Architecture and environment `guard-*` scripts                        |
| `tests/`  | Test suites and supporting fixtures                                   |

**Dependency principle.** Libraries are used where they stay bounded: headless UI primitives,
routing, charting, the database platform behind its own seam. Where a library would grow into a
framework, and the architecture into its lock-in, the capability is owned instead, so engineering
decisions stay under the project's control. The applications' runtime dependencies are about
seven: Solid, Kobalte, TanStack Query and Router, Chart.js, `idb`, and Supabase.

#### 1.5.1 Core (`source/core/`)

| Path   | Description                                                                    |
| ------ | ------------------------------------------------------------------------------ |
| `api/` | Transport-agnostic API contracts (CRUD, list, business rules, auth)            |
| `cfg/` | Configuration management (Config singleton, runtime providers)                 |
| `cli/` | API client implementations and makers (HTTP, Supabase, IndexedDB)              |
| `db/`  | Database APIs (Supabase, IndexedDB)                                            |
| `svc/` | Edge service support (caller verification for privileged functions)            |
| `std/` | Standard types and makers (Id, When, Dictionary, Instantiable, adapter, scope) |

**Owned capabilities.** `core/` imports one third-party package, `@supabase/client`, in two files.
Supabase sits behind `api/`'s transport-agnostic contracts, so it is a replaceable implementation,
not an architecture. Concerns a project commonly hands to libraries or frameworks are owned here,
built to one model of the domain:

| Commonly a library or framework                     | Here                                                             |
| --------------------------------------------------- | ---------------------------------------------------------------- |
| Schema validation (Zod, Yup)                        | `std/validators.ts`, and the domain validators built on it       |
| ORM or mapping layer (Prisma, Drizzle)              | `makeAdapter`: domain shapes to storage columns                  |
| Form state and partial updates                      | `makeScope`: typed update scopes                                 |
| Environment and config                              | `Config` with runtime providers (Deno, Solid, Netlify, Supabase) |
| HTTP client (Axios, ky)                             | `make-http-client` and the CRUD client makers                    |
| Edge or server framework (Hono, Express middleware) | `wrapHttpHandler`, with CORS and validation built in             |
| Utility belts (lodash, date-fns)                    | `std/adt.ts`, `datetime.ts`, `identifier.ts`                     |

Fewer dependencies to upgrade, audit, or work around, and the pieces agree with each other because
they share one design.

#### 1.5.2 Domain (`source/domain/`)

| Path            | Description                                         |
| --------------- | --------------------------------------------------- |
| `abstractions/` | Core domain types (User, Job, Service, Asset, etc.) |
| `adapters/`     | Storage serialization (Dictionary ↔ domain types)   |
| `protocols/`    | Input/output contracts (`UserCreate`, `UserUpdate`) |
| `schema/`       | Generated canonical schema (`schema.sql`)           |
| `validators/`   | Domain validation rules and invariants              |

Each directory is one of the domain SDK's five **archetypes**, and every file in it is produced by
**domain genesis**: the prompt [`genesis-domain-sdk.md`](effort/genesis/genesis-domain-sdk.md)
generates each archetype for every topic in the
[data dictionary](documentation/domain/domain-data-dictionary.md), following the patterns in
[domain archetypes](documentation/domain/domain-archetypes.md). `domain/` is therefore regenerable from its documents.
A change to the domain starts in the data dictionary or the archetypes, and a hand edit is made
only where it equals what genesis would produce.

#### 1.5.3 Backend (`source/back/`)

| Path             | Description                                                       |
| ---------------- | ----------------------------------------------------------------- |
| `migrations/`    | Forward-only SQL deltas and RLS policies                          |
| `supabase-edge/` | Supabase Edge Functions (config, functions, shared orchestration) |

#### 1.5.4 Frontend (`source/front/`)

| Path               | Description                                                 |
| ------------------ | ----------------------------------------------------------- |
| `app-admin/`       | Admin PWA application (desktop/tablet)                      |
| `app-ops/`         | Operations PWA application (mobile, field execution)        |
| `app-customer/`    | Customer portal application (static, read-only)             |
| `app-style-guide/` | Style-guide harness application                             |
| `app/`             | Shared swarmAg shell bindings, branding, views, and widgets |
| `api/`             | Composed application API                                    |
| `config/`          | Configuration bootstrap for UX applications                 |

#### 1.5.5 UX Toolkit (`source/ux/`)

| Path       | Description                                                    |
| ---------- | -------------------------------------------------------------- |
| `shell/`   | Bootstrap, routing, shell components, and shared state modules |
| `ui/`      | UI primitives, CSS, fonts, and icons                           |
| `widgets/` | Application-neutral widgets and their registry                 |

Import toolkit modules through `@ux/`; `@ux/ui` exposes the UI component barrel and
`@ux/css` loads the shared CSS foundation. `AppState`, `SessionState`, and `DashboardState`
live in `source/ux/shell/`. swarmAg session coordination lives in
`source/front/app/shell/session-coordinator.ts`.

**One design language.** `ux/` follows the same principle as `core/`. Headless accessible
primitives (Kobalte) and routing (TanStack Router) are bounded libraries and are used; the design
language, styling, and application shell are owned, and designed to fit each other:

| Commonly a library or framework                  | Here                                                                                     |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Component library or design system (MUI, shadcn) | `ui/components`: about 30 `Ui*` controls in one design language, on Kobalte's primitives |
| CSS framework (Tailwind, Bootstrap)              | `ui/css`: tokens, roles, and light and dark themes; guards hold every value to tokens    |
| Icon package                                     | `ui/icons`: 347 SVGs behind one catalog; a guard keeps names and files in step           |
| Admin or CRUD framework (React Admin, Refine)    | `shell/workbench`: `AbstractionManager` and `Wizard`                                     |
| Panel, layout, and nested-navigation components  | `shell/panel`: panel container, drill-down, step sequences                               |
| Dashboard and widget-grid libraries              | `shell/dashboard` and `widgets/`                                                         |
| Application bootstrap and route configuration    | `shell/runtime`: a route grammar compiled onto TanStack Router                           |

## 2. Physical Architecture

| Tier          | Platform                       | Role                                                                    |
| ------------- | ------------------------------ | ----------------------------------------------------------------------- |
| Applications  | Netlify CDN                    | Static PWA bundles: `app-admin`, `app-ops`, `app-customer`              |
| Data          | Supabase Postgres              | Canonical schema with row-level security; applications call it directly |
| Identity      | Supabase Auth                  | Passwordless one-time-code sign-in                                      |
| Orchestration | Supabase Edge Functions (Deno) | Privileged operations only, such as User create, update, delete, eject  |
| Field device  | IndexedDB, in the Ops PWA      | The offline copy of a job, and its append-only work log                 |

The applications are static bundles with no application server of their own. The backend they bind
to is embedded at package time (Supabase endpoint, public key, and client mode), not chosen by the
host that serves them. Most operations go directly to the database through the Supabase client
under row-level security; edge functions exist only for orchestration that simple CRUD cannot
express. The Ops application carries a job's complete working set onto the device and returns only
an append-only log, so field work never needs a two-way sync.

Deployment details, packages, and environment files are in
[Architecture DevOps](documentation/architecture/architecture-devops.md); application runtime
profiles are in
[Architecture Front §3](documentation/architecture/architecture-front.md#3-application-runtime-profiles),
and edge functions in [Architecture Back](documentation/architecture/architecture-back.md).

## 3. Environments & Configuration

### 3.1 Package Targets

Deployable UX packages bind to a remote backend target at build time:

| Target  | Purpose                                           |
| ------- | ------------------------------------------------- |
| `dev`   | Hosted Supabase project for active feature work   |
| `stage` | Hosted Supabase project for acceptance validation |
| `prod`  | Hosted Supabase project for production            |

**Environments in use.** The three targets are defined; `stage` is the one hosted today. swarmAg is
greenfield, built by a single architect directing a team of AI agents, so there is one integration
line and no production data yet. Environments are added when the project needs them:

- **`dev`** when parallel development begins: a second engineer or team working alongside, needing
  an integration environment separate from acceptance.
- **`prod`** at first real use: production data, and a release boundary that `stage` then guards.

Packaging, environment files, and the secret registry already treat all three as first-class, so
adding one is configuration, not rework.

Local UX hosting is development tooling. A locally served app is still bound to the backend target embedded in its package env file. The local runner appends `-local` to the package version in the Vite process environment so login
diagnostics identify local hosting without changing package identity or the generated `.env` file.

### 3.2 Environment Files

Committed env templates live under `source/front/config/` and `source/back/supabase-edge/config/`.

| File pattern                                                               | Role                       |
| -------------------------------------------------------------------------- | -------------------------- |
| `source/front/config/app-{app}-{target}.env.example`                       | Committed UX template      |
| `source/front/config/app-{app}-{target}.env`                               | Generated UX package input |
| `source/back/supabase-edge/config/back-supabase-edge-{target}.env.example` | Committed backend template |
| `source/back/supabase-edge/config/back-supabase-edge-{target}.env`         | Generated backend input    |

Package scripts recreate generated UX `.env` files from templates when `--init-env` is passed. Template values set to `__SECRET__` are resolved from the local, gitignored `secrets.jsonc` registry during packaging, and `__PACKAGE_VERSION__` is computed from `VERSION`, Git build count, and target.

Resolved values are not written back into generated `.env` files.

### 3.3 Configuration Pattern

The system uses a singleton `Config` defined in `@core/cfg/config.ts`, initialized once per deployment context via `Config.init(provider, keys, aliases?)`:

- `provider` — runtime-specific implementation (`SolidProvider`, `SupabaseProvider`, `DenoProvider`)
- `keys` — required environment variable names; bootstrap fails immediately if any are missing
- `aliases` — optional map of logical name → environment key for platform-specific prefixing

See [Architecture Core §6](documentation/architecture/architecture-core.md#6-configuration-management)
for complete configuration management detail.

### 3.4 Configuration Rules

- Never commit actual `.env` files — only commit `.env.example` templates
- Generated env files are gitignored package inputs
- Secrets live in `secrets.jsonc` or platform-managed secret stores
- UX package targets are `dev`, `stage`, and `prod`
- All runtime config values validated at bootstrap via `Config.init()`

## 4. DevOps Commands

The examples below use `dot` as a local shell alias for `deno task`. `deno.jsonc` is the authoritative task registry. Detailed workflow contracts live in
[Architecture DevOps](documentation/architecture/architecture-devops.md).

### 4.1 Validation

| Command     | Purpose                           |
| ----------- | --------------------------------- |
| `dot check` | Run guards, type checks, and lint |
| `dot fmt`   | Format configured assets          |
| `dot test`  | Run repository tests              |

Individual `guard:*` tasks are documented in
[Architecture DevOps](documentation/architecture/architecture-devops.md).

### 4.2 Local Servers

| Command                     | Purpose                            |
| --------------------------- | ---------------------------------- |
| `dot app-dev-local {app}`   | Serve a dev-bound UX app locally   |
| `dot app-stage-local {app}` | Serve a stage-bound UX app locally |
| `dot app-style-guide-local` | Serve the style-guide harness      |

Where:

- `{app}`: `admin` | `ops` | `customer`.

### 4.3 Packaging And Deployment

**Frontend deployment:**

| Command                                                | Purpose                                        |
| ------------------------------------------------------ | ---------------------------------------------- |
| `dot deploy --app {name} [name ...] --target {target}` | Check, package, deploy, and smoke-test UX apps |

Where:

- `{name}`: `admin` | `ops` | `customer`.
- `{target}`: `dev` | `stage` | `prod`.

**Backend edge serve and deployment:**

Edge functions are Supabase orchestration handlers authored under
`source/back/supabase-edge/functions/` and deployed via committed shims under
`supabase/functions/`. Always use the repository tasks — they refresh the
generated `_shared` tree and pin `TMPDIR` to a Docker-VM-shared path:

```bash
dot edge-serve                                      # serve all functions against the local stack
dot edge-deploy <function...> --project-ref <ref>   # deploy to a resolved project (§4.4)
```

See [Architecture DevOps §8.5](documentation/architecture/architecture-devops.md#85-edge-deployment)
for target resolution, deployment, and verification in full, and
[Architecture Backend §7.1](documentation/architecture/architecture-back.md#71-supabase-edge-functions)
for function registration and runtime constraints.

**Backend OTP sign-in email deployment:**

Auth email templates are repository-owned. The OTP sign-in email is
`supabase/templates/magic-link.html`, wired through `supabase/config.toml`, and
applied to the linked Supabase project.

```bash
supabase db push
```

### 4.4 Platform Listings

Query live platform topology. Both scripts write JSON to stdout.

| Command                                                    | Purpose                                       |
| ---------------------------------------------------------- | --------------------------------------------- |
| `dot list-netlify-targets [--app {app}] --target {target}` | List Netlify site IDs and URLs by app/target  |
| `dot list-supabase-targets --target {target}`              | List Supabase project refs and URLs by target |

Where:

- `{app}`: `admin` | `ops` | `customer` (optional — omit to return all apps).
- `{target}`: `dev` | `stage` | `prod` (required).

See [Architecture DevOps §14](documentation/architecture/architecture-devops.md#14-platform-target-listings) for output shape, error conditions, and naming conventions.

## 5. Working Rules

| Rule                                      | Description                                                                |
| ----------------------------------------- | -------------------------------------------------------------------------- |
| Follow [CONSTITUTION.md](CONSTITUTION.md) | It is the governing authority for all human and AI contributions.          |
| Keep docs truthful                        | Remove stale instructions instead of preserving dead content.              |
| Keep `README.md` operational              | Document commands that exist and workflows that are currently supported.   |
| Keep `deno.jsonc` authoritative           | Task tables in this README reflect the task surface in `deno.jsonc`.       |
| Run checks before handoff                 | Use `dot check`; add package verification when packaging is touched.       |
| Respect generated artifacts               | Do not commit `.env` files, build outputs, package zips, or local secrets. |
| Use architecture docs for depth           | Keep detailed rationale in `documentation/architecture/architecture-*.md`. |

## 6. Working Sessions

All software construction activity operates in conformance with the governing principles defined in [CONSTITUTION.md](CONSTITUTION.md).

The constitution is designed to make most efficient and cost-effective use of AI reasoning and coding facilities across AI providers following the 3-role ["Model of Development w/ AI Coding"](https://seasonscomputing.com/markdown.html?documentation/tvk-mod-3rm.md).

The human participates as the Chief Architect with AI Architect and AI Coding Engine roles provided by AI reasoning and AI coding platforms respectively.

Sessions are governed by [`AGENTS.md`](AGENTS.md), which is bound by
[`CONSTITUTION.md`](CONSTITUTION.md).

_End of README Document_
