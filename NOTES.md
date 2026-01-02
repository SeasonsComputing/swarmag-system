# swarmAg System - Working Notes

This file summarizes the current baseline so it can be restored after tool resets.

## Repo summary

- Monorepo for domain model, Netlify Functions, and Supabase-backed data.
- SolidJS apps are planned; only shared helpers exist today.
- Primary goal: typed domain model + API layer first, then Admin/Ops/Customer apps.

## Architecture and conventions

- Platforms: Netlify Functions + Supabase (Postgres/Auth/Storage).
- Language: TypeScript, `module: ESNext`, `moduleResolution: bundler`, `baseUrl: source`.
- Aliases: `@domain/*`, `@utils/*`, `@serverless/*`, `@/*`.
- API handlers: Netlify `handler = withNetlify(handle)` with JSON envelopes.
- Responses: success `{ data }`, failure `{ error, details? }`.
- HTTP codes use `HttpCodes` (no numeric literals).
- Job logs are append-only.
- Soft deletes: `deletedAt` timestamp; filter `deleted_at IS NULL`.
- IDs: UUID v7 (`@utils/identifier`).
- Time: ISO UTC strings (`@utils/datetime`).

## Domain model (`source/domain`)

- Core abstractions: Service, Asset, Chemical, Workflow, Job (Assessment/Plan/Log),
  Customer/Contact.
- Shared types: User, Author (with curated attribution roles), Note, Attachment,
  Address, Location, Question/Answer.
- Roles:
  - User roles in `USER_ROLES`.
  - Attribution roles in `AUTHOR_ATTRIBUTION_ROLES`.

## Serverless (`source/serverless`)

- `lib/netlify.ts`: wraps handlers with JSON parsing + error handling.
- `lib/api-binding.ts`: `ApiRequest`, `ApiResponse`, `HttpCodes`.
- `lib/supabase.ts`: singleton Supabase client using env vars.
- `lib/db-binding.ts`: pagination helpers and row guards.
- Functions implemented:
  - `job-create`, `job-log-append`, `service-list`
  - `user-create`, `user-get`, `user-update`, `user-delete`
  - `user-mapping` helper

## Tests (`source/tests`)

- Vitest unit tests for job-create and user CRUD handlers.
- Fixtures under `source/tests/fixtures`, barreled by `samples.ts`.
- Live test for `service-list` (requires `LIVE_BASE_URL`).

## Apps (`source/apps`)

- Only shared helper exists: `source/apps/shared/attribution-roles.ts`.
- Admin/Ops/Customer apps are planned but not implemented.

## Migrations

- `source/migrations/20241107000000_create_users.sql` creates users table
  with soft delete and partial unique index on active emails.

## Useful docs

- `project/architecture.md`
- `project/domain.md`
- `project/orchestration.md`
- `project/style-guide.md`
- `project/data-lists.md`
- `project/user-stories.md`

## Working with Ted

- Prefer direct, no-fluff communication and concrete actions.
- Emphasize rigorous engineering, architecture quality, and correctness.
- Keep changes aligned with system conventions and documented standards.
