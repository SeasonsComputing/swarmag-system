# 1-genesis-domain-abstractions

You are an AI Coding Engine operating under `CONSTITUTION.md`. You have no
architectural authority. Implement exactly what is specified. Do not invent
abstractions, reinterpret intent, or cross architectural boundaries.

## 1. Authority

In case of conflict:
`CONSTITUTION.md` → `architecture-core.md` → `domain.md` → `domain-archetypes.md`
→ `data-dictionary.md` → `style-guide.md`

You MUST ingest all of these files PRIOR to assessing your task. Confirm you
have no conflicts, questions, or concerns before generating any files.

## 2. Task

Generate `source/domain/abstractions/` from scratch. Delete all existing files
and replace them completely. Do not patch.

## 3. Target File Inventory

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

## 4. Authoritative Source

`data-dictionary.md` is the authoritative reference for all types, fields,
relations, and purpose statements. `domain.md` provides narrative context and
invariants. In case of conflict between them, `domain.md` governs.

## 5. Placement Rules (non-negotiable)

Per `domain-archetypes.md` section 2:

**`common.ts`** owns:
`Location`, `Attachment`, `Note`,
`QuestionType`, `QUESTION_TYPES`, `QuestionOption`,
`ScalarQuestion`, `SelectQuestion`, `Question`,
`AnswerValue`, `Answer`

**`workflow.ts`** owns:
`Task`, `TaskQuestion`, `Workflow`, `WorkflowTask`

All other files own their named domain area as defined in `data-dictionary.md`.

## 6. Key Invariants (non-negotiable)

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

## 7. Implementation Rules

All implementation rules are defined in `domain-archetypes.md`. Apply them in
full. The sections below are cross-references only — not restatements.

| Concern            | Spec reference                     |
| ------------------ | ---------------------------------- |
| Abstraction rules  | `domain-archetypes.md` section 3.1 |
| Const-enum pattern | `domain-archetypes.md` section 3.2 |
| Union-type pattern | `domain-archetypes.md` section 3.3 |
| File format        | `style-guide.md` section 6.1       |
| Naming             | `style-guide.md` section 4         |
| Import aliases     | `style-guide.md` section 3         |

## 8. Formatting Rules (non-negotiable)

- No semicolons
- Single quotes for all string literals
- TypeScript strict mode — `deno task check` must pass
- No `any` — use `unknown` at boundaries
- No inline `id`, `createdAt`, `updatedAt`, `deletedAt?` on Instantiable types
- File format per `style-guide.md` section 6.1 Spec files

## 9. Quality Bar

Before finalizing verify:

- No `id`, `createdAt`, `updatedAt`, `deletedAt?` declared inline on any
  `Instantiable` type — use intersection only
- All const-enum tuples paired with derived type alias, both exported
- `Question` is a discriminated union of `ScalarQuestion | SelectQuestion` —
  no optional fields that only apply to one variant
- `CompositionPositive` (not `CompositionMany`) on `options` in `SelectQuestion`
- `WorkflowTask` and `TaskQuestion` have no lifecycle columns
- `Workflow` has no `tasks` field
- `JobWorkflow` has no `sequence` field
- `JobWorkLogEntry` is append-only (`Pick<Instantiable, 'id' | 'createdAt'>`)
- `deno task check` passes
