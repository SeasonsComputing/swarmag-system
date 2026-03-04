# swarmAg Operations System — Domain Model Archetypes

![swarmAg ops logo](../../swarmag-ops-logo.png)

## 1. Overview

Implementation patterns for the `source/domain/` package. This document governs **how** domain meaning is expressed in code. For **what** the domain means, see `domain.md`.

### 1.1 Authority Chain

`CONSTITUTION.md`
→ `architecture-core.md`
→ `domain.md`
→ `data-dictionary.md`
→ `domain-archetypes.md`
→ `style-guide.md`

### 1.2 Scope Boundary

- `domain.md` owns domain meaning and invariants.
- `data-dictionary.md` owns abstraction inventory and field-level reference tables.
- `domain-archetypes.md` owns implementation patterns only (file layout, typing patterns, adapter/protocol/validator/schema mechanics).

## 2. File Organization

The domain layer follows an abstraction-per-file pattern across five subdirectories:

| Sub-layer       | File                         | Purpose                                              |
| --------------- | ---------------------------- | ---------------------------------------------------- |
| `abstractions/` | `{abstraction}.ts`           | TypeScript types — the domain truth                  |
| `adapters/`     | `{abstraction}-adapter.ts`   | Dictionary ↔ domain type serialization               |
| `protocols/`    | `{abstraction}-protocol.ts`  | Create/update input shapes for boundary transmission |
| `validators/`   | `{abstraction}-validator.ts` | Boundary validation — returns `string \| null`       |
| `schema/`       | `schema.sql`                 | Generated canonical PostgreSQL schema                |

Placement rules are topic-area based and must align with namespace ownership in `data-dictionary.md` section 2:

- `common` namespace abstractions are implemented in `common.ts`, `common-adapter.ts`, `common-protocol.ts`, and `common-validator.ts`
- `workflow` namespace abstractions are implemented in `workflow.ts`, `workflow-adapter.ts`, `workflow-protocol.ts`, and `workflow-validator.ts`
- all remaining namespace abstractions follow `{topic}.ts`, `{topic}-adapter.ts`, `{topic}-protocol.ts`, `{topic}-validator.ts`

### 2.1 File format

All domain files conform to `style-guide.md` section 6.1 Spec files.

### 2.2 Topic-area namespaces

Protocol, adapter, and validator files are organized by topic-area namespace, not one-to-one with abstractions. `job-protocol.ts` covers all job-area types; `asset-protocol.ts` covers all asset-area types; and so on. A single file per sub-layer per topic area.

## 3. Abstraction Archetype (`abstractions/`)

### 3.1 Rules

- `type` for all domain shapes, aliases, unions. `interface` only for contracts that something explicitly implements.
- Lifecycled abstractions extend `Instantiable` via intersection — never redeclare `id`, `createdAt`, `updatedAt`, `deletedAt?` inline.
- Embedded subordinate compositions use `Composition*<T>` from `@core-std`.
- FK references use `Association*<T>` from `@core-std`.
- JSON-serializable only — no methods on domain objects.
- No variadic tuple types anywhere.
- Abstraction definitions are the single source of truth for protocol field sets — `CreateFromInstantiable<T>` and `UpdateFromInstantiable<T>` derive protocol shapes directly. No manual synchronization required.

### 3.2 Const-enum pattern (non-negotiable)

Any domain value set that requires runtime validation must be expressed as a `const` tuple paired with a derived type alias.

```typescript
/** Lifecycle and availability state. */
export const ASSET_STATUSES = ['active', 'maintenance', 'retired', 'reserved'] as const
export type AssetStatus = (typeof ASSET_STATUSES)[number]
```

- Tuple named `SCREAMING_SNAKE`; derived type named `PascalCase`.
- Both exported from the abstraction file — never redeclared elsewhere.
- Validators import the tuple and use `.includes()` — never redeclare a local copy.

### 3.3 Union-type pattern

When a domain concept has structurally distinct variants sharing a discriminator field, express as named constituents combined into a discriminated union. Do not embed optional fields that only apply to some variants.

