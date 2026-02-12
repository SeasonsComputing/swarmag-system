# swarmAg System – Domain

This document defines the foundational abstractions, contracts, and APIs of the `swarmAg System`. The domain model captures both the problem space and the solution space, expressed as classes, types, interfaces, associations, and APIs delivered through a TypeScript library.

## 1. Solution Space

### 1.1 Service

A Service is a listed product representing work we sell, identified by an SKU. Services belong to a category (for example, aerial or ground), have a description, and define the kinds of assets required to execute the work (machines, tools, supplies, and labor).

Many services require the use of regulated chemicals. The acquisition, storage, mixing, and application of chemicals must be managed to maintain licensing and regulatory compliance.

A Service Category represents a class of service we offer (e.g., aerial-drone-service, ground-machinery-service). Each Service Category has one or more Workflows suitable for performing services within that category.

### 1.2 Workflow & Tasks

A Workflow describes how work is generally performed. It may be composed of a graph of Tasks, where a Workflow is itself one kind of Task (composite). Examples include "Drone Chemical Prep", "Mesquite Chemical Preparation", "Mesquite Mitigation Procedure", and "Drone Obstacle Preflight".

Each Task in a Workflow is either a Note or a Question. Notes are static text used to inform or warn operations staff. Questions are expressed using a small set of fundamental response forms, including yes/no, selection, date/time, quantity (real number), and free-form comment. All workflow questions reduce to one of these forms, though answers may include supporting artifacts such as notes or attachments.

Workflows guide how work is assessed and inform how it is later planned and executed.

### 1.3 Job: Assessment, Plan, & Log

A Job represents a work agreement with a customer and serves as the hub of the model. A Job is created first and anchors all related work artifacts.

A Job Assessment evaluates the work to be completed on behalf of a customer. Assessments define the locations involved and gather the information required to determine scope, feasibility, and approach. A Job Assessment must exist before a Job Plan may be created.

We use multispectral mapping drones for both aerial and ground services. A Job Assessment may include one or more maps to inform planning and guide execution.

A Job Plan defines how a specific Job will be executed. Plans are created after assessment and translate intent into concrete, job-specific instruction. Job Plans are the primary means by which field crews are informed of the work to be performed and are prepared prior to execution to support guided, often offline operation in the field.

A Job Log memorializes the physical execution of a Job. Logs are append-only and record what actually occurred, including photos, GPS coordinates, comments, time accrued, and any exceptions or deviations encountered. Logs may also capture notes about the job as a whole.

A Job has an Assessment, a Plan, and one or more Logs. There are no circular foreign keys; Assessments, Plans, and Logs reference the Job.

## 2. Domain Model (`source/domain`)

### 2.1 Scope

This section defines the core domain model of the system. It establishes the fundamental types, concepts, and associations that express domain truth and business intent.

The domain model is implemented as a TypeScript library under `source/domain`, with shared primitives in `source/utilities`. It is the authoritative source of meaning for the system.

All architectural, API, persistence, and user-interface concerns are derived from and constrained by this model. They consume these types rather than redefining or reshaping them.

`architecture-core.md` documents how the system is organized to support this domain model; it does not define the domain itself.

### 2.2 Core abstractions that define the domain

These abstractions represent the primary concepts of the system and form the core of the domain model. They are expressed as TypeScript types under `source/domain` and define the vocabulary used throughout the system.

| Abstraction     | Description                                                         |
| --------------- | ------------------------------------------------------------------- |
| `Service`       | Offering provided to customers, defining the kind of work performed |
| `Asset`         | Equipment or resources used to perform services                     |
| `Chemical`      | Regulated materials applied as part of certain services             |
| `Workflow`      | Reusable template describing how work is generally performed        |
| `Job`           | Unit of work agreed to with a customer; lifecycle anchor            |
| `JobAssessment` | Evaluation of a job’s scope, locations, and requirements            |
| `JobPlan`       | Job-specific execution plan derived from a workflow                 |
| `JobLog`        | Append-only record of execution events and observations             |
| `Customer`      | Organization purchasing services                                    |

These abstractions describe **domain meaning**, not persistence, API shape, or user interface concerns.

### 2.3 Common abstractions shared within the model

The following abstractions are shared across multiple domain concepts and represent either pure value objects or embedded subordinate compositions. They do not have independent lifecycles.

| Abstraction  | Location      | Description                                                        |
| ------------ | ------------- | ------------------------------------------------------------------ |
| `Location`   | `common.ts`   | Geographic coordinates with optional address information           |
| `Note`       | `common.ts`   | Freeform text with author and timestamp                            |
| `Attachment` | `common.ts`   | Metadata describing an uploaded file or artifact                   |
| `User`       | `user.ts`     | Identity and role information for system users                     |
| `Question`   | `workflow.ts` | Prompt used to gather structured input                             |
| `Answer`     | `workflow.ts` | Response to a question, potentially including supporting artifacts |

These abstractions are **composed into** higher-level domain objects and are not referenced independently.

### 2.4 Supporting domain relationships and junctions

In addition to the core abstractions, the domain includes supporting structures that express relationships between concepts without embedding or ownership.

These structures are present in code to model associations explicitly and to preserve flexibility as the system evolves.

