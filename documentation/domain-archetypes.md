![swarmAg Operations System](../swarmag-ops-logo.png)

# swarmAg Operations System — Domain Model Archetypes

## 1. Overview

Implementation patterns for the `source/domain/` package. This document governs **how** domain meaning is expressed in code. For **what** the domain means, see `domain-model.md`.

### 1.1 Authority Chain

`CONSTITUTION.md`
→ `architecture-core.md`
→ `domain-model.md`
→ `domain-data-dictionary.md`
→ `style-guide.md`

### 1.2 Scope Boundary of Governing Documents

- `domain-model.md` owns domain meaning.
- `domain-data-dictionary.md` owns topic namespaces, abstraction inventory, and field-level reference tables.
- `style-guide.md` owns implementation patterns, file layouts, and coding conventions.
- `domain-archetypes.md` owns how to craft topic namespaces from the data dictionary into archetype artifacts.

## 2. File Organization

The domain layer follows a file-per-topic-namespace pattern, where each file contains the abstractions that define the topic namespace, organized by archetype directory.

| Archetype       | File                   | Purpose                                                     |
| --------------- | ---------------------- | ----------------------------------------------------------- |
| `abstractions/` | `{topic}.ts`           | TypeScript types — the domain truth                         |
| `adapters/`     | `{topic}-adapter.ts`   | Dictionary ↔ domain type serialization                      |
| `protocols/`    | `{topic}-protocol.ts`  | Create and update protocol shapes for boundary transmission |
| `validators/`   | `{topic}-validator.ts` | Boundary validation — returns `ExpectResult`                |
| `schema/`       | `schema.sql`           | Generated canonical PostgreSQL schema                       |

### 2.1 File Format

All domain files conform to `style-guide.md` Functional files format.

### 2.2 Header Public Formatting

The file-header `PUBLIC` subsection is mandatory for all domain archetype files.

`PUBLIC` entries must follow these rules:

- One symbol per line.
- Symbol and description must be on the same line.
- Use at least two spaces between symbol and description.
- Align the description column vertically for all entries in that file header.

### 2.3 Export Comment and Body Section Rules

Exported symbols follow explicit one-line comments:

- Every exported function and exported type alias has a single-line JSDoc comment directly above the export.
- For const-enum pairs in abstractions, use one single-line JSDoc comment above the `const` tuple; the derived `type` directly below inherits that header context.

In-source section dividers are conditional:

- If a file contains only exported symbols at top level, omit in-source `PUBLIC` divider banners.
- If a file contains exports and private helpers, keep explicit section dividers (for example `PUBLIC`, `GUARDS`) to separate concerns.

## 3. Abstractions

Source: `@domain/abstractions/{topic}.ts`

Abstractions are pure TypeScript types. They have no infrastructure dependencies and carry no behavior. They are the domain truth — all other archetypes are derived from them.

### 3.1 Type Classification

Every abstraction in the data dictionary has an explicit type classification. The classification determines the TypeScript pattern used.

| Classification      | Pattern                                     | Lifecycle base                               |
| ------------------- | ------------------------------------------- | -------------------------------------------- |
| `Instantiable`      | Named `type` extending `Instantiable`       | `id`, `createdAt`, `updatedAt`, `deletedAt?` |
| `InstantiableOnly`  | Named `type` extending `InstantiableOnly`   | `id`, `createdAt`                            |
| `Junction`          | Named `type` using `AssociationJunction<T>` | None                                         |
| `object`            | Named `type` — plain shape, no life-cycle   | None                                         |
| `const-enum`        | `const` tuple + derived type alias          | None                                         |
| `intersection-type` | Named `type` extending a base type          | Inherits from base                           |
| `union-type`        | Named discriminated union of constituents   | None                                         |

### 3.2 Instantiable

Extend `Instantiable` from `@core/std` via intersection. Never redeclare `id`, `createdAt`, `updatedAt`, or `deletedAt` inline.

