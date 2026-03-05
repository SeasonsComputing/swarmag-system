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

- `domain.md` owns domain meaning.
- `data-dictionary.md` owns topic namespaces, abstraction inventory, and field-level reference tables.
- `style-guide.md` owns implementation patterns, file layouts, and coding conventions.
- `domain-archetypes.md` owns how to craft topic namespaces from the data dictionary into archetype artifacts.

## 2. File Organization

The domain layer follows a file-per-topic-namespace pattern, where each file contains the abstractions that define the topic namespace, organized by archetype directory.

| Archetype       | File                   | Purpose                                              |
| --------------- | ---------------------- | ---------------------------------------------------- |
| `abstractions/` | `{topic}.ts`           | TypeScript types — the domain truth                  |
| `adapters/`     | `{topic}-adapter.ts`   | Dictionary ↔ domain type serialization               |
| `protocols/`    | `{topic}-protocol.ts`  | Create/update input shapes for boundary transmission |
| `validators/`   | `{topic}-validator.ts` | Boundary validation — returns `string \| null`       |
| `schema/`       | `schema.sql`           | Generated canonical PostgreSQL schema                |

### 2.1 File format

Abstraction files conform to `style-guide.md` §6.1 Spec files. Adapter, protocol, and validator files conform to `style-guide.md` §6.2 Functional files.

## 3. Abstraction Archetype (`abstractions/`)

### 3.1 Rules

- `type` for all domain shapes, aliases, unions. `interface` only for contracts that something explicitly implements.
- Lifecycled abstractions extend `Instantiable` via intersection — never redeclare `id`, `createdAt`, `updatedAt`, `deletedAt?` inline.
- Append-only abstractions extend `InstantiableOnly` — never redeclare `id`, `createdAt` inline.
- Embedded subordinate compositions use `Composition*<T>` from `@core-std`.
- FK references use `Association*<T>` from `@core-std`.
- JSON-serializable only — no methods on domain objects.
- No variadic tuple types anywhere.
- Abstraction definitions are the single source of truth for protocol field sets — `CreateFromInstantiable<T>` and `UpdateFromInstantiable<T>` derive protocol shapes directly. No manual synchronization required.
- `const-enum` and `union-type` / `intersection-type` patterns: see `style-guide.md` §8.2, §8.3, §8.4.

## 4. Adapter Archetype (`adapters/`)

### 4.1 Pattern

```typescript
import type { Dictionary, When } from '@core-std'
import { notValid } from '@core-std'
import type { Asset, AssetStatus } from '@domain/abstractions/asset.ts'
import type { Note } from '@domain/abstractions/common.ts'
import { fromNote, toNote } from '@domain/adapters/common-adapter.ts'

// ────────────────────────────────────────────────────────────────────────────
// ADAPTERS
// ────────────────────────────────────────────────────────────────────────────

/** Create an Asset from its dictionary representation. */
export const toAsset = (dict: Dictionary): Asset => {
  if (!dict.id) return notValid('Asset dictionary missing required field: id')
  if (!dict.label) return notValid('Asset dictionary missing required field: label')
  return {
    id: dict.id as string,
    label: dict.label as string,
    type: dict.type_id as string,
    status: dict.status as AssetStatus,
    notes: (dict.notes as Dictionary[]).map(toNote),
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
toSelectOption / fromSelectOption
toQuestion / fromQuestion
toAnswer / fromAnswer
```

`toQuestion` / `fromQuestion` apply the `union-type` adapter pattern — see `style-guide.md` §8.3.

### 4.3 Rules

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

// ────────────────────────────────────────────────────────────────────────────
// PROTOCOLS
// ────────────────────────────────────────────────────────────────────────────

