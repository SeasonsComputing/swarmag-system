# Domain Abstractions Generation Prompt

You are an AI Coding Engine operating under `CONSTITUTION.md`. You have no architectural authority. Implement exactly what is specified. Do not invent abstractions, reinterpret intent, or cross architectural boundaries.

## Authority

In case of conflict: 
  `CONSTITUTION.md` → `architecture-core.md` → `domain.md` → `domain-archetypes.md` → `style-guide.md`

You MUST Ingest all of these files PRIOR to assessing your task.
Confirm you have no conflicts, questions, or concerns before generating any files.

## Task

Generate the `source/domain/abstractions/` sub-package from scratch. Delete existing files and replace them completely. Do not patch.

## Target File Inventory

```
source/domain/abstractions/
  common.ts
  asset.ts
  chemical.ts
  customer.ts
  service.ts
  user.ts
  workflow.ts
  job.ts
```

## Formatting Rules (non-negotiable)

- No semicolons
- Single quotes for all string literals
- TypeScript strict mode — `deno task check` must pass
- No `any` — use `unknown` at boundaries
- No inline `id`, `createdAt`, `updatedAt`, `deletedAt?` on Instantiable types

## Import Aliases

Trailing slashes required on directory aliases:

```
@core-std       → source/core/std/std.ts
@core/          → source/core/
@domain/        → source/domain/
```

`@core-std` barrel exports: `Id`, `When`, `Dictionary`, `Instantiable`, `notValid`,
`isNonEmptyString`, `isId`, `isWhen`, `isPositiveNumber`,
`CompositionOne`, `CompositionOptional`, `CompositionMany`, `CompositionPositive`,
`AssociationOne`, `AssociationOptional`, `AssociationJunction`

## File Format

Conform to style-guide.md section 6.1 Spec files.

## Instantiable Pattern

Lifecycled abstractions extend `Instantiable` via intersection. Never redeclare `id`, `createdAt`, `updatedAt`, `deletedAt?` inline:

```typescript
import type { Instantiable } from '@core-std'

export type Asset = Instantiable & {
  label: string
}
```

Instantiable types: `AssetType`, `Asset`, `Chemical`, `Customer`, `Service`, `Workflow`,
`Job`, `JobAssessment`, `JobWorkflow`, `JobPlan`, `JobPlanAssignment`, `JobPlanChemical`, `JobWork`, `User`

## Relation Types

All embedded subordinate compositions use `Composition*<T>` — never variadic tuples or bare arrays.
All FK references use `Association*<T>` — never bare `Id` fields.

| Use case                        | Type                     |
| ------------------------------- | ------------------------ |
| Embed exactly 1                 | `CompositionOne<T>`      |
| Embed 0 or 1                    | `CompositionOptional<T>` |
| Embed 0 or more                 | `CompositionMany<T>`     |
| Embed 1 or more                 | `CompositionPositive<T>` |
| Required FK (many side of 1:m)  | `AssociationOne<T>`      |
| Optional FK (nullable column)   | `AssociationOptional<T>` |
| Junction FK (both sides of m:m) | `AssociationJunction<T>` |

## Placement Rules

- `Location`, `Note`, `Attachment` → `common.ts`
- `Question`, `Answer`, `Task`, `QuestionType`, `QuestionOption`, `AnswerValue` → `workflow.ts`
- `JobStatus`, `JobAssessment`, `JobWorkflow`, `JobPlan`, `JobPlanAssignment`, `JobPlanChemical`, `JobPlanAsset`, `JobWork`, `JobWorkLogEntry`, `Job` → `job.ts`
- All others in their named file

## Notable Invariants

- `Customer.contacts: CompositionPositive<Contact>` — non-empty
- `Contact` is a pure value object — no `id`, no lifecycle fields
- `Contact.isPrimary` flags the primary contact — no `primaryContactId` on `Customer`
- `Task.checklist: CompositionPositive<Question>` — non-empty
- `Workflow.tasks: CompositionPositive<Task>` — non-empty
- `JobAssessment.locations: CompositionPositive<Location>` — non-empty
- `User.roles: CompositionPositive<UserRole>` — non-empty, at least one role required
- `JobPlanAssignment` and `JobPlanChemical` are `Instantiable` — they are on the many side of 1:m with `JobPlan`
- `JobPlanAsset` is a pure junction — no `id`, no lifecycle, `AssociationJunction` on both sides
- `JobWorkLogEntry` is flat with required `answer: CompositionOne<Answer>` — no discriminated union, no metadata field:
  ```typescript
  export type JobWorkLogEntry = {
    id: Id
    jobId: AssociationOne<Job>
    userId: AssociationOne<User>
    answer: CompositionOne<Answer>
    createdAt: When
  }
  ```
- Telemetry uses `QuestionType = 'internal'` — same `Answer` structure, no special casing
- `JobWork.work: CompositionPositive<Id>` — immutable once created
- `Workflow` masters are read-only except for administrator role

## Data Dictionary

Reproduce types exactly as specified in `domain.md §3`. Key DD → TypeScript mappings:

| DD notation                                        | TypeScript                                |
| -------------------------------------------------- | ----------------------------------------- |
| `(Instantiable)`                                   | `= Instantiable & { ... }`                |
| `(object)`                                         | `= { ... }`                               |
| `(enum)`                                           | `= 'val1' \| 'val2'`                      |
| `(union)`                                          | `= TypeA \| TypeB`                        |
| `(alias)`                                          | `= PrimitiveType`                         |
| `(Junction)`                                       | plain object, no Instantiable             |
| `CompositionOne<T>`                                | `CompositionOne<T>` from `@core-std`      |
| `AssociationOne<T>`                                | `AssociationOne<T>` from `@core-std`      |
| `AssociationOptional<T>`                           | `AssociationOptional<T>` from `@core-std` |
| `AssociationJunction<T>`                           | `AssociationJunction<T>` from `@core-std` |
| `createdAt, updatedAt, deletedAt?` on Instantiable | omit — provided by Instantiable           |

## Quality Bar

Before finalizing each file verify:

1. Every `Instantiable` type uses intersection — no inline lifecycle fields
2. Every embedded field uses `Composition*<T>` — no bare arrays, no variadic tuples
3. Every FK field uses `Association*<T>` — no bare `Id` or `string` fields
4. `JobPlanAsset` has no `id`, no lifecycle — pure junction
5. No semicolons anywhere
6. Single quotes everywhere
7. No `any`
8. All imports use correct aliases with trailing slashes on directory aliases
9. `deno task check` passes
