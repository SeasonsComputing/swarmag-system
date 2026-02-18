# swarmAg System – Domain

This document defines the foundational abstractions, contracts, and APIs of the `swarmAg System`. The domain model captures the solution space expressed as classes, types, interfaces, associations, and APIs specified using TypeScript.

## 1. Solution Space

### 1.1 Service

A Service is a listed product representing work we sell, identified by an SKU. Services belong to a category (for example, aerial or ground), have a description, and define the kinds of assets required to execute the work (equipment, tools, supplies).

Many services require the use of regulated chemicals. The acquisition, storage, mixing, and application of chemicals must be managed to maintain licensing and regulatory compliance.

A Service Category represents a class of service we offer (e.g., aerial-drone-service, ground-machinery-service). Each Service Category has one or more Workflows suitable for performing services within that category.

### 1.2 Services by Category

#### 1.2.1 Aerial Drone Service

| Description                    | Equipment | SKU        |
| ------------------------------ | --------- | ---------- |
| Pesticide, Herbicide           | XAG P150  | A-CHEM-01  |
| Fertilizer                     | XAG P150  | A-CHEM-02  |
| Seed                           | XAG P150  | A-SEED-01  |
| Pond Weeds & Algae             | DJI T30   | A-CHEM-03  |
| Pond Feeding                   | DJI T30   | A-FEED-01  |
| Precision Mapping              | DJI P4    | A-MAP-01   |
| Mesquite Herbicide             | XAG P150  | A-CHEM-04  |
| Commercial Greenhouse Painting | DJI T30   | A-PAINT-01 |

#### 1.2.2 Ground Machinery Services

| Description                        | Equipment            | SKU        |
| ---------------------------------- | -------------------- | ---------- |
| Mesquite, Hackberry, et al Removal | John Deere Skidsteer | G-MITI-01  |
| Fence-line Tree Trimming           | Bobcat Toolcat       | G-FENCE-01 |
| Rock Removal, Regrade              | Skidsteer, Toolcat   | G-MACH-01  |
| Brush Hogging                      | Skidsteer, Toolcat   | G-BRUSH-01 |

#### 1.2.3 Tools

| Tool                 | Description                                                                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sickle Shears        | Precise cutting of brush and small mesquite clusters at ground level.                                                                                   |
| Buncher Shears       | Precise cutting of medium to large mesquite at ground level aided by hydraulic arms.                                                                    |
| Telescoping Shears   | Precise cutting of high-reaching trees or brush, or those located on pond downslope.                                                                    |
| 6-way Dozer Blade    | Hydraulic attachment that offers six directions of movement to precisely grade, push, and spread materials for detailed earthmoving and finishing work. |
| Tree Saw             | Specialized, hydraulically-powered tool featuring a large circular blade designed for quickly and safely felling trees and clearing heavy brush.        |
| Chemical Applicators | Custom sponge/dauber systems ensure thorough target surface coverage with precise, controlled volumes of herbicide.                                     |

#### 1.2.4 Asset Types

| Description             |
| ----------------------- |
| Transport Truck         |
| Transport Trailer       |
| Skidsteer Vehicle       |
| Toolcat Vehicle         |
| Vehicle Tool Attachment |
| Mapping Drone           |
| Dispensing Drone        |
| Drone Spray Tank        |
| Drone Granular Hopper   |

### 1.2 Workflow & Tasks

A Workflow describes how work is generally performed. Examples of workflows include "Drone Chemical Preparation", "Mesquite Chemical Preparation", "Mesquite Mitigation Procedure", and "Drone Obstacle Preflight".

A Workflow is structured as a sequence of Tasks. Examples of tasks include "Packed the chemicals.", "Checked the drone's battery.", "Reviewed the weather forecast.", "Reviewed the drone's flight plan.".

Each Task in a Workflow is a simple checklist supporting the task. Each item in the checklist can be either a Note or a Question. Notes are static text used to inform or warn operations staff. Questions are expressed using a small set of fundamental response formats: yes/no, selection, datetime, quantity (real number). All Tasks and Answers may be annotated with one or more Notes. Notes may contain one or more Attachments. Attachments are mime-type specified, such as images, videos, or documents.

Workflows guide how work is assessed and inform how it is later planned and executed.

### 1.3 Job

A Job represents a work agreement with a customer and serves as the hub of the model. A Job is created first and anchors all related work artifacts.

### 1.4 Job Assessment, Job Plan, & Job Work Log

TODO: **review for clarity, no rewrite**

A Job Assessment evaluates the work to be completed on behalf of a customer. Assessments define the locations involved and gather the information required to determine scope, feasibility, and approach. Job Assessments scope the Job using Workflow definitions that direct the Job. A Job Assessment must exist before a Job Plan may be created.

We use multispectral mapping drones for both aerial and ground services. A Job Assessment may include one or more annotations, Notes, which in turn may include attachments which may include maps or images.

