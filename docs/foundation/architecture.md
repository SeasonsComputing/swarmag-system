# swarmAg System - Architecture

The definitive architecture document for the swarmAg System.

## 1. Executive summary

The **swarmAg System** is composed of SolidJS web and mobile applications orchestrated via a serverless api (edge functions backend). It supports administration, operations workflows & logs, and customer-facing features for agricultural services that involve regulated chemicals and industrial equipment. The system focuses on two service classes—Aerial and Ground—and the workflows, assets, and regulated chemicals required to deliver them safely and repeatably. Quality is measured against safety, efficiency, repeatability, and performance.

## 2. Core Platforms

- **Netlify** — frontends, functions compute, DNS, SSL
- **Supabase** — Postgres, Auth, Storage, Realtime
- **GitHub Actions** — CI/CD
- **SolidJS + TanStack + Kobalte + vanilla CSS** — UI platform
- **Deno & Docker** — runtime hosts used across the stack.

## 3. Goals, constraints, and guiding principles

- Offline-Capable PWA
- Append-only logs
- Zero-cost infrastructure
- TypeScript ontology

## 4. System overview

Components: Ops PWA, Admin Portal, Customer Portal, API Edge Functions, Supabase Data.

```text
  ┌─────────────────┐
  │ ops.swarmag.com │─────╮
  └─────────────────┘     │
┌───────────────────┐     │                        web-app:
│ admin.swarmag.com │─────│               /app, /api, /domain, /utils
└───────────────────┘     │
   ┌────────────────┐     │
   │ me.swarmag.com │─────│
   └────────────────┘     │
                          │
                   ┌─────────────────┐            netlify:
                ╭──│ api.swarmag.com │    /serverless, /domain, /utils
                │  └─────────────────┘
       ┌──────────────────┐                       supabase:
       │ data.swarmag.com │                      /migrations
       └──────────────────┘
```

## 5. Domain model summary

Abstractions: Service, Asset, Chemical, Workflow, JobAssessment, JobPlan, JobLog, Customer, Contact. Canonical domain definitions and rules live in `docs/foundation/domain.md`.

## 6. Backend API design

Netlify Edge Functions for REST, Supabase Edge Functions for async workflows. API files live under `source/serverless/functions/*`, default-export handlers wrapped with `createApiHandler`, and use per-abstraction mapping helpers (e.g., `users-mapping.ts`) from `source/serverless/mappings/` to convert between domain models and Supabase row shapes.

### 6.1 API conventions

Functions that expose the domain model over HTTP, persisted in Supabase, and typed with `source/domain`. Each function:

- `source/serverless/functions` — API to store & retrieve domain concepts via Netlify Edge Functions via REST endpoints.
- Uses the `{resource}-{action}.ts` naming convention with plural resource names (e.g., `users-create.ts`).
- Each function exports `config = { path: "/api/{resource}/{action}" }` to bind a stable route.
- Parses and validates JSON requests against domain types.
- Returns JSON responses with a consistent envelope and status codes.

### 6.2 Handler pattern

| Item      | Detail                                                                                                                                                                                                              |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Exports   | Each file default-exports the Edge handler `createApiHandler(handle)` from `source/serverless/lib/api-handler.ts`; keep per-abstraction mapping helpers in `source/serverless/mappings/*` for DB/domain conversion. |
| Signature | `handle: (req: ApiRequest<RequestBody, Query>) => ApiResponse<ResponseBody> or Promise<ApiResponse<ResponseBody>>`                                                                                                  |
| Request   | `ApiRequest` carries `method`, parsed `body`, `query`, `headers`, and raw Request.                                                                                                                                  |
| Response  | `ApiResponse` carries `statusCode`, optional `headers`, and JSON-serializable `body`.                                                                                                                               |
| Imports   | Only import domain types from `source/domain`; do not redefine domain abstractions locally.                                                                                                                         |

### 6.3 Validation and errors

