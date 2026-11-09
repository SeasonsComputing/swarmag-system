<img src="../../swarmag-ops-logo.png" title="" alt="swarmAg Operations System" data-align="center">

# swarmAg Operations System — Domain Data Dictionary

## 1. Overview

This document is the normalized reference for domain abstraction types, relations, and state attributes.

It is derived from `domain-model.md` and presents the same model in a table-first, implementation-ready format for use in topic artifact productions -- Abstractions -- and the archetypes -- Adapters, Protocols, Validators and Schema -- that are tightly coupled to them.

The `domain-model.md` and `domain-data-dictionary.md` go hand-in-hand in mapping a conceptual solution space to physical artifacts that codify the solution as software.

## 2. Topic Namespace

| Topic     | Source                             | Contents                 |
| --------- | ---------------------------------- | ------------------------ |
| Common    | `@domain/abstractions/common.ts`   | Location                 |
|           |                                    | ContactPreferredChannel  |
|           |                                    | Attachment               |
|           |                                    | Note                     |
|           |                                    | Facet                    |
| Assets    | `@domain/abstractions/asset.ts`    | AssetType                |
|           |                                    | AssetStatus              |
|           |                                    | Asset                    |
| Chemicals | `@domain/abstractions/chemical.ts` | ChemicalUsage            |
|           |                                    | ChemicalLabel            |
|           |                                    | Chemical                 |
| Customers | `@domain/abstractions/customer.ts` | Contact                  |
|           |                                    | CustomerSite             |
|           |                                    | CustomerUser             |
|           |                                    | Customer                 |
| Services  | `@domain/abstractions/service.ts`  | ServiceCategory          |
|           |                                    | Service                  |
|           |                                    | ServiceRequiredAssetType |
| Users     | `@domain/abstractions/user.ts`     | UserRole                 |
|           |                                    | User                     |
| Workflows | `@domain/abstractions/workflow.ts` | QuestionType             |
|           |                                    | BaseQuestion             |
|           |                                    | InternalQuestion         |
|           |                                    | ScalarQuestion           |
|           |                                    | SelectOption             |
|           |                                    | SelectQuestion           |
|           |                                    | Question                 |
|           |                                    | Answer                   |
|           |                                    | Task                     |
|           |                                    | TaskQuestion             |
|           |                                    | Workflow                 |
|           |                                    | WorkflowTask             |
| Jobs      | `@domain/abstractions/job.ts`      | JobStatus                |
|           |                                    | Job                      |
|           |                                    | JobAssessment            |
|           |                                    | JobWorkflow              |
|           |                                    | JobPlan                  |
|           |                                    | JobPlanAssignmentRole    |
|           |                                    | JobPlanAssignment        |
|           |                                    | JobPlanChemical          |
|           |                                    | JobPlanAsset             |
|           |                                    | JobWork                  |
|           |                                    | JobWorkLogEntry          |

## 3. Attribute Domains

A string attribute may carry a **Domain**: the kind of string it holds, from a closed set. A table
shows the Domain column only when one of its attributes has one.

| **Domain**         | **Format**                            |
| ------------------ | ------------------------------------- |
| `email`            | An email address                      |
| `url (schemes)`    | A URL, with one of the listed schemes |
| `document-address` | A document store address              |

## 4. Core Standard

Source: `@core/std`

### 4.1 Instantiable

Purpose: **Lifecycle base for all persisted abstractions with independent database rows; extend via intersection — do not redeclare these fields inline**

Type: **type**

Attributes: **State**

| **Attribute** | **Type** |
| ------------- | -------- |
| `id`          | Id       |
| `createdAt`   | When     |
| `updatedAt`   | When     |
| `deletedAt?`  | When     |

### 4.2 InstantiableOnly

Purpose: **Lifecycle base for append-only abstractions; no update or delete; extend via intersection — do not redeclare these fields inline**

Type: **type**

Attributes: **State**

| **Attribute** | **Type** |
| ------------- | -------- |
| `id`          | Id       |
| `createdAt`   | When     |

## 5. Common

Source: `@domain/abstractions/common.ts`

### 5.1 Location

Purpose: **Place carrying coordinate substance (latitude+longitude) or address substance (line1+city), or both; a present coordinate must be paired**

