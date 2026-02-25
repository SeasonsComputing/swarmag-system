# swarmAg System — Domain Model Archetypes

![swarmAg ops logo](../../swarmag-ops-logo.png)

## 1. Overview

Implementation patterns for the `source/domain/` package. This document governs **how** domain meaning is expressed in code. For **what** the domain means, see `domain.md`.

Authority chain for implementation:
  `CONSTITUTION.md` → `architecture-core.md` → `domain.md` → `domain-archetypes.md` → `style-guide.md`

## 2. File Organization

The domain layer follows an abstraction-per-file pattern across five subdirectories:

| Sub-layer       | File                         | Purpose                                              |
| --------------- | ---------------------------- | ---------------------------------------------------- |
| `abstractions/` | `{abstraction}.ts`           | TypeScript types — the domain truth                  |
| `adapters/`     | `{abstraction}-adapter.ts`   | Dictionary ↔ domain type serialization               |
| `protocols/`    | `{abstraction}-protocol.ts`  | Create/update input shapes for boundary transmission |
| `validators/`   | `{abstraction}-validator.ts` | Boundary validation — returns `string                |
| `schema/`       | `schema.sql`                 | Generated canonical PostgreSQL schema                |

**Placement rules:**

- `Location`, `Note`, `Attachment` → `common.ts` / `common-adapter.ts`
- `Question`, `Answer`, `Task`, `QuestionType`, `QuestionOption`, `AnswerValue` → `workflow.ts`
- `JobStatus`, `JobAssessment`, `JobWorkflow`, `JobPlan`, `JobPlanAssignment`, `JobPlanChemical`, `JobPlanAsset`, `JobWork`, `JobWorkLogEntry`, `Job` → `job.ts`
- Generic protocol shapes (`ListOptions`, `ListResult`, `DeleteResult`) → `@core/api/api-contract.ts`
- Shared primitive validators → `@core-std`; domain-specific guards → their abstraction's validator file

### 2.1 File format

All domain files must conform to `style-guide.md` section 6.1 Spec files.

## 3. Abstraction Archetype (`abstractions/`)

### 3.1 Rules

- `type` for all domain shapes, aliases, unions, enums. `interface` only for contracts that something explicitly implements.
- Lifecycled abstractions extend `Instantiable` via intersection — never redeclare `id`, `createdAt`, `updatedAt`, `deletedAt?` inline.
- Embedded subordinate compositions use `Composition*<T>` from `@core-std/relations.ts`.
- FK references use `Association*<T>` from `@core-std/relations.ts`.
- JSON-serializable only — no methods on domain objects.
- No variadic tuple types anywhere.

### 3.2 Relation type reference

| Use case                        | Type                     |
| ------------------------------- | ------------------------ |
| Embed exactly 1                 | `CompositionOne<T>`      |
| Embed 0 or 1                    | `CompositionOptional<T>` |
| Embed 0 or more                 | `CompositionMany<T>`     |
| Embed 1 or more                 | `CompositionPositive<T>` |
| Required FK (many side of 1:m)  | `AssociationOne<T>`      |
| Optional FK (nullable column)   | `AssociationOptional<T>` |
| Junction FK (both sides of m:m) | `AssociationJunction<T>` |

## 4. Adapter Archetype (`adapters/`)

### 4.1 Pattern

```typescript
/**
 * Asset et al adapters to and from Dictionary representation
 */
import type { Dictionary, When } from '@core-std'
import { notValid } from '@core-std'
import type { Asset } from '@domain/abstractions/asset.ts'
import { fromNote, toNote } from '@domain/adapters/common-adapter.ts'

/** Create an Asset instance from dictionary representation */
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

/** Create a dictionary representation of Asset instance */
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

Exports composition helpers only — not row-level adapters:

```typescript
toLocation / fromLocation
toNote / fromNote
toAttachment / fromAttachment
```

These are imported by all other adapters that handle embedded `Note`, `Location`, or `Attachment` fields.

### 4.3 Rules