A Job Plan defines how a specific Job will be executed. Plans are created after assessment and translate intent into concrete, job-specific instruction. Job Plans are the primary means by which field crews are informed of the work to be performed and are prepared prior to execution to support guided, often offline operation in the field.

A Job Work Log memorializes the physical execution of a Job. Logs are append-only and record the Answers to the Questions with the Task checklist. Additionally, the Job Work Log records any metadata about what actually occurred, including telemetry, GPS coordinates, comments, time accrued, and any exceptions or deviations encountered. Logs may also capture notes about the job as a whole.

A Job has an Assessment, a Plan, and a collection of Log entries. Log entries are created during the execution of a Job, by a User, and are appended to the Job's Log. There are no circular foreign keys; Assessments, Plans, and Logs reference the Job.

### 1.5 Job Workflow & Job Work

TODO: **review for clarity, no rewrite**

Work is the physical execution of a Job. It produces the progress and knowledge captured by field crews during a job. Work is directed by a sequence of Workflows. Each Workflow, its Tasks and their associated checklist of Questions are a template used to assess and plan the job.

To facilitate the role a Workflow plays in orchestrating a Job, two new abstractions, Job Workflow and Job Work are introduced. Job has a collection of Job Workflows. Job Assessment, Job Plan, and Job Work each contain an association to their Job and therefore to the Job Workflows. Just as Tasks and Task checklist are sequenced, so too Job Workflows are sequenced.

Job Workflows are prepared prior to the Job Work. The Job Assessment phase includes selecting the Workflows to be used on a Job. As each job is different the Job Assessment may edit the workflows to capture the specialization. Creating, editing, and deleting Workflows are an administration authorization and so are read-only for Job Assessment and Job Plan. The Job Workflow is thus associated with a Workflow read-only basis and an optional Workflow modification -- which is a clone of the basis-workflow. The Job Plan phase may add additional basis Workflows and optionally modify them. The Job Plan may also modify Job Workflows that were modified during assessment. The assessment-modified Workflow then becomes the basis-workflow for a Job Workflow added by the Job Plan.

Starting Job Work involves transitioning the Job's status to `inprogress` and finalizing the workflow, essentially setting in stone the work to be done. As stated, Job Work is the process of executing a Job Workflow. A specialized UX within operations will walk a crew member through the workflow tasks, presenting the task checklist items as Questions and logging the Answers in the Job Work Log along with any metadata.

TODO: **should Job Workflows be assigned to a crew member for execution as part of the Job Plan? Essentially doling out the work to be done vs. each crew member stepping on each other's toes. My intuition is yes. I have not worked through what that means yet. Let's not let this impeded today's progress. We must consider how to assign workflows to crew members and how to manage conflicts that may arise at some point soon.**

## 2. Domain Model (`source/domain`)

TODO: **rewrite for clarity and content**

I want to restructure this to bifurcate the swarmAg domain model from the patterns used to codify the domain model:
  Domain Model: User, Customer, Workflow, Task, Job, ...
  Abstraction Patterns: abstractions, adapters, validators, protocols
  Association Patterns: Embedded as JSONB columns or 4th normal form using PK & FK columns
  
  Embedded array of abstractions are always arrays of type abstraction, and use Typescript Variadic Tuple Types + Optional Elements to declare their cardinality within the data-dictionary and generated abstraction types. 
  - [Abstraction] - 1 and only 1 
  - [Abstraction?] - 0 or 1 
  - [Abstraction, ...Abstraction[]] - 1 or more 
  - [Abstraction?, ...Abstraction[]] - 0 or more
  
  4NF includes: 
  - 1:1 FK on owner or parent side
  - 1:m FK on many side 
  - m:m FK junction table (I use the expression "join-table" though I think you may be correct in "junction table" as the technical term)

### 2.1 Scope

This section defines the core domain model of the system. It establishes the fundamental types, concepts, and associations that express domain truth and business intent.

The domain model is implemented as a TypeScript library under `source/domain`. It is the authoritative source of meaning for the system. The domain model is composed of `abstractions`, `adapters`, `validators`, and `protocols`.

| Domain         | Description                                                                                                |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| `abstractions` | Core domain types and interfaces representing business entities and their relationships                    |
| `adapters`     | Serialization logic converting between storage/transport representations and domain abstractions           |
| `validators`   | Validation logic ensuring data integrity at system boundaries (both ingress and egress)                    |
| `protocols`    | Partial and essential abstraction state definitions for boundary transmission (creation, updates, queries) |

All architectural, API, persistence, and user-interface concerns are derived from and constrained by this model. They consume these types rather than redefining or reshaping them.

`architecture-core.md` documents how the system is organized to support this domain model; it does not define the domain itself.

