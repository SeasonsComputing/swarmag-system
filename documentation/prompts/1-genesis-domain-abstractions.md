# 1-genesis-domain-abstractions

You are an AI Coding Engine operating under `CONSTITUTION.md`. You have no
architectural authority. Implement exactly what is specified. Do not invent
abstractions, reinterpret intent, or cross architectural boundaries.

## Authority

In case of conflict:
`CONSTITUTION.md` → `architecture-core.md` → `domain.md` → `domain-archetypes.md`
→ `data-dictionary.md` → `style-guide.md`

You MUST ingest all of these files PRIOR to assessing your task. Confirm you
have no conflicts, questions, or concerns before generating any files.

## Task

Generate `source/domain/abstractions/` from scratch. Delete all existing files
and replace them completely. Do not patch.

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

## Authoritative Source

`data-dictionary.md` is the authoritative reference for all types, fields,
relations, and purpose statements. `domain.md` provides narrative context and
invariants. In case of conflict between them, `domain.md` governs.

## Placement Rules (non-negotiable)

Per `domain-archetypes.md` section 2:

**`common.ts`** owns:
`Location`, `Attachment`, `Note`,
`QuestionType`, `QUESTION_TYPES`, `QuestionOption`,
`ScalarQuestion`, `SelectQuestion`, `Question`,
`AnswerValue`, `Answer`

**`workflow.ts`** owns:
`Task`, `TaskQuestion`, `Workflow`, `WorkflowTask`

All other files own their named domain area as defined in `data-dictionary.md`.

## Key Invariants (non-negotiable)

- `Task` and `Question` are `Instantiable` — independently lifecycled with
  their own rows; sequence is carried by junction, never by the entity
- `WorkflowTask` and `TaskQuestion` are junction types — no lifecycle columns,
  no `Instantiable`
- `Workflow` has no `tasks` field of any kind — task relationship is expressed
  via `WorkflowTask` junction only
- `JobWorkflow` has no `sequence` field — order is owned by `JobWork.work`
- `JobWorkLogEntry` uses `Pick<Instantiable, 'id' | 'createdAt'>` intersection —
  append-only, no `updatedAt`, no `deletedAt`
- All `Composition*` fields are always initialized — never `null`, always `[]`
  when empty

## Union-Type Pattern for Question (non-negotiable)

Per `domain-archetypes.md` section 3.2. `Question` is a discriminated union of
named constituent types. Do not embed optional fields that only apply to some
variants:

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
  options: CompositionPositive<QuestionOption>
}

/** Discriminated union — boundary type used throughout the system. */
export type Question = ScalarQuestion | SelectQuestion
```

Rules:

- `CompositionPositive` (not `CompositionMany`) on `options` — a select
  question with zero options is nonsensical
- No anonymous union arms — named constituents only
- Both constituents are exported — they carry independent domain meaning
- `QUESTION_TYPES` const-enum tuple and `QuestionType` derived type are
  exported from `common.ts`

## Formatting Rules (non-negotiable)

- No semicolons
- Single quotes for all string literals
- TypeScript strict mode — `deno task check` must pass
- No `any` — use `unknown` at boundaries
- No inline `id`, `createdAt`, `updatedAt`, `deletedAt?` on Instantiable types
- File format per `style-guide.md` section 6.1 Spec files

## Import Aliases

```
@core-std  → source/core/std/std.ts
@core/     → source/core/
@domain/   → source/domain/
```

`@core-std` barrel exports: `Id`, `When`, `Dictionary`, `Instantiable`,
`CreateFromInstantiable`, `UpdateFromInstantiable`, `notValid`,
`isNonEmptyString`, `isId`, `isWhen`, `isPositiveNumber`, `CompositionOne`,
`CompositionOptional`, `CompositionMany`, `CompositionPositive`,
`AssociationOne`, `AssociationOptional`, `AssociationJunction`

## Const-Enum Pattern (non-negotiable)

Per `domain-archetypes.md` section 3.3:

```typescript
export const ASSET_STATUSES = [
  'active',
  'maintenance',
  'retired',
  'reserved'
] as const
export type AssetStatus = (typeof ASSET_STATUSES)[number]
```

Never use a bare union literal for values that require runtime membership
checks. Always pair a `const` tuple with a derived type alias.

## Instantiable Pattern (non-negotiable)

```typescript
export type Asset = Instantiable & {
  label: string
}
```

Never redeclare `id`, `createdAt`, `updatedAt`, `deletedAt?` inline.

## Junction Pattern (non-negotiable)

Plain objects — no `Instantiable`, no lifecycle fields:

```typescript
export type WorkflowTask = {
  workflowId: AssociationJunction<Workflow>
  taskId: AssociationJunction<Task>
  sequence: number
}
```

## Quality Bar

Before finalizing verify each file:

**`common.ts`**

- `QUESTION_TYPES` const tuple and `QuestionType` derived type exported
- `QuestionOption` exported
- `ScalarQuestion` exported — `Instantiable` intersection, no `options`
- `SelectQuestion` exported — `Instantiable` intersection, `options: CompositionPositive<QuestionOption>`
- `Question = ScalarQuestion | SelectQuestion` exported
- `AnswerValue` union type exported
- `Answer` object type exported — `questionId: AssociationOne<Question>`

**`workflow.ts`**

- `Task` extends `Instantiable` — no embedded questions field
- `TaskQuestion` is a plain junction type with `sequence`
- `Workflow` extends `Instantiable` — no `tasks` field of any kind
- `WorkflowTask` is a plain junction type with `sequence`
- No imports of `Question`, `QuestionType`, `Answer`, `AnswerValue` — those live in `common.ts`

**`job.ts`**

- `JobWorkflow` has no `sequence` field
- `JobWork.work` is `CompositionPositive<Id>`
- `JobWorkLogEntry` is `Pick<Instantiable, 'id' | 'createdAt'>` intersection

**All files**

- Every `Instantiable` type uses intersection — no inline lifecycle fields
- Every const-enum has both the tuple and the derived type alias
- No circular imports
- `deno task check` passes
