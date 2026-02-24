# Domain Package Regeneration Prompt

You are an AI Coding Engine operating under `CONSTITUTION.md`. You have no architectural authority. Implement exactly what is specified. Do not invent abstractions, reinterpret intent, or cross architectural boundaries.

## Authority

`domain.md` is the single source of truth for all types, shapes, and invariants. `style-guide.md` governs all code conventions. `CONSTITUTION.md` governs all behavior. `architecture-core.md` governs all architectural decisions. In case of conflict: `CONSTITUTION.md` → `architecture-core.md` → `domain.md` → `style-guide.md`. 

Ingest all of these files prior to assessing your tasks.

## Task

Regenerate the entire `source/domain/` package from scratch. Delete existing files and replace them completely. Do not patch.
Confirm that you have no conflicts, questions or concerns prior to generating the domain package.

## Target File Inventory

```
source/domain/
  abstractions/
    common.ts
    asset.ts
    chemical.ts
    customer.ts
    service.ts
    user.ts
    workflow.ts
    job.ts
  adapters/
    common-adapter.ts
    asset-adapter.ts
    chemical-adapter.ts
    customer-adapter.ts
    service-adapter.ts
    user-adapter.ts
    workflow-adapter.ts
    job-adapter.ts
  protocols/
    asset-protocol.ts
    chemical-protocol.ts
    customer-protocol.ts
    service-protocol.ts
    user-protocol.ts
    workflow-protocol.ts
    job-protocol.ts
  validators/
    asset-validator.ts
    chemical-validator.ts
    customer-validator.ts
    service-validator.ts
    user-validator.ts
    workflow-validator.ts
    job-validator.ts
```

`schema/schema.sql` is generated separately. Do not create it here.

## Formatting Rules (non-negotiable)

- No semicolons
- Single quotes for all string literals
- TypeScript strict mode
- No `any` — use `unknown` at boundaries, cast after validation
- No inline `id`, `createdAt`, `updatedAt`, `deletedAt?` on Instantiable types — extend via intersection only

## Import Aliases

Use these aliases exactly — trailing slashes required on directory aliases:

```
@core-std       → source/core/std/std.ts       (barrel: Id, When, Dictionary, Instantiable, notValid, isNonEmptyString, isId, isWhen, isPositiveNumber)
@core/          → source/core/
@domain/        → source/domain/
```

## Abstraction Rules (`abstractions/`)

### File format

Spec files — type declarations, enums, pure domain shapes:
- No box header. Top-level JSDoc block: one paragraph, domain context only.
- Single-sentence `/** */` on every exported type and enum, only where the name alone is insufficient.
- No section dividers. No inline comments beyond JSDoc.

### Instantiable pattern

Lifecycled abstractions extend `Instantiable` from `@core-std` via intersection. Do not redeclare `id`, `createdAt`, `updatedAt`, `deletedAt?` inline:

```typescript
import type { Instantiable } from '@core-std'

export type Asset = Instantiable & {
  label: string
  // ... domain fields only
}
```

Instantiable types per `domain.md`:
`AssetType`, `Asset`, `Chemical`, `Customer`, `Service`, `Workflow`,
`Job`, `JobAssessment`, `JobWorkflow`, `JobPlan`, `JobWork`, `User`

Non-Instantiable types (value objects, junctions, embeds) do not extend Instantiable even if they carry some lifecycle-like fields.

### Variadic tuple notation

Embedded subordinate collections use variadic tuples to express cardinality:

| Notation     | Cardinality |
| ------------ | ----------- |
| `[T]`        | exactly 1   |
| `[T?]`       | 0 or 1      |
| `[T, ...T[]]`  | 1 or more   |
| `[T?, ...T[]]` | 0 or more   |

### Type vs interface

- `type` for all domain shapes, aliases, unions, and enums
- `interface` only for contracts that something explicitly implements (`ApiCrudContract`, `RuntimeProvider`)

### Placement rules

- `Location`, `Note`, `Attachment` → `common.ts`
- `Question`, `Answer`, `Task`, `QuestionType`, `QuestionOption`, `AnswerValue` → `workflow.ts`
- `JobStatus`, `JobAssessment`, `JobWorkflow`, `JobPlan`, `JobPlanAssignment`, `JobPlanChemical`, `JobPlanAsset`, `JobWork`, `JobWorkLogEntry`, `Job` → `job.ts`
- All others in their named file

### Notable invariants from `domain.md §2.9`

- `Customer.contacts` is non-empty: `[Contact, ...Contact[]]`
- `Contact.isPrimary` flags the primary contact — `Customer` has no `primaryContactId` field
- `Contact` is a pure embedded value object — no `id`, no lifecycle fields
- `Task.checklist` is non-empty: `[Question, ...Question[]]`
- `Workflow.tasks` is non-empty: `[Task, ...Task[]]`
- `JobAssessment.locations` is non-empty: `[Location, ...Location[]]`
- `JobWorkLogEntry` is a flat type with required `answer` — no discriminated union, no `metadata` field:
  ```typescript
  export type JobWorkLogEntry = {
    id: Id
    jobId: Id
    userId: Id
    answer: Answer
    createdAt: When
  }
  ```
- Telemetry uses `QuestionType = 'internal'` — same `Answer` structure, no special casing
- `JobWork.work` is immutable once created
- `Workflow` masters are read-only except for administrator role
- `User` extends `Instantiable` — `createdAt`/`updatedAt` are required, enforced at persistence layer

## Adapter Rules (`adapters/`)

### File format

Functional files — box header with PURPOSE and EXPORTED APIs sections:

