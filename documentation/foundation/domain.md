# swarmAg Operations System — Domain Model

![swarmAg ops logo](../../swarmag-ops-logo.png)

## 1. Overview

This document defines the foundational abstractions, contracts, and APIs of the `swarmAg System`. The domain model captures the solution space expressed as types, attributes, enums, unions and relations declaratively using TypeScript.

## 2. Solution Space

### 2.1 Service

A Service is a listed product representing work we sell, identified by an SKU. Services belong to a category (for example, aerial or ground), have a description, and define the kinds of assets required to execute the work (equipment, tools, supplies).

Many services require the use of regulated chemicals. The acquisition, storage, mixing, and application of chemicals must be managed to maintain licensing and regulatory compliance.

A Service Category represents a class of service we offer (e.g., aerial-drone-service, ground-machinery-service). Each Service Category has one or more Workflows suitable for performing services within that category.

### 2.2 Workflow, Tasks & Questions

A Workflow describes how work is generally performed. Examples of workflows include "Drone Chemical Preparation", "Mesquite Chemical Preparation", "Mesquite Mitigation Procedure", and "Drone Obstacle Preflight".

A Workflow is structured as an ordered sequence of Tasks. Tasks are Instantiable life-cycled and reusable across Workflows. For example, a "Prepare Chemicals" task appears in both aerial and ground chemical workflows. The sequence of Tasks within a Workflow is defined by the WorkflowTask junction, which carries the ordering.

Each Task is a named grouping of an ordered sequence of Questions. Questions are Instantiable life-cycled and reusable across Tasks. The sequence of Questions within a Task is defined by the TaskQuestion junction, which carries the ordering.

Questions are expressed using a small set of fundamental response formats: text, number, yes/no, single-select, multi-select. A special `internal` question type is reserved for system-generated log entries such as telemetry, GPS coordinates, and operational metadata. Internal questions exist as seed records in the question library and are referenced directly by log entries — no wrapper workflow is required.

All Answers may be annotated with one or more Notes. Notes may contain one or more Attachments. Attachments are mime-type specified, such as images, videos, or documents.

Workflows guide how work is assessed and inform how it is later planned and executed.

### 2.3 Job

A Job represents a work agreement with a customer and serves as the hub of the model. A Job is created first and anchors all related work artifacts.

### 2.4 Job Assessment, Job Plan, & Job Work Log

A Job Assessment evaluates the work to be completed on behalf of a customer. Assessments define the locations involved and gather the information required to determine scope, feasibility, and approach. Job Assessments scope the Job using Workflow definitions that direct the Job. A Job Assessment must exist before a Job Plan may be created.

We use multispectral mapping drones for both aerial and ground services. A Job Assessment may include one or more annotations, Notes, which in turn may include attachments which may include maps or images.

A Job Plan defines how a specific Job will be executed. Plans are created after assessment and translate intent into concrete, job-specific instruction. Job Plans are the primary means by which field crews are informed of the work to be performed and are prepared prior to execution to support guided field operation.

A Job Work Log memorializes the physical execution of a Job. Logs are append-only and record the Answers to the Questions within the Task checklist. Additionally, the Job Work Log records any metadata about what actually occurred, including telemetry, GPS coordinates, comments, time accrued, and any exceptions or deviations encountered. Logs may also capture notes about the job as a whole.

A Job has an Assessment, a Plan, and a collection of Log entries. Log entries are created during the execution of a Job, by a User, and are appended to the Job's Log. There are no circular foreign keys; Assessments, Plans, and Logs reference the Job.

### 2.5 Job Workflow & Job Work

Work is the physical execution of a Job. It produces the progress and knowledge captured by field crews during a job. Work is directed by a sequence of Workflows. Each Workflow and its associated Tasks and Questions are a template used to assess and plan the job.

To facilitate the role a Workflow plays in orchestrating a Job, two abstractions are introduced: Job Workflow and Job Work. A Job has a collection of Job Workflows. Job Assessment, Job Plan, and Job Work each contain an association to their Job and therefore to the Job Workflows. Just as Tasks and Questions are sequenced via their junction tables, so too is the order of Job Workflows defined by `JobWork.work` — the immutable execution manifest.

