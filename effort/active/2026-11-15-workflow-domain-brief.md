# Workflow Domain — Brief

**Active.** The first M-7 enabler: the domain and `api` supporting the Workflow Builder
(`2026-11-15-workflow-builder-brief.md`). Foundation mode: `domain/`, `core/cli`, and the schema
are locked namespaces.

## Status

The Answer and Note slice is implemented. The stage `user-create` and `user-update` edge functions
use the updated domain validators. The CA verifies attachment-only User Note Save on screen.
Q&A has no capture or execution surface, so Answer behavior has no end-to-end verification.

The Workflow version slice is implemented across the dictionary, abstraction, validator, schema,
and affected test data. The adapter mapping and derived protocols carry the string unchanged.
The edge source copy includes the version changes; stage deployment and database reset are
outside this slice.

The three CRUD clients, `api.Workflows`, `api.Tasks`, and `api.Questions`, are composed with the
existing Supabase CRUD maker, domain adapters, and create/update validators. Core mutation
protocols and scoped drafts preserve union constituents. Lifecycle helpers and CRUD makers
retain their existing implementations. Client typing passes verification; stage CRUD has no
verification claim.

The ordered junction capability is implemented under
[B-36](../project/project-backlog.md#b-36--ordered-junctions-have-no-client): shared complete
membership reads, ordered replacement, and an owner-bound list mutator with confirmed writes.
Architecture and construction conventions describe the pattern. The core contracts, maker,
validators, and edge source copy include the capability.

The two junction client compositions, schema `UPDATE` policies, and stage verification remain
outside the implemented slices.

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

Mutation protocols apply lifecycle projection independently to each union constituent.
Create and update protocols preserve the resulting variants. Scoped drafts and updates preserve
constituents over common fields; variant-specific scopes use the corresponding constituent.
Question's named per-variant protocols remain the domain boundary vocabulary. The generic CRUD
maker and validator shape consume the preserved union without Question-specific behavior.

### Ordered junctions

An ordered specification names the `sequence` field and supplies `OrderedJunctionValidator<J>`,
with create and update validation. Unordered specifications retain create-only
`JunctionValidator<J>`. Both forms use the same owner batching and pair-key pagination.

`partners` and `partnersOf` return partner IDs in sequence order. `replace` establishes the
supplied membership and order, assigning positions from one. Its multi-request writes are
non-atomic; replay converges without competing writers.

`list(owner)` opens an owner-bound mutator. Callers identify partners by ID through `add`,
`remove`, `moveBack`, and `moveForward`; `items` returns an isolated snapshot. Sequence positions
are distinct within the owner; gaps are valid. Add appends one link, remove leaves gaps, and
movement exchanges positions with the adjacent link. Boundary moves perform no write. Opening
a list with tied positions fails without rewriting data; `replace` explicitly establishes valid
order.

Mutations write only affected links and confirm the returned identities and positions before
publishing local state. Commands serialize within one instance. A failed or unconfirmed write
invalidates it; reopening reconciles persisted state. Relative moves are not automatically
replayed. Other writers require a fresh list.

Each junction's primary key is the pair: a Task appears at most once in a Workflow, and a
Question at most once in a Task. The Builder owns domain operations such as clone.

### Facets

Workflow carries facets; Task and Question carry none. The Builder edits Workflow facets.

## Governing documents

Documentation leads implementation:

- **domain-data-dictionary §5.4 and §11:** optional Note `content`, captured Answer `type`,
  optional Answer `value`, and Workflow `version` as a string.
- **architecture-core §5:** the junction client family includes an ordered variant.
- **CONVENTIONS §10.6 and §14.2.8:** ordered specifications supply sequence metadata and update
  validation; state-bearing junction tables include `UPDATE` policies.
- **domain-seed-data:** Workflow versions use the string form wherever present.

## Production scope

Paths are under `source/`.

| Files                                                 | Work                                                              |
| ----------------------------------------------------- | ----------------------------------------------------------------- |
| `domain/abstractions/workflow.ts`                     | Answer `type`, optional `value`, string Workflow `version`        |
| `domain/adapters/workflow-adapter.ts`                 | Answer type mapping and Workflow version serialization            |
| `domain/validators/workflow-validator.ts`             | Answer structural validation and string version validation        |
| `domain/abstractions/common.ts`                       | Optional Note `content`                                           |
| `domain/validators/common-validator.ts`               | Optional Note text shape validation                               |
| `front/app/shell/notes/notes-editor.tsx`              | Text or attachments satisfy content; absent text handling         |
| `domain/schema/schema.sql`                            | `version TEXT`; junction `UPDATE` policies                        |
| `core/cli/make-supabase-client.ts`                    | Shared junction reader, ordered replacement, and bound mutator    |
| `core/std/protocols.ts`, `core/std/make-scope.ts`     | Union-preserving mutation protocols and scoped drafts             |
| `core/std/validators.ts`, `core/std/api-contracts.ts` | Junction validator and client contracts                           |
| `front/api/api.ts`                                    | The five clients                                                  |
| `tests/fixtures/job-samples.ts`                       | Captured `type: 'internal'` on the telemetry Answer               |
| `tests/cases/…`                                       | Validators, adapters, Note content, and ordered junction behavior |

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
- Ordered single-owner and owner-set reads return complete membership in sequence order.
- Ordered replacement writes the supplied membership and order; replay converges after partial
  failure without competing writers.
- The bound mutator appends, removes without renumbering, and exchanges adjacent positions.
  It serializes commands, leaves boundary moves unchanged, and exposes isolated snapshots.
- Opening a mutator rejects tied positions without writing. Mutation success requires returned
  identities and positions matching the requested change; zero-effect, partial, or mismatched
  confirmations invalidate the instance.
- Unordered junction behavior retains its existing membership and replacement contract.
- The CA runs `db-genesis`; the five clients read and write on stage.

## Verification

`deno task check` passes, including guards, source types, and lint. The junction and list-client
suites pass all 32 tests with type checking enabled. Coverage includes unordered regression,
ordered paging and batching, affected-link writes, command serialization, failed and ambiguous
responses, and zero-effect, partial, and mismatched write confirmations.

The mutation protocol and scope tests establish Question create/update equivalence, required
select options, and union scope projections. Targeted formatting passes; `STYLE_AUDIT: PASS`
covers the changed core contracts, maker, validator shape, API composition, and tests.
Repository-wide `fmt:check` reports formatting differences in
`source/domain/validators/common-validator.ts` and `workflow-validator.ts`, outside the ordered
junction repair.

Stage behavior verification is limited to the CA's attachment-only User Note Save on screen.
Answer validation and nested adapter round-trip are testable independently of the Runner;
those tests are not present. Q&A end-to-end verification depends on the Runner capture surface.
The Workflow version schema applies through the CA's greenfield database reset; its stage
behavior has no verification claim.

## Remaining work

- Compose `api.WorkflowTasks` and `api.TaskQuestions` with their domain adapters and validators.
- Add `UPDATE` policies to `workflow_tasks` and `task_questions` in the canonical schema.
- Apply the schema through the CA's greenfield database reset and verify the five clients on stage.

## Open

1. **Schema lifecycle wording.** Architecture-core §12.1 prescribes migrations. Its wording needs
   reconciliation with the CA's greenfield `db-genesis` scope; this effort includes no migration
   or genesis prompt changes.

_End of Brief_
