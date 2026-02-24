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

### 1.3 Workflow & Tasks

A Workflow describes how work is generally performed. Examples of workflows include "Drone Chemical Preparation", "Mesquite Chemical Preparation", "Mesquite Mitigation Procedure", and "Drone Obstacle Preflight".

A Workflow is structured as a sequence of Tasks. Examples of tasks include "Packed the chemicals.", "Checked the drone's battery.", "Reviewed the weather forecast.", "Reviewed the drone's flight plan.".

Each Task in a Workflow is a simple checklist supporting the task. Each item in the checklist can be either a Note or a Question. Notes are static text used to inform or warn operations staff. Questions are expressed using a small set of fundamental response formats: yes/no, selection, datetime, quantity (real number). All Tasks and Answers may be annotated with one or more Notes. Notes may contain one or more Attachments. Attachments are mime-type specified, such as images, videos, or documents.

Workflows guide how work is assessed and inform how it is later planned and executed.

### 1.4 Job

A Job represents a work agreement with a customer and serves as the hub of the model. A Job is created first and anchors all related work artifacts.

### 1.5 Job Assessment, Job Plan, & Job Work Log

A Job Assessment evaluates the work to be completed on behalf of a customer. Assessments define the locations involved and gather the information required to determine scope, feasibility, and approach. Job Assessments scope the Job using Workflow definitions that direct the Job. A Job Assessment must exist before a Job Plan may be created.

We use multispectral mapping drones for both aerial and ground services. A Job Assessment may include one or more annotations, Notes, which in turn may include attachments which may include maps or images.

A Job Plan defines how a specific Job will be executed. Plans are created after assessment and translate intent into concrete, job-specific instruction. Job Plans are the primary means by which field crews are informed of the work to be performed and are prepared prior to execution to support guided field operation.

A Job Work Log memorializes the physical execution of a Job. Logs are append-only and record the Answers to the Questions within the Task checklist. Additionally, the Job Work Log records any metadata about what actually occurred, including telemetry, GPS coordinates, comments, time accrued, and any exceptions or deviations encountered. Logs may also capture notes about the job as a whole.

A Job has an Assessment, a Plan, and a collection of Log entries. Log entries are created during the execution of a Job, by a User, and are appended to the Job's Log. There are no circular foreign keys; Assessments, Plans, and Logs reference the Job.

### 1.6 Job Workflow & Job Work

Work is the physical execution of a Job. It produces the progress and knowledge captured by field crews during a job. Work is directed by a sequence of Workflows. Each Workflow, its Tasks and their associated checklist of Questions are a template used to assess and plan the job.

To facilitate the role a Workflow plays in orchestrating a Job, two abstractions are introduced: Job Workflow and Job Work. A Job has a collection of Job Workflows. Job Assessment, Job Plan, and Job Work each contain an association to their Job and therefore to the Job Workflows. Just as Tasks and Task checklists are sequenced, so too Job Workflows are sequenced.

Job Workflows are prepared prior to Job Work. The Job Assessment phase includes selecting the Workflows to be used on a Job. As each job is different, the Job Assessment may edit the workflows to capture the specialization. Creating, editing, and deleting Workflows are an administration authorization and so are read-only for Job Assessment and Job Plan. A Job Workflow is therefore associated with a basis Workflow (read-only reference) and an optional modified Workflow — which is always a clone of the basis Workflow. The Job Plan phase may add additional basis Workflows and optionally modify them. The Job Plan may also further modify Job Workflows that were already modified during assessment; in that case the assessment-modified Workflow becomes the basis for the Job Plan's modification.

Starting Job Work involves transitioning the Job's status to `executing`. At that point the set of Workflows to be executed is finalized: Job Work holds an ordered collection of resolved Workflow IDs — the basis Workflow where no modification exists, or the modified Workflow where one does. This is the execution manifest. Job Work is then the process of executing these Workflows in sequence. A specialized UX within the operations application walks a crew member through the workflow tasks, presenting the task checklist items as Questions and logging the Answers as Job Work Log entries.

TODO: **Should Job Workflows be assigned to a crew member for execution as part of the Job Plan? Essentially doling out the work to be done vs. each crew member stepping on each other's toes. My intuition is yes. I have not worked through what that means yet. Let's not let this impede today's progress. We must consider how to assign workflows to crew members and how to manage conflicts that may arise at some point soon.**

## 2. Domain Model (`source/domain`)

