# swarmAg System — Data Dictionary

![swarmAg ops logo](../../swarmag-ops-logo.png)

## 1. Overview

This document is the normalized reference for domain abstraction types, relations, and state attributes.
It is derived from section 4 (Data Dictionary) in `documentation/foundation/domain.md` and presents the same model in a table-first, implementation-ready format for adapters, validators, protocols, and schema alignment.

## 2. Core Standard

Source: `@core-std`

### 2.1 Abstract Data Types

| **Name**   | **Type**                | **Purpose**                        |
| ---------- | ----------------------- | ---------------------------------- |
| Id         | UUID v7 string          | Primary/foreign identifier type    |
| When       | ISO 8601 UTC string     | Timestamp type                     |
| Dictionary | JSON-like key/value map | Flexible structured data container |

### 2.2 Instantiable

Type: **type**

Purpose: **Lifecycle base for all persisted abstractions with independent database rows; extend via intersection — do not redeclare these fields inline**

Attributes: **State**

| **Attribute** | **Type** |
| ------------- | -------- |
| `id`          | Id       |
| `createdAt`   | When     |
| `updatedAt`   | When     |
| `deletedAt?`  | When     |

## 3. Common

Source: `@domain/abstractions/common.ts`

### 3.1 Location

Type: **object**

Purpose: **Geographic position plus optional address metadata**

Attributes: **State**

| **Attribute**     | **Type** |
| ----------------- | -------- |
| `latitude`        | number   |
| `longitude`       | number   |
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

### 3.2 Attachment

Type: **object**

Purpose: **Uploaded artifact metadata**

Attributes: **State**

| **Attribute**  | **Type**                          |
| -------------- | --------------------------------- |
| `filename`     | string                            |
| `url`          | string                            |
| `contentType`  | string                            |
| `kind`         | photo \| video \| map \| document |
| `uploadedAt`   | When                              |
| `uploadedById` | Id                                |

### 3.3 Note

Type: **object**

Purpose: **Freeform note with optional visibility/taxonomy**

Attributes: **Relations**

| **Attribute** | **Relation**    | **Abstraction** |
| ------------- | --------------- | --------------- |
| `attachments` | CompositionMany | Attachment      |

Attributes: **State**

| **Attribute** | **Type**                |
| ------------- | ----------------------- |
| `createdAt`   | When                    |
| `authorId?`   | Id                      |
| `content`     | string                  |
| `visibility?` | internal \| shared      |
| `tags`        | CompositionMany<string> |

## 4. Assets

Source: `@domain/abstractions/asset.ts`

### 4.1 AssetType

Type: **Instantiable**

Purpose: **Reference type for categorizing assets**

Attributes: **State**

| **Attribute** | **Type** |
| ------------- | -------- |
| `label`       | string   |
| `active`      | boolean  |

### 4.2 AssetStatus

Type: **const-enum**

Purpose: **Lifecycle/availability state**

| Values        |
| ------------- |
| `active`      |
| `maintenance` |
| `retired`     |
| `reserved`    |

### 4.3 Asset

Type: **Instantiable**

Purpose: **Operational equipment/resource**

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

## 5. Chemicals

Source: `@domain/abstractions/chemical.ts`

### 5.1 ChemicalUsage

Type: **const-enum**

Purpose: **Domain usage classification**

| Values       |
| ------------ |
| `herbicide`  |
| `pesticide`  |
| `fertilizer` |
| `fungicide`  |
| `adjuvant`   |

### 5.2 ChemicalLabel

Type: **object**

Purpose: **Label/document pointer**

Attributes: **State**

| **Attribute**  | **Type** |
| -------------- | -------- |
| `url`          | string   |
| `description?` | string   |

### 5.3 Chemical

Type: **Instantiable**

Purpose: **Regulated material record**

Attributes: **Relations**

| **Attribute** | **Relation**    | **Abstraction** |
| ------------- | --------------- | --------------- |
| `labels`      | CompositionMany | ChemicalLabel   |
| `notes`       | CompositionMany | Note            |

Attributes: **State**

