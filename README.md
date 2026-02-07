# swarmAg System

![swarmAg ops logo](swarmag-ops-logo.png)

The swarmAg Operations System, or the `swarmAg system` supports the administration and operations of the swarmAg agricultural services business. Services fall into two classes—Aerial and Ground—and rely on complex machinery, vehicles, equipment, tools, chemicals, and workflows. Safety, efficiency, repeatability, and performance are first principles, and the system is evaluated against those outcomes. See `https://swarmag.com` for broader context.

The swarmAg system monorepo contains SolidJS frontends, Netlify Edge Functions, and a Supabase-backed domain model. The repo focuses first on a typed domain model and API layer, then the Admin, Ops, and Customer apps.

Architecture, goals, and setup instructions live in `docs/foundation/architecture.md`.

## 1. Repository Layout

| Path                           | Description                                                 |
| ------------------------------ | ----------------------------------------------------------- |
| `docs/`                        | System, architecture, and application specifications        |
| `source/domain/`               | Canonical domain model (types/interfaces/classes)           |
| `source/utils/`                | Shared primitives, e.g. datetime & identifier               |
| `source/serverless/functions/` | Netlify Edge Functions                                      |
| `source/serverless/lib/`       | Backend platform helpers (Netlify adapter, Supabase client) |
| `source/migrations/`           | Supabase SQL migrations                                     |
| `source/tests/`                | Test specs and fixtures (barreled samples in `fixtures/`)   |
| `source/apps/`                 | Planned SolidJS apps for admin, ops, customer               |

## 2. Roadmap (Current Project State)

- Foundation — domain types + initial APIs.
- Admin Web App — dashboards, scheduling, catalog administration.
- Ops Mobile App — offline-first field workflows and job logging.
- Customer Portal — read-only job visibility.

## 3. Documentation

### 3.1 Foundation

- `docs/foundation/architecture.md`
- `docs/foundation/domain.md`
- `docs/foundation/data-lists.md`
- `docs/foundation/style-guide.md`

### 3.2 Applications

- `docs/applications/user-stories.md`
- `docs/applications/admin-web-app.md`
- `docs/applications/ops-mobile-app.md`
- `docs/applications/customer-portal.md`

### 3.3 History (origin)

- `docs/history/swarmag-ops-meta-prompt.md`

## 4. Configuration Setup

SwarmAg uses environment-specific configuration files for each deployment context.

### 4.1 Local development setup

**Create local environment files** for each context you'll be working with:

```bash
# Serverless API functions
cp source/serverless/config/serverless-local.env.example source/serverless/config/serverless-local.env

# API client (for apps)
cp source/api/config/api-local.env.example source/api/config/api-local.env
```

Edit each file with your local values:

```bash
# source/serverless/config/serverless-local.env
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_KEY=your-local-service-key
JWT_SECRET=your-local-jwt-secret

# source/api/config/api-local.env
VITE_API_URL=http://localhost:8888
```

**Never commit** these files - they're in `.gitignore` by default.

### 4.2 Stage/Production setup

**Serverless (Netlify):**

1. Log into Netlify Dashboard.
2. Navigate to your site > Settings > Environment Variables.
3. Add required variables: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `JWT_SECRET`.

**Apps (Build-time):**

Build-time environment variables are injected by the build system. Vite reads from `VITE_*` prefixed variables.

### 4.3 Verification

```bash
# Test serverless config
netlify dev  # Should start without "Missing required config" errors

# Type check and guards
deno task check  # Should pass all checks
```

See `docs/foundation/architecture.md` section 19 for the complete configuration reference.

## 5. Software Construction Sessions

**Prepare a software construction session** by creating a new chat with your chosen AI assistant and instructing it to first ingest and comply with the project’s governing constitution and artifacts. Specifically, have the assistant ingest `CONSTITUTION.md` as the highest-authority document, followed by all Markdown files under `docs/` (architecture, domain, style, and data definitions), and then the full source tree under `source/`. The AI must treat `CONSTITUTION.md` as binding law, respect the defined authority model (Chief Architect → Architect AI → Coding Engine), refrain from architectural or domain changes without explicit instruction, and operate conservatively—pausing and escalating whenever intent or rules are unclear.

## 5.1. Ingestion Scope (Authoritative)

**Ingest the following files, in order of authority and context:**

1. `CONSTITUTION.md`  
   The highest-authority governing document. Binding law for all human and AI contributions.
2. `README.md`  
   Project orientation, workflow, and operational context. Establishes intent and usage expectations.
3. `docs/*`  
   All Markdown documentation, including architecture, domain model, style guide, and data definitions.
4. `devops/*`  
   Architecture guards, CI enforcement rules, and build-time constraints. These are **enforceable law**, not advisory documentation.
5. Configuration files, including (but not limited to):  
   - `deno.json`  
   - `netlify.toml`  
   - `netlify-import-map.json`  
   - CI configuration files  
   These files define hard runtime, build, and import constraints and must not be overridden or assumed.
6. `source/*`  
   The complete source tree for domain, API, serverless functions, tests, and applications.

### 5.2. Rules

- `CONSTITUTION.md` must be treated as binding law.
- Architectural, domain, persistence, or migration changes are forbidden without explicit instruction from the Chief Architect.
- Architecture guards under `devops/` are authoritative and non-optional; violations are errors, not warnings.
- Configuration files define immutable constraints and must be respected exactly.
- When intent, rules, or constraints are unclear, the AI must choose the most conservative interpretation and escalate before proceeding.
