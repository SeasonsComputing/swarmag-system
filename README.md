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

# Admin web app
cp source/apps/admin/config/admin-local.env.example source/apps/admin/config/admin-local.env

# Tests
cp source/tests/config/tests-local.env.example source/tests/config/tests-local.env
```

Edit each file With your local values:

```bash
# source/serverless/config/serverless-local.env
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_KEY=your-local-service-key
JWT_SECRET=your-local-jwt-secret
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

# Test suite
deno task test  # Should run without environment errors
```

See `docs/foundation/architecture.md` section 18 for the complete configuration reference.

## 5. Software Construction Sessions

Prepare a software construction session by creating a new chat and submitting the following prompt:

Ingest the following files:

1. `CLAUDE.md` - guidance for Claude Code
2. `docs/*` - all markdown files
3. `source/*` - all source files
4. `AUTHORITY.md` - preeminent binding document