| Area         | Behavior                                                                                                 |
| ------------ | -------------------------------------------------------------------------------------------------------- |
| Methods      | Reject unsupported HTTP methods with `HttpCodes.methodNotAllowed` (405).                                 |
| Parsing      | Invalid/missing JSON -> `HttpCodes.badRequest` (400).                                                    |
| Semantics    | Shape/domain validation failures -> `HttpCodes.unprocessableEntity` (422).                               |
| Persistence  | Supabase/unknown failures -> `HttpCodes.internalError` (500); do not leak stacks.                        |
| Responses    | Always JSON; success `{ data: ... }`; failure `{ error, details? }`.                                     |
| Immutability | Use `append` actions for append-only resources (e.g., job logs); avoid in-place mutation where required. |

Invariant validation lives in `source/domain/*-validators.ts`. Serverless handlers must call domain validators and translate failures; they must not re-implement invariants.

### 6.4 Database Boundaries and Mapping

Database results are an untrusted boundary. Supabase rows are treated as `unknown`, validated in mapping helpers under `source/serverless/mappings/`, and converted to domain types only after runtime checks. Generic row wrapper types (for example, `Row<T>`) are forbidden. Mapping logic lives with the subsystem that consumes it and is neither domain logic nor infrastructure.

## 7. Client API Design

The Client API layer (`source/api/`) provides a typed SDK for apps to consume the serverless runtime. It is a top-level namespace that bridges apps to the serverless backend while depending on domain types.

### 7.1 Purpose and placement

The API client layer serves as the typed interface between frontend applications and the serverless backend. As a top-level namespace, it:

- Provides a clean SDK that apps import to communicate with the backend.
- Depends on domain types for request/response shapes.
- Encapsulates all HTTP/RPC details so apps never see fetch, headers, or envelopes.
- Sits between apps and serverless in the dependency graph.

### 7.2 Directory structure

```text
source/api/
  client/
    users-api.ts            # UsersApi client object
  lib/
    api-client-binding.ts   # Factory, shared types, and helpers
    configure-solid.ts      # Browser/SSR configuration provider
  config/
    config.ts               # Bootstrap for API client
    api-*.env               # Environment values
```

### 7.3 API client conventions

| Item           | Convention                                                                      |
| -------------- | ------------------------------------------------------------------------------- |
| Factory        | Use `makeApiClient<T, TCreate, TUpdate>(spec)` factory function                 |
| Naming         | `{Abstraction}Api` object in `{abstractions}-api.ts` (e.g., `UsersApi`)         |
| Return types   | Return domain types directly (`User`, `User[]`); never expose HTTP envelopes    |
| Error handling | Throw `ApiError` on failures; callers use try/catch                             |
| Encapsulation  | Hide all RPC internals (fetch, headers, JSON parsing, result unwrapping)        |
| Method names   | Use `create`, `get`, `list`, `update`, `delete` to match serverless conventions |
| Base URL       | Configured via `Config.get('VITE_API_URL')` from api/config bootstrap           |

### 7.4 Shared types

The `api-client-binding.ts` module exports:

| Export             | Purpose                                                               |
| ------------------ | --------------------------------------------------------------------- |
| `makeApiClient`    | Factory function to create typed API client objects                   |
| `ApiSpecification` | Configuration interface for the factory (`{ basePath: string }`)      |
| `ListOptions`      | Pagination parameters (`{ limit?: number; cursor?: number }`)         |
| `ListResult<T>`    | Paginated response (`{ data: T[]; cursor: number; hasMore: boolean}`) |
| `DeleteResult`     | Soft-delete response (`{ id: ID; deletedAt: When }`)                  |
| `ApiError`         | Error class with `status` and optional `details`                      |

### 7.5 Usage pattern

