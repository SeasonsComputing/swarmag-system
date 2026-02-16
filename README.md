# swarmAg Operations System -- README

![swarmAg ops logo](swarmag-ops-logo.png)

The swarmAg Operations System (`swarmAg system`) supports operations across aerial and ground agricultural services. The monorepo is organized around a typed domain core, backend/runtime infrastructure, and user experience applications.

Primary architectural context lives in `documentation/foundation/architecture-core.md`.

## 1. Repository Structure

### 1.1 Top-level Namespaces

| Path             | Description                                              |
| ---------------- | -------------------------------------------------------- |
| `deploy/`        | Deployment artifacts and environment-specific output     |
| `documentation/` | Product, architecture, domain, and history documentation |
| `source/`        | Application and platform implementation code             |
| `supabase/`      | Supabase project configuration and local metadata        |

### 1.2 Documentation (`documentation/`)

| Path            | Description                                            |
| --------------- | ------------------------------------------------------ |
| `applications/` | Application-level requirements and UX/product specs    |
| `foundation/`   | Core architecture, domain, style, and data definitions |

#### 1.2.1 Foundation (`documentation/foundation/`)

| Path                   | Description                                            |
| ---------------------- | ------------------------------------------------------ |
| `architecture-core.md` | Core architecture principles and system-wide structure |
| `architecture-back.md` | Backend architecture, boundaries, and runtime model    |
| `architecture-ux.md`   | UX architecture and frontend layering                  |
| `domain.md`            | Domain model concepts, entities, and invariants        |
| `data-lists.md`        | Controlled vocabularies and enumerated values          |
| `style-guide.md`       | Style and authoring conventions                        |

#### 1.2.2 Applications (`documentation/applications/`)

| Path                 | Description                                        |
| -------------------- | -------------------------------------------------- |
| `user-stories.md`    | Cross-application user stories and workflow goals  |
| `admin-web-app.md`   | Administration app scope and requirements          |
| `ops-mobile-app.md`  | Operations mobile app scope and field workflows    |
| `customer-portal.md` | Customer portal scope, visibility, and constraints |

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

| Path       | Description                                                      |
| ---------- | ---------------------------------------------------------------- |
| `api/`     | Client makers and provider adapters (CRUD, HTTP, business rules) |
| `db/`      | Database client singletons (Supabase)                            |
| `runtime/` | Configuration management (Config singleton, runtime providers)   |
| `std/`     | Standard types (ID, When, Dictionary)                            |

#### 1.3.2 Domain (`source/domain/`)

| Path            | Description                                         |
| --------------- | --------------------------------------------------- |
| `abstractions/` | Core domain types (User, Job, Service, Asset, etc.) |
| `adapters/`     | Storage serialization (Dictionary ↔ domain types)   |
| `protocols/`    | Input/output contracts (CreateInput, UpdateInput)   |
| `validators/`   | Domain validation rules and invariants              |

#### 1.3.3 Backend (`source/back/`)

| Path             | Description                                  |
| ---------------- | -------------------------------------------- |
| `migrations/`    | SQL migrations (schema + RLS policies)       |
| `supabase-edge/` | Supabase Edge Functions (orchestration only) |

#### 1.3.4 Frontend (`source/ux/`)

| Path            | Description                                        |
| --------------- | -------------------------------------------------- |
| `api/`          | Composed API namespace (@ux-api barrel export)     |
| `app-admin/`    | Admin PWA application (desktop/tablet)             |
| `app-ops/`      | Operations PWA application (mobile, offline-first) |
| `app-customer/` | Customer portal application (static, read-only)    |
| `app-common/`   | Shared UX components and utilities                 |

## 2. Local Configuration

### 2.1 Backend Configuration

```bash
# Create backend config from example
cp source/back/supabase-edge/config/back-local.env.example \
   source/back/supabase-edge/config/back-local.env
```

Required variables:

```dotenv
# source/back/supabase-edge/config/back-local.env
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_KEY=your-service-role-key
JWT_SECRET=your-jwt-secret
```

### 2.2 UX Configuration

Each UX application has its own configuration module that initializes the core `Config` singleton with the appropriate runtime provider.

```bash
# Create config for each app
cp source/ux/app-admin/config/admin-local.env.example \
   source/ux/app-admin/config/admin-local.env

cp source/ux/app-ops/config/ops-local.env.example \
   source/ux/app-ops/config/ops-local.env

cp source/ux/app-customer/config/customer-local.env.example \
   source/ux/app-customer/config/customer-local.env
```

Required variables (similar for all apps):

```dotenv
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 2.3 Configuration Pattern

The system uses a singleton `Config` pattern defined in `@core/runtime/config.ts`:

- **Core defines the singleton** - Configuration lives at the lowest layer
- **Packages inject providers** - Each deployment context supplies its runtime provider
- **Config packaged with apps** - Configuration modules bundled during build

See `architecture-core.md` Section 6 for complete configuration management details.

### 2.4 Configuration Rules

- **Never commit actual `.env` files** - only commit `.env.example` templates
- Local configs gitignored via `**/*-local.env` pattern
- Stage and prod configs follow same pattern: `*-stage.env`, `*-prod.env`
- All runtime config values validated at bootstrap via `Config.init()`

## 3. Project Commands

```bash
# Full checks (guards + typecheck + lint)
deno task check

# Tests
deno task test

# Lint
deno task lint

# Format and format-check
deno task fmt
deno task fmt:check
```

## 4. Working Rules

| Rule              | Description                                                                                                                                                           |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CONSTITUTION.md` | Governing authority for all human and AI contributions. Apply conservative changes, respect architecture guards, and escalate when intent or constraints are unclear. |
| `README.md`       | Starting point for understanding the project. Keep it up-to-date and accurate.                                                                                        |
| `cspell.json`     | Spell checker configuration. Keep it up-to-date and accurate.                                                                                                         |
| `dprint.json`     | Code formatter configuration. Keep it up-to-date and accurate.                                                                                                        |
| `deno.jsonc`      | Deno project configuration. Keep it up-to-date and accurate.                                                                                                          |
