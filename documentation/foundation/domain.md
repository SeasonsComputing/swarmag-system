# swarmAg System – Domain

This document defines the foundational abstractions, contracts, and APIs of the `swarmAg System`. The domain model captures the solution space expressed as classes, types, interfaces, associations, and APIs specified using TypeScript.

## 1. Solution Space

### 1.1 Service

A Service is a listed product representing work we sell, identified by an SKU. Services belong to a category (for example, aerial or ground), have a description, and define the kinds of assets required to execute the work (machines, tools, supplies, and labor).

Many services require the use of regulated chemicals. The acquisition, storage, mixing, and application of chemicals must be managed to maintain licensing and regulatory compliance.

A Service Category represents a class of service we offer (e.g., aerial-drone-service, ground-machinery-service). Each Service Category has one or more Workflows suitable for performing services within that category.

### 1.2 Workflow & Tasks

A Workflow describes how work is generally performed. It may be composed of a graph of Tasks, where a Workflow is itself one kind of Task (composite). Examples include "Drone Chemical Preparation", "Mesquite Chemical Preparation", "Mesquite Mitigation Procedure", and "Drone Obstacle Preflight".

Each Task in a Workflow is either a Note or a Question. Notes are static text used to inform or warn operations staff. Questions are expressed using a small set of fundamental response forms, including yes/no, selection, date/time, quantity (real number), and free-form comment. All workflow questions reduce to one of these forms, though answers may include supporting artifacts captured as Notes. Notes may contain or Attachments. Attachments are mime-type specified, such as images, videos, or documents.

Workflows guide how work is assessed and inform how it is later planned and executed.

### 1.3 Job: Assessment, Plan, & Log

A Job represents a work agreement with a customer and serves as the hub of the model. A Job is created first and anchors all related work artifacts.

A Job Assessment evaluates the work to be completed on behalf of a customer. Assessments define the locations involved and gather the information required to determine scope, feasibility, and approach. A Job Assessment must exist before a Job Plan may be created.

We use multispectral mapping drones for both aerial and ground services. A Job Assessment may include one or more maps to inform planning and guide execution.

A Job Plan defines how a specific Job will be executed. Plans are created after assessment and translate intent into concrete, job-specific instruction. Job Plans are the primary means by which field crews are informed of the work to be performed and are prepared prior to execution to support guided, often offline operation in the field.

A Job Log memorializes the physical execution of a Job. Logs are append-only and record what actually occurred, including photos, GPS coordinates, comments, time accrued, and any exceptions or deviations encountered. Logs may also capture notes about the job as a whole.

A Job has an Assessment, a Plan, and a collection of Log entries. Log entries are created during the execution of a Job, by a User, and are appended to the Job's Log. There are no circular foreign keys; Assessments, Plans, and Logs reference the Job.

## 2. Domain Model (`source/domain`)

### 2.1 Scope

This section defines the core domain model of the system. It establishes the fundamental types, concepts, and associations that express domain truth and business intent.

The domain model is implemented as a TypeScript library under `source/domain`. It is the authoritative source of meaning for the system. The domain model is composed of `abstractions`, `adapters`, `validators`, and `protocols`.

| Domain         | Description                                                                                           |
| -------------- | ----------------------------------------------------------------------------------------------------- |
| `abstractions` | Core domain types and interfaces representing business entities and their relationships               |
| `adapters`     | Serialization logic converting between storage/transport representations and domain abstractions      |
| `validators`   | Validation logic ensuring data integrity at system boundaries (both ingress and egress)               |
| `protocols`    | Partial and essential abstraction state definitions for boundary transmission (creation, updates, queries) |

All architectural, API, persistence, and user-interface concerns are derived from and constrained by this model. They consume these types rather than redefining or reshaping them.

`architecture-core.md` documents how the system is organized to support this domain model; it does not define the domain itself.

**Adapter naming convention:** Adapters use `Dictionary` (or `dict`) rather than `row` or `record` to represent serialized forms. Functions follow the pattern `to{Abstraction}(dict: Dictionary)` and `from{Abstraction}(abstraction: Abstraction): Dictionary`. This emphasizes storage-agnostic serialization rather than database-specific terminology.

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

The following abstractions are shared across multiple domain concepts and represent either pure value objects or embedded subordinate compositions. They do not have independent life-cycles.