The domain model has two distinct concerns: the **swarmAg domain** (the business abstractions — Service, Customer, Workflow, Job, etc.) and the **patterns used to codify it** (how those abstractions are structured, associated, and serialized in TypeScript and PostgreSQL).

### 2.1 Domain Abstractions

The swarmAg domain is expressed as TypeScript types under `source/domain/abstractions/`. These types are the single source of truth for domain meaning. All other code — API clients, edge functions, UX applications — consumes these types and does not redefine them.

### 2.2 Abstraction Patterns

The domain layer is organized into four sub-layers:

| Layer           | Description                                                                                                |
| --------------- | ---------------------------------------------------------------------------------------------------------- |
| `abstractions/` | Core domain types and interfaces representing business entities and their relationships                    |
| `adapters/`     | Serialization logic converting between storage/transport representations and domain abstractions           |
| `protocols/`    | Partial and essential abstraction state definitions for boundary transmission (creation, updates, queries) |
| `schema/`       | Generated canonical SQL schema (`schema.sql`); authoritative current-state, derived from domain            |
| `validators/`   | Validation logic ensuring data integrity at system boundaries (both ingress and egress)                    |

### 2.3 Association Patterns

Associations between abstractions follow two patterns.

#### 2.3.1 Embedded (JSONB columns)

Subordinate abstractions with no independent lifecycle are embedded directly. Embedded abstractions are always represented as typed TypeScript arrays, regardless of cardinality. The corresponding RDBMS column type is JSONB. Cardinality is expressed in TypeScript using Variadic Tuple Types:

| Notation                           | Cardinality |
| ---------------------------------- | ----------- |
| `[Abstraction]`                    | exactly 1   |
| `[Abstraction?]`                   | 0 or 1      |
| `[Abstraction, ...Abstraction[]]`  | 1 or more   |
| `[Abstraction?, ...Abstraction[]]` | 0 or more   |

#### 2.3.2 4th Normal Form (FK columns)

Independent abstractions with their own lifecycle are associated via foreign keys:

| Relationship | Pattern                        |
| ------------ | ------------------------------ |
| 1:1          | FK on the owner or parent side |
| 1:m          | FK on the many side            |
| m:m          | FK junction table              |

### 2.4 Scope

This section defines the core domain model of the system. It establishes the fundamental types, concepts, and associations that express domain truth and business intent.

The domain model is implemented as a TypeScript library under `source/domain`. It is the authoritative source of meaning for the system.

`architecture-core.md` documents how the system is organized to support this domain model; it does not define the domain itself.

**Adapter naming convention:** Adapters use `Dictionary` (or `dict`) rather than `row` or `record` to represent serialized forms. Functions follow the pattern `to{Abstraction}(dict: Dictionary): Abstraction` and `from{Abstraction}(abstraction: Abstraction): Dictionary`. This emphasizes storage-agnostic serialization rather than database-specific terminology.

### 2.5 Core abstractions that define the domain

These abstractions represent the primary concepts of the system and form the core of the domain model. They are expressed as TypeScript types under `source/domain` and define the vocabulary used throughout the system.

| Abstraction     | Description                                                                       |
| --------------- | --------------------------------------------------------------------------------- |
| `Service`       | Offering provided to customers, defining the kind of work performed               |
| `Asset`         | Equipment or resources used to perform services                                   |
| `Chemical`      | Regulated materials applied as part of certain services                           |
| `Workflow`      | Reusable template describing how work is generally performed                      |
| `Job`           | Unit of work agreed to with a customer; lifecycle anchor                          |
| `JobAssessment` | Evaluation of a job's scope, locations, and requirements                          |
| `JobWorkflow`   | Job-specific workflow instance referencing a basis and optional modified Workflow |
| `JobPlan`       | Job-specific execution plan                                                       |
| `JobWork`       | Execution record; finalizes the workflow manifest and gates field execution       |
| `JobWorkLog`    | Append-only record of execution events and observations                           |
| `Customer`      | Organization purchasing services                                                  |

These abstractions describe **domain meaning**, not persistence, API shape, or user interface concerns.

### 2.6 Common abstractions shared within the model

The following abstractions are shared across multiple domain concepts and represent either pure value objects or embedded subordinate compositions. They do not have independent life-cycles.