```typescript
// Define API client using factory
const UsersApi = makeApiClient<User, UserCreateInput, UserUpdateInput>({
  basePath: '/api/users'
})

// Create
const user = await UsersApi.create({
  displayName: 'Ada Lovelace',
  primaryEmail: 'ada@example.com',
  phoneNumber: '555-0100'
})

// Get by ID
const fetched = await UsersApi.get(user.id)

// List with pagination
const { data, cursor, hasMore } = await UsersApi.list({ limit: 25, cursor: 0 })

// Update
const updated = await UsersApi.update({ id: user.id, displayName: 'Ada Byron' })

// Soft-delete
const { deletedAt } = await UsersApi.delete(user.id)
```

### 7.6 Error handling

API methods throw `ApiError` on non-ok responses:

```typescript
try {
  const user = await UsersApi.get('nonexistent-id')
} catch (err) {
  if (err instanceof ApiError) {
    console.error(`${err.status}: ${err.message}`)
    if (err.details) console.error(`Details: ${err.details}`)
  }
}
```

### 7.7 Design principles

1. **Domain types only**: Methods accept and return domain types; no HTTP artifacts leak through.
2. **Single responsibility**: Each API client handles one domain abstraction.
3. **Factory pattern**: `makeApiClient` generates typed client objects with standard CRUD methods.
4. **Consistent naming**: Method names mirror serverless endpoint actions.
5. **Centralized error handling**: `ApiError` provides structured failure information.
6. **Testable**: Mock `globalThis.fetch` in tests to control responses.

## 8. Coding conventions & UI

TypeScript + SolidJS + TanStack + Kobalte + vanilla CSS See `docs/foundation/style-guide.md` for compiler settings, aliases, and code style rules.

## 9. Namespace dependencies

This section outlines the monorepo structure and its primary dependency flow.

```text
          ┌ LAYER ┐                      ┌ SCOPE / RESPONSIBILITY ┐
  ══════════════════════════════════════════════════════════════════════ 
          ┌───────┐
          │ TESTS │                   (Orchestration & Verification)
          └───┬───┘
              ▼
          ┌───────┐
          │ APPS  │                   (UI / Presentation / Entry Points)
          └───┬───┘
              ▼
          ┌───────┐
          │  API  │                   (Contract / Transport / DTOs)
          └───┬───┘
              ▼
    ┌─────────┴─────────┐
┌───┴────────┐      ┌───┴────────┐
│ SERVERLESS │ ───> │   DOMAIN   │    (Business Logic / Persistence)
└───┬────────┘      └───┬────────┘
    └─────────┬─────────┘
              ▼
          ┌───────┐
          │ UTILS │                   (ADTs / RuntimeConfig / Pure Logic)
          └───────┘
  ══════════════════════════════════════════════════════════════════════
  STRICT INVARIANT: Imports must flow DOWN. 
  Violation of this DAG triggers Architecture Guard failure.
```

### 9.1 Source directory graph

```text
source/
  api/
    client/
    config/
    lib/
  apps/
    admin/
    customer/
    ops/
  domain/
    abstractions/
    validators/
    protocol/
  migrations/
  serverless/
    config/
    functions/
    lib/
    mappings/
  tests/
    cases/
    config/
    fixtures/
  utils/
devops/
  scripts/
```

## 10. Build, CI/CD, Deployment

- GitHub Actions for CI/CD.
- Netlify for builds and deploys.
- Supabase for schema, data, auth, and storage.
- TypeScript is checked via Deno; import aliases are defined in `deno.json` so runtime and tooling match.
- Netlify Edge Functions use `netlify-import-map.json` (root) via `netlify.toml [functions].deno_import_map`; keep it aligned with `deno.json` and use root-relative paths.
- CI runs `deno task guard:architecture` to enforce import boundaries; violations fail the build.
- CI runs `deno task guard:leaf` to enforce the leaf-directory rule; violations fail the build.

### 10.1 Database migrations