| Area      | Structures / Notes                                                            |
| --------- | ----------------------------------------------------------------------------- |
| Services  | Asset requirements expressed as associations between services and asset types |
| Assets    | Asset types defined independently and selected based on service requirements  |
| Workflows | Versioned workflows and task composition                                      |
| Planning  | Associations between plans and assigned users, assets, and chemicals          |
| Customers | Embedded subordinate data such as sites and contacts                          |

These structures exist to model **relationships**, not to redefine the core abstractions themselves.

### 2.5 Utility data types

The following utility types are used consistently across the domain model.

| Type   | Description                                    |
| ------ | ---------------------------------------------- |
| `ID`   | UUID v7 string identifier                      |
| `When` | ISO 8601 UTC timestamp represented as a string |

These types provide consistency and clarity without imposing storage or transport constraints.

### 2.6 Rules

- Language: TypeScript (strict mode) checked via Deno (`deno task check`).
- Use the configured import aliases from `deno.json`: `@domain/` for domain modules, and `@utils`/`@utils/` for core utilities.
- Types must be JSON-serializable.
- No runtime dependencies beyond the UUID helper (or a tiny internal implementation).
- This package is the **single source of truth** for domain types.
- All other code (ux, edge functions) must import from `source/domain`.
- Asset types are modeled as data records (`AssetType`) and referenced by `Asset.type` and `Service.requiredAssetTypes`; keep the canonical list in `documentation/foundation/data-lists.md`.
- Attachments carry a `kind` (`photo` | `video` | `map` | `document`).
- `Customer.contacts` is non-empty and `primaryContactId` lives on `Customer`.
- Locations store coordinates/addresses without a `source` field.
- JobAssessments must capture one or more `Location` entries (`locations` tuple) to support noncontiguous ranch assessments.
- Soft deletes: all abstractions expose `deletedAt?: When`; callers treat undefined/null as active, filter queries to `deleted_at IS NULL`, and keep partial unique indexes on active rows so identifiers can be reused after delete.
- ID strategy: UUID v7 for PK/FK to avoid an ID service, allow offline/preassigned keys, and let related rows be inserted together; mitigations include using the native `uuid` type, a v7 generator, avoiding redundant indexes, preferring composite keys for pure join tables, and routine maintenance (vacuum/reindex) on heavy-write tables.

### 2.7 Roles & attribution

- User memberships are constrained to `USER_ROLES` (`administrator`, `sales`, `operations`) defined in `source/domain/abstractions/user.ts`.
- `User.roles` is an array; a user may hold multiple memberships simultaneously.
- Role semantics describe authorization intent only; enforcement occurs outside the domain layer.

### 2.8 Domain layer file organization

The domain layer follows an abstraction-per-file pattern across three subdirectories:

| Layer           | Abstraction file              | Shared/helper file     |
| --------------- | ----------------------------- | ---------------------- |
| `abstractions/` | `{abstraction}.ts`            | `common.ts`            |
| `validators/`   | `{abstraction}-validators.ts` | `helper-validators.ts` |
| `protocol/`     | `{abstraction}-protocol.ts`   | `helpers-protocol.ts`  |

**Placement rules:**

- Abstraction-specific types belong with their owning abstraction (e.g., `User` in `user.ts`).
- Pure value objects and shared subordinate types (Location, Note, Attachment) live in `common.ts`.
- Concept-owning types live with their owner (e.g., Question and Answer in `workflow.ts`).
- Generic protocol shapes (ListOptions, ListResult, DeleteResult) live in `helpers-protocol.ts`.
- Shared validators (e.g., `isNonEmptyString`) live in `helper-validators.ts`.

### 2.9 API surface summary

The domain model informs, but does not define, the API surface. The following actions reflect current domain intent and lifecycle sequencing.

| Abstraction    | Actions                                                                                  | Notes                                              |
| -------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Service        | `service-create`, `service-get`, `service-list`, `service-update`, `service-delete`      | CRUD for catalogued offerings                      |
| Asset          | `asset-create`, `asset-get`, `asset-list`, `asset-update`, `asset-delete`                | Manage equipment and resources                     |
| Chemical       | `chemical-create`, `chemical-get`, `chemical-list`, `chemical-update`, `chemical-delete` | Track regulated materials                          |
| Workflow       | `workflow-create`, `workflow-get`, `workflow-list`, `workflow-update`, `workflow-delete` | Versioned workflow templates                       |
| Job            | `job-create`, `job-get`, `job-list`, `job-update`                                        | Job agreement created first                        |
| Job Assessment | `job-assessment-create`, `job-assessment-get`, `job-assessment-update`                   | Assessment precedes planning                       |
| Job Plan       | `job-plan-create`, `job-plan-get`, `job-plan-update`                                     | Plan instantiated from workflow prior to execution |
| Job Log        | `job-log-append`, `job-log-list`                                                         | Append-only execution records                      |
| User           | `user-create`, `user-get`, `user-list`, `user-update`, `user-delete`                     | Operator and staff identities                      |
| Customer       | `customer-create`, `customer-get`, `customer-list`, `customer-update`, `customer-delete` | Customer records                                   |
| Optional       | `*-search`                                                                               | Richer filtering when required                     |

API handler conventions, validation rules, and transport concerns are documented in `documentation/foundation/architecture-back.md`.
