# Domain Sub-Layers Generation Prompt

You are an AI Coding Engine operating under `CONSTITUTION.md`. You have no architectural authority. Implement exactly what is specified. Do not invent abstractions, reinterpret intent, or cross architectural boundaries.

## Authority

In case of conflict: `CONSTITUTION.md` → `architecture-core.md` → `domain.md` → `domain-archetypes.md` → `style-guide.md`

You MUST ingest all of these files PRIOR to assessing your task. Confirm you have no conflicts, questions, or concerns before generating any files.

## Task

Generate the three domain sub-layers from scratch:

- `source/domain/adapters/`
- `source/domain/protocols/`
- `source/domain/validators/`

Delete existing files and replace them completely. Do not patch.

## Target File Inventory

```
source/domain/adapters/
  common-adapter.ts
  asset-adapter.ts
  chemical-adapter.ts
  customer-adapter.ts
  service-adapter.ts
  user-adapter.ts
  workflow-adapter.ts
  job-adapter.ts

source/domain/protocols/
  asset-protocol.ts
  chemical-protocol.ts
  customer-protocol.ts
  service-protocol.ts
  user-protocol.ts
  workflow-protocol.ts
  job-protocol.ts

source/domain/validators/
  asset-validator.ts
  chemical-validator.ts
  customer-validator.ts
  service-validator.ts
  user-validator.ts
  workflow-validator.ts
  job-validator.ts
```

## Formatting Rules (non-negotiable)

- No semicolons
- Single quotes for all string literals
- TypeScript strict mode — `deno task check` must pass
- No `any` — use `unknown` at boundaries
- File format per `style-guide.md` section 6.1 Spec files all files

## Import Aliases

Trailing slashes required on directory aliases:

```
@core-std       → source/core/std/std.ts
@core/          → source/core/
@domain/        → source/domain/
```

`@core-std` barrel exports: `Id`, `When`, `Dictionary`, `Instantiable`, `notValid`, `isNonEmptyString`, `isId`, `isWhen`, `isPositiveNumber`, `CompositionOne`, `CompositionOptional`, `CompositionMany`, `CompositionPositive`, `AssociationOne`, `AssociationOptional`, `AssociationJunction`, `isCompositionOne`, `isCompositionOptional`, `isCompositionMany`, `isCompositionPositive`, `demandOne`, `optionalOne`

## Abstraction Source Files

The complete, authoritative domain type definitions are in `source/domain/abstractions/`:

| File          | Key types exported                                                                                                                                                                                    |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `common.ts`   | `Location`, `Attachment`, `AttachmentKind`, `Note`                                                                                                                                                    |
| `asset.ts`    | `ASSET_STATUSES`, `AssetStatus`, `AssetType`, `Asset`                                                                                                                                                 |
| `chemical.ts` | `CHEMICAL_USAGES`, `ChemicalUsage`, `ChemicalLabel`, `Chemical`                                                                                                                                       |
| `customer.ts` | `Contact`, `CustomerSite`, `Customer`                                                                                                                                                                 |
| `service.ts`  | `SERVICE_CATEGORIES`, `ServiceCategory`, `Service`, `ServiceRequiredAssetType`                                                                                                                        |
| `user.ts`     | `USER_ROLES`, `UserRole`, `User`                                                                                                                                                                      |
| `workflow.ts` | `QUESTION_TYPES`, `QuestionType`, `QuestionOption`, `Question`, `AnswerValue`, `Answer`, `Task`, `Workflow`                                                                                           |
| `job.ts`      | `JOB_STATUSES`, `JobStatus`, `CHEMICAL_UNITS`, `ChemicalUnit`, `Job`, `JobAssessment`, `JobWorkflow`, `JobPlan`, `JobPlanAssignment`, `JobPlanChemical`, `JobPlanAsset`, `JobWork`, `JobWorkLogEntry` |

---

## 1. Adapter Sub-Layer (`adapters/`)

### 1.1 Pattern

Each adapter file exports `to{Abstraction}` and `from{Abstraction}` functions. No other exports.