```typescript
import type { AssociationOne, CompositionMany, Instantiable } from '@core/std'
import type { Note } from '@domain/abstractions/common.ts'
import type { UserRole } from '@domain/abstractions/user.ts'

/** System user identity and membership. */
export type User = Instantiable & {
  roles: CompositionPositive<UserRole>
  displayName: string
  primaryEmail: string
  phoneNumber: string
  avatarUrl?: string
  status: 'active' | 'inactive'
}
```

### 3.3 InstantiableOnly

Extend `InstantiableOnly` from `@core/std` can neither be updated nor deleted. Used for append-only tables.

```typescript
import type { AssociationOne, CompositionOne, InstantiableOnly } from '@core/std'
import type { Answer } from '@domain/abstractions/common.ts'
import type { Job } from '@domain/abstractions/job.ts'
import type { User } from '@domain/abstractions/user.ts'

/** Work execution event; append-only log. */
export type JobWorkLogEntry = InstantiableOnly & {
  jobId: AssociationOne<Job>
  userId: AssociationOne<User>
  answer: CompositionOne<Answer>
}
```

### 3.4 Junction

Junction abstractions use `AssociationJunction<T>` for all foreign keys. No life-cycle fields — junctions are hard-deleted only.

```typescript
import type { AssociationJunction, Id } from '@core/std'
import type { Question } from '@domain/abstractions/common.ts'
import type { Task } from '@domain/abstractions/workflow.ts'

/** m:m junction — tasks to questions with explicit ordering. */
export type TaskQuestion = {
  taskId: AssociationJunction<Task>
  questionId: AssociationJunction<Question>
  sequence: number
}
```

### 3.5 Object

Plain shape with no life-cycle base. Used for embedded subordinates and value objects.

```typescript
/** Geographic position plus optional address metadata. */
export type Location = {
  latitude: number
  longitude: number
  altitudeMeters?: number
  line1?: string
  line2?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
  recordedAt?: When
  accuracyMeters?: number
  description?: string
}
```

### 3.6 Const-Enum

Any value set requiring runtime validation. Defined as a `const` tuple paired with a derived type alias. Both exported from the abstractions file. Never redeclared elsewhere.

```typescript
/** Canonical role set. */
export const USER_ROLES = ['administrator', 'sales', 'operations'] as const
export type UserRole = (typeof USER_ROLES)[number]
```

### 3.7 Union-Type

Discriminated union of named intersection-type constituents sharing a discriminator field. Follow `style-guide.md` `union-type` pattern exactly.

```typescript
/** Supported question input modes. */
export const QUESTION_TYPES = [
  'internal',
  'text',
  'number',
  'boolean',
  'single-select',
  'multi-select'
] as const
export type QuestionType = (typeof QUESTION_TYPES)[number]

/** Common shape shared by all Question constituents. */
export type BaseQuestion = Instantiable & {
  type: QuestionType
  prompt: string
  helpText?: string
  required?: boolean
}

/** System-generated question. */
export type InternalQuestion = BaseQuestion & {
  type: 'internal'
}

/** Scalar input question; no options. */
export type ScalarQuestion = BaseQuestion & {
  type: 'text' | 'number' | 'boolean'
}

/** Select input question; options required and non-empty. */
export type SelectQuestion = BaseQuestion & {
  type: 'single-select' | 'multi-select'
  options: CompositionPositive<SelectOption>
}

/** Discriminated union — boundary type used throughout the system. */
export type Question = InternalQuestion | ScalarQuestion | SelectQuestion
```

### 3.8 Association and Composition Relations

Relations from the data dictionary map directly to `@core/std` types.
Never use raw `Id` or `T[]` where a relation type is specified.

| Data dictionary relation | Type                     |
| ------------------------ | ------------------------ |
| `AssociationOne`         | `AssociationOne<T>`      |
| `AssociationOptional`    | `AssociationOptional<T>` |
| `AssociationJunction`    | `AssociationJunction<T>` |
| `CompositionOne`         | `CompositionOne<T>`      |
| `CompositionOptional`    | `CompositionOptional<T>` |
| `CompositionMany`        | `CompositionMany<T>`     |
| `CompositionPositive`    | `CompositionPositive<T>` |

