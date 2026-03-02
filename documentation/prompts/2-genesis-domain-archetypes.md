# 2-genesis-domain-archetypes

You are an AI Coding Engine operating under `CONSTITUTION.md`. You have no
architectural authority. Implement exactly what is specified. Do not invent
abstractions, reinterpret intent, or cross architectural boundaries.

## Authority

In case of conflict:
`CONSTITUTION.md` → `architecture-core.md` → `domain.md` → `domain-archetypes.md`
→ `data-dictionary.md` → `style-guide.md`

You MUST ingest all of these files PRIOR to assessing your task. Confirm you
have no conflicts, questions, or concerns before generating any files.

## Prerequisite

Ingest all files under `source/domain/abstractions/` before generating any
output. The abstraction files are the authoritative type source. If any
abstraction conflicts with `data-dictionary.md`, escalate — do not proceed.

## Task

Generate the three domain sub-layers from scratch:

- `source/domain/adapters/`
- `source/domain/protocols/`
- `source/domain/validators/`

Delete all existing files and replace them completely. Do not patch.

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

## Placement Rules (non-negotiable)

`common-adapter.ts` owns adapters for:
`Location`, `Attachment`, `Note`, `QuestionOption`, `ScalarQuestion`,
`SelectQuestion`, `Question`, `Answer`

`workflow-adapter.ts` owns adapters for:
`Task`, `TaskQuestion`, `Workflow`, `WorkflowTask`

All other adapter files own their named domain area.

## Protocol Rules (non-negotiable)

Per `domain-archetypes.md` section 5:

**Rule 1** — All `Instantiable` types use `CreateFromInstantiable<T>` and
`UpdateFromInstantiable<T>`. Never hand-write `Omit`/`Pick`/`Partial`
for lifecycled types.

**Rule 2** — Composite objects and junction types have no protocol entry.

**Rule 3** — Exceptions hand-coded with `Pick` only:

- `JobWorkLogEntryCreate = Pick<JobWorkLogEntry, 'jobId' | 'userId' | 'answer'>`
- `WorkflowCreate = CreateFromInstantiable<Workflow>` — no `WorkflowUpdate`
  (read-only master)
- `JobWorkCreate = CreateFromInstantiable<JobWork>` — no `JobWorkUpdate`
  (immutable manifest)

`ScalarQuestion`, `SelectQuestion`, and `Question` are `Instantiable` — they
get `QuestionCreate` and `QuestionUpdate` via `CreateFromInstantiable<Question>`
and `UpdateFromInstantiable<Question>`. These belong in `common-protocol.ts`.

## Adapter Rules (non-negotiable)

Per `domain-archetypes.md` section 4:

- Export `to{Abstraction}(dict: Dictionary): Abstraction` and
  `from{Abstraction}(abstraction: Abstraction): Dictionary` — no other exports
- Column mapping: camelCase ↔ snake_case
- Every `Instantiable` field mapped: `createdAt` ↔ `created_at`,
  `updatedAt` ↔ `updated_at`, `deletedAt` ↔ `deleted_at`
- Every FK field maps to/from `_id`-suffixed snake_case column
- Every `Composition*` field mapped with `.map()` — no raw array casts
- `notValid` guards on required fields precede the single return — no
  unreachable returns
- Junction types and composite objects delegate to `common-adapter.ts`
  helpers

**Union-type adapter pattern for `Question`:**

```typescript
export const toQuestion = (dict: Dictionary): Question => {
  const type = dict.type as QuestionType
  if (type === 'single-select' || type === 'multi-select') {
    return {
      id: dict.id as string,
      type,
      prompt: dict.prompt as string,
      helpText: dict.help_text as string | undefined,
      required: dict.required as boolean | undefined,
      options: (dict.options as Dictionary[]).map(toQuestionOption),
      createdAt: dict.created_at as When,
      updatedAt: dict.updated_at as When,
      deletedAt: dict.deleted_at as When | undefined
    } satisfies SelectQuestion
  }
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
```

## Validator Rules (non-negotiable)

Per `domain-archetypes.md` sections 6.1–6.4:

- Export `validate{Abstraction}Create` and `validate{Abstraction}Update`
  where an Update protocol exists
- Return `string | null` — error message or null for valid
- Named private `is{Abstraction}` guard for every object type validated
- Recursive delegation: `isComposition*(data, is{Child})` for nested types
- Const-enum membership: import tuple from abstraction file, use `.includes()`
  — never redeclare locally
- Update validators: validate `id` first, then only fields `!== undefined`
- No Update validator for: `Workflow`, `JobWork`, `JobWorkLogEntry`

**Union-type validator pattern for `Question`:**

```typescript
export const validateQuestionCreate = (input: QuestionCreate): string | null => {
  if (!isNonEmptyString(input.prompt)) return 'prompt must be a non-empty string'
  if (!QUESTION_TYPES.includes(input.type as QuestionType)) {
    return 'type must be a valid QuestionType'
  }
  if (input.type === 'single-select' || input.type === 'multi-select') {
    if (!isCompositionPositive(input.options, isQuestionOption)) {
      return 'options must be a non-empty array of valid QuestionOption values'
    }
  }
  return null
}
```

`QUESTION_TYPES` is imported from `@domain/abstractions/common.ts` — not
`workflow.ts`.

## Formatting Rules (non-negotiable)

- No semicolons
- Single quotes
- TypeScript strict mode — `deno task check` must pass
- No `any` — use `unknown` at boundaries
- File format per `style-guide.md` section 6.1 Spec files

## Quality Bar

Before finalizing verify:

**Adapters**

- `common-adapter.ts` exports `toQuestion`/`fromQuestion` with union switch
- `toQuestion` uses `satisfies SelectQuestion` / `satisfies ScalarQuestion`
- `workflow-adapter.ts` has no `toQuestion`/`fromQuestion` — those are in common
- `job-adapter.ts` — `toJobWorkflow`/`fromJobWorkflow` has no `sequence` field
- `workflow-adapter.ts` — `toWorkflow`/`fromWorkflow` has no `tasks` field
- Every lifecycle field mapped, no raw array casts, `notValid` guards present

**Protocols**

- `common-protocol.ts` exports `QuestionCreate` and `QuestionUpdate`
- No hand-written `Omit`/`Pick`/`Partial` for `Instantiable` types
- No protocol entries for junction types or composite objects
- `WorkflowUpdate` does not exist
- `JobWorkUpdate` does not exist

**Validators**

- `common-validator.ts` exports `validateQuestionCreate` and `validateQuestionUpdate`
- `QUESTION_TYPES` imported from `@domain/abstractions/common.ts`
- All exports return `string | null`
- Named guards for all object types validated
- No local const-enum redeclarations
- `JobWorkflow` validator validates `jobId` and `basisWorkflowId` on Create —
  no `sequence` validation
- `deno task check` passes
