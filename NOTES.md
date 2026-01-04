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

## Local tooling status

- Netlify CLI installed (requires `XDG_CONFIG_HOME` workaround in this sandbox).
- Supabase CLI installed at `~/.local/bin/supabase`.
- `supabase/` initialized in repo.
- Docker installed; local Supabase started with auth enabled.
- `.env.local` created with local Supabase URL + keys (gitignored).

## Local dev commands

- Start Supabase (minimal services):  
  `supabase start --exclude realtime,storage-api,imgproxy,mailpit,postgres-meta,studio,edge-runtime,logflare,vector,supavisor`
- Reset/apply migrations: `supabase db reset --yes`
- Show local URLs/keys: `supabase status --output env`
- Build functions: `pnpm build`
- Run Netlify dev (sandbox only):  
  `XDG_CONFIG_HOME=./.config netlify dev`

## DBeaver local connection

- Host: `127.0.0.1`
- Port: `54322`
- Database: `postgres`
- User: `postgres`
- Password: `postgres`
- URL: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`

## Pending setup tasks

- Create hosted Supabase project for staging and wire `.env.staging`.
- Create Netlify staging site and decide custom domain naming.

## Migration layout

- Supabase CLI reads migrations from `supabase/migrations`.
- `supabase/migrations` is a symlink to `source/migrations` to avoid duplication.

## Working with Ted

- Prefer direct, no-fluff communication and concrete actions.
- Emphasize rigorous engineering, architecture quality, and correctness.
- Keep changes aligned with system conventions and documented standards.
- Prefer zero warnings across tooling, linting, and builds.

## Recent changes

- Cleaned up markdown lint warnings in `tedvkremer_experience.md` (headings, labels, links).
