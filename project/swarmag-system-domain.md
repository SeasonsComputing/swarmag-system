# swarmAg System – Domain

This document defines the foundational abstractions, contracts, and APIs of the swarmAg solution space. The domain model captures both the problem space and the solution space, expressed as classes, types, interfaces, associations, and APIs delivered through a TypeScript library.

- `source/domain` — canonical domain abstractions, associations, properties, et al (Domain Model)
- `source/utils` - utility data types and helpers
- `source/api` — API to store & retrieve domain concepts via Netlify Functions via REST endpoints

## 1. Domain Model (`source/domain`)

### 1.1 Scope

Implement a TypeScript library that expresses the domain concepts described in `swarmag-system-architecture.md`.

Core abstractions that define the solution space:

- `Service`
- `Asset`
- `Chemical`
- `Workflow`
- `JobAssessment`
- `JobPlan`
- `JobLog`
- `Customer`
- `Contact`

Common abstractions shared within the model:

- `Note`
- `Location`
- `Coordinate`
- `Question`
- `Answer`

Utility data types:

- `ID`
- `When`

### 1.2 Directory Layout

```text
source/domain/
  common.ts
  service.ts
  asset.ts
  chemical.ts
  workflow.ts
  job.ts
  customer.ts

source/utils/
  datetime.ts
  identifier.ts
```

### 1.3 Rules

- Language: TypeScript (strict mode) using the root `tsconfig.json` settings (`module: ESNext`, `moduleResolution: bundler`, `baseUrl: "source"`).
- Use the configured path aliases when importing: `@domain/*` for domain modules, `@utils/*` for core utilities.
- Types must be JSON-serializable.
- No runtime dependencies beyond the UUID helper (or a tiny internal implementation).
- This package is the **single source of truth** for domain types.
- All other code (apps, functions) must import from `source/domain`.
- JobAssessments must capture one or more `Location` entries (`locations` tuple) to support noncontiguous ranch assessments.

## 2. API Functions (`source/api/*`)

### 2.1 Scope

Functions that expose the domain model over HTTP, persisted in Supabase, and typed with `source/domain`. Each function:

- Uses the `{abstraction}-{action}.ts` naming convention with singular-tense abstractions.
- Parses and validates JSON requests against domain types.
- Returns JSON responses with a consistent envelope and status codes.

### 2.2 Naming and layout

```text
source/api/
  helpers/
    http.ts        # jsonResponse, parseJsonBody
    handler.ts     # ApiRequest/ApiResult types + withNetlify adapter
    supabase.ts    # Supabase client factory
  job-create.ts
  job-log-append.ts
  service-list.ts
  # future: job-get.ts, job-list.ts, job-update.ts
  # future: service-create.ts, service-get.ts, service-update.ts, service-delete.ts
  # future: asset-*.ts, chemical-*.ts, workflow-*.ts, customer-*.ts, contact-*.ts
```

### 2.3 Standard actions by abstraction

- **Service:** `service-create`, `service-get`, `service-list`, `service-update`, `service-delete`.
- **Asset:** `asset-create`, `asset-get`, `asset-list`, `asset-update`, `asset-delete`.
- **Chemical:** `chemical-create`, `chemical-get`, `chemical-list`, `chemical-update`, `chemical-delete`.
- **Workflow:** `workflow-create`, `workflow-get`, `workflow-list`, `workflow-update`, `workflow-delete`.
- **Job:**
  - Assessments/Plans: `job-create` (creates Job + Assessment + Plan), `job-get`, `job-list`, `job-update` (mutable Plan/Job fields only where allowed).
  - Logs: `job-log-append` (append-only), `job-log-list` (paginated read).
- **Customer:** `customer-create`, `customer-get`, `customer-list`, `customer-update`, `customer-delete`.
- **Contact:** `contact-create`, `contact-get`, `contact-list`, `contact-update`, `contact-delete`.
- Optional: `search` variants for richer filtering when needed.

### 2.4 Handler pattern

- Each file exports a typed `handle` (domain-aware) and the default Netlify `handler` created via `withNetlify` in `source/api/helpers/handler.ts`.
- `handle` signature: `(req: ApiRequest<Body, Query>) => ApiResult<Payload> | Promise<ApiResult<Payload>>`.
- `ApiRequest` contains `method`, parsed `body`, `query`, `headers`, and the raw Netlify event; `ApiResult` contains `statusCode`, optional `headers`, and a JSON-serializable `body`.
- Import domain types from `source/domain` only; do not redefine them inside API handlers.

### 2.5 Validation and errors

- Methods: reject unsupported HTTP methods with `405`.
- Parsing: reject invalid or missing JSON bodies with `400`.
- Semantics: reject domain/shape validation failures with `422`.
- Persistence/unknown: return `500` with an error message; never leak raw stack traces.
- Responses: always `application/json`; prefer `{ data: ... }` for success and `{ error: string, details?: string }` for failures.
- Immutability: use `append` actions for append-only resources (e.g., job logs); avoid in-place mutation where the domain requires immutability.
