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

### 1.2 Documentation (`documentation\`)

| Path            | Description                                                   |
| --------------- | ------------------------------------------------------------- |
| `applications/` | Application-level requirements and UX/product specs           |
| `foundation/`   | Core architecture, domain, style, and data definitions        |
| `history/`      | Historical architecture notes and project evolution artifacts |

#### 1.2.1 Foundation (`documentation\foundation\`)

| Path                   | Description                                            |
| ---------------------- | ------------------------------------------------------ |
| `architecture-core.md` | Core architecture principles and system-wide structure |
| `architecture-back.md` | Backend architecture, boundaries, and runtime model    |
| `architecture-ux.md`   | UX architecture and frontend layering                  |
| `domain.md`            | Domain model concepts, entities, and invariants        |
| `data-dictionary.md`   | Canonical field and data element definitions           |
| `data-lists.md`        | Controlled vocabularies and enumerated values          |
| `style-guide.md`       | Style and authoring conventions                        |

#### 1.2.2 Applications (`documentation\applications\`)

| Path                 | Description                                        |
| -------------------- | -------------------------------------------------- |
| `user-stories.md`    | Cross-application user stories and workflow goals  |
| `admin-web-app.md`   | Administration app scope and requirements          |
| `ops-mobile-app.md`  | Operations mobile app scope and field workflows    |
| `customer-portal.md` | Customer portal scope, visibility, and constraints |

### 1.3 Source Layers (`source\`)

| Path         | Description                                                       |
| ------------ | ----------------------------------------------------------------- |
| `back/`      | Backend runtime modules (config, functions, library, migrations)  |
| `devops/`    | Architecture and environment guard scripts                        |
| `domain/`    | Domain model and domain-layer contracts                           |
| `tests/`     | Test suites and supporting fixtures                               |
| `utilities/` | Shared utility modules used across layers                         |
| `ux/`        | Client-facing user experiences, apps, contracts, and UI libraries |

#### 1.3.1 Domain (`source/domain`)

| Path            | Description                                    |
| --------------- | ---------------------------------------------- |
| `abstractions/` | Core domain abstractions                       |
| `adapters/`     | Domain adapters and boundary translation logic |
| `protocol/`     | Domain protocols and interface contracts       |
| `validators/`   | Domain validation logic and invariants         |

#### 1.3.2 Backend (`source/back`)

| Path          | Description                                                     |
| ------------- | --------------------------------------------------------------- |
| `config/`     | Backend runtime configuration loading and environment templates |
| `functions/`  | Serverless/edge function entry points                           |
| `library/`    | Backend shared libraries and runtime bindings                   |
| `migrations/` | SQL migration files for backend persistence setup               |

#### 1.3.3 User Experience (`source/ux`)

| Path                           | Description                            |
| ------------------------------ | -------------------------------------- |
| `api/client/`                  | UX API client into the backend         |
| `api/contracts/`               | UX API client contracts                |
| `applications/administration/` | Administration application code        |
| `applications/components/`     | Shared application-level UI components |
| `applications/customer/`       | Customer application code              |
| `applications/operations/`     | Operations application code            |
| `applications/library/`        | Shared UX library/runtime helpers      |

## 2. Local Configuration

Create local environment files from the current examples:

```bash
# Backend runtime config
cp source/back/config/back-local.env.example source/back/config/back-local.env

# Administration UX app config
cp source/ux/applications/administration/config/app-admin-local.env.example source/ux/applications/administration/config/app-admin-local.env
```

Populate values as needed for your environment:

```dotenv
# source/back/config/back-local.env
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_KEY=...
JWT_SECRET=...

# source/ux/applications/administration/config/app-admin-local.env
VITE_API_URL=http://localhost:8888
```

Do not commit local env files.

## 3. Project Commands

```bash
# Full checks (guards + typecheck + lint)
deno task check

# Tests
deno task test

# Lint + markdown lint
deno task lint

# Format and format-check
deno task fmt
deno task fmt:check
```

## 4. Working Rules

| Rule                      | Description                                                                                                                                                           |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CONSTITUTION.md`         | Governing authority for all human and AI contributions. Apply conservative changes, respect architecture guards, and escalate when intent or constraints are unclear. |
| `README.md`               | Starting point for understanding the project. Keep it up-to-date and accurate.                                                                                        |
| `cspell.json`             | Spell checker configuration. Keep it up-to-date and accurate.                                                                                                         |
| `dprint.json`             | Code formatter configuration. Keep it up-to-date and accurate.                                                                                                        |
| `deno.json`               | Deno project configuration. Keep it up-to-date and accurate.                                                                                                          |
| `netlify.toml`            | Netlify runtime/build configuration. Keep it up-to-date and accurate.                                                                                                 |
| `netlify-import-map.json` | Netlify import map configuration. Keep it up-to-date and accurate.                                                                                                    |