| **Attribute**           | **Type**                     |
| ----------------------- | ---------------------------- |
| `name`                  | string                       |
| `epaNumber?`            | string                       |
| `usage`                 | ChemicalUsage                |
| `signalWord?`           | danger \| warning \| caution |
| `restrictedUse`         | boolean                      |
| `reEntryIntervalHours?` | number                       |
| `storageLocation?`      | string                       |
| `sdsUrl?`               | string                       |

## 6. Customers

Source: `@domain/abstractions/customer.ts`

### 6.1 Contact

Type: **object**

Purpose: **Embedded customer contact; isPrimary flags the primary contact**

Attributes: **Relations**

| **Attribute** | **Relation**    | **Abstraction** |
| ------------- | --------------- | --------------- |
| `notes`       | CompositionMany | Note            |

Attributes: **State**

| **Attribute**       | **Type**               |
| ------------------- | ---------------------- |
| `name`              | string                 |
| `email?`            | string                 |
| `phone?`            | string                 |
| `isPrimary`         | boolean                |
| `preferredChannel?` | email \| text \| phone |

### 6.2 CustomerSite

Type: **object**

Purpose: **Serviceable customer location**

Attributes: **Relations**

| **Attribute** | **Relation**    | **Abstraction** |
| ------------- | --------------- | --------------- |
| `customerId`  | AssociationOne  | Customer        |
| `location`    | CompositionOne  | Location        |
| `notes`       | CompositionMany | Note            |

Attributes: **State**

| **Attribute** | **Type** |
| ------------- | -------- |
| `label`       | string   |
| `acreage?`    | number   |

### 6.3 Customer

Type: **Instantiable**

Purpose: **Customer account aggregate; contacts must be non-empty**

Attributes: **Relations**

| **Attribute**      | **Relation**        | **Abstraction** |
| ------------------ | ------------------- | --------------- |
| `accountManagerId` | AssociationOptional | User            |
| `sites`            | CompositionMany     | CustomerSite    |
| `contacts`         | CompositionPositive | Contact         |
| `notes`            | CompositionMany     | Note            |

Attributes: **State**

| **Attribute** | **Type**                       |
| ------------- | ------------------------------ |
| `name`        | string                         |
| `status`      | active \| inactive \| prospect |
| `line1`       | string                         |
| `line2?`      | string                         |
| `city`        | string                         |
| `state`       | string                         |
| `postalCode`  | string                         |
| `country`     | string                         |

## 7. Services

Source: `@domain/abstractions/service.ts`

### 7.1 ServiceCategory

Type: **const-enum**

Purpose: **Service family classification**

| Values                      |
| --------------------------- |
| `aerial-drone-services`     |
| `ground-machinery-services` |

### 7.2 Service

Type: **Instantiable**

Purpose: **Sellable operational offering**

Attributes: **Relations**

| **Attribute** | **Relation**    | **Abstraction** |
| ------------- | --------------- | --------------- |
| `notes`       | CompositionMany | Note            |

Attributes: **State**

| **Attribute**            | **Type**                |
| ------------------------ | ----------------------- |
| `name`                   | string                  |
| `sku`                    | string                  |
| `description?`           | string                  |
| `category`               | ServiceCategory         |
| `tagsWorkflowCandidates` | CompositionMany<string> |

### 7.3 ServiceRequiredAssetType

Type: **Junction**

Purpose: **m:m junction — services to required asset types; hard delete only**

Attributes: **Relations**

| **Attribute** | **Relation**        | **Abstraction** |
| ------------- | ------------------- | --------------- |
| `serviceId`   | AssociationJunction | Service         |
| `assetTypeId` | AssociationJunction | AssetType       |

## 8. Users

Source: `@domain/abstractions/user.ts`

### 8.1 UserRole

Type: **const-enum**

Purpose: **Canonical role set**

| Values          |
| --------------- |
| `administrator` |
| `sales`         |
| `operations`    |

### 8.2 User

Type: **Instantiable**

Purpose: **System user identity and membership; extends Instantiable**

Attributes: **Relations**

| **Attribute** | **Relation**        | **Abstraction** |
| ------------- | ------------------- | --------------- |
| `roles`       | CompositionPositive | UserRole        |

Attributes: **State**

| **Attribute**  | **Type**           |
| -------------- | ------------------ |
| `displayName`  | string             |
| `primaryEmail` | string             |
| `phoneNumber`  | string             |
| `avatarUrl?`   | string             |
| `status?`      | active \| inactive |