Type: **object**

Attributes: **State**

| **Attribute**     | **Type** |
| ----------------- | -------- |
| `latitude?`       | number   |
| `longitude?`      | number   |
| `altitudeMeters?` | number   |
| `line1?`          | string   |
| `line2?`          | string   |
| `city?`           | string   |
| `state?`          | string   |
| `postalCode?`     | string   |
| `country?`        | string   |
| `recordedAt?`     | When     |
| `accuracyMeters?` | number   |
| `description?`    | string   |

### 5.2 ContactPreferredChannel

Purpose: **Preferred communication channel for a reachable party**

Type: **const-enum**

| Values  |
| ------- |
| `email` |
| `text`  |
| `phone` |

### 5.3 Attachment

Purpose: **Uploaded artifact metadata**

Type: **object**

Attributes: **State**

| **Attribute**     | **Type**                                                               | **Domain**         |
| ----------------- | ---------------------------------------------------------------------- | ------------------ |
| `filename`        | string                                                                 |                    |
| `documentAddress` | string                                                                 | `document-address` |
| `contentType`     | string                                                                 |                    |
| `kind`            | `'photo'` \| `'video'` \| `'map'` \| `'document'` (default: `'photo'`) |                    |
| `uploadedAt`      | When                                                                   |                    |

### 5.4 Note

Purpose: **Freeform note with visibility**

Type: **object**

Attributes: **Relations**

| **Attribute** | **Relation**    | **Abstraction** |
| ------------- | --------------- | --------------- |
| `attachments` | CompositionMany | Attachment      |

Attributes: **State**

| **Attribute** | **Type**                                           |
| ------------- | -------------------------------------------------- |
| `createdAt`   | When                                               |
| `content`     | string                                             |
| `visibility`  | `'internal'` \| `'shared'` (default: `'internal'`) |

### 5.5 Facet

Purpose: **Curated classification catalog entry: one code within a scheme**

Type: **Instantiable**

Attributes: **State**

| **Attribute**  | **Type** |
| -------------- | -------- |
| `scheme`       | string   |
| `code`         | string   |
| `label`        | string   |
| `description?` | string   |
| `active`       | boolean  |

Consumers reference a facet by the string `scheme:code`, never by `id`. `:` is reserved: neither
`scheme` nor `code` may contain it; `code` may contain `/`, with no hierarchy semantics yet.
`(scheme, code)` is unique. Retiring a facet sets `active` to false: the row stays readable and
still resolves the label of existing references. Once a facet is referenced, its `scheme` and
`code` never change and it is never soft-deleted; soft delete is for a facet created by mistake
and never referenced. Those are curation obligations, enforced by the curation surface, not by
the database.

## 6. Assets

Source: `@domain/abstractions/asset.ts`

### 6.1 AssetType

Purpose: **Reference type for categorizing assets**

Type: **Instantiable**

Attributes: **State**

| **Attribute** | **Type** |
| ------------- | -------- |
| `label`       | string   |
| `active`      | boolean  |

### 6.2 AssetStatus

Purpose: **Lifecycle/availability state**

Type: **const-enum**

| Values        |
| ------------- |
| `active`      |
| `maintenance` |
| `retired`     |
| `reserved`    |

### 6.3 Asset

Purpose: **Operational equipment or resource**

Type: **Instantiable**

Attributes: **Relations**

| **Attribute** | **Relation**    | **Abstraction** |
| ------------- | --------------- | --------------- |
| `type`        | AssociationOne  | AssetType       |
| `notes`       | CompositionMany | Note            |

Attributes: **State**

| **Attribute**   | **Type**    |
| --------------- | ----------- |
| `label`         | string      |
| `description?`  | string      |
| `serialNumber?` | string      |
| `status`        | AssetStatus |

## 7. Chemicals

Source: `@domain/abstractions/chemical.ts`

### 7.1 ChemicalUsage

Purpose: **Domain usage classification**

Type: **const-enum**

| Values       |
| ------------ |
| `herbicide`  |
| `pesticide`  |
| `fertilizer` |
| `fungicide`  |
| `adjuvant`   |

### 7.2 ChemicalLabel

Purpose: **Label/document pointer**