- Migrations live in `source/migrations/` and are applied by the deploy pipeline (GitHub Actions or Netlify build step), not by serverless edge functions.
- The build runner connects directly to Supabase/Postgres using elevated credentials (service role or DB URL) and runs the migration tool (Supabase CLI or `psql`).
- Production deploys run migrations; preview/staging should avoid schema changes unless explicitly intended.
- `supabase/migrations` is a symlink to `source/migrations` so the Supabase CLI reads the canonical migrations without duplication.

### 10.2 Local development quickstart

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

### 10.3 Local development helpers

| Command                                                                                                                      | Purpose                                                                                  |
| ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `supabase start --exclude realtime,storage-api,imgproxy,mailpit,postgres-meta,studio,edge-runtime,logflare,vector,supavisor` | Start local Supabase with minimal services.                                              |
| `supabase db reset --yes`                                                                                                    | Reset and re-apply migrations.                                                           |
| `supabase status --output env`                                                                                               | Show local Supabase URLs and keys.                                                       |
| `XDG_CONFIG_HOME=./.config netlify dev`                                                                                      | Run Netlify dev (uses `source/apps/dev-server/dev-server.ts` for the custom dev server). |

### 10.4 Database GUI connection (DBeaver)

| Field    | Value                                                     |
| -------- | --------------------------------------------------------- |
| Host     | `127.0.0.1`                                               |
| Port     | `54322`                                                   |
| Database | `postgres`                                                |
| User     | `postgres`                                                |
| Password | `postgres`                                                |
| URL      | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |

## 11. Environment variables

At minimum:

- Supabase: URL, anon key, service role key.
- Netlify: auth token, site IDs for each app.
- Optional: Mapbox or similar mapping API key.

## 12. Offline model (Ops PWA)

- IndexedDB cache.
- Append-only queue of operations.
- Background sync via Service Worker.

## 13. Map pipeline

- Files uploaded to Supabase Storage.
- Edge Function processes metadata/derivatives.

## 14. Document storage

- Supabase Storage buckets serve as the shared document store for manuals, job maps, photos, and other binary assets referenced via the `Attachment` domain type.
- Domain abstractions only persist attachment metadata (filename, uploader, URL, timestamps) while the files live in storage.
- Buckets follow a `<context>-attachments` naming convention (e.g., `assets-attachments`, `jobs-attachments`, `assessments-attachments`) with folder paths such as `jobs/{jobId}/photos/*.jpg` or `job-assessments/{assessmentId}/maps/*.tif`.
- Retention: production buckets keep files indefinitely with lifecycle rules for temporary uploads; preview/staging buckets auto-expire after 30 days.
- Access: Netlify Edge Functions broker signed URLs for uploads/downloads, while Supabase RLS ensures only authorized users can request those URLs.

## 15. Security & compliance

- JWT-based auth (Supabase).
- Row Level Security (RLS) on all key tables.
- Immutable JobLogs with retention policies.

## 16. Observability

- Telemetry into Supabase (or equivalent).
- Error tracking with a service such as Sentry.

## 17. Compliance & safety

- Digital checklists.
- Geotagged logs as needed.

## 18. Implementation recommendations

- Stateless functions.
- Schema validation at boundaries.
- Soft delete pattern for user-centric data: persist a `deletedAt` UTC timestamp (null/undefined means active), filter queries to `deleted_at IS NULL`, and use partial unique indexes on active rows so identifiers like email can be reused after deletion. Hard deletes run in batch maintenance jobs when needed.
- UUID v7 for primary/foreign keys to avoid an ID service, allow offline/preassigned inserts, and keep btree inserts mostly ordered; use the native `uuid` type with a v7 generator, avoid redundant indexes, favor composite keys on join tables, and monitor index health on write-heavy tables.

## 19. Runtime configuration parameters

### 19.1 Overview

Runtime configuration uses a consistent interface across all deployment contexts with context-appropriate error handling. Configuration parameters are declared upfront via `init()` and accessed via `get()`, eliminating scattered null checks and default values throughout the codebase.

### 19.2 Architecture

