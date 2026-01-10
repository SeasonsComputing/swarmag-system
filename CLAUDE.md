# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 1. Project Overview

The swarmAg System is a monorepo for agricultural services operations management, built with Netlify Edge Functions (Deno), Supabase backend, and SolidJS frontends. The system manages Aerial and Ground services that involve regulated chemicals and industrial equipment, with safety, efficiency, repeatability, and performance as first principles.

Architecture: Serverless API layer (Netlify Edge Functions) over Supabase (Postgres + Auth + Storage), consumed by planned SolidJS web/mobile apps. See `docs/foundation/architecture.md` for the authoritative architecture documentation.

## 2. Essential Commands

| Command | Purpose |
| ------- | ------- |
| `deno task check` | Type-check all TypeScript + run architecture guards |
| `deno task test` | Run all tests |
| `deno task guard:architecture` | Enforce import boundaries (CI requirement) |
| `deno task guard:validation` | Ensure validation rules aren't duplicated |
| `deno task lint` | Lint TypeScript and Markdown |
| `deno task fmt` | Format source and docs |

### 2.1 Local development

```bash
# Start local Supabase (minimal services)
supabase start --exclude realtime,storage-api,imgproxy,mailpit,postgres-meta,studio,edge-runtime,logflare,vector,supavisor

# Reset and re-apply migrations
supabase db reset --yes

# Show local Supabase URLs and keys
supabase status --output env

# Run Netlify dev (uses custom dev server)
XDG_CONFIG_HOME=./.config netlify dev
```

### 2.2 Live smoke tests

Requires a deployed base URL:

```bash
LIVE_BASE_URL=https://<env> deno test --allow-env --allow-net --allow-read source/tests/live
```

### 2.3 Database GUI connection (DBeaver)

| Field | Value |
| ----- | ----- |
| Host | `127.0.0.1` |
| Port | `54322` |
| Database | `postgres` |
| User | `postgres` |
| Password | `postgres` |

## 3. High-Level Architecture

### 3.1 Monorepo structure and dependency flow

```text
           ┌───────────────┐
           │    tests      │
           └───────────────┘
 ──────────────────────────────────────
           ┌───────────────┐
           │     apps      │
           └───────────────┘
 ─────────────────────────────────────
           ┌───────────────┐
       ╭───│     api       │───╮
       │   └───────────────┘   │
       ▼                       ▼
 ┌───────────────┐    ┌───────────────┐
 │  serverless   │───>│     domain    │
 └───────────────┘    └───────────────┘
 ─────────────────────────────────────
           ┌───────────────┐
           │     utils     │
           └───────────────┘
```

**Critical rule:** Apps must consume the backend exclusively through the runtime API (Netlify Edge Functions). Apps must NOT import serverless code or persistence logic directly. Architecture is enforced by CI via `deno task guard:architecture`; violations fail the build.

### 3.2 Directory purposes

| Path | Purpose |
| ---- | ------- |
| `source/domain/` | Canonical domain types (Service, Asset, Job, etc.) and validators |
| `source/utils/` | Shared primitives: `id()` (UUID v7), `when()` (ISO 8601 UTC) |
| `source/serverless/functions/` | Netlify Edge Functions (REST API endpoints) |
| `source/serverless/lib/` | Backend platform helpers (Netlify adapter, Supabase client) |
| `source/serverless/mappings/` | DB row ↔ domain type conversion helpers |
| `source/migrations/` | Supabase SQL migrations (symlinked to `supabase/migrations`) |
| `source/tests/` | Test specs and fixtures |
| `source/apps/` | Planned SolidJS apps (admin, ops, customer) |
| `docs/foundation/` | Architecture, domain model, style guide |
| `docs/applications/` | App-specific briefs and user stories |

### 3.3 Development sequence

**Extend the domain model first, then implement or update the API layer that exposes it, and only then build or modify the apps that consume it.**

## 4. Domain Model

### 4.1 Core abstractions

Service, Asset, Chemical, Workflow, JobAssessment, JobPlan, JobLog, Customer, Contact, User.

See `docs/foundation/domain.md` for canonical definitions and rules.

### 4.2 Key domain rules

- All identifiers are UUID v7 generated via `id()` from `@utils/identifier`; validate with `isID()`.
- All timestamps are ISO 8601 UTC strings generated via `when()` from `@utils/datetime`; validate with `isWhen()`.
- Domain types must be JSON-serializable.
- Validators live in `source/domain/*-validators.ts` and are the single source of truth for invariants.
- Soft deletes: `deletedAt?: When`; undefined/null means active, filter queries to `deleted_at IS NULL`.
- Job logs are append-only.

### 4.3 Import aliases

Configured in `deno.json`:

- `@domain/` → `source/domain/`
- `@utils/` → `source/utils/`
- `@serverless-lib/` → `source/serverless/lib/`
- `@serverless-functions/` → `source/serverless/functions/`
- `@serverless-mappings/` → `source/serverless/mappings/`
- `@tests-fixtures/` → `source/tests/fixtures/`
- `@tests-helpers/` → `source/tests/api/helpers/`

**Netlify Edge Functions:** Use `netlify-import-map.json` (kept aligned with `deno.json`, with root-relative paths).

## 5. API Handler Patterns

### 5.1 Function structure

Each Edge Function in `source/serverless/functions/`:

- Uses naming convention: `{resource}-{action}.ts` with plural resource names (e.g., `users-create.ts`).
- Exports `config = { path: "/api/{resource}/{action}" }` for stable routes.
- Default-exports `createApiHandler(handle)` from `@serverless-lib/api-handler.ts`.
- Handler signature: `handle: (req: ApiRequest<RequestBody, Query>) => ApiResponse<ResponseBody> | Promise<ApiResponse<ResponseBody>>`.
- Uses `HttpCodes` constants (never numeric literals) from `@serverless-lib/api-binding.ts`.
- Returns JSON envelopes: success `{ data: ... }`, failure `{ error, details? }`.

### 5.2 Standard flow

1. Guard HTTP method (return `HttpCodes.methodNotAllowed` for unsupported methods).
2. Validate request body against domain validators (return `HttpCodes.unprocessableEntity` on failure).
3. Call domain validators from `source/domain/*-validators.ts` (never duplicate invariant logic).
4. Generate UUID v7 and timestamps using `id()` and `when()`.
5. Convert domain object to Supabase row using mapping helpers from `source/serverless/mappings/`.
6. Persist using `Supabase.client()` from `@serverless-lib/supabase.ts`.
7. Return `{ data }` on success or `{ error, details }` on failure (never leak stack traces).

### 5.3 Database boundaries and mapping

- Supabase rows are treated as `unknown`.
- Validate in mapping helpers under `source/serverless/mappings/`.
- Convert to domain types only after runtime checks.
- Never use generic row wrapper types like `Row<T>`.
- Never use `as any` for type coercion.

### 5.4 Pagination

For list endpoints:

- Clamp `limit` to 1-100 with default of 25.
- Parse `cursor` as non-negative integer defaulting to 0.
- Use `Supabase.clampLimit` and `Supabase.parseCursor`.

## 6. Authority & Constraints

**`AUTHORITY.md` is the highest-priority engineering rules document. In case of conflict: correctness > authority > convention > examples.**

Key rules:

- Use the prescribed stack (Netlify + Supabase + TypeScript + SolidJS + TanStack + Kobalte + Docker).
- Maintain zero-cost deployment constraints.
- Prefer classes when state, lifecycle, or invariants must be enforced; use free functions only for pure utilities.
- Do not introduce new patterns, abstractions, or conventions unless explicitly requested.
- Get it right the first time; do not defer correctness or completeness.
- Prefer less over more; keep solutions minimal and KISS.
- Keep tooling, linting, and builds free of warnings.
- Number all Markdown sections; keep Markdown free of lint warnings.
- No multiple consecutive blank lines.
- Prefer dashes over underscores in filenames.
- Prefer tables over lists when there is more than a simple description.

### 6.1 Domain validation ownership

- All invariant validation lives in `source/domain`.
- Shared validation logic must be implemented once in the domain and reused elsewhere.
- Duplicating invariant validation in serverless is forbidden.
- Upper layers translate domain validation failures but must not redefine the rules.
- DRY applies to truth, not transport.

## 7. Code Style

See `docs/foundation/style-guide.md` for full details.

### 7.1 Highlights

- TypeScript strict mode, checked via `deno check`.
- Include `.ts` in import specifiers.
- Use import aliases (`@domain/*`, `@utils/*`, etc.) instead of deep relative paths.
- Use `import type` where helpful.
- JSDoc on exports: one-sentence summary + `@param`/`@returns`/`@throws`, ending with periods.
- No non-ASCII literals.
- Prefer type aliases and interfaces; avoid runtime-heavy helpers.
- String unions for enums (e.g., `JobStatus`, `JobLogType`).
- Default export only for Netlify Edge `createApiHandler(handle)`.

### 7.2 Error handling

- Invalid JSON → `HttpCodes.badRequest` (400).
- Validation failures → `HttpCodes.unprocessableEntity` (422).
- Persistence/unknown failures → `HttpCodes.internalError` (500); do not leak stacks.
- Do not throw past `createApiHandler`; return `ApiResponse`.

## 8. Migrations

- Migrations live in `source/migrations/`.
- Applied by deploy pipeline (GitHub Actions or Netlify build), NOT by Edge Functions.
- `supabase/migrations` is a symlink to `source/migrations`.
- Production deploys run migrations; preview/staging should avoid schema changes unless explicitly intended.

## 9. Document Storage

- Supabase Storage buckets serve as the shared document store for attachments.
- Buckets follow `<context>-attachments` naming (e.g., `assets-attachments`, `jobs-attachments`).
- Folder paths: `jobs/{jobId}/photos/*.jpg`, `job-assessments/{assessmentId}/maps/*.tif`.
- Netlify Edge Functions broker signed URLs for uploads/downloads.
- Supabase RLS ensures only authorized users can request URLs.

## 10. Working Notes & Context

`NOTES.md` contains working log and agent handoff context, including conversation summaries and decisions. Refer to it for recent changes and institutional memory.

## 11. Key Documentation Files

- `README.md` — Start here; repo layout and roadmap.
- `AUTHORITY.md` — Binding engineering rules and collaboration preferences.
- `docs/foundation/architecture.md` — Master architecture doc; stable, rarely changes.
- `docs/foundation/domain.md` — Canonical domain definitions.
- `docs/foundation/style-guide.md` — Code style norms.
- `docs/foundation/data-lists.md` — Canonical catalogs (services, asset types).
- `docs/applications/user-stories.md` — User stories.
- `docs/applications/admin-web-app.md`, `ops-mobile-app.md`, `customer-portal.md` — App-specific briefs.
- `NOTES.md` — Working log and context for future agents.