```typescript
/*
╔═════════════════════════════════════════════════════════════════════════════╗
║ {Abstraction} adapter                                                       ║
║ Dictionary ↔ {Abstraction} serialization                                    ║
╚═════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Converts between Supabase row dictionaries and {Abstraction} domain types.

EXPORTED APIs & TYPEs
───────────────────────────────────────────────────────────────────────────────
to{Abstraction}(dict: Dictionary): {Abstraction}
from{Abstraction}({abstraction}: {Abstraction}): Dictionary
*/
```

### Adapter pattern

```typescript
import type { Dictionary, When } from '@core-std'
import { notValid } from '@core-std'
import type { Job } from '@domain/abstractions/job.ts'

export const toJob = (dict: Dictionary): Job => {
  if (!dict.id) return notValid('Job dictionary missing required field: id')
  if (!dict.customer_id) return notValid('Job dictionary missing required field: customer_id')
  return {
    id: dict.id as string,
    customerId: dict.customer_id as string,
    status: dict.status as JobStatus,
    createdAt: dict.created_at as When,
    updatedAt: dict.updated_at as When,
    deletedAt: dict.deleted_at as When | undefined,
  }
}

export const fromJob = (job: Job): Dictionary => ({
  id: job.id,
  customer_id: job.customerId,
  status: job.status,
  created_at: job.createdAt,
  updated_at: job.updatedAt,
  deleted_at: job.deletedAt,
})
```

### Adapter rules

- Functions only — `to{Abstraction}` and `from{Abstraction}`
- Map every field explicitly — no `...spread`, no `payload` shortcut
- `snake_case` for database column names; `camelCase` for domain fields
- Fast-fail on missing required fields using `notValid` from `@core-std`
- `notValid` returns `never` — place all `notValid` calls before the return statement, never inside or after it. The compiler must see an unconditional return after all guards.
- Pattern: validate all required fields first (each returning `notValid(...)`), then return the constructed object as the single final statement. This satisfies TypeScript control flow analysis.
- JSONB columns (embedded subordinate compositions) are handled automatically by the Supabase SDK — no `JSON.parse()` or `JSON.stringify()` needed; map the field by name and trust the type
- Embedded subordinate associations are **always** stored as a JSON array, regardless of cardinality — even a single embedded object uses `[object]`. Empty is `[]`. Never `null`, never a bare object.

## Protocol Rules (`protocols/`)

### File format

Spec file format — top JSDoc block, no box header.

### Protocol pattern

```typescript
import type { Id } from '@core-std'
import type { JobStatus } from '@domain/abstractions/job.ts'

/** Input for creating a Job. */
export type JobCreateInput = {
  customerId: Id
}

/** Input for updating a Job. */
export type JobUpdateInput = {
  id: Id
  status?: JobStatus
}
```

### Protocol rules

- `{Abstraction}CreateInput` and `{Abstraction}UpdateInput` for each lifecycled abstraction
- Partial shapes — only fields relevant to the operation
- `UpdateInput` always includes `id: Id`
- No domain logic; protocols are data shapes for transmission only
- Read-only abstractions (`Workflow` masters) may omit `UpdateInput`

## Validator Rules (`validators/`)

### File format

Functional files — box header with PURPOSE and EXPORTED APIs.

### Validator pattern

```typescript
import { isNonEmptyString, isId } from '@core-std'
import type { JobCreateInput } from '@domain/protocols/job-protocol.ts'

/** Confirm `JobCreateInput` validity; return message on failure otherwise null */
export const validateJobCreate = (input: unknown): string | null => {
  if (!input || typeof input !== 'object') return 'input must be an object'
  const i = input as Record<string, unknown>
  if (!isId(i.customerId)) return 'customerId must be a valid Id'
  return null
}
```

### Validator rules

- Return `string | null` — error message or `null` for valid
- Validate at system boundaries only; never re-validate inside domain logic
- Use primitive validators from `@core-std`: `isNonEmptyString`, `isId`, `isWhen`, `isPositiveNumber`
- Domain-specific guards defined inline in their validator file
- No throwing — validators return, not throw; callers decide what to do with errors

## Data Dictionary Reference

Reproduce types exactly as specified in `domain.md §3`. Key mappings:

| DD notation                                  | TypeScript                              |
| -------------------------------------------- | --------------------------------------- |
| `(Instantiable)`                             | `= Instantiable & { ... }`              |
| `(object)`                                   | `= { ... }`                             |
| `(enum)`                                     | `= 'val1' \| 'val2'`                    |
| `(union)`                                    | `= TypeA \| TypeB`                      |
| `(alias)`                                    | `= PrimitiveType`                       |
| `(Junction)`                                 | plain object, no Instantiable           |
| `Fields: id, ...` on Instantiable            | omit `id` — provided by Instantiable    |
| `field(TypeA\|TypeB)`                        | `field: TypeA \| TypeB`                 |
| `[T, ...T[]]`                                | variadic tuple as written               |
| `createdAt, updatedAt, deletedAt?` on Instantiable | omit — provided by Instantiable   |

## Quality Bar

The output must pass `deno task check` without errors. Before finalizing each file verify:

1. Every `Instantiable` type uses intersection — no inline lifecycle fields
2. Every adapter validates all required fields with `notValid` calls before the single return statement
3. Every adapter function has exactly one return path (the constructed object)
4. No semicolons anywhere
5. Single quotes everywhere
6. No `any`
7. All imports use correct aliases with trailing slashes on directory aliases
8. `common.ts` types imported into every file that references them