Type: **object**

Attributes: **State**

| **Attribute**  | **Type** | **Domain**          |
| -------------- | -------- | ------------------- |
| `url`          | string   | `url (https, http)` |
| `description?` | string   |                     |

### 7.3 Chemical

Purpose: **Regulated material record**

Type: **Instantiable**

Attributes: **Relations**

| **Attribute** | **Relation**    | **Abstraction** |
| ------------- | --------------- | --------------- |
| `labels`      | CompositionMany | ChemicalLabel   |
| `notes`       | CompositionMany | Note            |

Attributes: **State**

| **Attribute**           | **Type**                                                                 | **Domain**          |
| ----------------------- | ------------------------------------------------------------------------ | ------------------- |
| `name`                  | string                                                                   |                     |
| `epaNumber?`            | string                                                                   |                     |
| `usage`                 | ChemicalUsage                                                            |                     |
| `signalWord`            | `'none'` \| `'danger'` \| `'warning'` \| `'caution'` (default: `'none'`) |                     |
| `restrictedUse`         | boolean                                                                  |                     |
| `reEntryIntervalHours?` | number                                                                   |                     |
| `storageLocation?`      | string                                                                   |                     |
| `sdsUrl?`               | string                                                                   | `url (https, http)` |

## 8. Customers

Source: `@domain/abstractions/customer.ts`

### 8.1 Contact

Purpose: **Account reachability data — how to reach the party behind a record; not a person identity**

Type: **object**

Attributes: **State**

| **Attribute**      | **Type**                | **Domain** |
| ------------------ | ----------------------- | ---------- |
| `displayName`      | string                  |            |
| `phoneNumber`      | string                  |            |
| `preferredChannel` | ContactPreferredChannel |            |
| `email?`           | string                  | `email`    |

### 8.2 CustomerSite

Purpose: **Serviceable customer location**

Type: **object**

Attributes: **Relations**

| **Attribute** | **Relation**    | **Abstraction** |
| ------------- | --------------- | --------------- |
| `location`    | CompositionOne  | Location        |
| `notes`       | CompositionMany | Note            |

Attributes: **State**

| **Attribute** | **Type** |
| ------------- | -------- |
| `label`       | string   |
| `acreage?`    | number   |

### 8.3 CustomerUser

Purpose: **Pure-key relationship between a customer account and a user contact**

Type: **Junction**

Attributes: **Relations**

| **Attribute** | **Relation**        | **Abstraction** |
| ------------- | ------------------- | --------------- |
| `customerId`  | AssociationJunction | Customer        |
| `userId`      | AssociationJunction | User            |

### 8.4 Customer

Purpose: **Customer account aggregate with a required primary contact composition; portal access is the CustomerUser junction's concern, wired at activation**

Type: **Instantiable**

Attributes: **Relations**

| **Attribute**      | **Relation**        | **Abstraction** |
| ------------------ | ------------------- | --------------- |
| `accountManagerId` | AssociationOptional | User            |
| `primaryContact`   | CompositionOne      | Contact         |
| `sites`            | CompositionMany     | CustomerSite    |
| `notes`            | CompositionMany     | Note            |

Attributes: **State**

| **Attribute** | **Type**                                                           |
| ------------- | ------------------------------------------------------------------ |
| `name`        | string                                                             |
| `status`      | `'active'` \| `'inactive'` \| `'prospect'` (default: `'prospect'`) |
| `line1`       | string                                                             |
| `line2?`      | string                                                             |
| `city`        | string                                                             |
| `state`       | string                                                             |
| `postalCode`  | string                                                             |
| `country`     | string                                                             |

## 9. Services

Source: `@domain/abstractions/service.ts`

### 9.1 ServiceCategory

Purpose: **Service family classification**

Type: **const-enum**

| Values                      |
| --------------------------- |
| `aerial-drone-services`     |
| `ground-machinery-services` |

### 9.2 Service

Purpose: **Sellable operational offering**

Type: **Instantiable**

Attributes: **Relations**

| **Attribute** | **Relation**    | **Abstraction** |
| ------------- | --------------- | --------------- |
| `notes`       | CompositionMany | Note            |

Attributes: **State**

