![swarmAg Operations System](swarmag-ops-logo.png)

# swarmAg Operations System -- README

The swarmAg Operations System (`swarmAg System`) supports operations across aerial and ground agricultural services. The monorepo is organized around a typed domain core, backend/runtime infrastructure, and user experience applications.

Primary architectural context lives in `documentation/architecture-core.md`.

## 1. Repository Structure

### 1.1 Top-level Namespaces

| Path             | Description                                       |
| ---------------- | ------------------------------------------------- |
| `documentation/` | Foundation and application documentation          |
| `source/`        | Source code organized into layers                 |
| `supabase/`      | Supabase project configuration and local metadata |

### 1.2 Documentation (`documentation/`)

| Category     | File                          | Description                                             |
| ------------ | ----------------------------- | ------------------------------------------------------- |
| Architecture | `architecture-core.md`        | Core architecture principles and system-wide structure  |
|              | `architecture-back.md`        | Backend architecture, boundaries, and runtime model     |
|              | `architecture-ux.md`          | UX architecture and frontend layering                   |
|              | `architecture-devops.md`      | Environment configuration, packaging, and guard suite   |
| Convention   | `style-guide.md`              | Code and content style conventions                      |
| Domain       | `domain-model.md`             | Domain solution-space concepts and invariants           |
|              | `domain-seed-data.md`         | Controlled vocabularies and canonical seed data         |
|              | `domain-data-dictionary.md`   | Normalized implementation-ready type and relation model |
|              | `domain-archetypes.md`        | Domain implementation patterns for archetype artifacts  |
| UX           | `ux-design-language.md`       | Visual language, interaction grammar, and layout rules  |
|              | `ux-components-guide.md`      | Full UX component guide and usage contracts             |
|              | `ux-components-guide-lite.md` | Lightweight UX component reference                      |
|              | `ux-components-internals.md`  | UX component implementation internals                   |
| AI Prompt    | `genesis-domain-sdk.md`       | Prompt contract for domain sdk genesis                  |
|              | `genesis-ux-scaffold.md`      | Prompt contract for UX applications scaffolding         |
| Application  | `user-stories.md`             | Cross-application user stories and scenario narratives  |

### 1.3 Source Layers (`source/`)

| Path      | Description                                                       |
| --------- | ----------------------------------------------------------------- |
| `back/`   | Backend runtime modules (config, functions, migrations)           |
| `core/`   | Fundamental types and utilities used by all layers                |
| `devops/` | Architecture and environment `guard-*` scripts                    |
| `domain/` | Domain model and domain-layer contracts                           |
| `tests/`  | Test suites and supporting fixtures                               |
| `ux/`     | Client-facing user experiences, apps, contracts, and UI libraries |

#### 1.3.1 Core (`source/core/`)

| Path   | Description                                                      |
| ------ | ---------------------------------------------------------------- |
| `api/` | Client makers and provider adapters (CRUD, HTTP, business rules) |
| `cfg/` | Configuration management (Config singleton, runtime providers)   |
| `db/`  | Cached database client (`supabase.ts`)                           |
| `std/` | Standard types (Id, When, Dictionary, Instantiable)              |

#### 1.3.2 Domain (`source/domain/`)

| Path            | Description                                         |
| --------------- | --------------------------------------------------- |
| `abstractions/` | Core domain types (User, Job, Service, Asset, etc.) |
| `adapters/`     | Storage serialization (Dictionary ↔ domain types)   |
| `protocols/`    | Input/output contracts (CreateInput, UpdateInput)   |
| `schema/`       | Generated canonical schema (`schema.sql`)           |
| `validators/`   | Domain validation rules and invariants              |

#### 1.3.3 Backend (`source/back/`)

| Path             | Description                                  |
| ---------------- | -------------------------------------------- |
| `migrations/`    | Forward-only SQL deltas and RLS policies     |
| `supabase-edge/` | Supabase Edge Functions (orchestration only) |

#### 1.3.4 Frontend (`source/ux/`)

| Path            | Description                                          |
| --------------- | ---------------------------------------------------- |
| `api/`          | Composed API namespace (@ux/api barrel export)       |
| `app-admin/`    | Admin PWA application (desktop/tablet)               |
| `app-ops/`      | Operations PWA application (mobile, field execution) |
| `app-customer/` | Customer portal application (static, read-only)      |
| `common/`       | Shared UX components and utilities                   |
| `config/`       | Configuration bootstrap for UX applications          |

## 2. Local Configuration

### 2.1 Package Targets

Deployable UX packages bind to a remote backend target at build time:

| Target  | Purpose                                           |
| ------- | ------------------------------------------------- |
| `dev`   | Hosted Supabase project for active feature work   |
| `stage` | Hosted Supabase project for acceptance validation |
| `prod`  | Hosted Supabase project for production            |

Local UX hosting is development tooling. A locally served app is still bound to
the backend target embedded in its package env file. The local runner appends
`-local` to the package version in the Vite process environment so login
diagnostics identify local hosting without changing package identity or the
generated `.env` file.

### 2.2 Environment Files

Committed env templates live under `source/ux/config/` and
`source/back/supabase-edge/config/`.