export type AssetTypeCreate = CreateFromInstantiable<AssetType>
export type AssetTypeUpdate = UpdateFromInstantiable<AssetType>
export type AssetCreate = CreateFromInstantiable<Asset>
export type AssetUpdate = UpdateFromInstantiable<Asset>
```

`CreateFromInstantiable<T>` strips `id`, `createdAt`, `updatedAt`, `deletedAt`. `UpdateFromInstantiable<T>` is `id` (required) plus all create fields as optional. Never hand-write `Omit`/`Pick`/`Partial` for lifecycled types. No JSDoc on protocol type exports — the name is the documentation.

For `union-type` abstractions, apply utility types to each constituent independently and reassemble as a protocol union.

**Rule 2 — Composite objects and junctions need no protocol entry.**

Composite objects and junction types are used directly by callers. The type is already the shape.

**Rule 3 — Exceptions are hand-coded with `Pick`.**

```typescript
export type JobWorkLogEntryCreate = Pick<JobWorkLogEntry, 'jobId' | 'userId' | 'answer'>
```

### 5.2 Rules

- Never hand-write `Omit`/`Pick`/`Partial` for `Instantiable` types — use the utility types
- Composite objects and junctions have no protocol entries
- `Pick` appears only in Rule 3 exceptions
- No domain logic — protocols are data shapes for boundary transmission only
- No JSDoc on protocol type exports — names are self-documenting

## 6. Validator Archetype (`validators/`)

### 6.1 Pattern

```typescript
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
// GUARDS
// ────────────────────────────────────────────────────────────────────────────
```

### 6.2 Explicit decomposition rules (non-negotiable)

1. **Named guards** — every domain object type validated in the file's own topic area gets a named `is{Abstraction}` guard. No anonymous object-level guards inline in `isComposition*` calls.
2. **Recursive delegation** — use `isComposition*(data, is{Child})` to delegate down the tree. Each level is named and declared separately.
3. **Primitive-only anonymous functions** — anonymous arrows permitted only for primitives: `(v): v is string => isNonEmptyString(v)`. All object validation must be a named guard.
4. **Input narrowing** — guards narrow with `Dictionary` casts from `@core-std`, not `Record<string, unknown>`.

### 6.3 Shared composition guards (non-negotiable)

`Note`, `Attachment`, and `Answer` have no protocol entries because **the type itself is the protocol** — they are value objects that arrive at the boundary exactly as defined. Their validation is therefore a **guard** (shape check), not a create/update validator pair.

Because these types are embedded as compositions across nearly every domain topic area, their guards are defined **once** in `common-validator.ts` and **exported**. Defining a local `isNote`, `isAttachment`, or `isAnswer` in any other validator file is a violation equivalent to redeclaring a const-enum tuple.

**§6.2 rule 1 scope:** "named guard for every object type validated in the file" applies to types owned by that file's topic area. Shared common-type guards are the explicit exception.

**Exported guards from `common-validator.ts`:**

| Guard            | Rationale                                              | Consumed by                                                                                                               |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `isAttachment`   | Type is the protocol; used inside `isNote`             | `isNote`                                                                                                                  |
| `isNote`         | Type is the protocol; embedded across all topics       | `asset-validator`, `chemical-validator`, `customer-validator`, `service-validator`, `workflow-validator`, `job-validator` |
| `isAnswer`       | Type is the protocol; field on `JobWorkLogEntryCreate` | `job-validator`                                                                                                           |
| `isSelectOption` | Composition element of `SelectQuestion`                | `validateQuestionCreate`, `validateQuestionUpdate`                                                                        |

**Import pattern:**

```typescript
import { isAnswer, isNote } from '@domain/validators/common-validator.ts'
```

**`common-validator.ts` exports exactly:**

- Guards: `isAttachment`, `isNote`, `isAnswer`, `isSelectOption`
- Validators: `validateQuestionCreate`, `validateQuestionUpdate`

No `validateNote*`, `validateAttachment*`, or `validateAnswer*` functions exist anywhere — these types have no protocols; guards are sufficient.

### 6.4 Rules

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

General DDL authoring conventions live in `style-guide.md` §10. This section captures domain-specific schema constraints.

### 7.1 Domain-specific table classes

- `InstantiableOnly` tables (`job_work_log_entries`) are append-only: `id` and `created_at` only; no `updated_at`, no `deleted_at`.
- Pure junction tables with no lifecycle columns:
  - `workflow_tasks`
  - `task_questions`
  - `service_required_asset_types`
  - `job_plan_assets`
- Policy operation constraints:
  - Junction tables allow `SELECT`, `INSERT`, `DELETE` only.
  - `job_work_log_entries` allows `SELECT`, `INSERT` only.

### 7.2 Seed data

Canonical seed data known at schema time belongs in `schema.sql` — not a migration. All seed record IDs are stable UUID v7 values drawn from `documentation/devops/seed-ids.txt` — application-supplied, never database-generated. No seed record uses a database-generated ID.
