# swarmAg System

A monorepo for the swarmAg platform: SolidJS frontends, Netlify Functions, and a Supabase-backed domain model. The repo focuses first on a typed domain model and API layer, then the Admin, Ops, and Customer apps.

## Getting Started

Requirements:

- Node 18+
- pnpm (`npm install -g pnpm`)

Setup and build:

```bash
pnpm install
pnpm tsc -b
```

## Repository Layout

| Path             | Description                                                         |
| ---------------- | ------------------------------------------------------------------- |
| `docs/`       | Foundation + applications docs, plus history                        |
| `source/domain/` | Canonical domain model (types/interfaces/classes)                   |
| `source/utils/`  | Shared primitives (UUID v7, UTC time)                               |
| `source/serverless/functions/` | Netlify Functions                                               |
| `source/serverless/lib/` | Backend platform helpers (Netlify adapter, Supabase client) |
| `source/migrations/` | Supabase SQL migrations                                  |
| `source/tests/`  | Test specs and fixtures (barreled samples in `fixtures/`)           |
| `source/apps/`   | (Placeholder) SolidJS apps for admin, ops, and customer experiences |

## TypeScript & Aliases

- `module: ESNext`, `moduleResolution: bundler`, `baseUrl: source`.
- Aliases: `@domain/*`, `@utils/*`, `@serverless/*`, `@/*`.
- UUID v7 (`id()`) and ISO UTC timestamps (`when()`) in `source/utils/`.

## API Conventions

- File naming: `{abstraction}-{action}.ts` (singular), e.g., `job-create.ts`, `service-list.ts`, `job-log-append.ts`.
- Typed handler pattern: export a domain-aware `handle` plus Netlify `handler` via `withNetlify` (`source/serverless/lib/netlify.ts`).
- Standard actions: `create`, `get`, `list`, `update`, `delete`, `append`, `search`.
- Responses: JSON with `{ data }` on success; `{ error, details? }` on failure; status codes 400/405/422/500 as appropriate.
- Append-only where required (e.g., job logs).

## Domain Notes

- Attachments carry a `kind` (`photo` | `video` | `map` | `document`).
- `Customer.contacts` is non-empty and `primaryContactId` lives on `Customer`.
- Asset types are data records (`AssetType`) referenced by `Asset.type` and `Service.requiredAssetTypes` and curated in `docs/foundation/data-lists.md`.
- Locations store coordinates/addresses without a `source` field.

## Roadmap (Current Project State)

1. Foundation — domain types + initial APIs.
2. Admin Web App — dashboards, scheduling, catalog administration.
3. Ops Mobile App — offline-first field workflows and job logging.
4. Customer Portal — read-only job visibility.

## Documentation

- Architecture (canonical platform/system doc): `docs/foundation/architecture.md`
- Domain model & API conventions: `docs/foundation/domain.md`
- User stories: `docs/applications/user-stories.md`
- App-specific briefs: `docs/applications/admin-web-app.md`, `docs/applications/ops-mobile-app.md`, `docs/applications/customer-portal.md`
- Data lists (services, asset types): `docs/foundation/data-lists.md`

## Docs Index

Foundation:

- `docs/foundation/architecture.md`
- `docs/foundation/domain.md`
- `docs/foundation/data-lists.md`
- `docs/foundation/style-guide.md`

Applications:

- `docs/applications/user-stories.md`
- `docs/applications/admin-web-app.md`
- `docs/applications/ops-mobile-app.md`
- `docs/applications/customer-portal.md`

History:

- `docs/history/swarmag-ops-meta-prompt.md`

## Development Tips

- Import domain types from `source/domain`; do not redefine domain abstractions locally.
- For new APIs, follow the handler adapter and naming conventions.
- Keep append-only semantics intact for logs and audit trails.
- Tests: `pnpm test` (unit), `pnpm test:watch`, `pnpm test:live` (requires `LIVE_BASE_URL` to hit deployed endpoints); fixtures live under `source/tests/fixtures/samples.ts`.