**Adapter naming convention:** Adapters use `Dictionary` (or `dict`) rather than `row` or `record` to represent serialized forms. Functions follow the pattern `to{Abstraction}(dict: Dictionary): Abstraction` and `from{Abstraction}(abstraction: Abstraction): Dictionary`. This emphasizes storage-agnostic serialization rather than database-specific terminology.

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
- Generic protocol shapes (`ListOptions`, `ListResult`, `DeleteResult`) live in `@core/api/api-contract.ts`.
- Shared validators (e.g., `isNonEmptyString` & `isIdArray`) live in `@domain/validators/helper-validator.ts`.

## 3. Data Dictionary

The following sections define the domain types and shape constraints from `@domain/abstractions`.

### 3.1 Core Standard (`@core-std`)

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

### 3.2 Common (`@domain/abstractions/common.ts`)

```text
Location (object)
  Fields: latitude, longitude, altitudeMeters?, line1?, line2?, city?, state?, postalCode?, country?, recordedAt?, accuracyMeters?, description?
  Notes: Geographic position plus optional address metadata

Attachment (object)
  Fields: id, filename, url, contentType, uploadedAt, uploadedById
  Notes: Uploaded artifact metadata

Note (object)
  Fields: id, createdAt, authorId?, content, visibility?(internal|shared),
          tags: [string?, ...string[]], attachments: [Attachment?, ...Attachment[]]
  Notes: Freeform note with optional visibility/taxonomy
```

### 3.3 Assets (`@domain/abstractions/asset.ts`)

```text
AssetType (object)
  Fields: id, label, active, createdAt, updatedAt, deletedAt?
  Notes: Reference type for categorizing assets
  Values: foundation/data-lists.md, Section 2. Asset Types

AssetStatus (enum)
  Values: active | maintenance | retired | reserved
  Notes: Lifecycle/availability state

Asset (object)
  Fields: id, label, description?, serialNumber?, type(AssetType.id), status(AssetStatus),
          notes: [Note?, ...Note[]], createdAt, updatedAt, deletedAt?
  Notes: Operational equipment/resource
```

### 3.4 Chemicals (`@domain/abstractions/chemical.ts`)

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

### 3.5 Customers (`@domain/abstractions/customer.ts`)

```text
Contact (object)
  Fields: id, customerId, name, email?, phone?, preferredChannel?(email|text|phone),
          notes: [Note?, ...Note[]], createdAt, updatedAt
  Notes: Customer-associated contact person

CustomerSite (object)
  Fields: id, customerId, label, location, acreage?, notes?
  Notes: Serviceable customer location

Customer (object)
  Fields: id, name, status(active|inactive|prospect), line1, line2?, city, state, postalCode,
          country, accountManagerId?, primaryContactId?, sites: [CustomerSite, ...CustomerSite[]],
          contacts: [Contact?, ...Contact[]], notes: [Note?, ...Note[]],
          createdAt, updatedAt, deletedAt?
  Notes: Customer account aggregate; contacts must be non-empty
```

### 3.6 Services (`@domain/abstractions/service.ts`)

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

### 3.7 Users (`@domain/abstractions/user.ts`)

```text
USER_ROLES (const tuple)
  Values: administrator | sales | operations
  Notes: Canonical role set

UserRole (union)
  Values: (typeof USER_ROLES)[number]
  Notes: Role type derived from tuple

User (object)
  Fields: id, displayName, primaryEmail, phoneNumber, avatarUrl?, roles?,
          status?(active|inactive), createdAt?, updatedAt?, deletedAt?
  Notes: System user identity and membership
```

### 3.8 Workflows (`@domain/abstractions/workflow.ts`)

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
  Fields: questionId, value, capturedAt, capturedById, notes: [Note?, ...Note[]]
  Notes: Captured response instance

Task (object)
  Fields: id, title, description?, checklist: [Question, ...Question[]]
  Notes: Atomic executable step

Workflow (object)
  Fields: id, name, description?, version, tags: [string?, ...string[]],
          tasks: [Task, ...Task[]], createdAt, updatedAt, deletedAt?
  Notes: Versioned execution template
```

### 3.9 Jobs (`@domain/abstractions/job.ts`)

```text
JobStatus (enum)
  Values: opened | assessed | planned | inprogress | completed | closed | cancelled
  Notes: Job lifecycle state

JobAssessment (object)
  Fields: id, jobId, assessorId, locations: [Location, ...Location[]],
          risks: [Note?, ...Note[]], notes: [Note?, ...Note[]],
          createdAt, updatedAt, deletedAt?
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
  Fields: id, jobId, scheduledStart, scheduledEnd?, notes: [Note?, ...Note[]],
          createdAt, updatedAt, deletedAt?
  Notes: Job-specific execution plan

JobLogType (enum)
  Values: status | checkpoint | note | telemetry | exception
  Notes: Execution log entry class
`
JobLogEntry (object)
  Fields: id, jobId, userId, answer: [Answer], metadata: [Dictionary]
  Notes: Append-only event record

Job (object)
  Fields: id, customerId, status, createdAt, updatedAt, deletedAt?
  Notes: Work agreement lifecycle anchor
```
