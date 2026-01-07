# swarmAg System - Architecture

The definitive architecture document for the swarmAg System.

## 1. Executive summary

The **swarmAg System** is composed of SolidJS web and mobile applications orchestrated via a serverless api (functions backend).
It supports administration, operations workflows & logs, and customer-facing features for agricultural services that involve regulated chemicals and industrial equipment.
The system focuses on two service classes—Aerial and Ground—and the workflows, assets, and regulated chemicals required to deliver them safely and repeatably. Quality is measured against safety, efficiency, repeatability, and performance.

## 2. Core Platforms

- **Netlify** — frontends, functions compute, DNS, SSL
- **Supabase** — Postgres, Auth, Storage, Realtime
- **GitHub Actions** — CI/CD
- **SolidJS + TanStack + Kobalte + vanilla CSS** — UI platform

## 3. Goals, constraints, and guiding principles

- Offline-Capable PWA
- Append-only logs
- Zero-cost infrastructure
- TypeScript ontology

## 4. System overview

Components: Ops PWA, Admin Portal, Customer Portal, API Functions, Supabase Data.

```text
       ┌─────────────────┐
       │ ops.swarmag.com │─────╮
       └─────────────────┘     │
     ┌───────────────────┐     │
     │ admin.swarmag.com │─────│
     └───────────────────┘     │
        ┌────────────────┐     │
        │ me.swarmag.com │─────│
        └────────────────┘     │
                               ▼
                        ┌─────────────────┐
                     ╭──│ api.swarmag.com │
                     ▼  └─────────────────┘
            ┌──────────────────┐
            │ data.swarmag.com │
            └──────────────────┘
```

## 5. Domain model summary

Abstractions: Service, Asset, Chemical, Workflow, JobAssessment, JobPlan, JobLog, Customer, Contact.
Canonical domain definitions and rules live in `docs/foundation/domain.md`.

## 6. API design

Netlify Edge Functions (Deno) for REST, Supabase Edge Functions for async workflows. API files live under `source/serverless/functions/*`, default-export handlers wrapped with `withNetlify`, and use per-abstraction mapping helpers (e.g., `user-mapping.ts`) to convert between domain models and Supabase row shapes.

### 6.1 API conventions

Functions that expose the domain model over HTTP, persisted in Supabase, and typed with `source/domain`. Each function:

- `source/serverless/functions` — API to store & retrieve domain concepts via Netlify Functions via REST endpoints.
- Uses the `{abstraction}-{action}.ts` naming convention with singular-tense abstractions.
- Parses and validates JSON requests against domain types.
- Returns JSON responses with a consistent envelope and status codes.

### 6.2 Handler pattern

| Item      | Detail                                                                                                                                                                                          |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Exports   | Each file default-exports the Netlify `handler = withNetlify(handle)` from `source/serverless/lib/netlify.ts`; keep per-abstraction mapping helpers in `*-mapping.ts` for DB/domain conversion. |
| Signature | `handle: (req: ApiRequest<RequestBody, Query>) => ApiResponse<ResponseBody> \| Promise<ApiResponse<ResponseBody>>`                                                                              |
| Request   | `ApiRequest` carries `method`, parsed `body`, `query`, `headers`, and raw Netlify event.                                                                                                        |
| Response  | `ApiResponse` carries `statusCode`, optional `headers`, and JSON-serializable `body`.                                                                                                           |
| Imports   | Only import domain types from `source/domain`; do not redefine domain abstractions locally.                                                                                                     |

### 6.3 Validation and errors

| Area         | Behavior                                                                                                 |
| ------------ | -------------------------------------------------------------------------------------------------------- |
| Methods      | Reject unsupported HTTP methods with `HttpCodes.methodNotAllowed` (405).                                 |
| Parsing      | Invalid/missing JSON -> `HttpCodes.badRequest` (400).                                                    |
| Semantics    | Shape/domain validation failures -> `HttpCodes.unprocessableEntity` (422).                               |
| Persistence  | Supabase/unknown failures -> `HttpCodes.internalError` (500); do not leak stacks.                        |
| Responses    | Always JSON; success `{ data: ... }`; failure `{ error, details? }`.                                     |
| Immutability | Use `append` actions for append-only resources (e.g., job logs); avoid in-place mutation where required. |

## 7. Coding conventions & UI

TypeScript + SolidJS + TanStack + Kobalte + vanilla CSS
See `docs/foundation/style-guide.md` for compiler settings, aliases, and code style rules.

## 8. Namespace dependencies

This section outlines the monorepo structure and its primary dependency flow; see `README.md` for the project roadmap.