| File pattern                                                               | Role                       |
| -------------------------------------------------------------------------- | -------------------------- |
| `source/ux/config/app-{app}-{target}.env.example`                          | Committed UX template      |
| `source/ux/config/app-{app}-{target}.env`                                  | Generated UX package input |
| `source/back/supabase-edge/config/back-supabase-edge-{target}.env.example` | Committed backend template |
| `source/back/supabase-edge/config/back-supabase-edge-{target}.env`         | Generated backend input    |

Package scripts recreate generated UX `.env` files from templates when `--init-env` is passed. Template values set to `__SECRET__` are resolved from the local, gitignored `secrets.jsonc` registry during packaging, and `__PACKAGE_VERSION__` is computed from `VERSION`, Git build count, and target.

Resolved values are not written back into generated `.env` files.

### 2.3 Configuration Pattern

The system uses a singleton `Config` defined in `@core/cfg/config.ts`, initialized once per deployment context via `Config.init(provider, keys, aliases?)`:

- `provider` — runtime-specific implementation (`SolidProvider`, `SupabaseProvider`, `DenoProvider`)
- `keys` — required environment variable names; bootstrap fails immediately if any are missing
- `aliases` — optional map of logical name → environment key for platform-specific prefixing

See `architecture-core.md` section 6 for complete configuration management detail.

### 2.4 Configuration Rules

- Never commit actual `.env` files — only commit `.env.example` templates
- Generated env files are gitignored package inputs
- Secrets live in `secrets.jsonc` or platform-managed secret stores
- UX package targets are `dev`, `stage`, and `prod`
- All runtime config values validated at bootstrap via `Config.init()`

## 3. DevOps Commands

The examples below use `dot` as a local shell alias for `deno task`.
`deno.jsonc` is the authoritative task registry. Detailed workflow contracts live
in `documentation/architecture-devops.md`.

### 3.1 Validation

| Command     | Purpose                           |
| ----------- | --------------------------------- |
| `dot check` | Run guards, type checks, and lint |
| `dot fmt`   | Format configured assets          |
| `dot test`  | Run repository tests              |

Individual `guard:*` tasks are documented in `architecture-devops.md`.

### 3.2 Local Servers

| Command                     | Purpose                            |
| --------------------------- | ---------------------------------- |
| `dot app-dev-local {app}`   | Serve a dev-bound UX app locally   |
| `dot app-stage-local {app}` | Serve a stage-bound UX app locally |
| `dot app-style-guide-local` | Serve the style-guide harness      |

`{app}` is one of `admin`, `ops`, or `customer`.

### 3.3 Packaging And Deployment

- `dot app-{name}-package-{target}` — package one UX app artifact
- `dot app-{name}-package-{target}-verify` — verify one packaged UX artifact
- `dot deploy --app {name} [name ...] --target {target}` — check, package,
  deploy, and smoke-test UX apps
- `dot ux-smoke --target {target} {app}={url} ...` — smoke-test deployed UX apps
- `dot ux-stage-smoke` — smoke-test stage UX apps at default URLs

`{name}` is one of `admin`, `ops`, or `customer`; `{target}` is one of `dev`,
`stage`, or `prod`. Pass `--init-env` after a package task to recreate the
generated `.env` file from its committed template before building.

Backend deployment uses the Supabase CLI:

```bash
supabase functions deploy <function>
supabase db push
```

## 4. Working Rules

| Rule                                      | Description                                                                |
| ----------------------------------------- | -------------------------------------------------------------------------- |
| Follow [CONSTITUTION.md](CONSTITUTION.md) | It is the governing authority for all human and AI contributions.          |
| Keep docs truthful                        | Remove stale instructions instead of preserving dead content.              |
| Keep `README.md` operational              | Document commands that exist and workflows that are currently supported.   |
| Keep `deno.jsonc` authoritative           | Task tables in this README reflect the task surface in `deno.jsonc`.       |
| Run checks before handoff                 | Use `dot check`; add package verification when packaging is touched.       |
| Respect generated artifacts               | Do not commit `.env` files, build outputs, package zips, or local secrets. |
| Use architecture docs for depth           | Keep detailed rationale in `documentation/architecture-*.md`.              |

## 5. Working Sessions

All software construction activity operates in conformance with the governing principles defined in [CONSTITUTION.md](CONSTITUTION.md).

The constitution is designed to make most efficient and cost-effective use of AI reasoning and coding facilities across AI providers following the 3-role ["Model of Development w/ AI Coding"](https://seasonscomputing.com/markdown.html?documentation/tvk-mod-3rm.md).

The human participates as the Chief Architect with AI Architect and AI Coding Engine roles provided by AI reasoning and AI coding platforms respectively.

### 5.1 Session Context

Sessions are governed by `AGENTS.md` which is bound by `CONSTITUTION.md`.

| Context              | Prompt                                                                                       |
| -------------------- | -------------------------------------------------------------------------------------------- |
| Product foundation   | Ingest AGENTS.md. You are {Agent-Role}. We're working on Product Foundation. {Work-Agenda}   |
| UX internals         | Ingest AGENTS.md. You are {Agent-Role}. We're working on UX internals. {Work-Agenda}         |
| Application features | Ingest AGENTS.md. You are {Agent-Role}. We're working on Application features. {Work-Agenda} |
| DevOps operations    | Ingest AGENTS.md. You are {Agent-Role}. We're working on DevOps operations. {Work-Agenda}    |

Where:

- Agent-Role: 'AI Architect' | 'AI Coding Engine'
- Work-Agenda: The tasks to be completed