```typescript
/**
 * {Abstraction} et al adapters to and from Dictionary representation
 */
import type { Dictionary, When } from '@core-std'
import { notValid } from '@core-std'
import type { Foo } from '@domain/abstractions/foo.ts'

/** Create a Foo from serialized dictionary format */
export const toFoo = (dict: Dictionary): Foo => {
  if (!dict.id) return notValid('Foo dictionary missing required field: id')
  if (!dict.label) return notValid('Foo dictionary missing required field: label')
  return {
    id: dict.id as string,
    label: dict.label as string,
    createdAt: dict.created_at as When,
    updatedAt: dict.updated_at as When,
    deletedAt: dict.deleted_at as When | undefined
  }
}

/** Serialized a Foo to dictionary format */
export const fromFoo = (foo: Foo): Dictionary => ({
  id: foo.id,
  label: foo.label,
  created_at: foo.createdAt,
  updated_at: foo.updatedAt,
  deleted_at: foo.deletedAt
})
```

### 1.2 `common-adapter.ts`

Exports composition helpers only — used by all other adapters:

```
toLocation / fromLocation
toNote / fromNote
toAttachment / fromAttachment
```

`Location`, `Note`, `Attachment` have no `id` or lifecycle fields of their own (except `Note.id: Id` and `Attachment.id: Id` which are plain value fields, not FK references — map them directly as `string`).

### 1.3 Field Mapping Rules

- DB column names are `snake_case`; domain fields are `camelCase`
- FK `AssociationOne<T>` / `AssociationOptional<T>` / `AssociationJunction<T>` fields: strip the `Id` suffix for the DB column name
  - `customerId` → `customer_id`, `planId` → `plan_id`, `basisWorkflowId` → `basis_workflow_id`
- `AssociationOptional<T>` resolves to `Id | undefined` — cast as `dict.foo_id as string | undefined`
- `CompositionMany<T>` / `CompositionPositive<T>` fields are stored as JSONB — Supabase SDK deserializes automatically; map with `.map(toChild)` / `.map(fromChild)` — no `JSON.parse`/`JSON.stringify`
- `CompositionOne<T>` fields: wrap in single-element array on `from`, unwrap with `[0]` on `to` after mapping — e.g. `answer: [toAnswer(dict.answer as Dictionary)]`
- Fast-fail on every required scalar field using `notValid` — all `notValid` calls must precede the single `return` statement so the compiler sees an unconditional return path
- Optional fields: do not guard — cast directly: `description: dict.description as string | undefined`
- `deletedAt` is always optional: `deletedAt: dict.deleted_at as When | undefined`

### 1.4 Junction and Flat Types

`ServiceRequiredAssetType`, `JobPlanAsset` are pure junctions with no lifecycle. Provide adapters but omit `notValid` guards for the two FK columns since both are required by the junction contract — simply cast:

```typescript
export const toServiceRequiredAssetType = (dict: Dictionary): ServiceRequiredAssetType => ({
  serviceId: dict.service_id as string,
  assetTypeId: dict.asset_type_id as string
})
```

`JobWorkLogEntry` has no lifecycle (no `updatedAt`, no `deletedAt`) but does have `id` and `createdAt` as plain value fields — map them directly.

### 1.5 Notable Per-Type Mappings

| Domain field                     | DB column              | Notes                                                                               |
| -------------------------------- | ---------------------- | ----------------------------------------------------------------------------------- |
| `Asset.type`                     | `type_id`              | `AssociationOne<AssetType>` → single UUID column                                    |
| `Customer.accountManagerId`      | `account_manager_id`   | `AssociationOptional<User>` → nullable UUID                                         |
| `Customer.sites`                 | `sites`                | JSONB; `CustomerSite` has its own `id` and `customerId` — map all fields            |
| `Customer.contacts`              | `contacts`             | JSONB; `Contact` has no `id`, no lifecycle                                          |
| `JobWorkLogEntry.answer`         | `answer`               | `CompositionOne<Answer>` stored as JSONB; wrap/unwrap single-element array          |
| `JobWork.work`                   | `work`                 | `CompositionPositive<Id>` stored as JSONB array of UUID strings; cast as `string[]` |
| `Workflow.tasks`                 | `tasks`                | JSONB; each `Task` contains `checklist: CompositionPositive<Question>` — recurse    |
| `Chemical.labels`                | `labels`               | JSONB; `ChemicalLabel` has no `id`, no lifecycle                                    |
| `JobWorkflow.modifiedWorkflowId` | `modified_workflow_id` | `AssociationOptional<Workflow>` → nullable UUID                                     |

---

## 2. Protocol Sub-Layer (`protocols/`)

### 2.1 Pattern