| Abstraction  | Module        | Description                                              |
| ------------ | ------------- | -------------------------------------------------------- |
| `Location`   | `common.ts`   | Geographic coordinates with optional address information |
| `Note`       | `common.ts`   | Freeform text with author and timestamp                  |
| `Attachment` | `common.ts`   | Metadata describing an uploaded file or artifact         |
| `User`       | `user.ts`     | Identity and role information for system users           |
| `Question`   | `workflow.ts` | Prompt used to gather structured input                   |
| `Answer`     | `workflow.ts` | Response to a question, with supporting notes            |

These abstractions are **composed into** higher-level domain objects and are not referenced independently.

### 2.7 Supporting domain relationships and junctions

In addition to the core abstractions, the domain includes supporting structures that express relationships between concepts without embedding or ownership.

These structures are present in code to model associations explicitly and to preserve flexibility as the system evolves.

| Area          | Structures / Notes                                                            |
| ------------- | ----------------------------------------------------------------------------- |
| Services      | Asset requirements expressed as associations between services and asset types |
| Assets        | Asset types defined independently and selected based on service requirements  |
| Workflows     | Versioned workflows with sequenced task composition                           |
| Job Workflows | Basis and modified workflow references per job, with sequence                 |
| Planning      | Associations between plans and assigned users, assets, and chemicals          |
| Customers     | Embedded subordinate data such as sites and contacts                          |

These structures exist to model **relationships**, not to redefine the core abstractions themselves.

### 2.8 Standard data types

The following standard data types are used consistently across the domain model.

| Type         | Description                                    |
| ------------ | ---------------------------------------------- |
| `Id`         | UUID v7 string identifier                      |
| `When`       | ISO 8601 UTC timestamp represented as a string |
| `Dictionary` | JSON-like key/value map                        |

These types provide consistency and clarity without imposing storage or transport constraints.

### 2.9 Rules

- Language: TypeScript (strict mode) checked via Deno (`deno task check`).
- Types must be JSON-serializable.
- No runtime dependencies beyond `@core-std`.
- This package is the **single source of truth** for domain types.
- All other code (ux, edge functions) must import from `source/domain`.
- Asset types are modeled as data records (`AssetType`) and referenced by `Asset.type` and `Service.requiredAssetTypes`; keep the canonical list in `documentation/foundation/data-lists.md`.
- Attachments carry a `kind` (`photo` | `video` | `map` | `document`).
- `Customer.contacts` is non-empty; the primary contact is flagged via `Contact.isPrimary`.
- Locations store coordinates/addresses without a `source` field.
- `JobAssessment` must capture one or more `Location` entries (`locations` tuple) to support noncontiguous ranch assessments.
- Lifecycled abstractions extend `Instantiable` from `@core-std` — do not redeclare `id`, `createdAt`, `updatedAt`, `deletedAt?` inline. `Instantiable` carries soft-delete semantics: callers treat `deletedAt` undefined/null as active, filter queries to `deleted_at IS NULL`. Exceptions: append-only logs and pure junction tables.
- Id strategy: UUID v7 for PK/FK to avoid an Id service, allow preassigned keys, and let related rows be inserted together; mitigations include using the native `uuid` type, a v7 generator, avoiding redundant indexes, preferring composite keys for pure junction tables, and routine maintenance (vacuum/reindex) on heavy-write tables.
- `JobWorkLogEntry` is append-only with a required `answer` field; telemetry and system-generated entries use `QuestionType = 'internal'` — no separate metadata field.
- `Workflow` masters are read-only to all roles except administrator. Modification during assessment or planning is achieved exclusively by cloning.
- `JobWork.work` is the finalized execution manifest and is immutable once created.
- Shared primitive validators (`isNonEmptyString`, `isId`, `isWhen`, `isPositiveNumber`) live in `@core-std`. Domain-specific guards live in their abstraction's validator file.

### 2.10 Roles & attribution

- User memberships are constrained to `USER_ROLES` (`administrator`, `sales`, `operations`) defined in `@domain/abstractions/user.ts`.
- `User.roles` is an array; a user may hold multiple memberships simultaneously.
- Role semantics describe authorization intent only; enforcement occurs outside the domain layer.

### 2.11 Domain layer file organization

The domain layer follows an abstraction-per-file pattern across four subdirectories:

| Layer           | Abstraction file             |
| --------------- | ---------------------------- |
| `abstractions/` | `{abstraction}.ts`           |
| `adapters/`     | `{abstraction}-adapter.ts`   |
| `protocols/`    | `{abstraction}-protocol.ts`  |
| `validators/`   | `{abstraction}-validator.ts` |

**Placement rules:**