| Abstraction  | Module        | Description                                                        |
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

### 2.5 Standard data types

The following standard data types are used consistently across the domain model.

| Type   | Description                                    |
| ------ | ---------------------------------------------- |
| `ID`   | UUID v7 string identifier                      |
| `When` | ISO 8601 UTC timestamp represented as a string |

These types provide consistency and clarity without imposing storage or transport constraints.

### 2.6 Rules

- Language: TypeScript (strict mode) checked via Deno (`deno task check`).
- Types must be JSON-serializable.
- No runtime dependencies beyond `@core-std`
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

- User memberships are constrained to `USER_ROLES` (`administrator`, `sales`, `operations`) defined in `@domain/abstraction/user.ts`.
- `User.roles` is an array; a user may hold multiple memberships simultaneously.
- Role semantics describe authorization intent only; enforcement occurs outside the domain layer.

### 2.8 Domain layer file organization

The domain layer follows an abstraction-per-file pattern across three subdirectories:

| Layer           | Abstraction file             |
| --------------- | ---------------------------- |
| `abstractions/` | `{abstraction}.ts`           |
| `adapters/`     | `{abstraction}-adapter.ts`   |
| `protocols/`    | `{abstraction}-protocol.ts`  |
| `validators/`   | `{abstraction}-validator.ts` |

**Placement rules:**

- Abstraction-specific types belong with their owning abstraction (e.g., `User` in `user.ts`).
- Pure value objects and shared subordinate types (Location, Note, Attachment) live in `common.ts`.
- Concept-owning types live with their owner (e.g., Question and Answer in `workflow.ts`).
- Generic protocol shapes (`ListOptions`, `ListResult`, `DeleteResult`) live in `@core/api/api-client.ts`.
- Shared validators (e.g., `isNonEmptyString` & `isIdArray`) live in `@domain/validators/helper-validator.ts`.

### 2.9 Data Dictionary

The following sections define the domain types and shape constraints from `@domain/abstractions`.

#### 2.9.1 Core (`@core-std`)

```text
ID (alias)
  Shape: UUID v7 string
  Notes: Primary/foreign identifier type

When (alias)
  Shape: ISO 8601 UTC string
  Notes: Timestamp type

Dictionary (alias)
  Shape: JSON-like key/value map
  Notes: Flexible structured data container
```

#### 2.9.2 Common (`@domain/abstractions/common.ts`)

```text
Location (object)
  Fields: latitude, longitude, altitudeMeters?, line1?, line2?, city?, state?, postalCode?, country?, recordedAt?, accuracyMeters?, description?
  Notes: Geographic position plus optional address metadata

Attachment (object)
  Fields: id, filename, url, contentType, uploadedAt, uploadedById
  Notes: Uploaded artifact metadata

Note (object)
  Fields: id, createdAt, authorId?, content, visibility?(internal|shared), tags?, images: Attachment[]
  Notes: Freeform note with optional visibility/taxonomy
```

#### 2.9.3 Assets (`@domain/abstractions/asset.ts`)

```text
AssetType (object)
  Fields: id, label, active, createdAt, updatedAt, deletedAt?
  Notes: Reference type for categorizing assets
  Values: foundation/data-lists.md, Section 2. Asset Types

AssetStatus (enum)
  Values: active | maintenance | retired | reserved
  Notes: Lifecycle/availability state

Asset (object)
  Fields: id, label, description?, serialNumber?, type(AssetType.id), status(AssetStatus), attachments?, createdAt, updatedAt, deletedAt?
  Notes: Operational equipment/resource
```

#### 2.9.4 Chemicals (`@domain/abstractions/chemical.ts`)

```text
ChemicalUsage (enum)
  Values: herbicide | pesticide | fertilizer | fungicide | adjuvant
  Notes: Domain usage classification

ChemicalLabel (object)
  Fields: url, description?
  Notes: Label/document pointer

Chemical (object)
  Fields: id, name, epaNumber?, usage, signalWord?(danger|warning|caution), restrictedUse, reEntryIntervalHours?, storageLocation?, sdsUrl?, labels?, attachments?, notes?, createdAt, updatedAt, deletedAt?
  Notes: Regulated material record
```

#### 2.9.5 Customers (`@domain/abstractions/customer.ts`)