- Functions only — `to{Abstraction}` and `from{Abstraction}`
- Map every field explicitly — no `...spread`, no payload shortcut
- `snake_case` for database column names; `camelCase` for domain fields
- Fast-fail on missing required fields using `notValid` from `@core-std` — not `throw`
- All `notValid` calls precede the single return statement — compiler must see unconditional return
- `Composition*` fields: Supabase SDK handles JSONB automatically — no `JSON.parse`/`JSON.stringify`
- Map composition fields with `.map(toChild)` / `.map(fromChild)` — no casting needed since `Composition*` is `readonly T[]`
- `Association*` fields resolve to `Id` or `Id | undefined` — cast from Dictionary as `string`

## 5. Protocol Archetype (`protocols/`)

### 5.1 Pattern

```typescript
/**
 * Protocol input shapes for Asset boundary operations.
 */

import type { Id } from '@core-std'
import type { AssetStatus } from '@domain/abstractions/asset.ts'

/** Input for creating an Asset. */
export type AssetCreateInput = {
  label: string
  type: Id
  status: AssetStatus
}

/** Input for updating an Asset. */
export type AssetUpdateInput = {
  id: Id
  label?: string
  status?: AssetStatus
}
```

### 5.2 Rules

- `{Abstraction}CreateInput` and `{Abstraction}UpdateInput` per lifecycled abstraction
- `UpdateInput` always includes `id: Id`
- Partial shapes — only fields relevant to the operation
- No domain logic — protocols are data shapes for transmission only
- Read-only abstractions (`Workflow` masters) omit `UpdateInput`
- FK fields use bare `Id` — not `Association*` types (protocols are boundary shapes, not domain types)

## 6. Validator Archetype (`validators/`)

### 6.1 Pattern

```typescript
/**
 * Workflow protocol validator
 */

import { isCompositionPositive, isId, isNonEmptyString } from '@core-std'
import type { Question, Task } from '@domain/abstractions/workflow.ts'
import type { WorkflowCreateInput } from '@domain/protocols/workflow-protocol.ts'

// ────────────────────────────────────────────────────────────────────────────
// VALIDATORS
// ────────────────────────────────────────────────────────────────────────────

/** Validates WorkflowCreateInput; returns error message or null. */
export const validateWorkflowCreate = (input: WorkflowCreateInput): string | null => {
  if (!isNonEmptyString(input.name)) return 'name must be a non-empty string'
  if (!isCompositionPositive(input.tasks, isTask)) {
    return 'tasks must be a non-empty association of valid tasks'
  }
  return null
}

// ────────────────────────────────────────────────────────────────────────────
// PRIVATE VALIDATOR DECOMPOSITION
// ────────────────────────────────────────────────────────────────────────────

/** Validate question component */
const isQuestion = (v: unknown): v is Question => {
  if (!v || typeof v !== 'object') return false
  const q = v as Record<string, unknown>
  return isId(q.id)
    && isNonEmptyString(q.prompt)
    && QUESTION_TYPES.includes(q.type as Question['type'])
}

/** Validate task component */
const isTask = (v: unknown): v is Task => {
  if (!v || typeof v !== 'object') return false
  const t = v as Record<string, unknown>
  return isId(t.id)
    && isNonEmptyString(t.title)
    && isCompositionPositive(t.checklist, isQuestion)
```

### 6.3 Explicit decomposition rules (non-negotiable)

Per `CONSTITUTION.md §9.5.1` (Explicit over clever):

1. **Named guards** — every domain object validated in the file gets a private `is{Abstraction}` guard. No anonymous object-level guards inline in `isComposition*` calls.
2. **Recursive delegation** — use `isComposition*(data, is{Child})` to delegate down the tree. Each level is named and declared separately.
3. **Primitive-only anonymous functions** — anonymous arrows permitted only for primitives: `(v): v is string => isNonEmptyString(v)`. All object validation must be a named guard.
4. **Input narrowing** — guards narrow with `Record<string, unknown>` and `@core-std` primitives.

### 6.4 Rules

- Return `string | null` — error message or `null` for valid
- Validate at system boundaries only — never re-validate inside domain logic
- Use `@core-std` primitives: `isNonEmptyString`, `isId`, `isWhen`, `isPositiveNumber`, `isComposition*`
- No throwing — validators return, callers decide what to do with errors
- Private guards above public validators in the file, separated by section divider