## 4. Protocols

Source: `@domain/protocols/{topic}-protocol.ts`

Protocols define the create and update input shapes transmitted across the system boundary. They are the contract validated at ingress.

### 4.1 Naming

| Shape          | Name            | Helper                          |
| -------------- | --------------- | ------------------------------- |
| Create payload | `{Topic}Create` | CreateFromInstantiable<{Topic}> |
| Update payload | `{Topic}Update` | UpdateFromInstantiable<{Topic}> |

### 4.2 Create and Update

The create and update protocol contain only fields required to create or update an abstraction. All life-cycle fields are excluded — those are set by the persistence layer.

```typescript
import type { CreateFromInstantiable, UpdateFromInstantiable } from '@core/std'
import type { User } from '@domain/abstractions/user.ts'

export type UserCreate = CreateFromInstantiable<User>
export type UserUpdate = UpdateFromInstantiable<User>
```

### 4.3 Junction and InstantiableOnly Protocols

Junction composite keys are identity — no lifecycle fields to strip. The protocol shape is the whole type.

**Pure-key junctions** (composite keys only, no state attributes): Create protocol only — no Update. Junction is created and hard-deleted.

```typescript
// ServiceRequiredAssetType = { serviceId, assetTypeId } — no state
export type ServiceRequiredAssetTypeCreate = ServiceRequiredAssetType
```

**State-bearing junctions** (composite keys plus state attributes, e.g. `sequence`): Both Create and Update. Both are the whole type — composite keys are included in both payloads as identity.

```typescript
// TaskQuestion = { taskId, questionId, sequence } — sequence is state
export type TaskQuestionCreate = TaskQuestion
export type TaskQuestionUpdate = TaskQuestion
```

`InstantiableOnly` abstractions have a Create protocol only — no Update protocol.

### 4.4 Union-Type Protocols

When an abstraction is a `union-type` (discriminated union of concrete variants), derive per-variant create and update types from each concrete member. Never apply `CreateFromInstantiable` or `UpdateFromInstantiable` directly to the union. Export a union alias as the boundary call-site type.

```typescript
import type { CreateFromInstantiable, UpdateFromInstantiable } from '@core/std'
import type { InternalQuestion, ScalarQuestion, SelectQuestion } from '@domain/abstractions/common.ts'

/*  Question Create protocol */
export type InternalQuestionCreate = CreateFromInstantiable<InternalQuestion>
export type ScalarQuestionCreate = CreateFromInstantiable<ScalarQuestion>
export type SelectQuestionCreate = CreateFromInstantiable<SelectQuestion>
export type QuestionCreate = InternalQuestionCreate | ScalarQuestionCreate | SelectQuestionCreate

/* Question Update protocol */
export type InternalQuestionUpdate = UpdateFromInstantiable<InternalQuestion>
export type ScalarQuestionUpdate = UpdateFromInstantiable<ScalarQuestion>
export type SelectQuestionUpdate = UpdateFromInstantiable<SelectQuestion>
export type QuestionUpdate = InternalQuestionUpdate | ScalarQuestionUpdate | SelectQuestionUpdate
```

## 5. Validators

Source: `@domain/validators/{topic}-validator.ts`

Validators enforce protocol contracts at the system boundary.

All field checks use `expect*` helpers from `@core/std` (`validators.ts`).

### 5.1 Naming

| Validator function | Name                    |
| ------------------ | ----------------------- |
| Create validator   | `validate{Topic}Create` |
| Update validator   | `validate{Topic}Update` |

### 5.2 Structure