```typescript
/**
 * Protocol input shapes for {Abstraction} boundary operations.
 */

import type { Id } from '@core-std'
import type { FooStatus } from '@domain/abstractions/foo.ts'

/** Input for creating a Foo. */
export type FooCreate = {
  label: string
  status: FooStatus
}

/** Input for updating a Foo. */
export type FooUpdate = {
  id: Id
  label?: string
  status?: FooStatus
}
```

### 2.2 Rules

- `{Abstraction}Create` and `{Abstraction}Update` per lifecycled abstraction
- `{Abstraction}Update` always includes `id: Id`
- Partial shapes — only fields meaningful for the operation; omit `createdAt`, `updatedAt`, `deletedAt`
- FK fields use bare `Id` — not `Association*` types
- No business logic; protocols are transmission shapes only
- Embedded composition fields that are writable use their child's create shape:
  - e.g. `Customer.contacts` in `CustomerCreate` uses the `Contact` type directly (it has no create/update protocol of its own)
- Read-only master abstractions (`Workflow`) omit `{Abstraction}Update`; provide `WorkflowCreate` only
- Junction types (`ServiceRequiredAssetType`, `JobPlanAsset`) provide only a create shape — no `id`, no `{Abstraction}Update`
- `JobWorkLogEntry` is append-only — provide `JobWorkLogEntryCreate` only; no `{Abstraction}Update`
- `JobWork` is created once and its `work` manifest is immutable — provide `JobWorkCreate` only; no `{Abstraction}Update`
- `JobWorkflow` supports both create and update (sequence or modifiedWorkflowId may change during planning)

### 2.3 Per-Abstraction Guidance

| Abstraction         | Create fields                                                                                                                 | Update fields (id + optionals)                                                                 |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `AssetType`         | `label`, `active`                                                                                                             | `label?`, `active?`                                                                            |
| `Asset`             | `label`, `type: Id`, `status`                                                                                                 | `label?`, `type?: Id`, `status?`                                                               |
| `Chemical`          | `name`, `epaNumber?`, `usage`, `signalWord?`, `restrictedUse`, `reEntryIntervalHours?`, `storageLocation?`, `sdsUrl?`         | same fields all optional                                                                       |
| `Customer`          | `name`, `status`, `line1`, `line2?`, `city`, `state`, `postalCode`, `country`, `accountManagerId?: Id`, `contacts: Contact[]` | `name?`, `status?`, address fields all optional, `accountManagerId?: Id`                       |
| `CustomerSite`      | `customerId: Id`, `label`, `location: Location`, `acreage?`                                                                   | `label?`, `location?: Location`, `acreage?`                                                    |
| `Service`           | `name`, `sku`, `description?`, `category`                                                                                     | `name?`, `sku?`, `description?`, `category?`                                                   |
| `User`              | `displayName`, `primaryEmail`, `phoneNumber`, `avatarUrl?`, `roles: UserRole[]`                                               | `displayName?`, `primaryEmail?`, `phoneNumber?`, `avatarUrl?`, `roles?: UserRole[]`, `status?` |
| `Workflow`          | `name`, `description?`, `version`, `tags: string[]`, `tasks: Task[]`                                                          | _(omit — read-only master)_                                                                    |
| `Job`               | `customerId: Id`                                                                                                              | `status?`                                                                                      |
| `JobAssessment`     | `jobId: Id`, `assessorId: Id`, `locations: Location[]`                                                                        | `assessorId?: Id`, `locations?: Location[]`                                                    |
| `JobWorkflow`       | `jobId: Id`, `sequence`, `basisWorkflowId: Id`, `modifiedWorkflowId?: Id`                                                     | `sequence?`, `modifiedWorkflowId?: Id`                                                         |
| `JobPlan`           | `jobId: Id`, `scheduledStart: When`, `scheduledEnd?: When`                                                                    | `scheduledStart?`, `scheduledEnd?`                                                             |
| `JobPlanAssignment` | `planId: Id`, `userId: Id`, `role: UserRole`                                                                                  | `role?`                                                                                        |
| `JobPlanChemical`   | `planId: Id`, `chemicalId: Id`, `amount`, `unit`, `targetArea?`, `targetAreaUnit?`                                            | `amount?`, `unit?`, `targetArea?`, `targetAreaUnit?`                                           |
| `JobPlanAsset`      | `planId: Id`, `assetId: Id`                                                                                                   | _(junction — no Update)_                                                                  |
| `JobWork`           | `jobId: Id`, `work: Id[]`, `startedAt: When`, `startedById: Id`                                                               | _(immutable manifest — no Update)_                                                        |
| `JobWorkLogEntry`   | `jobId: Id`, `userId: Id`, `answer: Answer`                                                                                   | _(append-only — no Update)_                                                               |

