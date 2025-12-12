# swarmAg System – Domain

This document defines the foundational abstractions, contracts, and APIs of the swarmAg solution space. The domain model captures both the problem space and the solution space, expressed as classes, types, interfaces, associations, and APIs delivered through a TypeScript library.

- `source/domain` — canonical domain abstractions, associations, properties, et al (Domain Model)
- `source/utils` - utility data types and helpers
- `source/api` — API to store & retrieve domain concepts via Netlify Functions via REST endpoints

## 1. Domain Model (`source/domain`)

### 1.1 Scope

Implement a TypeScript library that expresses the domain concepts described in `architecture.md`.

Core abstractions that define the solution space:

| Abstraction    | Description                                 |
| -------------- | ------------------------------------------- |
| `Service`      | Offering provided to customers              |
| `Asset`        | Equipment/resources used in operations      |
| `Chemical`     | Materials applied within services           |
| `Workflow`     | Sequenced steps for delivering a service    |
| `JobAssessment`| Initial evaluation of a prospective job     |
| `JobPlan`      | Planned execution details for a job         |
| `JobLog`       | Append-only record of job events and states |
| `Customer`     | Organization purchasing services            |
| `Contact`      | Individual associated with a customer       |

Common abstractions shared within the model:

| Abstraction    | Description                                  |
| -------------- | -------------------------------------------- |
| `User`         | Identity/profile with roles and contact info |
| `Author`       | Lightweight attribution slice of `User`      |
| `Note`         | Freeform text with author/time               |
| `Attachment`   | File reference metadata and uploader         |
| `Address`      | Postal address fields                        |
| `Location`     | Coordinate plus optional address             |
| `Coordinate`   | Latitude/longitude pair                      |
| `Question`     | Prompt used in assessments/forms             |
| `Answer`       | Response to a question                       |

Utility data types:

| Type           | Description                       |
| -------------- | --------------------------------- |
| `ID`           | UUID v7 string identifier         |
| `When`         | ISO 8601 UTC timestamp as string  |

Supporting structures present in code (refer to type definitions for details):

| Area           | Structures / Notes                                        |
| -------------- | --------------------------------------------------------- |
| Services       | `sku`; `requiredAssetTypes: ID[]` (links to AssetType)    |
| Assets         | `AssetType` (`id`, `name`; lifecycle aligned to Services) |
| Workflows      | `WorkflowStep`, `WorkflowVersion`                         |
| Jobs           | `JobAssignment`, `JobChemicalPlan`                        |
| Customers      | `CustomerSite`                                            |

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
- Asset types are modeled as data records (`AssetType`) and referenced by `Asset.type` and `Service.requiredAssetTypes`; keep the canonical list in `project/data-lists.md`.
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
  platform/
    netlify.ts     # ApiRequest/ApiResult and withNetlify adapter
    supabase.ts    # Supabase client factory
  job-create.ts
  job-log-append.ts
  service-list.ts
  # future: job-get.ts, job-list.ts, job-update.ts
  # future: service-create.ts, service-get.ts, service-update.ts, service-delete.ts
  # future: asset-*.ts, chemical-*.ts, workflow-*.ts, customer-*.ts, contact-*.ts
```

### 2.3 Standard actions by abstraction

| Abstraction | Actions | Notes |
| ----------- | ------- | ----- |
| Service     | `service-create`, `service-get`, `service-list`, `service-update`, `service-delete` | CRUD for catalogued offerings |
| Asset       | `asset-create`, `asset-get`, `asset-list`, `asset-update`, `asset-delete` | Manage fleet/equipment |
| Chemical    | `chemical-create`, `chemical-get`, `chemical-list`, `chemical-update`, `chemical-delete` | Track regulated materials |
| Workflow    | `workflow-create`, `workflow-get`, `workflow-list`, `workflow-update`, `workflow-delete` | Versioned service playbooks |
| Job (assess/plan) | `job-create`, `job-get`, `job-list`, `job-update` | `job-create` seeds Job + Assessment + Plan; updates limited to allowed Plan/Job fields |
| Job (logs) | `job-log-append`, `job-log-list` | Append-only logs; paginated reads |
| User       | `user-create`, `user-get`, `user-list`, `user-update`, `user-delete` | Profiles/roles for operators and customers |
| Customer   | `customer-create`, `customer-get`, `customer-list`, `customer-update`, `customer-delete` | Customer records |
| Contact    | `contact-create`, `contact-get`, `contact-list`, `contact-update`, `contact-delete` | People tied to customers |
| Optional   | `*-search` | Richer filtering when needed |

### 2.4 Handler pattern

| Item | Detail |
| ---- | ------ |
| Exports | Each file exports typed `handle` plus default Netlify `handler = withNetlify(handle)` from `source/api/platform/netlify.ts`. |
| Signature | `handle: (req: ApiRequest<Body, Query>) => ApiResult<Payload> \| Promise<ApiResult<Payload>>` |
| Request | `ApiRequest` carries `method`, parsed `body`, `query`, `headers`, and raw Netlify event. |
| Response | `ApiResult` carries `statusCode`, optional `headers`, and JSON-serializable `body`. |
| Imports | Only import domain types from `source/domain`; do not redefine entities locally. |

### 2.5 Validation and errors

| Area         | Behavior |
| ------------ | -------- |
| Methods      | Reject unsupported HTTP methods with `HttpCodes.methodNotAllowed` (405). |
| Parsing      | Invalid/missing JSON -> `HttpCodes.badRequest` (400). |
| Semantics    | Shape/domain validation failures -> `HttpCodes.unprocessableEntity` (422). |
| Persistence  | Supabase/unknown failures -> `HttpCodes.internalError` (500); do not leak stacks. |
| Responses    | Always JSON; success `{ data: ... }`; failure `{ error, details? }`. |
| Immutability | Use `append` actions for append-only resources (e.g., job logs); avoid in-place mutation where required. |