The configuration system uses a `RuntimeConfig` class that wraps context-specific `RuntimeProvider` implementations.

```text
RuntimeProvider (interface in utils/runtime.ts)
  get(key: string): string | undefined
  fail(msg: string): never

RuntimeConfig (class in utils/runtime.ts)
  constructor(provider: RuntimeProvider)
  init(required: readonly string[]): void
  get(name: string): string

Provider Implementations:
  utils/configure-deno.ts              → DenoProvider (console.error + Deno.exit)
  serverless/lib/configure-netlify.ts  → NetlifyProvider (throws Response)
  api/lib/configure-solid.ts           → SolidProvider (throws Error)

Bootstrap Files (config.ts):
  serverless/config/config.ts       (detects Netlify vs Deno, exports Config)
  api/config/config.ts              (uses ConfigureSolid, exports Config)
  tests/config/config.ts            (uses ConfigureDeno, exports Config)
```

### 19.3 Configuration parameter matrix

| Parameter              | Serverless | Apps | Tests | Description                                     |
| ---------------------- | ---------- | ---- | ----- | ----------------------------------------------- |
| `SUPABASE_URL`         | Yes        |      | Yes   | Database connection URL (varies by environment) |
| `SUPABASE_SERVICE_KEY` | Yes        |      | Yes   | Service role key for elevated database access   |
| `JWT_SECRET`           | Yes        |      |       | Secret for signing/verifying auth tokens        |
| `VITE_API_URL`         |            | Yes  |       | Base URL for serverless API (client-side)       |
| `API_BASE_URL`         |            |      | Yes   | Base URL for API testing                        |

### 19.4 Environment values by deployment context

Each deployment context maintains separate environment files:

```text
serverless/config/
  config.ts
  serverless-local.env
  serverless-stage.env
  serverless-prod.env

api/config/
  config.ts
  api-local.env
  api-stage.env
  api-prod.env
```

### 19.5 Usage pattern

```typescript
// Bootstrap file declares required parameters once
import { ConfigureNetlify } from '@serverless-lib/configure-netlify.ts'
import { ConfigureDeno } from '@utils/configure-deno.ts'

const Config = 'Deno' in self ? ConfigureDeno : ConfigureNetlify

Config.init(['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'JWT_SECRET'])

export { Config }

// Application code imports and uses
import { Config } from '@serverless/config/config.ts'

const dbUrl = Config.get('SUPABASE_URL') // Guaranteed to return string
```

### 19.6 Fast-fail behavior

Configuration validates all required parameters during `init()` and fails fast with context-appropriate error handling:

- **Netlify Edge Functions**: `throw new Response(message, { status: 500 })`
- **Browser/SSR Apps**: `throw new Error(message)`
- **CLI/Tests**: `console.error(message); Deno.exit(1)`

Missing or unregistered parameters cause immediate, explicit failures rather than runtime null reference errors.

### 19.7 Deployment environment management

**Local Development:**

- Values read from `.env` files in each context's config directory.
- `netlify dev` loads serverless environment.
- Vite loads app environment with `VITE_` prefix.

**Stage/Production:**

- Serverless: Environment variables set in Netlify UI (one-time manual setup).
- Apps: Build-time environment variables injected by build system.
- Tests: Environment variables set in CI/CD or test runner.

**Rationale:** Configuration changes infrequently (infrastructure cadence) compared to code deployments (feature cadence). Separating these concerns reduces coupling and security risk.

### 19.8 Design principles

1. **A priori declaration**: All required parameters declared upfront via `init()`.
2. **Fast-fail validation**: Missing parameters cause immediate, explicit failures.
3. **No optional parameters**: Eliminates null checks and default value logic.
4. **Isomorphic interface**: Same API across all deployment contexts.
5. **Context-appropriate errors**: Error handling matches execution environment.
6. **Co-located values**: Environment files live with the code that uses them.
7. **Honest duplication**: Shared values duplicated across contexts that independently need them.