Import `Location`, `Contact`, `Answer`, `Task`, `UserRole`, `When` from their respective abstraction files as needed. Import `Id`, `When` from `@core-std`.

---

## 3. Validator Sub-Layer (`validators/`)

### 3.1 Pattern

```typescript
/**
 * {Abstraction} protocol validator
 */

import { isCompositionPositive, isId, isNonEmptyString } from '@core-std'
import type { Foo } from '@domain/abstractions/foo.ts'
import type { FooCreate } from '@domain/protocols/foo-protocol.ts'

// ────────────────────────────────────────────────────────────────────────────
// VALIDATORS
// ────────────────────────────────────────────────────────────────────────────

/** Validates FooCreate; returns error message or null. */
export const validateFooCreate = (input: FooCreate): string | null => {
  if (!isNonEmptyString(input.name)) return 'name must be a non-empty string'
  return null
}

// ────────────────────────────────────────────────────────────────────────────
// VALIDATOR DECOMPOSITION
// ────────────────────────────────────────────────────────────────────────────

const isFoo = (v: unknown): v is Foo => { ... }
```

### 3.2 Rules

- Export `validate{Abstraction}Create` (and `validate{Abstraction}Update` where `{Abstraction}Update` exists)
- Return `string | null` — error message or `null` for valid
- Validate at system boundaries only — never re-validate inside domain logic
- Use `@core-std` primitives: `isNonEmptyString`, `isId`, `isWhen`, `isPositiveNumber`, `isComposition*`
- No throwing — validators return, callers decide
- Update validators: validate `id` first (`isId`), then validate any provided optional fields (only validate non-undefined fields)

### 3.3 Const-Enum Membership (non-negotiable)

Validators import the const-enum tuple from the abstraction file and use `.includes()` for membership checks. **Never redeclare a local tuple copy in a validator file.**

```typescript
// CORRECT — import and reuse
import { QUESTION_TYPES } from '@domain/abstractions/workflow.ts'
QUESTION_TYPES.includes(q.type as Question['type'])

// WRONG — local redeclaration is a violation
const QUESTION_TYPES = ['text', 'number', ...] as const
```

Import the following tuples from their abstraction files:

| Tuple constant       | Import from                        |
| -------------------- | ---------------------------------- |
| `ASSET_STATUSES`     | `@domain/abstractions/asset.ts`    |
| `CHEMICAL_USAGES`    | `@domain/abstractions/chemical.ts` |
| `SERVICE_CATEGORIES` | `@domain/abstractions/service.ts`  |
| `USER_ROLES`         | `@domain/abstractions/user.ts`     |
| `QUESTION_TYPES`     | `@domain/abstractions/workflow.ts` |
| `JOB_STATUSES`       | `@domain/abstractions/job.ts`      |
| `CHEMICAL_UNITS`     | `@domain/abstractions/job.ts`      |

### 3.4 Explicit Decomposition Rules (non-negotiable)

Per `CONSTITUTION.md §9.5.1` (Explicit over clever):

1. **Named guards** — every domain object type validated in the file gets a private `is{Abstraction}` guard
2. **Recursive delegation** — `isComposition*(data, is{Child})` to delegate down the tree
3. **Primitive-only anonymous functions** — anonymous arrows permitted only for primitives: `(v): v is string => isNonEmptyString(v)`; all object validation must be a named guard
4. **Input narrowing** — guards narrow with `Dictionary` casts from `@core-std`, not `Record<string, unknown>`

### 3.5 Per-Abstraction Validator Notes