```typescript
/** Scalar input question; no options. */
export type ScalarQuestion = Instantiable & {
  type: 'text' | 'number' | 'boolean' | 'internal'
  prompt: string
  helpText?: string
  required?: boolean
}

/** Select input question; options required and non-empty. */
export type SelectQuestion = Instantiable & {
  type: 'single-select' | 'multi-select'
  prompt: string
  helpText?: string
  required?: boolean
  options: CompositionPositive<SelectableOption>
}

/** Discriminated union — boundary type used throughout the system. */
export type Question = ScalarQuestion | SelectQuestion
```

- Constituent types are named and exported — they carry independent domain meaning.
- The union type is the boundary type used by adapters, validators, and callers.
- The discriminator field (`type`) must be present in every constituent.
- `CompositionPositive` (not `CompositionMany`) on fields that must be non-empty when present.
- No anonymous union arms.

## 4. Adapter Archetype (`adapters/`)

### 4.1 Pattern

```typescript
/**
 * Asset domain adapters.
 */

import type { Dictionary, When } from '@core-std'
import { notValid } from '@core-std'
import type { Asset, AssetStatus } from '@domain/abstractions/asset.ts'
import type { Note } from '@domain/abstractions/common.ts'
import { fromNote, toNote } from '@domain/adapters/common-adapter.ts'

/** Create an Asset from its dictionary representation. */
export const toAsset = (dict: Dictionary): Asset => {
  if (!dict.id) return notValid('Asset dictionary missing required field: id')
  if (!dict.label) return notValid('Asset dictionary missing required field: label')
  return {
    id: dict.id as string,
    label: dict.label as string,
    type: dict.type_id as string,
    status: dict.status as AssetStatus,
    notes: (dict.notes as Note[]).map(toNote),
    createdAt: dict.created_at as When,
    updatedAt: dict.updated_at as When,
    deletedAt: dict.deleted_at as When | undefined
  }
}

/** Create a dictionary representation from an Asset. */
export const fromAsset = (asset: Asset): Dictionary => ({
  id: asset.id,
  label: asset.label,
  type_id: asset.type,
  status: asset.status,
  notes: asset.notes.map(fromNote),
  created_at: asset.createdAt,
  updated_at: asset.updatedAt,
  deleted_at: asset.deletedAt
})
```

### 4.2 `common-adapter.ts`

Exports shared composition helpers imported by all other adapters:

```
toLocation / fromLocation
toAttachment / fromAttachment
toNote / fromNote
toSelectableOption / fromSelectableOption
toQuestion / fromQuestion
toAnswer / fromAnswer
```

### 4.3 Union-type adapter pattern for `Question`

Use a `switch` on the discriminator — exhaustive, no fall-through default:

```typescript
export const toQuestion = (dict: Dictionary): Question => {
  const type = dict.type as QuestionType

  switch (type) {
    case 'single-select':
    case 'multi-select':
      return {
        id: dict.id as string,
        type,
        prompt: dict.prompt as string,
        helpText: dict.help_text as string | undefined,
        required: dict.required as boolean | undefined,
        options: (dict.options as Dictionary[]).map(toSelectableOption),
        createdAt: dict.created_at as When,
        updatedAt: dict.updated_at as When,
        deletedAt: dict.deleted_at as When | undefined
      } satisfies SelectQuestion

    case 'text':
    case 'number':
    case 'boolean':
    case 'internal':
      return {
        id: dict.id as string,
        type,
        prompt: dict.prompt as string,
        helpText: dict.help_text as string | undefined,
        required: dict.required as boolean | undefined,
        createdAt: dict.created_at as When,
        updatedAt: dict.updated_at as When,
        deletedAt: dict.deleted_at as When | undefined
      } satisfies ScalarQuestion
  }
}
```

### 4.4 Rules

- Functions only — `to{Abstraction}(dict: Dictionary): Abstraction` and `from{Abstraction}(abstraction: Abstraction): Dictionary`
- Map every field explicitly — no `...spread`, no payload shortcut
- `snake_case` for database column names; `camelCase` for domain fields
- Fast-fail on missing required fields using `notValid` from `@core-std` — not `throw`
- All `notValid` calls precede the single return statement
- `Composition*` fields mapped with `.map(toChild)` / `.map(fromChild)` — no raw array casts
- `Association*` fields resolve to `Id` or `Id | undefined` — cast from Dictionary as `string`

## 5. Protocol Archetype (`protocols/`)

### 5.1 Three Rules

**Rule 1 — Instantiable types use utility type derivation.**

