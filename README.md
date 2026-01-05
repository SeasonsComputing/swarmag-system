# swarmAg System

![swarmAg ops logo](swarmag-ops-logo.png)

The swarmAg system supports the administration and operations of the swarmAg agricultural services business. Services fall into two classes—Aerial and Ground—and rely on complex machinery, vehicles, equipment, tools, chemicals, and workflows. Safety, efficiency, repeatability, and performance are first principles, and the system is evaluated against those outcomes. See `https://swarmag.com` for broader context.

This repo is a monorepo for the swarmAg system: SolidJS frontends, Netlify Functions, and a Supabase-backed domain model. The repo focuses first on a typed domain model and API layer, then the Admin, Ops, and Customer apps.

Architecture, goals, and setup instructions live in `docs/foundation/architecture.md`.

## 1. Repository Layout

| Path                           | Description                                                 |
| ------------------------------ | ----------------------------------------------------------- |
| `docs/`                        | Foundation + applications docs, plus history                |
| `source/domain/`               | Canonical domain model (types/interfaces/classes)           |
| `source/utils/`                | Shared primitives (UUID v7, UTC time)                       |
| `source/serverless/functions/` | Netlify Functions                                           |
| `source/serverless/lib/`       | Backend platform helpers (Netlify adapter, Supabase client) |
| `source/migrations/`           | Supabase SQL migrations                                     |
| `source/tests/`                | Test specs and fixtures (barreled samples in `fixtures/`)   |
| `source/apps/`                 | Planned SolidJS apps for admin, ops, customer               |

## 2. Roadmap (Current Project State)

1. Foundation — domain types + initial APIs.
2. Admin Web App — dashboards, scheduling, catalog administration.
3. Ops Mobile App — offline-first field workflows and job logging.
4. Customer Portal — read-only job visibility.

## 3. Documentation

- Architecture (canonical platform/system doc): `docs/foundation/architecture.md`
- Domain model & API conventions: `docs/foundation/domain.md`
- User stories: `docs/applications/user-stories.md`
- App-specific briefs: `docs/applications/admin-web-app.md`, `docs/applications/ops-mobile-app.md`, `docs/applications/customer-portal.md`
- Data lists (services, asset types): `docs/foundation/data-lists.md`

## 4. Docs Index

### 4.1 Foundation

- `docs/foundation/architecture.md`
- `docs/foundation/domain.md`
- `docs/foundation/data-lists.md`
- `docs/foundation/style-guide.md`

### 4.2 Applications

- `docs/applications/user-stories.md`
- `docs/applications/admin-web-app.md`
- `docs/applications/ops-mobile-app.md`
- `docs/applications/customer-portal.md`

### 4.3 History

- `docs/history/swarmag-ops-meta-prompt.md`