| Abstraction         | Create validations (key rules)                                                                           | Update validations                                        |
| ------------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `AssetType`         | `label` non-empty string; `active` boolean                                                               | `id` isId; optionals: check if provided before validating |
| `Asset`             | `label` non-empty; `type` isId; `status` in `ASSET_STATUSES`                                             | `id` isId                                                 |
| `Chemical`          | `name` non-empty; `usage` in `CHEMICAL_USAGES`; `restrictedUse` boolean                                  | `id` isId                                                 |
| `Customer`          | `name` non-empty; required address fields non-empty; `contacts` isCompositionPositive using `isContact`  | `id` isId                                                 |
| `Service`           | `name` non-empty; `sku` non-empty; `category` in `SERVICE_CATEGORIES`                                    | `id` isId                                                 |
| `User`              | `displayName`, `primaryEmail`, `phoneNumber` non-empty; `roles` isCompositionPositive using `isUserRole` | `id` isId                                                 |
| `Workflow`          | `name` non-empty; `version` isPositiveNumber; `tasks` isCompositionPositive using `isTask`               | _(no Update — omit update validator)_                |
| `Job`               | `customerId` isId                                                                                        | `id` isId; `status` in `JOB_STATUSES` if provided         |
| `JobAssessment`     | `jobId` isId; `assessorId` isId; `locations` isCompositionPositive using `isLocation`                    | `id` isId                                                 |
| `JobWorkflow`       | `jobId` isId; `sequence` isPositiveNumber; `basisWorkflowId` isId                                        | `id` isId                                                 |
| `JobPlan`           | `jobId` isId; `scheduledStart` isWhen                                                                    | `id` isId                                                 |
| `JobPlanAssignment` | `planId` isId; `userId` isId; `role` in `USER_ROLES`                                                     | `id` isId                                                 |
| `JobPlanChemical`   | `planId` isId; `chemicalId` isId; `amount` isPositiveNumber; `unit` in `CHEMICAL_UNITS`                  | `id` isId                                                 |
| `JobWork`           | `jobId` isId; `work` isCompositionPositive using `isId`; `startedAt` isWhen; `startedById` isId          | _(no Update — omit update validator)_                |
| `JobWorkLogEntry`   | `jobId` isId; `userId` isId; `answer` isCompositionOne using `isAnswer`                                  | _(no Update — omit update validator)_                |

Private object guards needed per file:

- `asset-validator.ts`: no sub-object guards required beyond primitives
- `chemical-validator.ts`: no sub-object guards required for create validator (ChemicalCreate takes scalar fields only)
- `customer-validator.ts`: `isContact`, `isLocation`
- `workflow-validator.ts`: `isQuestionOption`, `isQuestion`, `isTask`
- `job-validator.ts`: `isLocation`, `isAnswer`

`isAnswer` guard shape:

```typescript
const isAnswer = (v: unknown): v is Answer => {
  if (!v || typeof v !== 'object') return false
  const a = v as Dictionary
  return isId(a.questionId as unknown)
    && isWhen(a.capturedAt as unknown)
    && isId(a.capturedById as unknown)
}
```

`isQuestion` guard shape — import `QUESTION_TYPES`, do not redeclare:

```typescript
import { QUESTION_TYPES } from '@domain/abstractions/workflow.ts'

const isQuestion = (v: unknown): v is Question => {
  if (!v || typeof v !== 'object') return false
  const q = v as Dictionary
  return isId(q.id as unknown)
    && isNonEmptyString(q.prompt as unknown)
    && QUESTION_TYPES.includes(q.type as Question['type'])
}
```

`isTask` guard shape:

```typescript
const isTask = (v: unknown): v is Task => {
  if (!v || typeof v !== 'object') return false
  const t = v as Dictionary
  return isId(t.id as unknown)
    && isNonEmptyString(t.title as unknown)
    && isCompositionPositive(t.checklist, isQuestion)
}
```

---

## Quality Bar

Before finalizing each file verify:

1. **Adapters**
   - Every `Instantiable` field (`createdAt`, `updatedAt`, `deletedAt?`) mapped to/from `snake_case` DB columns
   - Every FK field (`Association*`) maps to/from a `_id`-suffixed DB column
   - Every `Composition*` field mapped with `.map()` — no raw casts of array fields
   - All `notValid` guards precede the single `return` — no unreachable returns
   - No semicolons; single quotes; no `any`

2. **Protocols**
   - No `Instantiable` lifecycle fields in any input type
   - FK fields use bare `Id`, not `Association*` types
   - `{Abstraction}Update` always has `id: Id` as first field
   - Append-only / immutable abstractions have no `{Abstraction}Update`
   - No semicolons; single quotes; no `any`

3. **Validators**
   - Every exported validator returns `string | null`
   - Every object-level validation uses a named private `is*` guard
   - Enum membership checks import the tuple from the abstraction file — no local redeclarations
   - Update validators only validate fields that are present (check `!== undefined` before validating optional fields)
   - No semicolons; single quotes; no `any`
   - `deno task check` passes
