# Workflow Domain — Brief

**Active.** The first M-7 enabler: the domain and `api` supporting the Workflow Builder
(`2026-11-15-workflow-builder-brief.md`). Foundation mode: `domain/`, `core/cli`, and the schema
are locked namespaces.

## Status

The Answer and Note slice is implemented. The stage `user-create` and `user-update` edge functions
use the updated domain validators. The CA verifies attachment-only User Note Save on screen.
Q&A has no capture or execution surface, so Answer behavior has no end-to-end verification.
Checks and STYLE_AUDIT are not run under the CA's instruction.

The Workflow version slice is implemented across the dictionary, abstraction, validator, schema,
and affected test data. The adapter mapping and derived protocols carry the string unchanged.
The edge source copy includes the version changes; stage deployment and database reset are
outside this slice. Checks and STYLE_AUDIT are not run under the CA's instruction.

Ordered junctions and the five clients remain undispatched.

## Design

### Answer capture context and response

Answer records `type: QuestionType`, the Question's type at capture time. This preserves capture
context independently of changes to the referenced Question. Value is independent of Question
type; Answer is an object, not a discriminated union.

`Answer.value` is optional and supports `string | number | boolean | string[]`. An Answer requires
a response: a value, a Note, or both. A Note can supply the response itself. The capture surface
owns response satisfaction; structural domain validation checks the supplied fields. Runner
capture and completion belong to M-9.

`notes` is `CompositionMany<Note>`, represented by `[]` when empty.

### Note content

`Note.content` is optional. A Note requires content: text, an attachment, or both. An attachment
can supply the content itself. `attachments` is `CompositionMany<Attachment>`, represented by
`[]` when empty.

The shared Notes editor enforces content on Save. It accepts text-only, attachment-only, and
combined content, and rejects an empty Note. Drafts, text normalization, titles, required
indicators, and errors handle absent text consistently. Structural domain validation checks
optional text and attachment shapes; content sufficiency belongs to the editing surface.

The Note index title uses the first line of text, a single attachment's filename, or the count
for multiple attachments. An empty draft uses "Untitled note".

Photos are Note attachments, available with every Question type. Question types are `internal`,
`text`, `number`, `boolean`, `single-select`, and `multi-select`.

### Workflow version

`Workflow.version` is a string, stored as `TEXT`. Domain validation uses the existing nonempty
string expectation. The Builder owns its `major.minor` interpretation (`"4.2"`) and advancement.

### The five clients

`front/api/api.ts` composes one client per abstraction:

| Client          | Kind             | Owner        | Partner      |
| --------------- | ---------------- | ------------ | ------------ |
| `Workflows`     | CRUD             |              |              |
| `Tasks`         | CRUD             |              |              |
| `Questions`     | CRUD             |              |              |
| `WorkflowTasks` | ordered junction | `workflowId` | `taskId`     |
| `TaskQuestions` | ordered junction | `taskId`     | `questionId` |

The ordered junction follows [B-36](../project/project-backlog.md#b-36--ordered-junctions-have-no-client):
a `sequence` field in the specification makes `partners` return in order and `replace` write
`sequence`; `JunctionValidator<J>` includes `validateUpdate`. Unordered junction behavior is
unchanged. Each junction's primary key is the pair: a Task appears at most once in a Workflow,
and a Question at most once in a Task.

### Facets

Workflow carries facets; Task and Question carry none. The Builder edits Workflow facets.

## Governing documents

Documentation leads implementation:

- **domain-data-dictionary §5.4 and §11:** optional Note `content`, captured Answer `type`,
  optional Answer `value`, and Workflow `version` as a string.
- **architecture-core §5:** the junction client family includes an ordered variant.
- **domain-seed-data:** Workflow versions use the string form wherever present.

## Production scope

Paths are under `source/`.

| Files | Work |
| ----- | ---- |
| `domain/abstractions/workflow.ts` | Answer `type`, optional `value`, string Workflow `version` |
| `domain/adapters/workflow-adapter.ts` | Answer type mapping and Workflow version serialization |
| `domain/validators/workflow-validator.ts` | Answer structural validation and string version validation |
| `domain/abstractions/common.ts` | Optional Note `content` |
| `domain/validators/common-validator.ts` | Optional Note text shape validation |
| `front/app/shell/notes/notes-editor.tsx` | Text or attachments satisfy content; absent text handling |
| `domain/schema/schema.sql` | `version TEXT`; junction `UPDATE` policies |
| `core/cli/make-supabase-client.ts` | Ordered junction variant |
| `core/std/validators.ts`, `core/std/api-contracts.ts` | Junction validator and client contracts |
| `front/api/api.ts` | The five clients |
| `tests/fixtures/job-samples.ts` | Captured `type: 'internal'` on the telemetry Answer |
| `tests/cases/…` | Validators, adapters, Note content, and ordered junction behavior |

Domain artifacts are hand-edited as if produced from genesis. Genesis prompts and drift
investigation are outside this scope.

Answer and Note are embedded JSONB compositions; their field changes require no new schema
columns. Development is greenfield, with stage as the only environment. The CA resets the
database through `db-genesis`; there is no backfill or compatibility path. The schema/reset
approach is subject to the governing alignment below.

`deno task edge-sync` regenerates `supabase/functions/_shared/` from source, along with function
manifests and build metadata. The generated copy is not hand-edited. Edge handlers require no
changes.

Out of scope:

- the Builder, its API, and version advancement
- the Runner's response capture and completion gate (M-9)
- facets on Task or Question
- genesis prompt updates and drift investigation
- additional Question types or Answer value shapes

Changes outside this scope require escalation.

## Acceptance

- Answer `type` survives adapter round-trip; missing or invalid types fail structural validation.
- Answer permits absent `value`; supplied values retain the supported shapes independently of
  Question type.
- Note permits absent text structurally; supplied text and attachments satisfy shape validation.
- The Notes editor saves text-only, attachment-only, and combined content, rejects an empty Note,
  and displays Notes without text safely.
- The Note index identifies attachment-only Notes by filename or attachment count.
- The edge domain copy contains the source abstractions, adapters, and validators.
- Workflow version validation accepts nonempty strings; create requires a version and update
  permits its omission. Interpretation of the string belongs to the Builder.
- `WorkflowTasks.partners` returns Tasks in `sequence` order; `replace` writes the supplied order;
  a replayed `replace` converges.
- The CA runs `db-genesis`; the five clients read and write on stage.

Implementation verification comprises `deno task check`, `deno task fmt:check`, the permitted
unit suite, and STYLE_AUDIT. These checks are not run for the Answer/Note slice under the CA's
instruction. Its verification is limited to the CA's attachment-only User Note Save on screen.
Answer validation and nested adapter round-trip are testable independently of the Runner;
those tests are not present. Q&A end-to-end verification depends on the Runner capture surface.
The Workflow version slice has no verification claim; the schema applies through the CA's
greenfield database reset.

## Open

1. **Governing alignment.** Ordered junction `UPDATE` policies conflict with CONVENTIONS §14.2.8.
   The schema/reset approach also conflicts with architecture-core §12.1's migration requirement.
   Both require CA resolution before the remaining implementation scope is dispatched.

_End of Brief_