```text
Contact (object)
  Fields: id, customerId, name, email?, phone?, preferredChannel?(email|sms|phone), notes?, createdAt, updatedAt
  Notes: Customer-associated contact person

CustomerSite (object)
  Fields: id, customerId, label, location, acreage?, notes?
  Notes: Serviceable customer location

Customer (object)
  Fields: id, name, status(active|inactive|prospect), line1, line2?, city, state, postalCode, country, accountManagerId?, primaryContactId?, sites: CustomerSite[], contacts: [Contact, ...Contact[]], notes?, createdAt, updatedAt, deletedAt?
  Notes: Customer account aggregate; contacts must be non-empty
```

#### 2.9.6 Services (`@domain/abstractions/service.ts`)

```text
ServiceCategory (enum)
  Values: aerial-drone-services | ground-machinery-services
  Notes: Service family classification

Service (object)
  Fields: id, name, sku, description?, category, notes?, createdAt, updatedAt, deletedAt?
  Notes: Sellable operational offering

ServiceRequiredAssetType (object)
  Fields: serviceId, assetTypeId, deletedAt?
  Notes: Association between services and required asset types
```

#### 2.9.7 Users (`@domain/abstractions/user.ts`)

```text
USER_ROLES (const tuple)
  Values: administrator | sales | operations
  Notes: Canonical role set

UserRole (union)
  Values: (typeof USER_ROLES)[number]
  Notes: Role type derived from tuple

User (object)
  Fields: id, displayName, primaryEmail, phoneNumber, avatarUrl?, roles?, status?(active|inactive), createdAt?, updatedAt?, deletedAt?
  Notes: System user identity and membership
```

#### 2.9.8 Workflows (`@domain/abstractions/workflow.ts`)

```text
QuestionType (enum)
  Values: text | number | boolean | single-select | multi-select
  Notes: Supported question input modes

QuestionOption (object)
  Fields: value, label?, requiresNote?
  Notes: Selectable option metadata

Question (object)
  Fields: id, prompt, type, helpText?, required?, options?
  Notes: Workflow checklist prompt

AnswerValue (union)
  Values: string | number | boolean | string[]
  Notes: Permitted answer value payloads

Answer (object)
  Fields: questionId, value, capturedAt, capturedById, note?
  Notes: Captured response instance

WorkflowStep (object)
  Fields: id, title, description?, checklist: Question[], requiresLocationCapture?, requiresPhoto?, notes?
  Notes: Atomic executable step

Workflow (object)
  Fields: id, serviceId, name, description?, version, effectiveFrom, steps, locationsRequired?, createdAt, updatedAt, deletedAt?
  Notes: Versioned execution template
```

#### 2.9.9 Jobs (`@domain/abstractions/job.ts`)

```text
JobStatus (enum)
  Values: opened | assessed | planned | inprogress | completed | closed | cancelled
  Notes: Job lifecycle state

JobAssessment (object)
  Fields: id, jobId, assessorId, locations: [Location, ...Location[]], questions: Answer[], risks?, notes?, attachments?, createdAt, updatedAt, deletedAt?
  Notes: Pre-planning assessment; requires one or more locations

JobPlanAssignment (object)
  Fields: planId, userId, role, notes?, deletedAt?
  Notes: Assignment of user to plan role

JobPlanChemical (object)
  Fields: planId, chemicalId, amount, unit(gallon|liter|pound|kilogram), targetArea?, targetAreaUnit?(acre|hectare), deletedAt?
  Notes: Planned chemical usage

JobPlanAsset (object)
  Fields: planId, assetId, deletedAt?
  Notes: Asset allocated to a plan

JobPlan (object)
  Fields: id, jobId, workflowId, scheduledStart, scheduledEnd?, targetLocations: Location[], notes?, createdAt, updatedAt, deletedAt?
  Notes: Job-specific execution plan

JobLogType (enum)
  Values: status | checkpoint | note | telemetry | exception
  Notes: Execution log entry class

JobLogPayload (alias)
  Shape: Dictionary
  Notes: Flexible structured metadata for log entries

JobLogEntry (object)
  Fields: id, jobId, type, message, occurredAt, createdAt, createdById, location?, attachments?, payload?
  Notes: Append-only event record

Job (object)
  Fields: id, customerId, serviceId, status, createdAt, updatedAt, deletedAt?
  Notes: Work agreement lifecycle anchor
```