- Abstraction-specific types belong with their owning abstraction (e.g., `User` in `user.ts`).
- Pure value objects and shared subordinate types (`Location`, `Note`, `Attachment`) live in `common.ts`.
- Concept-owning types live with their owner (e.g., `Question` and `Answer` in `workflow.ts`).
- Generic protocol shapes (`ListOptions`, `ListResult`, `DeleteResult`) live in `@core/api/api-contract.ts`.
- Shared primitive validators live in `@core-std`; domain-specific guards live in their abstraction's validator file.

## 3. Data Dictionary

The following sections define the domain types and shape constraints from `@domain/abstractions`.

### 3.1 Core Standard (`@core-std`)

```text
Id (alias)
  Shape: UUID v7 string
  Notes: Primary/foreign identifier type

When (alias)
  Shape: ISO 8601 UTC string
  Notes: Timestamp type

Dictionary (alias)
  Shape: JSON-like key/value map
  Notes: Flexible structured data container

Instantiable (type)
  Fields: id: Id, createdAt: When, updatedAt: When, deletedAt?: When
  Notes: Lifecycle base for all persisted abstractions with independent database rows;
         extend via intersection — do not redeclare these fields inline
```

### 3.2 Common (`@domain/abstractions/common.ts`)

```text
Location (object)
  Fields: latitude, longitude, altitudeMeters?, line1?, line2?, city?, state?,
          postalCode?, country?, recordedAt?, accuracyMeters?, description?
  Notes: Geographic position plus optional address metadata

Attachment (object)
  Fields: id, filename, url, contentType, kind(photo|video|map|document),
          uploadedAt, uploadedById
  Notes: Uploaded artifact metadata

Note (object)
  Fields: id, createdAt, authorId?, content, visibility?(internal|shared),
          tags: [string?, ...string[]], attachments: [Attachment?, ...Attachment[]]
  Notes: Freeform note with optional visibility/taxonomy
```

### 3.3 Assets (`@domain/abstractions/asset.ts`)

```text
AssetType (Instantiable)
  Fields: id, label, active, createdAt, updatedAt, deletedAt?
  Notes: Reference type for categorizing assets
  Values: foundation/data-lists.md, Section 2. Asset Types

AssetStatus (enum)
  Values: active | maintenance | retired | reserved
  Notes: Lifecycle/availability state

Asset (Instantiable)
  Fields: id, label, description?, serialNumber?, type(AssetType.id),
          status(AssetStatus), notes: [Note?, ...Note[]],
          createdAt, updatedAt, deletedAt?
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

Chemical (Instantiable)
  Fields: id, name, epaNumber?, usage(ChemicalUsage),
          signalWord?(danger|warning|caution), restrictedUse,
          reEntryIntervalHours?, storageLocation?, sdsUrl?,
          labels: [ChemicalLabel?, ...ChemicalLabel[]],
          notes: [Note?, ...Note[]], createdAt, updatedAt, deletedAt?
  Notes: Regulated material record
```

### 3.5 Customers (`@domain/abstractions/customer.ts`)

```text
Contact (object)
  Fields: name, email?, phone?, isPrimary,
          preferredChannel?(email|text|phone),
          notes: [Note?, ...Note[]]
  Notes: Embedded customer contact; isPrimary flags the primary contact

CustomerSite (object)
  Fields: id, customerId, label, location, acreage?,
          notes: [Note?, ...Note[]]
  Notes: Serviceable customer location

Customer (Instantiable)
  Fields: id, name, status(active|inactive|prospect), line1, line2?,
          city, state, postalCode, country, accountManagerId?,
          sites: [CustomerSite?, ...CustomerSite[]],
          contacts: [Contact, ...Contact[]], notes: [Note?, ...Note[]],
          createdAt, updatedAt, deletedAt?
  Notes: Customer account aggregate; contacts must be non-empty
```

### 3.6 Services (`@domain/abstractions/service.ts`)

```text
ServiceCategory (enum)
  Values: aerial-drone-services | ground-machinery-services
  Notes: Service family classification

Service (Instantiable)
  Fields: id, name, sku, description?, category(ServiceCategory),
          tagsWorkflowCandidates: [string?, ...string[]],
          notes: [Note?, ...Note[]], createdAt, updatedAt, deletedAt?
  Notes: Sellable operational offering

ServiceRequiredAssetType (Junction)
  Fields: serviceId, assetTypeId
  Notes: Junction — services to required asset types; hard delete only
```