Job Workflows are prepared prior to Job Work. The Job Assessment phase includes selecting the Workflows to be used on a Job. As each job is different, the Job Assessment may edit the workflows to capture the specialization. Creating, editing, and deleting Workflows are an administration authorization and so are read-only for Job Assessment and Job Plan. A Job Workflow is therefore associated with a basis Workflow (read-only reference) and an optional modified Workflow — which is always a clone of the basis Workflow, including its WorkflowTask and TaskQuestion junction records. The Job Plan phase may add additional basis Workflows and optionally modify them. The Job Plan may also further modify Job Workflows that were already modified during assessment; in that case the assessment-modified Workflow becomes the basis for the Job Plan's modification.

Starting Job Work involves transitioning the Job's status to `executing`. At that point the set of Workflows to be executed is finalized: Job Work holds an ordered collection of resolved Workflow IDs — the basis Workflow where no modification exists, or the modified Workflow where one does. This is the execution manifest. Job Work is then the process of executing these Workflows in sequence. A specialized UX within the operations application walks a crew member through the workflow tasks and their questions, logging the Answers as Job Work Log entries.

Job Workflows are assigned to crew staff during the planning phase.

## 3. Domain Model (`source/domain`)

The domain model has two distinct concerns: the **swarmAg domain** (the business abstractions — Service, Customer, Workflow, Job, etc.) and the **patterns used to codify it** (how those abstractions are structured, associated, and serialized in TypeScript and PostgreSQL).

### 3.1 Domain Abstractions

The swarmAg domain is expressed as TypeScript types under `source/domain/abstractions/`. These types are the single source of truth for domain meaning. All other code — API clients, edge functions, UX applications — consumes these types and does not redefine them.

### 3.2 Abstraction Archetypes

The domain layers are organized into four archetypes:

| Archetype       | Description                                                                                                |
| --------------- | ---------------------------------------------------------------------------------------------------------- |
| `abstractions/` | Core domain types and interfaces representing business entities and their relationships                    |
| `adapters/`     | Serialization logic converting between storage/transport representations and domain abstractions           |
| `protocols/`    | Partial and essential abstraction state definitions for boundary transmission (creation, updates, queries) |
| `schema/`       | Generated canonical SQL schema (`schema.sql`); authoritative current-state, derived from domain            |
| `validators/`   | Validation logic ensuring data integrity at system boundaries (both ingress and egress)                    |

### 3.3 Relation Patterns

All relationships between domain abstractions are expressed using typed relation primitives from `@core-std/relations.ts`. Two orthogonal concepts:

#### 3.3.1 Composition (embedded, JSONB)

Subordinate abstractions with no independent lifecycle are embedded directly. Always represented as `readonly T[]` at runtime. Always `[]` when empty, never `null`. The RDBMS column type is JSONB.

| Type                     | Cardinality | Validated by            |
| ------------------------ | ----------- | ----------------------- |
| `CompositionOne<T>`      | exactly 1   | `isCompositionOne`      |
| `CompositionOptional<T>` | 0 or 1      | `isCompositionOptional` |
| `CompositionMany<T>`     | 0 or more   | `isCompositionMany`     |
| `CompositionPositive<T>` | 1 or more   | `isCompositionPositive` |

#### 3.3.2 Association (FK reference, UUID column)

Instantiable life-cycled abstractions are referenced via foreign keys. The phantom type parameter documents the referenced abstraction. Resolves to `Id` or `Id | undefined` at runtime.

| Type                     | Cardinality                           | Column type     |
| ------------------------ | ------------------------------------- | --------------- |
| `AssociationOne<T>`      | required FK — many side of 1:m or 1:1 | `UUID NOT NULL` |
| `AssociationOptional<T>` | optional FK — nullable column         | `UUID`          |
| `AssociationJunction<T>` | junction FK — both sides of m:m       | `UUID NOT NULL` |

### 3.4 Scope

This section defines the core domain model of the system. It establishes the fundamental types, concepts, and associations that express domain truth and business intent.

The domain model is implemented as a TypeScript library under `source/domain`. It is the authoritative source of meaning for the system.

`architecture-core.md` documents how the system is organized to support this domain model; it does not define the domain itself.

**Adapter naming convention:** Adapters use `Dictionary` (or `dict`) rather than `row` or `record` to represent serialized forms. Functions follow the pattern `to{Abstraction}(dict: Dictionary): Abstraction` and `from{Abstraction}(abstraction: Abstraction): Dictionary`. This emphasizes storage-agnostic serialization rather than database-specific terminology.

