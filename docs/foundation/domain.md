# swarmAg System – Domain

This document defines the foundational abstractions, contracts, and APIs of the `swarmAg System`. The domain model captures both the problem space and the solution space, expressed as classes, types, interfaces, associations, and APIs delivered through a TypeScript library.

## 1. Solution Space

### 1.1 Service

Service is a listed-product that represents something we sell with an SKU. Services are part of a category (aerial, ground); have a description; an inventory of assets required (machines, tools, supplies, workers).

Many services require the use of Regulated Chemicals. We must manage the acquisition, storage, mixing, and application of chemicals to maintain our license.

Service Category is type of service we offer (aerial-drone-service, ground-machinery-service). A Service Category has one or more Workflows suitable to the category.

### 1.2 Workflow & Tasks

Workflow may be composed of a graph of Tasks of which a Workflow is one kind (Composite). For example "Drone Chemical Prep", "Mesquite Chemical Prepare", "Mesquite Mitigation Procedure", "Drone Obstacle Preflight". Each Task in a Workflow is either a Note or a Question. Note is static text used to inform and warn Operations. Each Question is constrained as yes-no, one-of, date, time, quantity (real number), or comment. A Workflow informs a Job Assessment.

### 1.3 Job: Assessment, Plan, & Log

Job is the work agreement/contract and the hub of the model. It is created first.

A Job Assessment evaluates the work to be completed on-behalf of a Customer. Job Assessments define the location(s), price estimate, service(s) (see Service), schedule start, and duration estimate. Once a Job Assessment has been agreed-to (signed obligation) then a Job Plan is created for the Job.

We use sophisticated multispectral mapping drones for aerial and ground services. A Job Assessment will contain 1 more of these maps to inform the Job Plan and direct the Job Log.

Job Plan defines the execution for a Job. Job Plans are the primary means to inform the job crew of work to be completed. The Job Plan lists the members of the crew to complete the work. Job Plans detail the physical assets required. Job Plans have a schedule divided into phases (preparation, setup, operations, clean-up, complete, retrospective). Job Phases are composed of one or more Workflows. A Workflow may not span phases to simplify the system. A Job Plan can be structured (phases derived from workflows) or free-form (one-off built by hand).

Job Log memorializes the physical work of executing a Job Plan. Logs are append-only. The Job Log follows the Job Plan sequentially, capturing photos, GPS coordinates, comments, records actual time accrued and any exceptions or changes made in the field. The Job Log saves any issues or notes about the job _in general_.

Job has an Assessment and Plan and many Logs. There are no circular foreign keys; Assessment, Plan, and Logs point to Job.

## 2. Domain Model (`source/domain`)

### 2.1 Scope

Define the TypeScript domain library described in `architecture.md`, limited to types and associations under `source/domain` plus shared primitives in `source/utils`. All other concerns (API, persistence, UI) consume these types rather than re-declaring them.

### 2.2 Core abstractions that define the solution space

| Abstraction     | Description                                 |
| --------------- | ------------------------------------------- |
| `Service`       | Offering provided to customers              |
| `Asset`         | Equipment/resources used in operations      |
| `Chemical`      | Materials applied within services           |
| `Workflow`      | Sequenced steps for delivering a service    |
| `JobAssessment` | Initial evaluation of a prospective job     |
| `JobPlan`       | Planned execution details for a job         |
| `JobLog`        | Append-only record of job events and states |
| `Customer`      | Organization purchasing services            |
| `Contact`       | Individual associated with a customer       |

### 2.3 Common abstractions shared within the model

| Abstraction  | Location      | Description                                             |
| ------------ | ------------- | ------------------------------------------------------- |
| `Location`   | `common.ts`   | Coordinate plus optional address                        |
| `Note`       | `common.ts`   | Freeform text with author/time                          |
| `Attachment` | `common.ts`   | File reference metadata and uploader                    |
| `User`       | `user.ts`     | Identity/profile with role memberships and contact info |
| `Question`   | `workflow.ts` | Prompt used in assessments/forms                        |
| `Answer`     | `workflow.ts` | Response to a question                                  |

### 2.4 Supporting structures present in code (refer to type definitions for details)

| Area      | Structures / Notes                                        |
| --------- | --------------------------------------------------------- |
| Services  | `sku`; `requiredAssetTypes: ID[]` (links to AssetType)    |
| Assets    | `AssetType` (`id`, `name`; lifecycle aligned to Services) |
| Workflows | `WorkflowStep`, `WorkflowVersion`                         |
| Jobs      | `JobAssignment`, `JobChemicalPlan`                        |
| Customers | `CustomerSite`                                            |