### 3.7 Users (`@domain/abstractions/user.ts`)

```text
USER_ROLES (const tuple)
  Values: administrator | sales | operations
  Notes: Canonical role set

UserRole (union)
  Values: (typeof USER_ROLES)[number]
  Notes: Role type derived from tuple

User (Instantiable)
  Fields: displayName, primaryEmail, phoneNumber, avatarUrl?,
          roles: [UserRole?, ...UserRole[]],
          status?(active|inactive)
  Notes: System user identity and membership; extends Instantiable
```

### 3.8 Workflows (`@domain/abstractions/workflow.ts`)

```text
QuestionType (enum)
  Values: 
    | text 
    | number 
    | boolean 
    | single-select 
    | multi-select
    | internal
  Notes: Supported question input modes; internal is reserved for system-generated
         log entries such as telemetry, GPS, and operational metadata

QuestionOption (object)
  Fields: value, label?, requiresNote?
  Notes: Selectable option metadata

Question (object)
  Fields: id, prompt, type(QuestionType), helpText?, required?,
          options: [QuestionOption?, ...QuestionOption[]]
  Notes: Workflow checklist prompt

AnswerValue (union)
  Values: 
    | string 
    | number 
    | boolean 
    | string[]
  Notes: Permitted answer value payloads

Answer (object)
  Fields: questionId, value(AnswerValue), capturedAt, capturedById,
          notes: [Note?, ...Note[]]
  Notes: Captured response instance; notes carry crew annotations and attachments

Task (object)
  Fields: id, title, description?, checklist: [Question, ...Question[]]
  Notes: Atomic executable step; checklist must be non-empty

Workflow (Instantiable)
  Fields: id, name, description?, version, tags: [string?, ...string[]],
          tasks: [Task, ...Task[]], createdAt, updatedAt, deletedAt?
  Notes: Versioned execution template; read-only except for administrator role
```

### 3.9 Jobs (`@domain/abstractions/job.ts`)

```text
JobStatus (enum)
  Values: 
    | 'open'
    | 'assessing'
    | 'planning'
    | 'preparing'
    | 'executing'
    | 'finalizing'
    | 'closed'
    | 'cancelled'
  Notes: Job lifecycle state

JobAssessment (Instantiable)
  Fields: id, jobId, assessorId, locations: [Location, ...Location[]],
          risks: [Note?, ...Note[]], notes: [Note?, ...Note[]],
          createdAt, updatedAt, deletedAt?
  Notes: Pre-planning assessment; requires one or more locations

JobWorkflow (Instantiable)
  Fields: id, jobId, sequence, basisWorkflowId, modifiedWorkflowId?,
          createdAt, updatedAt, deletedAt?
  Notes: Job-specific workflow instance; basisWorkflowId references the
         read-only Workflow master; modifiedWorkflowId is always a clone
         of the basis, created only when specialization is required during
         assessment or planning

JobPlanAssignment (object)
  Fields: planId, userId, role, notes: [Note?, ...Note[]], deletedAt?
  Notes: Assignment of user to plan role

JobPlanChemical (object)
  Fields: planId, chemicalId, amount,
          unit(gallon|liter|pound|kilogram),
          targetArea?, targetAreaUnit?(acre|hectare), deletedAt?
  Notes: Planned chemical usage

JobPlanAsset (object)
  Fields: planId, assetId, deletedAt?
  Notes: Asset allocated to a plan

JobPlan (Instantiable)
  Fields: id, jobId, scheduledStart, scheduledEnd?,
          notes: [Note?, ...Note[]], createdAt, updatedAt, deletedAt?
  Notes: Job-specific execution plan

JobWork (Instantiable)
  Fields: id, jobId, work: [Id, ...Id[]], startedAt, startedById,
          completedAt?, createdAt, updatedAt, deletedAt?
  Notes: Execution record; creation transitions Job to executing;
         work is an ordered array of resolved Workflow IDs (basis if
         unmodified, modified clone otherwise) — the immutable
         execution manifest

JobWorkLogEntry (object)
  Fields: id, jobId, userId, answer: Answer, createdAt
  Notes: Append-only execution event; answer is always present and captures
         both crew checklist responses (text, number, boolean, single-select,
         multi-select) and system-generated telemetry via internal question type
         
Job (Instantiable)
  Fields: id, customerId, status(JobStatus), createdAt, updatedAt, deletedAt?
  Notes: Work agreement lifecycle anchor
```
