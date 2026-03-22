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

// ────────────────────────────────────────────────────────────────────────────
// PROTOCOL
// ────────────────────────────────────────────────────────────────────────────

export type UserCreate = CreateFromInstantiable<User>
export type UserUpdate = UpdateFromInstantiable<User>
```

### 4.3 Junction and InstantiableOnly Protocols

Junction abstractions have no update protocol — they are created and hard-deleted only.

`InstantiableOnly` abstractions have a create protocol only — no update protocol.

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

## 6. Adapters

Source: `@domain/adapters/{topic}-adapter.ts`

Adapters serialize between the storage representation (`Dictionary`) and domain abstractions. They contain no business logic and no validation.

### 6.1 Naming

| Adapter function | Name          |
| ---------------- | ------------- |
| Storage → domain | `to{Topic}`   |
| Domain → storage | `from{Topic}` |

### 6.2 Structure

Each adapter file exports a `to` function and a `from` function for each abstraction in the topic namespace that is persisted. Plain `object` types embedded as compositions are serialized inline within their parent's adapter — they do not get standalone adapter functions.

```typescript
import type { Dictionary } from '@core/std'
import type { User } from '@domain/abstractions/user.ts'

/** Deserialize User from storage dictionary. */
export const toUser = (dict: Dictionary): User => ({
  id: dict.id as Id,
  createdAt: dict.created_at as When,
  updatedAt: dict.updated_at as When,
  deletedAt: dict.deleted_at as When | undefined,
  roles: dict.roles as CompositionPositive<UserRole>,
  displayName: dict.display_name as string,
  primaryEmail: dict.primary_email as string,
  phoneNumber: dict.phone_number as string,
  avatarUrl: dict.avatar_url as string | undefined,
  status: dict.status as 'active' | 'inactive' | undefined
})

/** Serialize User to storage dictionary. */
export const fromUser = (user: User): Dictionary => ({
  id: user.id,
  created_at: user.createdAt,
  updated_at: user.updatedAt,
  deleted_at: user.deletedAt,
  roles: user.roles,
  display_name: user.displayName,
  primary_email: user.primaryEmail,
  phone_number: user.phoneNumber,
  avatar_url: user.avatarUrl,
  status: user.status
})
```

### 6.3 Column Mapping

Domain fields are `camelCase`. Storage columns are `snake_case`. Map every field explicitly — no spread, no payload passthrough.

| Domain field   | Storage column   |
| -------------- | ---------------- |
| `id`           | `id`             |
| `createdAt`    | `created_at`     |
| `updatedAt`    | `updated_at`     |
| `deletedAt`    | `deleted_at`     |
| `{camelField}` | `{snake_column}` |

### 6.4 Composition Serialization

Composition fields (`CompositionOne`, `CompositionMany`, `CompositionPositive`) are stored as JSONB. Deserialize inline within the parent's `to` function.

```typescript
/** Deserialize Asset from storage dictionary. */
export const toAsset = (dict: Dictionary): Asset => ({
  id: dict.id as Id,
  createdAt: dict.created_at as When,
  updatedAt: dict.updated_at as When,
  deletedAt: dict.deleted_at as When | undefined,
  typeId: dict.type_id as AssociationOne<AssetType>,
  notes: (dict.notes as Dictionary[]).map(toNote),
  label: dict.label as string,
  description: dict.description as string | undefined,
  serialNumber: dict.serial_number as string | undefined,
  status: dict.status as AssetStatus
})
```

### 6.5 Union-Type Adapters

```typescript
/** Deserialize Question from storage dictionary. */
export const toQuestion = (dict: Dictionary): Question => {
  const type = dict.type as QuestionType
  switch (type) {
    case 'internal':
      return {
        id: dict.id as Id,
        createdAt: dict.created_at as When,
        updatedAt: dict.updated_at as When,
        deletedAt: dict.deleted_at as When | undefined,
        type,
        prompt: dict.prompt as string,
        helpText: dict.help_text as string | undefined,
        required: dict.required as boolean | undefined
      } satisfies InternalQuestion
    case 'text':
    case 'number':
    case 'boolean':
      return {
        id: dict.id as Id,
        createdAt: dict.created_at as When,
        updatedAt: dict.updated_at as When,
        deletedAt: dict.deleted_at as When | undefined,
        type,
        prompt: dict.prompt as string,
        helpText: dict.help_text as string | undefined,
        required: dict.required as boolean | undefined
      } satisfies ScalarQuestion
    case 'single-select':
    case 'multi-select':
      return {
        id: dict.id as Id,
        createdAt: dict.created_at as When,
        updatedAt: dict.updated_at as When,
        deletedAt: dict.deleted_at as When | undefined,
        type,
        prompt: dict.prompt as string,
        helpText: dict.help_text as string | undefined,
        required: dict.required as boolean | undefined,
        options: (dict.options as Dictionary[]).map(toSelectOption) as CompositionPositive<
          SelectOption
        >
      } satisfies SelectQuestion
  }
}
```

### 6.6 Round-Trip Integrity

Every adapter must support a clean round-trip: `toTopic(fromTopic(obj))` produces a structurally identical object. This is enforced by the fixture round-trip test in `source/tests/cases/fixtures-test.ts`.

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