```typescript
import type { CreateFromInstantiable, UpdateFromInstantiable } from '@core-std'
import type { Asset, AssetType } from '@domain/abstractions/asset.ts'

export type AssetTypeCreate = CreateFromInstantiable<AssetType>
export type AssetTypeUpdate = UpdateFromInstantiable<AssetType>
export type AssetCreate = CreateFromInstantiable<Asset>
export type AssetUpdate = UpdateFromInstantiable<Asset>
```

`CreateFromInstantiable<T>` strips `id`, `createdAt`, `updatedAt`, `deletedAt`. `UpdateFromInstantiable<T>` is `id` (required) plus all create fields as optional. Never hand-write `Omit`/`Pick`/`Partial` for lifecycled types. No JSDoc on protocol type exports — the name is the documentation.

**Rule 2 — Composite objects and junctions need no protocol entry.**

Composite objects and junction types are used directly by callers. The type is already the shape.

**Rule 3 — Exceptions are hand-coded with `Pick`.**

```typescript
export type JobWorkLogEntryCreate = Pick<JobWorkLogEntry, 'jobId' | 'userId' | 'answer'>
```

`Question` is `Instantiable` — it gets `QuestionCreate` and `QuestionUpdate` via utility types. These belong in `common-protocol.ts`.

### 5.2 Rules

- Never hand-write `Omit`/`Pick`/`Partial` for `Instantiable` types — use the utility types
- Composite objects and junctions have no protocol entries
- `Pick` appears only in Rule 3 exceptions
- No domain logic — protocols are data shapes for boundary transmission only
- No JSDoc on protocol type exports — names are self-documenting

## 6. Validator Archetype (`validators/`)

### 6.1 Pattern

```typescript
/**
 * Workflow protocol validator.
 */

import { isNonEmptyString, isPositiveNumber } from '@core-std'
import type { WorkflowCreate } from '@domain/protocols/workflow-protocol.ts'

// ────────────────────────────────────────────────────────────────────────────
// VALIDATORS
// ────────────────────────────────────────────────────────────────────────────

/** Validates WorkflowCreate; returns error message or null. */
export const validateWorkflowCreate = (input: WorkflowCreate): string | null => {
  if (!isNonEmptyString(input.name)) return 'name must be a non-empty string'
  if (!isPositiveNumber(input.version)) return 'version must be a positive number'
  return null
}

// ────────────────────────────────────────────────────────────────────────────
// INTERNALS
// ────────────────────────────────────────────────────────────────────────────
```

### 6.2 Enum membership

Import the const-enum tuple from the abstraction file and use `.includes()`. Never redeclare a local copy.

```typescript
// CORRECT
import { QUESTION_TYPES } from '@domain/abstractions/common.ts'
QUESTION_TYPES.includes(q.type as QuestionType)

// WRONG — local redeclaration is a violation
const QUESTION_TYPES = ['text', 'number', ...] as const
```

### 6.3 Explicit decomposition rules (non-negotiable)

1. **Named guards** — every domain object type validated in the file's own topic area gets a named `is{Abstraction}` guard. No anonymous object-level guards inline in `isComposition*` calls.
2. **Recursive delegation** — use `isComposition*(data, is{Child})` to delegate down the tree. Each level is named and declared separately.
3. **Primitive-only anonymous functions** — anonymous arrows permitted only for primitives: `(v): v is string => isNonEmptyString(v)`. All object validation must be a named guard.
4. **Input narrowing** — guards narrow with `Dictionary` casts from `@core-std`, not `Record<string, unknown>`.

### 6.4 Union-type validator pattern

Use a `switch` on the discriminator — exhaustive, no fall-through default:

```typescript
export const validateQuestionCreate = (input: QuestionCreate): string | null => {
  if (!isNonEmptyString(input.prompt)) return 'prompt must be a non-empty string'
  if (!QUESTION_TYPES.includes(input.type as QuestionType)) return 'type must be a valid QuestionType'

  switch (input.type) {
    case 'single-select':
    case 'multi-select':
      if (!isCompositionPositive(input.options, isSelectableOption)) {
        return 'options must be a non-empty array of valid SelectableOption values'
      }
      return null

    case 'text':
    case 'number':
    case 'boolean':
    case 'internal':
      return null
  }
}
```