```typescript
import {
  expectCompositionPositive,
  expectConstEnum,
  expectId,
  expectNonEmptyString,
  expectValid
} from '@core/std/validators.ts'
import type { ExpectGuard, ExpectResult } from '@core/std/validators.ts'
import { USER_ROLES, USER_STATUSES, type UserRole } from '@domain/abstractions/user.ts'
import type { UserCreate, UserUpdate } from '@domain/protocols/user-protocol.ts'

// ────────────────────────────────────────────────────────────────────────────
// VALIDATORS
// ────────────────────────────────────────────────────────────────────────────

/** Validate UserCreate payloads. */
export const validateUserCreate = (input: UserCreate): ExpectResult =>
  expectValid(
    expectCompositionPositive(input.roles, 'roles', isUserRole),
    expectNonEmptyString(input.displayName, 'displayName'),
    expectNonEmptyString(input.primaryEmail, 'primaryEmail'),
    expectNonEmptyString(input.phoneNumber, 'phoneNumber'),
    expectConstEnum(input.status, 'status', USER_STATUSES, true)
  )

/** Validate UserUpdate payloads. */
export const validateUserUpdate = (input: UserUpdate): ExpectResult =>
  expectValid(
    expectId(input.id, 'id'),
    expectCompositionPositive(input.roles, 'roles', isUserRole, true),
    expectNonEmptyString(input.displayName, 'displayName', true),
    expectNonEmptyString(input.primaryEmail, 'primaryEmail', true),
    expectNonEmptyString(input.phoneNumber, 'phoneNumber', true),
    expectConstEnum(input.status, 'status', USER_STATUSES, true)
  )

// ────────────────────────────────────────────────────────────────────────────
// GUARDS
// ────────────────────────────────────────────────────────────────────────────

const isUserRole = (v: unknown): v is UserRole => expectConstEnum(v, 'role', USER_ROLES) === null
```

Validator formatting requirements:

- File-header `PUBLIC` entries must have aligned description columns.
- Every exported validator and exported guard has a single-line JSDoc comment immediately above its export.
- Omit in-source `PUBLIC` divider banners when the validator file is export-only.
- Keep section dividers when private helpers exist.

### 5.3 Union-Type Validation

Validate the discriminator first with `expectConstEnum`, then switch on the type for branch-specific field checks.

```typescript
import { expectCompositionPositive, expectConstEnum, ExpectResult } from '@core/std'
import { QUESTION_TYPES } from '@domain/abstractions/common.ts'
import type { QuestionType, SelectOption } from '@domain/abstractions/common.ts'
import type { QuestionCreate } from '@domain/protocols/common-protocol.ts'

// ────────────────────────────────────────────────────────────────────────────
// VALIDATORS
// ────────────────────────────────────────────────────────────────────────────

/** Validate QuestionCreate payloads. */
export const validateQuestionCreate = (input: QuestionCreate): ExpectResult => {
  const typeError = expectConstEnum(input.type, 'type', QUESTION_TYPES)
  if (typeError) return typeError
  switch (input.type) {
    case 'internal':
      return null
    case 'text':
    case 'number':
    case 'boolean':
      return null
    case 'single-select':
    case 'multi-select':
      return expectCompositionPositive(input.options, 'options', isSelectOption)
  }
}

// ────────────────────────────────────────────────────────────────────────────
// GUARDS
// ────────────────────────────────────────────────────────────────────────────

const isSelectOption = (v: unknown): v is SelectOption => v !== null && typeof v === 'object'
```

### 5.5 Update Validators

Update validators follow the same structure as create validators. Exports at top, guards in a GUARDS section below.

