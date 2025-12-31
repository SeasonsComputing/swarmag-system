# swarmAg System – Domain

This document defines the foundational abstractions, contracts, and APIs of the swarmAg Operations System, or
 the `swarmAg System`. The domain model captures both the problem space and the solution space, expressed as classes, types, interfaces, associations, and APIs delivered through a TypeScript library.

## 1. Domain Model (`source/domain`)

### 1.1 Scope

Define the TypeScript domain library described in `architecture.md`, limited to types and associations under `source/domain` plus shared primitives in `source/utils`. All other concerns (API, persistence, UI) consume these types rather than re-declaring them.

### 1.2 Core abstractions that define the solution space

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

### 1.3 Common abstractions shared within the model

| Abstraction    | Description                                  |
| -------------- | -------------------------------------------- |
| `User`         | Identity/profile with role memberships and contact info |
| `Author`       | Lightweight attribution slice of `User` with a curated attribution role |
| `Note`         | Freeform text with author/time               |
| `Attachment`   | File reference metadata and uploader         |
| `Address`      | Postal address fields                        |
| `Location`     | Coordinate plus optional address             |
| `Coordinate`   | Latitude/longitude pair                      |
| `Question`     | Prompt used in assessments/forms             |
| `Answer`       | Response to a question                       |

### 1.4 Supporting structures present in code (refer to type definitions for details)

| Area           | Structures / Notes                                        |
| -------------- | --------------------------------------------------------- |
| Services       | `sku`; `requiredAssetTypes: ID[]` (links to AssetType)    |
| Assets         | `AssetType` (`id`, `name`; lifecycle aligned to Services) |
| Workflows      | `WorkflowStep`, `WorkflowVersion`                         |
| Jobs           | `JobAssignment`, `JobChemicalPlan`                        |
| Customers      | `CustomerSite`                                            |

### 1.5 Utility data types

| Type           | Description                       |
| -------------- | --------------------------------- |
| `ID`           | UUID v7 string identifier         |
| `When`         | ISO 8601 UTC timestamp as string  |

### 1.6 Rules

- Language: TypeScript (strict mode) using the root `tsconfig.json` settings (`module: ESNext`, `moduleResolution: bundler`, `baseUrl: "source"`).
- Use the configured path aliases when importing: `@domain/*` for domain modules, `@utils/*` for core utilities.
- Types must be JSON-serializable.
- No runtime dependencies beyond the UUID helper (or a tiny internal implementation).
- This package is the **single source of truth** for domain types.
- All other code (apps, functions) must import from `source/domain`.
- Asset types are modeled as data records (`AssetType`) and referenced by `Asset.type` and `Service.requiredAssetTypes`; keep the canonical list in `project/data-lists.md`.
- JobAssessments must capture one or more `Location` entries (`locations` tuple) to support noncontiguous ranch assessments.
- Soft deletes: abstractions that need logical deletion (starting with `User`) expose `deletedAt?: When`; callers treat undefined/null as active, filter queries to `deleted_at IS NULL`, and keep partial unique indexes on active rows so identifiers can be reused after delete.
- ID strategy: UUID v7 for PK/FK to avoid an ID service, allow offline/preassigned keys, and let related rows be inserted together; mitigations include using the native `uuid` type, a v7 generator, avoiding redundant indexes, preferring composite keys for pure join tables, and routine maintenance (vacuum/reindex) on heavy-write tables.

### 1.7 Roles & attribution

- User memberships are constrained to `USER_ROLES` (`administrator`, `sales`, `operations`) defined in `source/domain/common.ts`; `User.roles` is an array so a user may hold multiple memberships.
- Attribution uses curated roles, not free text: `AUTHOR_ATTRIBUTION_ROLES` in `source/domain/common.ts` lists role ids/labels and the contexts they apply to (e.g., `assessment-lead`, `crew-lead`, `gis-analyst`, `field-tech`, `fleet-manager`, `account-executive`).
- `Author.role` stores the attribution role id from `AUTHOR_ATTRIBUTION_ROLES`; UI should render the label from that catalog and never collect arbitrary text.
- If a context does not supply a meaningful attribution role, omit it rather than prompting the user for input.

## 2. API Functions (`source/serverless/functions/*`)

### 2.1 Scope

Functions that expose the domain model over HTTP, persisted in Supabase, and typed with `source/domain`. Each function:

- `source/serverless/functions` — API to store & retrieve domain concepts via Netlify Functions via REST endpoints
- Uses the `{abstraction}-{action}.ts` naming convention with singular-tense abstractions.
- Parses and validates JSON requests against domain types.
- Returns JSON responses with a consistent envelope and status codes.

### 2.2 Standard actions by abstraction

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

### 2.3 Handler pattern

| Item | Detail |
| ---- | ------ |
| Exports | Each file default-exports the Netlify `handler = withNetlify(handle)` from `source/serverless/lib/netlify.ts`; keep per-abstraction mapping helpers in `*-mapping.ts` for DB/domain conversion. |
| Signature | `handle: (req: ApiRequest<RequestBody, Query>) => ApiResponse<ResponseBody> \| Promise<ApiResponse<ResponseBody>>` |
| Request | `ApiRequest` carries `method`, parsed `body`, `query`, `headers`, and raw Netlify event. |
| Response | `ApiResponse` carries `statusCode`, optional `headers`, and JSON-serializable `body`. |
| Imports | Only import domain types from `source/domain`; do not redefine domain abstractions locally. |

### 2.4 Validation and errors

| Area         | Behavior |
| ------------ | -------- |
| Methods      | Reject unsupported HTTP methods with `HttpCodes.methodNotAllowed` (405). |
| Parsing      | Invalid/missing JSON -> `HttpCodes.badRequest` (400). |
| Semantics    | Shape/domain validation failures -> `HttpCodes.unprocessableEntity` (422). |
| Persistence  | Supabase/unknown failures -> `HttpCodes.internalError` (500); do not leak stacks. |
| Responses    | Always JSON; success `{ data: ... }`; failure `{ error, details? }`. |
| Immutability | Use `append` actions for append-only resources (e.g., job logs); avoid in-place mutation where required. |