## 9. Workflows

Source: `@domain/abstractions/workflow.ts`

### 9.1 QuestionType

Type: **const-enum**

Purpose: **Supported question input modes; internal is reserved for system-generated log entries such as telemetry, GPS, and operational metadata**

| Values          |
| --------------- |
| `text`          |
| `number`        |
| `boolean`       |
| `single-select` |
| `multi-select`  |
| `internal`      |

### 9.2 QuestionOption

Type: **object**

Purpose: **Selectable option metadata**

Attributes: **State**

| **Attribute**   | **Type** |
| --------------- | -------- |
| `value`         | string   |
| `label?`        | string   |
| `requiresNote?` | boolean  |

### 9.3 Question

Type: **object**

Purpose: **Workflow checklist prompt**

Attributes: **Relations**

| **Attribute** | **Relation**    | **Abstraction** |
| ------------- | --------------- | --------------- |
| `options`     | CompositionMany | QuestionOption  |

Attributes: **State**

| **Attribute** | **Type**     |
| ------------- | ------------ |
| `id`          | Id           |
| `prompt`      | string       |
| `type`        | QuestionType |
| `helpText?`   | string       |
| `required?`   | boolean      |

### 9.4 AnswerValue

Type: **union**

Purpose: **Permitted answer value payloads**

Attributes: **State**

| **Attribute** | **Type** |
| ------------- | -------- |
| `string`      | string   |
| `number`      | number   |
| `boolean`     | boolean  |
| `string[]`    | string[] |

### 9.5 Answer

Type: **object**

Purpose: **Captured response instance; notes carry crew annotations and attachments**

Attributes: **Relations**

| **Attribute** | **Relation**    | **Abstraction** |
| ------------- | --------------- | --------------- |
| `notes`       | CompositionMany | Note            |

Attributes: **State**

| **Attribute**  | **Type**    |
| -------------- | ----------- |
| `questionId`   | Id          |
| `value`        | AnswerValue |
| `capturedAt`   | When        |
| `capturedById` | Id          |

### 9.6 Task

Type: **object**

Purpose: **Atomic executable step; checklist must be non-empty**

Attributes: **Relations**

| **Attribute** | **Relation**        | **Abstraction** |
| ------------- | ------------------- | --------------- |
| `checklist`   | CompositionPositive | Question        |

Attributes: **State**

| **Attribute**  | **Type** |
| -------------- | -------- |
| `id`           | Id       |
| `title`        | string   |
| `description?` | string   |

### 9.7 Workflow

Type: **Instantiable**

Purpose: **Versioned execution template; read-only except for administrator role**

Attributes: **Relations**

| **Attribute** | **Relation**        | **Abstraction** |
| ------------- | ------------------- | --------------- |
| `tasks`       | CompositionPositive | Task            |

Attributes: **State**

| **Attribute**  | **Type**                |
| -------------- | ----------------------- |
| `name`         | string                  |
| `description?` | string                  |
| `version`      | number                  |
| `tags`         | CompositionMany<string> |

## 10. Jobs

Source: `@domain/abstractions/job.ts`

### 10.1 JobStatus

Type: **const-enum**

Purpose: **Job lifecycle state**

| Values         |
| -------------- |
| `'open'`       |
| `'assessing'`  |
| `'planning'`   |
| `'preparing'`  |
| `'executing'`  |
| `'finalizing'` |
| `'closed'`     |
| `'cancelled'`  |

### 10.2 JobAssessment

Type: **Instantiable**

Purpose: **Pre-planning assessment; requires one or more locations**

Attributes: **Relations**

| **Attribute** | **Relation**        | **Abstraction** |
| ------------- | ------------------- | --------------- |
| `jobId`       | AssociationOne      | Job             |
| `assessorId`  | AssociationOne      | User            |
| `locations`   | CompositionPositive | Location        |
| `risks`       | CompositionMany     | Note            |
| `notes`       | CompositionMany     | Note            |

### 10.3 JobWorkflow

Type: **Instantiable**

Purpose: **Job-specific workflow instance; basisWorkflowId references the read-only Workflow master; modifiedWorkflowId is always a clone of the basis, created only when specialization is required during assessment or planning**

Attributes: **Relations**