`QUESTION_TYPES` imported from `@domain/abstractions/common.ts` — not `workflow.ts`.

### 6.5 Shared composition guards (non-negotiable)

`Note`, `Attachment`, and `Answer` have no protocol entries because **the type itself is the protocol** — they are value objects that arrive at the boundary exactly as defined. Their validation is therefore a **guard** (shape check), not a create/update validator pair.

Because these types are embedded as compositions across nearly every domain topic area, their guards are defined **once** in `common-validator.ts` and **exported**. Defining a local `isNote`, `isAttachment`, or `isAnswer` in any other validator file is a violation equivalent to redeclaring a const-enum tuple.

**§6.3 rule 1 scope:** "named guard for every object type validated in the file" applies to types owned by that file's topic area. Shared common-type guards are the explicit exception.

**Exported guards from `common-validator.ts`:**

| Guard                | Rationale                                              | Consumed by                                                                                                               |
| -------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `isAttachment`       | Type is the protocol; used inside `isNote`             | `isNote`                                                                                                                  |
| `isNote`             | Type is the protocol; embedded across all topics       | `asset-validator`, `chemical-validator`, `customer-validator`, `service-validator`, `workflow-validator`, `job-validator` |
| `isAnswer`           | Type is the protocol; field on `JobWorkLogEntryCreate` | `job-validator`                                                                                                           |
| `isSelectableOption` | Composition element of `SelectQuestion`                | `validateQuestionCreate`, `validateQuestionUpdate`                                                                        |

**Import pattern:**

```typescript
import { isAnswer, isNote } from '@domain/validators/common-validator.ts'
```

**`common-validator.ts` exports exactly:**

- Guards: `isAttachment`, `isNote`, `isAnswer`, `isSelectableOption`
- Validators: `validateQuestionCreate`, `validateQuestionUpdate`

No `validateNote*`, `validateAttachment*`, or `validateAnswer*` functions exist anywhere — these types have no protocols; guards are sufficient.

### 6.6 Rules

- Return `string | null` — error message or `null` for valid
- Validate at system boundaries only — never re-validate inside domain logic
- Use `@core-std` primitives: `isNonEmptyString`, `isId`, `isWhen`, `isPositiveNumber`, `isComposition*`
- No throwing — validators return, callers decide
- Import const-enum tuples from abstraction files — never redeclare locally
- Update validators: validate `id` first, then only fields `!== undefined`
- No Update validator for: `JobWorkLogEntry`

## 7. Schema Archetype (`schema/`)

`source/domain/schema/schema.sql` is a domain artifact — generated from the domain model, owned by the domain layer. It is the authoritative current-state DDL for the entire system. It is not a migration.

**The schema and migrations are bifurcated by design:**

- `schema.sql` — complete, idempotent, reproducible current state; generated from the domain model; includes canonical seed data known at schema time
- `source/back/migrations/` — forward-only deltas expressing change over time; governed by `architecture-back.md`

This bifurcation is intentional and non-negotiable. The domain model is exhaustive and the data dictionary is authoritative — the schema is a direct derivation of them, not a layered accumulation of migrations.

General DDL authoring conventions for `schema.sql` live in `style-guide.md` section 10. This section captures swarmAg-specific schema constraints that are not broadly reusable coding standards.

### 7.1 Domain-specific table classes

- `job_work_log_entries` is append-only: includes `id` and `created_at`; excludes `updated_at` and `deleted_at`.
- Pure junction tables with no lifecycle columns:
  - `workflow_tasks`
  - `task_questions`
  - `service_required_asset_types`
  - `job_plan_assets`
- Policy operation constraints:
  - Junction tables allow `SELECT`, `INSERT`, `DELETE` only.
  - `job_work_log_entries` allows `SELECT`, `INSERT` only.

### 7.2 JSONB exception governance

Any JSONB usage outside domain `Composition*<T>` mappings requires Chief Architect authorization for one of:

1. End-user specialization (custom fields)
2. Third-party metadata (opaque payloads)
3. Payload-as-truth (versioning snapshots)

### 7.3 Seed data

Canonical seed data known at schema time belongs in `schema.sql` — not a migration. All seed record IDs are stable UUID v7 values drawn from `documentation/devops/seed-ids.txt` — application-supplied, never database-generated. No seed record uses a database-generated ID.
