# Workflow Domain — Brief

**Active, not dispatched.** Drafted 2026-11-15 from a CA + AI Architect exploration session. The
first M-7 enabler: the domain and `api` the Workflow Builder (`2026-11-15-workflow-builder-brief.md`)
stands on. Foundation mode: `domain/`, `core/cli`, and the schema are locked namespaces.

## Escalation: `domain/`, `core/cli`, schema (requested)

- `domain/abstractions/workflow.ts`, its adapter and validator: a new Question type and a string
  `version`.
- `core/cli/make-supabase-client.ts`: the ordered junction variant, already designed (B-36).
- `domain/schema/schema.sql`: the `questions` type check, `workflows.version`, and `UPDATE`
  policies on `workflow_tasks` and `task_questions`. Stage is the only environment: the schema is
  edited and the CA runs `db-genesis`. No migration.

## Current behavior

Verified against the code on 2026-11-15:

- `QUESTION_TYPES` is `internal`, `text`, `number`, `boolean`, `single-select`, `multi-select`.
  `Question` is the union of `InternalQuestion`, `ScalarQuestion`, and `SelectQuestion`.
- `Workflow.version` is a `number`, `INTEGER NOT NULL` in the schema, validated as a positive
  number.
- `Workflow.facets` exists, in the type and the schema. Task and Question carry none.
- `api.ts` has no Workflow, Task, or Question client; `Workflows` is a commented-out line.
  Adapters and validators exist for all five.
- `makeJunctionSupabaseClient` serves unordered junctions only. `workflow_tasks` and
  `task_questions` carry `sequence` and have no `UPDATE` policy (B-36).
- Each junction's primary key is the pair, so a Task appears at most once in a Workflow and a
  Question at most once in a Task.

## Target design

### The `photo` Question

For a Question whose only answer is a photo.

- `QUESTION_TYPES` gains `photo`; `Question` gains `PhotoQuestion = BaseQuestion & { type: 'photo' }`.
- The photo is an attachment on the Answer's Note. The type changes only what the Runner shows
  and what its gate requires; the Answer's shape is unchanged.
- The schema's `questions_type_check` admits `photo`.

### `version` is a string

- `Workflow.version: string`, in the form `major.minor` (`"4.2"`). The schema column is `TEXT`.
- The validator requires two non-negative integers joined by a dot.
- Only the form lives in the domain. When a version changes is the Builder's rule.

### The five clients

In `front/api/api.ts`, one per abstraction, beside the others:

| Client          | Kind               | Owner        | Partner      |
| --------------- | ------------------ | ------------ | ------------ |
| `Workflows`     | CRUD               |              |              |
| `Tasks`         | CRUD               |              |              |
| `Questions`     | CRUD               |              |              |
| `WorkflowTasks` | ordered junction   | `workflowId` | `taskId`     |
| `TaskQuestions` | ordered junction   | `taskId`     | `questionId` |

The ordered junction is B-36 as designed: a `sequence` field in the specification makes `partners`
return in order and `replace` write `sequence`, and `JunctionValidator<J>` gains `validateUpdate`.
It is additive; unordered junctions are unchanged.

### Facets

Workflow already carries facets. Nothing changes here; the Builder edits them.

## Governing documents to amend

Amended first, since documentation leads code:

- **domain-data-dictionary §11:** `QuestionType` gains `photo`; `PhotoQuestion`; `Workflow.version`
  is a `major.minor` string.
- **domain-model:** the Question types, where listed.
- **architecture-core §5:** the junction client family has an ordered variant.
- **domain-seed-data:** any seeded Workflow `version` becomes a string.

## Production scope

Paths are under `source/`.

| Files                                                         | Work                                         |
| ------------------------------------------------------------- | -------------------------------------------- |
| `domain/abstractions/workflow.ts`                             | `photo`, `PhotoQuestion`, string `version`   |
| `domain/adapters/workflow-adapter.ts`                         | as the types require                         |
| `domain/validators/workflow-validator.ts`                     | `photo`; `major.minor` version               |
| `domain/schema/schema.sql`                                    | type check, `version TEXT`, `UPDATE` policies |
| `core/cli/make-supabase-client.ts`, `core/stdx` contract      | ordered junction variant (B-36)              |
| `front/api/api.ts`                                            | the five clients                             |
| `tests/cases/…`                                               | validator, adapter, ordered junction         |

Out of scope:

- the Builder and its API, and when a version changes
- the Runner's photo screen and gate (M-9)
- facets on Task or Question (dropped)

Escalate any change outside this scope.

## Acceptance

- A `photo` Question round-trips through the adapter and validator.
- A version other than `major.minor` fails validation.
- `WorkflowTasks.partners` returns Tasks in `sequence` order; `replace` with a reordered list
  writes the new order; a replayed `replace` converges.
- The CA runs `db-genesis` and the five clients read and write on stage.

Run `deno task check`, `deno task fmt:check`, the permitted unit suite, and STYLE_AUDIT.

## Open

1. **A photo Answer's `value`.** `Answer.value` is required; the photo lives on the Note. What the
   value holds for a `photo` Question is undecided.
2. **Genesis.** `domain/` is regenerable from genesis. How this change reaches the genesis prompts
   is the CA's.

## Records

- **Photo is a Note.** The docstore foundation already carries attachments on Notes; a photo
  answer is one more of them.
- **The form is the domain's; the rule is the Builder's.** A `major.minor` string is data. When the
  minor or major changes is behavior, and it lives with the feature that edits Workflows.

## Design history

- `photo` was first framed as "a value or an attachment". The docstore settles it: the Note carries
  it.
- `version` was weighed as an author's label, a save counter, and real versioning before
  `major.minor` was chosen to trace on-the-job issues.

_End of Brief_