| **Attribute**        | **Relation**        | **Abstraction** |
| -------------------- | ------------------- | --------------- |
| `jobId`              | AssociationOne      | Job             |
| `basisWorkflowId`    | AssociationOne      | Workflow        |
| `modifiedWorkflowId` | AssociationOptional | Workflow        |

Attributes: **State**

| **Attribute** | **Type** |
| ------------- | -------- |
| `sequence`    | number   |

### 10.4 JobPlanAssignment

Type: **Instantiable**

Purpose: **Assignment of user to plan role; many side of 1:m with JobPlan**

Attributes: **Relations**

| **Attribute** | **Relation**    | **Abstraction** |
| ------------- | --------------- | --------------- |
| `planId`      | AssociationOne  | JobPlan         |
| `userId`      | AssociationOne  | User            |
| `notes`       | CompositionMany | Note            |

Attributes: **State**

| **Attribute** | **Type** |
| ------------- | -------- |
| `role`        | UserRole |

### 10.5 JobPlanChemical

Type: **Instantiable**

Purpose: **Planned chemical usage; many side of 1:m with JobPlan**

Attributes: **Relations**

| **Attribute** | **Relation**   | **Abstraction** |
| ------------- | -------------- | --------------- |
| `planId`      | AssociationOne | JobPlan         |
| `chemicalId`  | AssociationOne | Chemical        |

Attributes: **State**

| **Attribute**     | **Type**                             |
| ----------------- | ------------------------------------ |
| `amount`          | number                               |
| `unit`            | gallon \| liter \| pound \| kilogram |
| `targetArea?`     | number                               |
| `targetAreaUnit?` | acre \| hectare                      |

### 10.6 JobPlanAsset

Type: **Junction**

Purpose: **m:m junction — plans to assets; hard delete only**

Attributes: **Relations**

| **Attribute** | **Relation**        | **Abstraction** |
| ------------- | ------------------- | --------------- |
| `planId`      | AssociationJunction | JobPlan         |
| `assetId`     | AssociationJunction | Asset           |

### 10.7 JobPlan

Type: **Instantiable**

Purpose: **Job-specific execution plan**

Attributes: **Relations**

| **Attribute** | **Relation**    | **Abstraction** |
| ------------- | --------------- | --------------- |
| `jobId`       | AssociationOne  | Job             |
| `notes`       | CompositionMany | Note            |

Attributes: **State**

| **Attribute**    | **Type** |
| ---------------- | -------- |
| `scheduledStart` | When     |
| `scheduledEnd?`  | When     |

### 10.8 JobWork

Type: **Instantiable**

Purpose: **Execution record; creation transitions Job to executing; work is an ordered array of resolved Workflow IDs (basis if unmodified, modified clone otherwise) — the immutable execution manifest**

Attributes: **Relations**

| **Attribute** | **Relation**   | **Abstraction** |
| ------------- | -------------- | --------------- |
| `jobId`       | AssociationOne | Job             |
| `startedById` | AssociationOne | User            |

Attributes: **State**

| **Attribute**  | **Type**                |
| -------------- | ----------------------- |
| `work`         | CompositionPositive<Id> |
| `startedAt`    | When                    |
| `completedAt?` | When                    |

### 10.9 JobWorkLogEntry

Type: **object**

Purpose: **Append-only execution event; answer is always present and captures both crew checklist responses (text, number, boolean, single-select, multi-select) and system-generated telemetry via internal question type**

Attributes: **Relations**

| **Attribute** | **Relation**   | **Abstraction** |
| ------------- | -------------- | --------------- |
| `jobId`       | AssociationOne | Job             |
| `userId`      | AssociationOne | User            |
| `answer`      | CompositionOne | Answer          |

Attributes: **State**

| **Attribute** | **Type** |
| ------------- | -------- |
| `id`          | Id       |
| `createdAt`   | When     |

### 10.10 Job

Type: **Instantiable**

Purpose: **Work agreement lifecycle anchor**

Attributes: **Relations**

| **Attribute** | **Relation**   | **Abstraction** |
| ------------- | -------------- | --------------- |
| `customerId`  | AssociationOne | Customer        |

Attributes: **State**

| **Attribute** | **Type**  |
| ------------- | --------- |
| `status`      | JobStatus |