| **Attribute**  | **Type**                                  |
| -------------- | ----------------------------------------- |
| `name`         | string                                    |
| `sku`          | string                                    |
| `description?` | string                                    |
| `category`     | ServiceCategory                           |
| `facets`       | CompositionMany\<string\> (`scheme:code`) |

### 9.3 ServiceRequiredAssetType

Purpose: **Asset types required for a service**

Type: **Junction**

Attributes: **Relations**

| **Attribute** | **Relation**        | **Abstraction** |
| ------------- | ------------------- | --------------- |
| `serviceId`   | AssociationJunction | Service         |
| `assetTypeId` | AssociationJunction | AssetType       |

## 10. Users

Source: `@domain/abstractions/user.ts`

### 10.1 UserRole

Purpose: **Canonical role set**

Type: **const-enum**

| Values          |
| --------------- |
| `administrator` |
| `sales`         |
| `operations`    |
| `customer`      |

### 10.2 User

Purpose: **System user identity, membership, contact preference, and person notes**

Type: **Instantiable**

Attributes: **Relations**

| **Attribute** | **Relation**        | **Abstraction** |
| ------------- | ------------------- | --------------- |
| `roles`       | CompositionPositive | UserRole        |
| `notes`       | CompositionMany     | Note            |

Attributes: **State**

| **Attribute**      | **Type**                                         | **Domain** | **Constraints** |
| ------------------ | ------------------------------------------------ | ---------- | --------------- |
| `displayName`      | string                                           |            |                 |
| `primaryEmail`     | string                                           | `email`    | unique          |
| `phoneNumber`      | string                                           |            |                 |
| `preferredChannel` | ContactPreferredChannel                          |            |                 |
| `status`           | `'active'` \| `'inactive'` (default: `'active'`) |            |                 |

`public.users.id` is the domain user identifier. Backend auth synchronization keeps it equal to
`auth.users.id` as a solution-space invariant. The shared UUID is supplied by application code
using the system UUID v7 strategy; the database does not generate domain user IDs.

## 11. Workflow

Source: `@domain/abstractions/workflow.ts`

### 11.1 QuestionType

Purpose: **Supported question input modes; `internal` is reserved for system-generated log entries such as telemetry, GPS, and operational metadata**

Type: **const-enum**

| Values          |
| --------------- |
| `internal`      |
| `text`          |
| `number`        |
| `boolean`       |
| `single-select` |
| `multi-select`  |

### 11.2 BaseQuestion

Purpose: **Common shape shared by all Question constituents**

Type: **Instantiable**

Attributes: **State**

| **Attribute** | **Type**     |
| ------------- | ------------ |
| `type`        | QuestionType |
| `prompt`      | string       |
| `helpText?`   | string       |
| `required?`   | boolean      |

### 11.3 InternalQuestion

Purpose: **System-generated question; seed records referenced directly by log entries**

Type: **intersection-type**

Constituents: `BaseQuestion`

Attributes: **State**

| **Attribute** | **Type**     |
| ------------- | ------------ |
| `type`        | `'internal'` |

### 11.4 ScalarQuestion

Purpose: **Scalar input question; no options**

Type: **intersection-type**

Constituents: `BaseQuestion`

Attributes: **State**

| **Attribute** | **Type**                              |
| ------------- | ------------------------------------- |
| `type`        | `'text'` \| `'number'` \| `'boolean'` |

### 11.5 SelectOption

Purpose: **Selectable option metadata; only valid on SelectQuestion**

Type: **object**

Attributes: **State**

| **Attribute**   | **Type** |
| --------------- | -------- |
| `value`         | string   |
| `label?`        | string   |
| `requiresNote?` | boolean  |

### 11.6 SelectQuestion

Purpose: **Select input question; options required and non-empty**

Type: **intersection-type**

Constituents: `BaseQuestion`

Attributes: **Relations**

| **Attribute** | **Relation**        | **Abstraction** |
| ------------- | ------------------- | --------------- |
| `options`     | CompositionPositive | SelectOption    |

Attributes: **State**

| **Attribute** | **Type**                              |
| ------------- | ------------------------------------- |
| `type`        | `'single-select'` \| `'multi-select'` |

### 11.7 Question

