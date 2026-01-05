# swarmAg System - Working Notes

Last updated: 2026-01-05

## 0. Purpose

- Working log and agent handoff context.
- Summaries of key conversations and decisions.
- Not canonical; authoritative docs are `README.md` and `docs/foundation/architecture.md`.

## 0.1 Conversation summaries

- 2026-01-05: Doc refactor alignment. We agreed the docs were strong but scattered, and that the system is best framed as four products (SDK, Admin, Ops, Customer) plus a platform/architecture layer. Decisions:
  - Keep `NOTES.md` as the agent handoff and institutional memory log; it should be comprehensive, not minimal, and include summaries of our conversations.
  - Retire `docs/orchestration.md` and move phase sequencing/roadmap into `README.md` (README is the "current state" entry point).
  - Keep `docs/foundation/architecture.md` as the master, stable architecture doc; it should avoid becoming a dumping ground and should change rarely.
  - `docs/foundation/domain.md` remains the canonical domain definition; `docs/foundation/architecture.md` should link to it rather than duplicate domain rules.
  - App briefs (`docs/applications/admin-web-app.md`, `docs/applications/ops-mobile-app.md`, `docs/applications/customer-portal.md`) remain product-specific and should not repeat platform/domain.
  - `docs/foundation/data-lists.md` stays as canonical catalogs, referenced by domain.
  - `NOTES.md` should reference canonical docs (`README.md`, `docs/foundation/architecture.md`) and capture any ongoing decisions or context for future agents.
  - The preferred doc layout is: `README.md` (start + roadmap), `docs/foundation/architecture.md` (platform + system + SDK conventions), `docs/foundation/domain.md` (domain rules), app briefs, `docs/foundation/style-guide.md`, `docs/foundation/data-lists.md`, `docs/applications/user-stories.md`, `NOTES.md` (working log).
  - Moved the historical seed prompt to `docs/history/swarmag-ops-meta-prompt.md` and marked it non-authoritative.
- 2026-01-05: Documentation structure refined into `docs/foundation/` and `docs/applications/`, with `docs/history/` for provenance. Updated all references and README summary accordingly.

## 0.2 Conversation summary template

- YYYY-MM-DD: Short title or focus.
  - Context: 1-2 sentence summary of the problem or intent.
  - Decisions: bullet list of concrete choices made.
  - Actions taken: bullet list of changes applied (files or commands).
  - Follow-ups: bullet list of open questions or next steps.

This file summarizes the current baseline so it can be restored after tool resets.

## 1. Repo summary

- Monorepo for domain model, Netlify Functions, and Supabase-backed data.
- SolidJS apps are planned; only shared helpers exist today.
- Primary goal: typed domain model + API layer first, then Admin/Ops/Customer apps.

## 2. Architecture and conventions

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

## 3. Domain model (`source/domain`)

- Core abstractions: Service, Asset, Chemical, Workflow, Job (Assessment/Plan/Log),
  Customer/Contact.
- Shared types: User, Author (with curated attribution roles), Note, Attachment,
  Address, Location, Question/Answer.
- Roles:
  - User roles in `USER_ROLES`.
  - Attribution roles in `AUTHOR_ATTRIBUTION_ROLES`.

## 4. Serverless (`source/serverless`)

- `lib/netlify.ts`: wraps handlers with JSON parsing + error handling.
- `lib/api-binding.ts`: `ApiRequest`, `ApiResponse`, `HttpCodes`.
- `lib/supabase.ts`: singleton Supabase client using env vars.
- `lib/db-binding.ts`: pagination helpers and row guards.
- Functions implemented:
  - `job-create`, `job-log-append`, `service-list`
  - `user-create`, `user-get`, `user-update`, `user-delete`
  - `user-mapping` helper

## 5. Tests (`source/tests`)

- Vitest unit tests for job-create and user CRUD handlers.
- Fixtures under `source/tests/fixtures`, barreled by `samples.ts`.
- Live test for `service-list` (requires `LIVE_BASE_URL`).

## 6. Apps (`source/apps`)

- Only shared helper exists: `source/apps/shared/attribution-roles.ts`.
- Admin/Ops/Customer apps are planned but not implemented.

## 7. Migrations

- `source/migrations/20241107000000_create_users.sql` creates users table
  with soft delete and partial unique index on active emails.

## 8. Useful docs

- `docs/foundation/architecture.md`
- `docs/foundation/domain.md`
- `docs/foundation/style-guide.md`
- `docs/foundation/data-lists.md`
- `docs/applications/user-stories.md`
- `docs/applications/admin-web-app.md`
- `docs/applications/ops-mobile-app.md`
- `docs/applications/customer-portal.md`
- `README.md`

## 9. Local tooling status

- Netlify CLI installed (requires `XDG_CONFIG_HOME` workaround in this sandbox).
- Supabase CLI installed at `~/.local/bin/supabase`.
- `supabase/` initialized in repo.
- Docker installed; local Supabase started with auth enabled.
- `.env.local` created with local Supabase URL + keys (gitignored).

## 10. Local dev commands

- Start Supabase (minimal services):  
  `supabase start --exclude realtime,storage-api,imgproxy,mailpit,postgres-meta,studio,edge-runtime,logflare,vector,supavisor`
- Reset/apply migrations: `supabase db reset --yes`
- Show local URLs/keys: `supabase status --output env`
- Build functions: `pnpm build`
- Run Netlify dev (sandbox only):  
  `XDG_CONFIG_HOME=./.config netlify dev`

## 11. DBeaver local connection

- Host: `127.0.0.1`
- Port: `54322`
- Database: `postgres`
- User: `postgres`
- Password: `postgres`
- URL: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`

## 12. Pending setup tasks

- Create hosted Supabase project for staging and wire `.env.staging`.
- Create Netlify staging site and decide custom domain naming.

## 13. Migration layout

- Supabase CLI reads migrations from `supabase/migrations`.
- `supabase/migrations` is a symlink to `source/migrations` to avoid duplication.

## 14. Working with Ted

- Prefer direct, no-fluff communication and concrete actions.
- Emphasize rigorous engineering, architecture quality, and correctness.
- Keep changes aligned with system conventions and documented standards.
- Prefer zero warnings across tooling, linting, and builds.
- Prefer dashes over underscores in filenames.

## 15. Recent changes

- Cleaned up markdown lint warnings in `tedvkremer-experience.md` (headings, labels, links).