```typescript
import {
  expectCompositionPositive,
  expectConstEnum,
  expectId,
  expectNonEmptyString,
  ExpectResult,
  expectValid
} from '@core/std'
import { USER_ROLES } from '@domain/abstractions/user.ts'
import type { UserRole } from '@domain/abstractions/user.ts'
import type { UserUpdate } from '@domain/protocols/user-protocol.ts'

// ────────────────────────────────────────────────────────────────────────────
// VALIDATORS
// ────────────────────────────────────────────────────────────────────────────

/** Validate UserUpdate payloads. */
export const validateUserUpdate = (input: UserUpdate): ExpectResult =>
  expectValid(
    expectId(input.id, 'id'),
    expectNonEmptyString(input.displayName, 'displayName'),
    expectNonEmptyString(input.primaryEmail, 'primaryEmail'),
    expectNonEmptyString(input.phoneNumber, 'phoneNumber'),
    expectCompositionPositive(input.roles, 'roles', isUserRole)
  )

// ────────────────────────────────────────────────────────────────────────────
// GUARDS
// ────────────────────────────────────────────────────────────────────────────

const isUserRole = (v: unknown): v is UserRole => expectConstEnum(v, 'role', USER_ROLES) === null
```

### 5.6 Object Guards

Every object-type abstraction that appears as a `CompositionOne`, `CompositionMany`, or `CompositionPositive` member must have a named, exported type guard in its topic's validator file. Guards must be typed to the specific abstraction — never generic.

```typescript
// common-validator.ts — exports guards for all common composable object types
export const isNote = (v: unknown): v is Note => v !== null && typeof v === 'object'
export const isLocation = (v: unknown): v is Location => v !== null && typeof v === 'object'
export const isAttachment = (v: unknown): v is Attachment => v !== null && typeof v === 'object'
export const isSelectOption = (v: unknown): v is SelectOption => v !== null && typeof v === 'object'
```

Validators that compose object types from another topic import the typed guard — they do not define their own:

```typescript
// job-validator.ts
import { isLocation, isNote } from '@domain/validators/common-validator.ts'
```

Import direction follows domain dependency flow: common guards flow outward to topic validators.

## 6. Adapters

Source: `@domain/adapters/{topic}-adapter.ts`

Adapters serialize between storage dictionaries and domain abstractions. They contain no business logic and no validation.

### 6.1 Structure

Each topic adapter file exports adapter instances built with `makeAdapter` from `@core/std`.

Adapter contract:

```typescript
type Adapter<T> = {
  toDomain(source: Dictionary): T
  fromDomain(patch: Partial<T>): Dictionary
}
```

`toDomain` deserializes storage dictionaries into domain abstractions.\
`fromDomain` accepts a wider input interface (`Partial<T>`), so both full abstractions and partial protocol/update payloads are valid inputs.

### 6.2 Metadata Mapping Model

Adapters are declared with metadata that maps domain keys to storage columns and optional delegate adapters for nested abstractions.

```typescript
type AdaptDelegate = [column: string, delegate?: Adapter<unknown>]
type Adapt<T> = { [K in keyof T]: AdaptDelegate }
```

`makeAdapter(meta)` is the canonical adapter maker for domain archetypes.

### 6.3 Column and Key Conventions

Domain fields use `camelCase`. Storage columns use `snake_case`.\
Every mapped field is explicit through metadata.

| Domain field   | Storage column   |
| -------------- | ---------------- |
| `id`           | `id`             |
| `createdAt`    | `created_at`     |
| `updatedAt`    | `updated_at`     |
| `deletedAt`    | `deleted_at`     |
| `{camelField}` | `{snake_column}` |

### 6.4 Composition and Delegation

For nested composition values, metadata uses delegate adapters. Delegates apply recursively to both object and array values.

```typescript
import { makeAdapter } from '@core/std'
import type { Attachment, Note } from '@domain/abstractions/common.ts'

export const AttachmentAdapter = makeAdapter<Attachment>({
  filename: ['filename'],
  url: ['url'],
  contentType: ['content_type'],
  kind: ['kind'],
  uploadedAt: ['uploaded_at']
})

export const NoteAdapter = makeAdapter<Note>({
  attachments: ['attachments', AttachmentAdapter],
  createdAt: ['created_at'],
  content: ['content'],
  visibility: ['visibility'],
  tags: ['tags']
})
```

### 6.5 Instantiable and Union-Type Coverage

Instantiable adapters include lifecycle mappings where present (`id`, `createdAt`, `updatedAt`, `deletedAt`).\
Composition-only adapters include only composition fields.

