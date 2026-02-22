# swarmAg Operations System -- README

![swarmAg ops logo](swarmag-ops-logo.png)

The swarmAg Operations System (`swarmAg system`) supports operations across aerial and ground agricultural services. The monorepo is organized around a typed domain core, backend/runtime infrastructure, and user experience applications.

Primary architectural context lives in `documentation/foundation/architecture-core.md`.

## 1. Repository Structure

### 1.1 Top-level Namespaces

| Path             | Description                                          |
| ---------------- | ---------------------------------------------------- |
| `deploy/`        | Deployment artifacts and environment-specific output |
| `documentation/` | Foundation and application documentation             |
| `source/`        | Source code organized into layers                    |
| `supabase/`      | Supabase project configuration and local metadata    |

### 1.2 Documentation (`documentation/`)

| Path            | Description                                            |
| --------------- | ------------------------------------------------------ |
| `applications/` | Application-level requirements and UX/product specs    |
| `foundation/`   | Core architecture, domain, style, and data definitions |
| `prompts/`      | Only prompts that may be re-run. One off's not saved.  |

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

| Path   | Description                                                      |
| ------ | ---------------------------------------------------------------- |
| `api/` | Client makers and provider adapters (CRUD, HTTP, business rules) |
| `cfg/` | Configuration management (Config singleton, runtime providers)   |
| `std/` | Standard types (Id, When, Dictionary)                            |

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

| Path            | Description                                          |
| --------------- | ---------------------------------------------------- |
| `api/`          | Composed API namespace (@ux-api barrel export)       |
| `app-admin/`    | Admin PWA application (desktop/tablet)               |
| `app-ops/`      | Operations PWA application (mobile, field execution) |
| `app-customer/` | Customer portal application (static, read-only)      |
| `app-common/`   | Shared UX components and utilities                   |

## 2. Local Configuration

### 2.1 Backend Configuration

```bash
cp source/back/supabase-edge/config/back-local.env.example \
   source/back/supabase-edge/config/back-local.env
```

```dotenv
# source/back/supabase-edge/config/back-local.env
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_KEY=your-service-role-key
JWT_SECRET=your-jwt-secret
```

### 2.2 UX Configuration

```bash
cp source/ux/config/ux-local.env.example \
   source/ux/config/ux-local.env
```

```dotenv
# source/ux/config/ux-local.env
VITE_SUPABASE_EDGE_URL=http://localhost:54321
VITE_SUPABASE_RDBMS_URL=http://localhost:54321
VITE_SUPABASE_SERVICE_KEY=your-service-role-key
VITE_JWT_SECRET=your-jwt-secret
```

UX apps use `VITE_`-prefixed keys as required by Vite. The `Config` alias map declared in `source/ux/config/ux-config.ts` exposes these as unprefixed names to all consuming code — `Config.get('SUPABASE_EDGE_URL')`, `Config.get('JWT_SECRET')`, etc.

### 2.3 Configuration Pattern

The system uses a singleton `Config` defined in `@core/cfg/config.ts`, initialized once per deployment context via `Config.init(provider, keys, aliases?)`:

- `provider` — runtime-specific implementation (`SolidProvider`, `SupabaseProvider`, `DenoProvider`)
- `keys` — required environment variable names; bootstrap fails immediately if any are missing
- `aliases` — optional map of logical name → environment key for platform-specific prefixing

See `architecture-core.md` section 6 for complete configuration management detail.

### 2.4 Configuration Rules

- Never commit actual `.env` files — only commit `.env.example` templates
- Local configs gitignored via `**/*-local.env` pattern
- Stage and prod configs follow the same pattern: `*-stage.env`, `*-prod.env`
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