### 2.5 Utility data types

| Type   | Description                      |
| ------ | -------------------------------- |
| `ID`   | UUID v7 string identifier        |
| `When` | ISO 8601 UTC timestamp as string |

### 2.6 Rules

- Language: TypeScript (strict mode) checked via Deno (`deno task check`).
- Use the configured import aliases from `deno.json`: `@domain/*` for domain modules, `@utils/*` for core utilities.
- Types must be JSON-serializable.
- No runtime dependencies beyond the UUID helper (or a tiny internal implementation).
- This package is the **single source of truth** for domain types.
- All other code (apps, edge functions) must import from `source/domain`.
- Asset types are modeled as data records (`AssetType`) and referenced by `Asset.type` and `Service.requiredAssetTypes`; keep the canonical list in `docs/foundation/data-lists.md`.
- Attachments carry a `kind` (`photo` | `video` | `map` | `document`).
- `Customer.contacts` is non-empty and `primaryContactId` lives on `Customer`.
- Locations store coordinates/addresses without a `source` field.
- JobAssessments must capture one or more `Location` entries (`locations` tuple) to support noncontiguous ranch assessments.
- Soft deletes: all abstractions expose `deletedAt?: When`; callers treat undefined/null as active, filter queries to `deleted_at IS NULL`, and keep partial unique indexes on active rows so identifiers can be reused after delete.
- ID strategy: UUID v7 for PK/FK to avoid an ID service, allow offline/preassigned keys, and let related rows be inserted together; mitigations include using the native `uuid` type, a v7 generator, avoiding redundant indexes, preferring composite keys for pure join tables, and routine maintenance (vacuum/reindex) on heavy-write tables.

### 2.7 Roles & attribution

- User memberships are constrained to `USER_ROLES` (`administrator`, `sales`, `operations`) defined in `source/domain/abstractions/user.ts`; `User.roles` is an array so a user may hold multiple memberships.

### 2.8 Domain layer file organization

The domain layer follows an abstraction-per-file pattern across three subdirectories:

| Layer           | Abstraction file              | Shared/helper file     |
| --------------- | ----------------------------- | ---------------------- |
| `abstractions/` | `{abstraction}.ts`            | `common.ts`            |
| `validators/`   | `{abstraction}-validators.ts` | `helper-validators.ts` |
| `protocol/`     | `{abstraction}-protocol.ts`   | `helpers-protocol.ts`  |

**Placement rules:**

- Abstraction-specific types belong in abstraction files (e.g., `User` in `user.ts`), not `common.ts`.
- Truly shared types (Location, Note, Attachment) stay in `common.ts`.
- Concept-owning types live with their owner (Question, Answer in `workflow.ts`).
- Generic protocol shapes (ListOptions, ListResult, DeleteResult) live in `helpers-protocol.ts`.
- Shared validators (isNonEmptyString) live in `helper-validators.ts`.

### 2.9 API surface summary

| Abstraction       | Actions                                                                                  | Notes                                                                         |
| ----------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Service           | `service-create`, `service-get`, `service-list`, `service-update`, `service-delete`      | CRUD for catalogued offerings                                                 |
| Asset             | `asset-create`, `asset-get`, `asset-list`, `asset-update`, `asset-delete`                | Manage fleet/equipment                                                        |
| Chemical          | `chemical-create`, `chemical-get`, `chemical-list`, `chemical-update`, `chemical-delete` | Track regulated materials                                                     |
| Workflow          | `workflow-create`, `workflow-get`, `workflow-list`, `workflow-update`, `workflow-delete` | Versioned service playbooks                                                   |
| Job (assess/plan) | `job-create`, `job-get`, `job-list`, `job-update`                                        | `job-create` creates the Job agreement; assessment/plan are follow-on actions |
| Job (logs)        | `job-log-append`, `job-log-list`                                                         | Append-only logs; paginated reads                                             |
| User              | `user-create`, `user-get`, `user-list`, `user-update`, `user-delete`                     | Profiles/roles for operators and customers                                    |
| Customer          | `customer-create`, `customer-get`, `customer-list`, `customer-update`, `customer-delete` | Customer records                                                              |
| Contact           | `contact-create`, `contact-get`, `contact-list`, `contact-update`, `contact-delete`      | People tied to customers                                                      |
| Optional          | `*-search`                                                                               | Richer filtering when needed                                                  |

API handler conventions and validation rules live in `docs/foundation/architecture.md`.
