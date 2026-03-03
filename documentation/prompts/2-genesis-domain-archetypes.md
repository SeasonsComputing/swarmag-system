# 2-genesis-domain-archetypes

You are an AI Coding Engine operating under `CONSTITUTION.md`. You have no
architectural authority. Implement exactly what is specified. Do not invent
abstractions, reinterpret intent, or cross architectural boundaries.

## 1. Authority

In case of conflict:
`CONSTITUTION.md` → `architecture-core.md` → `domain.md` → `domain-archetypes.md`
→ `data-dictionary.md` → `style-guide.md`

You MUST ingest all of these files PRIOR to assessing your task. Confirm you
have no conflicts, questions, or concerns before generating any files.

## 2. Prerequisite

Ingest all files under `source/domain/abstractions/` before generating any
output. The abstraction files are the authoritative type source. If any
abstraction conflicts with `data-dictionary.md`, escalate — do not proceed.

## 3. Task

Generate the three domain sub-layers from scratch:

- `source/domain/adapters/`
- `source/domain/protocols/`
- `source/domain/validators/`

Delete all existing files and replace them completely. Do not patch.

## 4. Target File Inventory

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
  common-protocol.ts
  asset-protocol.ts
  chemical-protocol.ts
  customer-protocol.ts
  service-protocol.ts
  user-protocol.ts
  workflow-protocol.ts
  job-protocol.ts

source/domain/validators/
  common-validator.ts
  asset-validator.ts
  chemical-validator.ts
  customer-validator.ts
  service-validator.ts
  user-validator.ts
  workflow-validator.ts
  job-validator.ts
```

## 5. Implementation Rules

All implementation rules are defined in `domain-archetypes.md`. Apply them in
full. The sections below are cross-references only — not restatements.

| Concern                   | Spec reference                     |
| ------------------------- | ---------------------------------- |
| Adapters                  | `domain-archetypes.md` section 4   |
| Protocols                 | `domain-archetypes.md` section 5   |
| Validators                | `domain-archetypes.md` section 6   |
| Shared composition guards | `domain-archetypes.md` section 6.5 |
| File format               | `style-guide.md` section 6.2       |
| Naming                    | `style-guide.md` section 4         |

## 6. Placement Rules (non-negotiable)

Per `domain-archetypes.md` section 2:

`common-adapter.ts` owns: `Location`, `Attachment`, `Note`, `QuestionOption`,
`ScalarQuestion`, `SelectQuestion`, `Question`, `Answer`

`workflow-adapter.ts` owns: `Task`, `TaskQuestion`, `Workflow`, `WorkflowTask`

`common-validator.ts` owns: `isAttachment`, `isNote`, `isAnswer`,
`isQuestionOption`, `validateQuestionCreate`, `validateQuestionUpdate`

All other files own their named domain area.

## 7. Protocol Exceptions (non-negotiable)

Per `domain-archetypes.md` section 5.1 Rule 3:

- `JobWorkLogEntryCreate = Pick<JobWorkLogEntry, 'jobId' | 'userId' | 'answer'>`
- `WorkflowCreate = CreateFromInstantiable<Workflow>` — no `WorkflowUpdate`
- `JobWorkCreate = CreateFromInstantiable<JobWork>` — no `JobWorkUpdate`

## 8. Validator Exceptions (non-negotiable)

Per `domain-archetypes.md` section 6.6:

- No Update validator for: `Workflow`, `JobWork`, `JobWorkLogEntry`
- No `validateNote*`, `validateAttachment*`, `validateAnswer*` anywhere

## 9. Formatting Rules (non-negotiable)

- No semicolons
- Single quotes
- TypeScript strict mode — `deno task check` must pass
- No `any` — use `unknown` at boundaries

## 10. Quality Bar

Before finalizing, verify:

### 10.1 Adapters

- `common-adapter.ts` exports `toQuestion`/`fromQuestion` with exhaustive `switch`
- `toQuestion` arms use `satisfies SelectQuestion` / `satisfies ScalarQuestion`
- `workflow-adapter.ts` has no `toQuestion`/`fromQuestion` — those belong in common
- `job-adapter.ts` — `toJobWorkflow`/`fromJobWorkflow` has no `sequence` field
- `workflow-adapter.ts` — `toWorkflow`/`fromWorkflow` has no `tasks` field
- Every `Instantiable` lifecycle field mapped; no raw array casts; `notValid` guards present

### 10.2 Protocols

- `common-protocol.ts` exports `QuestionCreate` and `QuestionUpdate`
- No hand-written `Omit`/`Pick`/`Partial` for `Instantiable` types
- No protocol entries for junction types or composite objects
- `WorkflowUpdate` does not exist
- `JobWorkUpdate` does not exist
- No JSDoc on protocol type exports

### 10.3 Validators

- `common-validator.ts` exports exactly: `isAttachment`, `isNote`, `isAnswer`,
  `isQuestionOption`, `validateQuestionCreate`, `validateQuestionUpdate`
- No `isNote`, `isAttachment`, or `isAnswer` declared locally in any other
  validator file — imported from `common-validator.ts` instead
- No `validateNote*`, `validateAttachment*`, or `validateAnswer*` anywhere
- `QUESTION_TYPES` imported from `@domain/abstractions/common.ts`
- All `validate*` exports return `string | null`
- `JobWorkflow` validator: validates `jobId` and `basisWorkflowId` on Create —
  no `sequence` validation
- `deno task check` passes