```text
               ╭─────────╮
               │  tests  │
               ╰─────────╯
   ───────────────────────────────────────
                ╭────────╮
            ╭───│  apps  │───╮
            ▼   ╰────────╯   ▼
       ╭────────────╮    ╭──────────╮
       │ serverless │───▶│  domain  │
       ╰────────────╯    ╰──────────╯
   ───────────────────────────────────────
               ╭─────────╮
               │  utils  │
               ╰─────────╯
```

## 9. Build, CI/CD, Deployment

- GitHub Actions for CI/CD.
- Netlify for builds and deploys.
- Supabase for schema, data, auth, and storage.
- TypeScript is checked via Deno; import aliases are defined in `deno.json` so runtime and tooling match.

### 9.1 Database migrations

- Migrations live in `source/migrations/` and are applied by the deploy pipeline (GitHub Actions or Netlify build step), not by serverless functions.
- The build runner connects directly to Supabase/Postgres using elevated credentials (service role or DB URL) and runs the migration tool (Supabase CLI or `psql`).
- Production deploys run migrations; preview/staging should avoid schema changes unless explicitly intended.
- `supabase/migrations` is a symlink to `source/migrations` so the Supabase CLI reads the canonical migrations without duplication.

### 9.2 Local development quickstart

Requirements:

- Deno 1.46+

Setup and build:

```bash
deno task check
```

Tests:

```bash
deno task test
```

Live smoke tests (requires a deployed base URL):

```bash
LIVE_BASE_URL=https://<env> deno test --allow-env --allow-net --allow-read source/tests/live
```

### 9.3 Local development helpers

| Command | Purpose |
| ------- | ------- |
| `supabase start --exclude realtime,storage-api,imgproxy,mailpit,postgres-meta,studio,edge-runtime,logflare,vector,supavisor` | Start local Supabase with minimal services. |
| `supabase db reset --yes` | Reset and re-apply migrations. |
| `supabase status --output env` | Show local Supabase URLs and keys. |
| `XDG_CONFIG_HOME=./.config netlify dev` | Run Netlify dev in sandbox environments. |

### 9.4 Database GUI connection (DBeaver)

| Field | Value |
| ----- | ----- |
| Host | `127.0.0.1` |
| Port | `54322` |
| Database | `postgres` |
| User | `postgres` |
| Password | `postgres` |
| URL | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |

## 10. Environment variables

At minimum:

- Supabase: URL, anon key, service role key.
- Netlify: auth token, site IDs for each app.
- Optional: Mapbox or similar mapping API key.

## 11. Offline model (Ops PWA)

- IndexedDB cache.
- Append-only queue of operations.
- Background sync via Service Worker.

## 12. Map pipeline

- Files uploaded to Supabase Storage.
- Edge Function processes metadata/derivatives.

## 13. Document storage

- Supabase Storage buckets serve as the shared document store for manuals, job maps, photos, and other binary assets referenced via the `Attachment` domain type.
- Domain abstractions only persist attachment metadata (filename, uploader, URL, timestamps) while the files live in storage.
- Buckets follow a `<context>-attachments` naming convention (e.g., `assets-attachments`, `jobs-attachments`, `assessments-attachments`) with folder paths such as `jobs/{jobId}/photos/*.jpg` or `job-assessments/{assessmentId}/maps/*.tif`.
- Retention: production buckets keep files indefinitely with lifecycle rules for temporary uploads; preview/staging buckets auto-expire after 30 days.
- Access: Netlify Functions broker signed URLs for uploads/downloads, while Supabase RLS ensures only authorized users can request those URLs.

## 14. Security & compliance

- JWT-based auth (Supabase).
- Row Level Security (RLS) on all key tables.
- Immutable JobLogs with retention policies.

## 15. Observability

- Telemetry into Supabase (or equivalent).
- Error tracking with a service such as Sentry.

## 16. MVP roadmap

- Foundation → Admin Portal → Ops PWA → Customer Portal

## 17. Compliance & safety

- Digital checklists.
- Geotagged logs as needed.

## 18. Implementation recommendations

- Stateless functions.
- Schema validation at boundaries.
- Soft delete pattern for user-centric data: persist a `deletedAt` UTC timestamp (null/undefined means active), filter queries to `deleted_at IS NULL`, and use partial unique indexes on active rows so identifiers like email can be reused after deletion. Hard deletes run in batch maintenance jobs when needed.
- UUID v7 for primary/foreign keys to avoid an ID service, allow offline/preassigned inserts, and keep btree inserts mostly ordered; use the native `uuid` type with a v7 generator, avoid redundant indexes, favor composite keys on join tables, and monitor index health on write-heavy tables.