Union-type adapters are still expressed as a single adapter per union abstraction, with metadata covering shared and variant fields. Discriminator semantics remain owned by the abstraction and protocol/validator layers.

### 6.6 Round-Trip Integrity

Every adapter must support clean round-trip behavior:

- `toDomain(source)` returns a valid abstraction from storage form.
- `fromDomain(patch)` emits a storage dictionary for the provided input shape.

Round-trip integrity is enforced by fixture tests in `source/tests/cases/fixtures-test.ts`.

## 7. Schema

Source: `@domain/schema/schema.sql`

DDL is derived from domain abstractions per `style-guide.md` sections 10–11. This section covers archetype-to-table mappings and shapes that require explicit specification.

### 7.1 Archetype-to-table mapping

| Archetype          | Table                                                                         | Lifecycle columns                              |
| ------------------ | ----------------------------------------------------------------------------- | ---------------------------------------------- |
| `Instantiable`     | One table per abstraction                                                     | `id`, `created_at`, `updated_at`, `deleted_at` |
| `InstantiableOnly` | One table per abstraction                                                     | `id`, `created_at` only                        |
| `Junction`         | One table; composite PK                                                       | None                                           |
| `object`           | No table — serialized as JSONB within parent                                  | —                                              |
| `const-enum`       | No table — `CHECK` constraint on parent column                                | —                                              |
| `union-type`       | Single table; all branch fields present, optional defaults on variant columns | Base life-cycle                                |

### 7.2 Table inventory

**Instantiable** (`id`, `created_at`, `updated_at`, `deleted_at`):
`users`, `asset_types`, `assets`, `chemicals`, `customers`, `services`, `workflows`, `tasks`, `questions`, `jobs`, `job_assessments`, `job_workflows`, `job_plans`, `job_plan_assignments`, `job_plan_chemicals`, `job_work`

**InstantiableOnly** (`id`, `created_at` only):
`job_work_log_entries`

**Junction** (composite PK, no life-cycle):
`workflow_tasks`, `task_questions`, `service_required_asset_types`, `job_plan_assets`

### 7.3 Notable table shapes

Tables where domain intent is not mechanically obvious.

**`questions`** — single table for the `Question` union-type; all variant fields present, optional or defaulted:

```sql
CREATE TABLE questions (
  id         UUID        PRIMARY KEY,
  prompt     TEXT        NOT NULL,
  type       TEXT        NOT NULL
                         CHECK (type IN ('text', 'number', 'boolean',
                                        'single-select', 'multi-select', 'internal')),
  help_text  TEXT,
  required   BOOLEAN,
  options    JSONB       NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
```

**`workflow_tasks`** — junction carries `sequence`; workflow owns the relationship (`CASCADE`), task is shared (`RESTRICT`):

```sql
CREATE TABLE workflow_tasks (
  workflow_id UUID    NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  task_id     UUID    NOT NULL REFERENCES tasks(id) ON DELETE RESTRICT,
  sequence    INTEGER NOT NULL,
  PRIMARY KEY (workflow_id, task_id)
);
```

**`task_questions`** — junction carries `sequence`; task owns (`CASCADE`), question is shared (`RESTRICT`):

```sql
CREATE TABLE task_questions (
  task_id     UUID    NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  question_id UUID    NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
  sequence    INTEGER NOT NULL,
  PRIMARY KEY (task_id, question_id)
);
```

**`job_workflows`** — no `sequence` column; execution order is resolved at runtime by `JobWork.work`:

```sql
CREATE TABLE job_workflows (
  id                   UUID        PRIMARY KEY,
  job_id               UUID        NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  basis_workflow_id    UUID        NOT NULL REFERENCES workflows(id) ON DELETE RESTRICT,
  modified_workflow_id UUID        REFERENCES workflows(id) ON DELETE RESTRICT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at           TIMESTAMPTZ
);
```

_End of Domain Archetypes Document_