Purpose: **General purpose reusable prompt; shared across tasks**

Type: **union-type**

Constituents: `ScalarQuestion | SelectQuestion | InternalQuestion`

Discriminator: `type`

### 11.8 Answer

Purpose: **Captured response to a question; notes carry crew annotations and attachments**

Type: **object**

Attributes: **Relations**

| **Attribute** | **Relation**    | **Abstraction** |
| ------------- | --------------- | --------------- |
| `questionId`  | AssociationOne  | Question        |
| `notes`       | CompositionMany | Note            |

Attributes: **State**

| **Attribute** | **Type**                                        |
| ------------- | ----------------------------------------------- |
| `value`       | `string` \| `number` \| `boolean` \| `string[]` |
| `capturedAt`  | When                                            |

### 11.9 Task

Purpose: **Reusable named grouping of ordered questions**

Type: **Instantiable**

Attributes: **Relations**

| **Attribute** | **Relation**    | **Abstraction** |
| ------------- | --------------- | --------------- |
| `notes`       | CompositionMany | Note            |

Attributes: **State**

| **Attribute**  | **Type** |
| -------------- | -------- |
| `label`        | string   |
| `description?` | string   |

### 11.10 TaskQuestion

Purpose: **m:m junction — tasks to questions with explicit ordering; hard delete only**

Type: **Junction**

Attributes: **Relations**

| **Attribute** | **Relation**        | **Abstraction** |
| ------------- | ------------------- | --------------- |
| `taskId`      | AssociationJunction | Task            |
| `questionId`  | AssociationJunction | Question        |

Attributes: **State**

| **Attribute** | **Type** |
| ------------- | -------- |
| `sequence`    | number   |

### 11.11 Workflow

Purpose: **Versioned template of ordered tasks; read-only except for administrator role**

Type: **Instantiable**

Attributes: **Relations**

| **Attribute** | **Relation**    | **Abstraction** |
| ------------- | --------------- | --------------- |
| `notes`       | CompositionMany | Note            |

Attributes: **State**

| **Attribute**  | **Type**                                  |
| -------------- | ----------------------------------------- |
| `name`         | string                                    |
| `description?` | string                                    |
| `version`      | number                                    |
| `facets`       | CompositionMany\<string\> (`scheme:code`) |

### 11.12 WorkflowTask

Purpose: **Ordered tasks that define a workflow**

Type: **Junction**

Attributes: **Relations**

| **Attribute** | **Relation**        | **Abstraction** |
| ------------- | ------------------- | --------------- |
| `workflowId`  | AssociationJunction | Workflow        |
| `taskId`      | AssociationJunction | Task            |

Attributes: **State**

| **Attribute** | **Type** |
| ------------- | -------- |
| `sequence`    | number   |

## 12. Jobs

Source: `@domain/abstractions/job.ts`

### 12.1 JobStatus

Purpose: **Job life-cycle state**

Type: **const-enum**

| Values       |
| ------------ |
| `open`       |
| `assessing`  |
| `planning`   |
| `preparing`  |
| `executing`  |
| `finalizing` |
| `closed`     |
| `cancelled`  |

### 12.2 Job

Purpose: **Work agreement life-cycle anchor**

Type: **Instantiable**

Attributes: **Relations**

| **Attribute** | **Relation**   | **Abstraction** |
| ------------- | -------------- | --------------- |
| `customerId`  | AssociationOne | Customer        |

Attributes: **State**

| **Attribute** | **Type**  |
| ------------- | --------- |
| `status`      | JobStatus |

### 12.3 JobAssessment

Purpose: **Pre-planning job assessment; requires one or more locations**

Type: **Instantiable**

Attributes: **State**

| **Attribute**  | **Type** |
| -------------- | -------- |
| `scheduledAt`  | When     |
| `startedAt?`   | When     |
| `completedAt?` | When     |

Attributes: **Relations**

| **Attribute** | **Relation**        | **Abstraction** |
| ------------- | ------------------- | --------------- |
| `jobId`       | AssociationOne      | Job             |
| `assessorId`  | AssociationOne      | User            |
| `locations`   | CompositionPositive | Location        |
| `risks`       | CompositionMany     | Note            |
| `notes`       | CompositionMany     | Note            |