### 3.5 Core abstractions that define the domain

These abstractions represent the primary concepts of the system and form the core of the domain model. They are expressed as TypeScript types under `source/domain` and define the vocabulary used throughout the system.

| Abstraction     | Description                                                                          |
| --------------- | ------------------------------------------------------------------------------------ |
| `Service`       | Offering provided to customers, defining the kind of work performed                  |
| `Asset`         | Equipment or resources used to perform services                                      |
| `Chemical`      | Regulated materials applied as part of certain services                              |
| `Workflow`      | Reusable template describing how work is generally performed                         |
| `Task`          | Reusable named grouping of questions; sequenced within workflows via junction        |
| `Question`      | Reusable prompt used to gather structured input; sequenced within tasks via junction |
| `Job`           | Unit of work agreed to with a customer; lifecycle anchor                             |
| `JobAssessment` | Evaluation of a job's scope, locations, and requirements                             |
| `JobWorkflow`   | Job-specific workflow instance referencing a basis and optional modified Workflow    |
| `JobPlan`       | Job-specific execution plan                                                          |
| `JobWork`       | Execution record; finalizes the workflow manifest and gates field execution          |
| `JobWorkLog`    | Append-only record of execution events and observations                              |
| `Customer`      | Organization purchasing services                                                     |

These abstractions describe **domain meaning**, not persistence, API shape, or user interface concerns.

### 3.6 Common abstractions shared within the model

The following abstractions are shared across multiple domain concepts and represent pure value objects or embedded subordinate compositions. They do not have independent lifecycles.

| Abstraction  | Module      | Description                                                                                         |
| ------------ | ----------- | --------------------------------------------------------------------------------------------------- |
| `Location`   | `common.ts` | Geographic coordinates with optional address information                                            |
| `Note`       | `common.ts` | Freeform text with author and timestamp                                                             |
| `Attachment` | `common.ts` | Metadata describing an uploaded file or artifact                                                    |
| `Question`   | `common.ts` | Reusable prompt; Instantiable life-cycled; discriminated union of ScalarQuestion and SelectQuestion |
| `Answer`     | `common.ts` | Response to a question, with supporting notes                                                       |

These abstractions are **composed into** higher-level domain objects, do not join with Instantiable and are not referenced independently.

### 3.7 Supporting domain relationships and junctions

In addition to the core abstractions, the domain includes supporting structures that express relationships between concepts without embedding or ownership.

| Area          | Structures / Notes                                                                |
| ------------- | --------------------------------------------------------------------------------- |
| Services      | Asset requirements expressed as m:m associations between services and asset types |
| Workflows     | Versioned workflows with sequenced task associations via WorkflowTask junction    |
| Tasks         | Reusable tasks with sequenced question associations via TaskQuestion junction     |
| Job Workflows | Basis and modified workflow references per job; order defined by `JobWork.work`   |
| Planning      | Associations between plans and assigned users, assets, and chemicals              |
| Customers     | Embedded subordinate data such as sites and contacts                              |

These structures exist to model **relationships**, not to redefine the core abstractions themselves.

### 3.8 Standard data types

The following standard data types are used consistently across the domain model.

| Type         | Description                                    |
| ------------ | ---------------------------------------------- |
| `Id`         | UUID v7 string identifier                      |
| `When`       | ISO 8601 UTC timestamp represented as a string |
| `Dictionary` | JSON-like key/value map                        |

These types provide consistency and clarity without imposing storage or transport constraints.

### 3.9 Domain Invariants

- Types must be JSON-serializable.
- No runtime dependencies beyond `@core-std`.
- This package is the **single source of truth** for domain types. All other code (ux, edge functions) must import from `source/domain`.
- Life-cycled abstractions extend `Instantiable` — soft-delete semantics: `deletedAt` undefined/null means active. Exceptions: append-only logs and pure junction tables.
- Embedded subordinate compositions use `Composition*` types from `@core-std/relations.ts`. Always `[]` when empty, never `null`.
- FK references to Instantiable life-cycled abstractions use `Association*` types from `@core-std/relations.ts`.
- Id strategy: UUID v7 for all PK/FK; application always supplies the ID — no database-generated defaults.
