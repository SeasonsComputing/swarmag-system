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

Netlify Functions for REST, Supabase Edge Functions for async workflows. API files live under `source/serverless/functions/*`, default-export Netlify handlers wrapped with `withNetlify`, and use per-abstraction mapping helpers (e.g., `user-mapping.ts`) to convert between domain models and Supabase row shapes.
API conventions and handler rules live in `docs/foundation/domain.md`.

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
- TypeScript compiler set to `module: ESNext` with `moduleResolution: bundler` so imports and aliases match the bundler/runtime behavior.

### 9.1 Database migrations

- Migrations live in `source/migrations/` and are applied by the deploy pipeline (GitHub Actions or Netlify build step), not by serverless functions.
- The build runner connects directly to Supabase/Postgres using elevated credentials (service role or DB URL) and runs the migration tool (Supabase CLI or `psql`).
- Production deploys run migrations; preview/staging should avoid schema changes unless explicitly intended.

### 9.2 Local development quickstart

Requirements:

- Node 18+
- pnpm (`npm install -g pnpm`)

Setup and build:

```bash
pnpm install
pnpm tsc -b
```

Tests:

```bash
pnpm test
pnpm test:watch
```

Live smoke tests (requires a deployed base URL):

```bash
LIVE_BASE_URL=https://<env> pnpm test:live
```

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
