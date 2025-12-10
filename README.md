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

- `project/` — architecture, orchestration, domain, and user story docs.
- `source/domain/` — canonical domain model (types/interfaces/classes).
- `source/utils/` — shared primitives (UUID v7, UTC time).
- `source/api/` — Netlify Functions exposing domain operations; platform helpers in `source/api/platform/`.
- `source/samples/` — sample domain objects for reference/tests.
- `source/apps/` — (placeholder) SolidJS apps for admin, ops, and customer experiences.

## TypeScript & Aliases

- `module: ESNext`, `moduleResolution: bundler`, `baseUrl: source`.
- Aliases: `@domain/*`, `@utils/*`, `@api/*`, `@/*`.
- UUID v7 (`id()`) and ISO UTC timestamps (`when()`) in `source/utils/`.

## API Conventions

- File naming: `{abstraction}-{action}.ts` (singular), e.g., `job-create.ts`, `service-list.ts`, `job-log-append.ts`.
- Typed handler pattern: export a domain-aware `handle` plus Netlify `handler` via `withNetlify` (`source/api/platform/netlify.ts`).
- Standard actions: `create`, `get`, `list`, `update`, `delete`, `append`, `search`.
- Responses: JSON with `{ data }` on success; `{ error, details? }` on failure; status codes 400/405/422/500 as appropriate.
- Append-only where required (e.g., job logs).

## Domain Notes

- Attachments carry a `kind` (`photo` | `video` | `map` | `document`).
- `Customer.contacts` is non-empty and `primaryContactId` lives on `Customer`.
- Asset types are specialized (`skidsteer-vehicle`, `toolcat-vehicle`, `vehicle-tool`, `mapping-drone`, `dispensing-drone`, `drone-bucket`).
- Locations store coordinates/addresses without a `source` field.

## Documentation

- Architecture: `project/swarmag-system-architecture.md`
- Orchestration (phase sequencing): `project/swarmag-system-orchestration.md`
- Domain model & API conventions: `project/swarmag-system-domain.md`
- User stories: `project/swarmag-system-user-stories.md`
- App-specific briefs: `project/swarmag-system-admin.md`, `project/swarmag-system-ops.md`, `project/swarmag-system-customer.md`

## Development Tips

- Import domain types from `source/domain`; do not redefine domain entities locally.
- For new APIs, follow the handler adapter and naming conventions.
- Keep append-only semantics intact for logs and audit trails.