### 12.4 JobWorkflow

Purpose: **Workflows required of a job; basis workflow may be customized for a job**

Type: **Instantiable**

Attributes: **Relations**

| **Attribute**        | **Relation**        | **Abstraction** |
| -------------------- | ------------------- | --------------- |
| `jobId`              | AssociationOne      | Job             |
| `basisWorkflowId`    | AssociationOne      | Workflow        |
| `modifiedWorkflowId` | AssociationOptional | Workflow        |

### 12.5 JobPlan

Purpose: **Planning for a job, based on an assessment**

Type: **Instantiable**

Attributes: **Relations**

| **Attribute** | **Relation**    | **Abstraction** |
| ------------- | --------------- | --------------- |
| `jobId`       | AssociationOne  | Job             |
| `plannerId`   | AssociationOne  | User            |
| `notes`       | CompositionMany | Note            |

Attributes: **State**

| **Attribute**      | **Type** |
| ------------------ | -------- |
| `scheduledStart`   | When     |
| `durationEstimate` | number   |

### 12.6 JobPlanAssignmentRole

Purpose: **Planned function a user performs as a member of a job crew**

Type: **const-enum**

| Values               |
| -------------------- |
| `crew-lead`          |
| `pilot`              |
| `visual-observer`    |
| `applicator`         |
| `equipment-operator` |
| `technician`         |

### 12.7 JobPlanAssignment

Purpose: **Planned user assignments required for a job**

Type: **Instantiable**

Attributes: **Relations**

| **Attribute**  | **Relation**    | **Abstraction** |
| -------------- | --------------- | --------------- |
| `planId`       | AssociationOne  | JobPlan         |
| `crewMemberId` | AssociationOne  | User            |
| `notes`        | CompositionMany | Note            |

Attributes: **State**

| **Attribute** | **Type**              |
| ------------- | --------------------- |
| `role`        | JobPlanAssignmentRole |

### 12.8 JobPlanChemical

Purpose: **Planned chemical usage required for a job**

Type: **Instantiable**

Attributes: **Relations**

| **Attribute** | **Relation**   | **Abstraction** |
| ------------- | -------------- | --------------- |
| `planId`      | AssociationOne | JobPlan         |
| `chemicalId`  | AssociationOne | Chemical        |

Attributes: **State**

| **Attribute**    | **Type**                                                                   |
| ---------------- | -------------------------------------------------------------------------- |
| `amount`         | number                                                                     |
| `unit`           | `'gallon'` \| `'liter'` \| `'pound'` \| `'kilogram'` (default: `'gallon'`) |
| `targetArea?`    | number                                                                     |
| `targetAreaUnit` | `'acre'` \| `'hectare'` (default: `'acre'`)                                |

### 12.9 JobPlanAsset

Purpose: **Planned assets required for a job**

Type: **Junction**

Attributes: **Relations**

| **Attribute** | **Relation**        | **Abstraction** |
| ------------- | ------------------- | --------------- |
| `planId`      | AssociationJunction | JobPlan         |
| `assetId`     | AssociationJunction | Asset           |

### 12.10 JobWork

Purpose: **Execution record; creation transitions job to executing; `work` is an ordered array of resolved workflow IDs — the immutable execution manifest**

Type: **Instantiable**

Attributes: **Relations**

| **Attribute** | **Relation**   | **Abstraction** |
| ------------- | -------------- | --------------- |
| `jobId`       | AssociationOne | Job             |
| `startedById` | AssociationOne | User            |

Attributes: **State**

| **Attribute**  | **Type**                  |
| -------------- | ------------------------- |
| `work`         | CompositionPositive\<Id\> |
| `startedAt`    | When                      |
| `completedAt?` | When                      |

### 12.11 JobWorkLogEntry

Purpose: **Work execution event; append-only log; event details as Answer to Question**

Type: **InstantiableOnly**

Attributes: **Relations**

| **Attribute** | **Relation**   | **Abstraction** |
| ------------- | -------------- | --------------- |
| `jobId`       | AssociationOne | Job             |
| `userId`      | AssociationOne | User            |
| `answer`      | CompositionOne | Answer          |

_End of Domain Data Dictionary Document_
