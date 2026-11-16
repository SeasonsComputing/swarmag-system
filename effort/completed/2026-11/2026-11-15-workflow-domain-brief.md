# Workflow Domain — Brief

**Completed 2026-11-16.** Shipped from `40bc505` to `9cb1ec9` and closed at the CA's direction; see "Closure" at the end. The first M-7 enabler: the domain and `api` supporting the Workflow Builder
(`2026-11-15-workflow-builder-brief.md`). Foundation mode: `domain/`, `core/cli`, and the schema
are locked namespaces.

## Status

The Answer and Note slice is implemented. The stage `user-create` and `user-update` edge functions
use the updated domain validators. The CA verifies attachment-only User Note Save on screen.
Q&A has no capture or execution surface, so Answer behavior has no end-to-end verification.

The Workflow version slice is implemented across the dictionary, abstraction, validator, schema,
and affected test data. The adapter mapping and derived protocols carry the string unchanged.
The edge source copy includes the version changes. The subsequent stage
database reset applies the string version schema; this effort does not deploy edge functions.

The three CRUD clients, `api.Workflows`, `api.Tasks`, and `api.Questions`, are composed with the
existing Supabase CRUD maker, domain adapters, and create/update validators. Core mutation
protocols and scoped drafts preserve union constituents. Lifecycle helpers and CRUD makers
retain their existing implementations. Client typing and live stage CRUD pass verification.

The ordered junction capability is implemented under
[B-36](../project/project-backlog.md#b-36--ordered-junctions-have-no-client): shared complete
membership reads, ordered replacement, and an owner-bound list mutator with confirmed writes.
Architecture and construction conventions describe the pattern. The core contracts, maker,
validators, and edge source copy include the capability.

The two ordered junction clients are composed in `api`. Both canonical junction tables now
include `UPDATE` policies matching their existing membership policies. The stage
genesis reset and `db-genesis-verify` passed on 2026-11-16. Live five-client verification passed
through `workflow-api-test.ts` (one test, zero failures).

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
columns. Development is greenfield, with stage as the only environment. The database is reset
through `db-genesis`; there is no backfill or compatibility path. The schema/reset
approach follows the governing lifecycle alignment below.

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
- `db-genesis` applies the schema; the five clients read and write on stage.

## Verification

`deno task check` passes, including guards, source types, and lint. The junction and list-client
suites pass all 32 tests with type checking enabled. Coverage includes unordered regression,
ordered paging and batching, affected-link writes, command serialization, failed and ambiguous
responses, and zero-effect, partial, and mismatched write confirmations.

The mutation protocol and scope tests establish Question create/update equivalence, required
select options, and union scope projections. Targeted formatting passes; `STYLE_AUDIT: PASS`
covers the changed core contracts, maker, validator shape, API composition, and tests.

Stage verification includes the CA's attachment-only User Note Save on screen and the
2026-11-16 live workflow API test. Workflow, Task, and Question create/read/update/list/soft-delete
passed. Both ordered junctions passed persisted replacement, append, removal, adjacent movement,
and owner-set reads through the public test-administrator session. Test cleanup removed junction
links and soft-deleted its records. Genesis and genesis verification both passed.
Answer validation and nested adapter round-trip are testable independently of the Runner;
those tests are not present. Q&A end-to-end verification depends on the Runner capture surface.
Workflow string versions round-tripped as `1.0` and `1.1` on stage after the stage reset.

## Remaining work

Final independent verification of the review amendments remains before archival. The Answer
structural-validation and nested adapter coverage gap is assigned to B-53 in the project backlog.
Builder work remains in its own brief; Runner capture and end-to-end verification remain M-9.

## Open

Schema lifecycle wording is reconciled in architecture-core §12.1, architecture-devops §12,
and CONVENTIONS §14.3: incremental advancement preserves existing state through migrations;
a greenfield genesis reset applies the complete canonical schema without a
migration for changes already represented there.

## Amendment — 2026-11-16 · Review and closure preparation

The stage test now uses complete paginated reads for
membership and soft-delete exclusion assertions. Cleanup attempts every tracked owner and record,
retaining the original test failure alongside cleanup failures. This supersedes the original
first-page-only assertions and fail-fast cleanup. CONVENTIONS §14.3 now explicitly follows the
lifecycle distinction in architecture-core §12.1.

Earlier stage and repository verification results above describe the version before this test
amendment. No checks or stage rerun were performed for the amendment, per CA instruction; it has
no new verification claim. Final independent verification and CA closure review remain pending,
so this record stays active rather than being archived as verified.

Deferred items are assigned explicitly: B-53 owns the Answer test gap, the Workflow Builder brief
owns Builder work, and M-9 owns Runner capture and end-to-end verification. No product-code,
domain-shape, schema, deployment, or UX changes are part of this review follow-up.

## Closure — 2026-11-16

The CA directed closure after review.

**Shipped** (`40bc505` to `9cb1ec9`). Answer records its Question's type at capture with an
optional value; Note text is optional and an attachment can be the content; `Workflow.version` is
a nonempty string; `api.Workflows`, `api.Tasks`, and `api.Questions`; the ordered junction family
(B-36) with `api.WorkflowTasks` and `api.TaskQuestions`; `UPDATE` policies on both junction
tables; the governing documents above.

**Verified.** `deno task check` and `deno task fmt:check` pass. The stage test passed on
2026-11-16 (`workflow clients persist CRUD and ordered membership on stage ... ok`, one passed,
none failed) after genesis and `db-genesis-verify`.

**Not run.** The amendment's rewrite of `workflow-api-test.ts` (complete paged reads, cleanup
that attempts every step) was reviewed by the AI Architect but not run; it needs the stage
environment (B-34).

**Departures from the drafted design,** settled by the CA with ACE: no `photo` Question type —
a photo is a Note attachment on any Question; Answer gains its captured `type`; Note text is
optional; version validation is a nonempty string, its `major.minor` reading the Builder's.

**Settled on closing.**

- **B-36** is done and leaves the backlog.
- **The Answer test gap** is B-53.
- **Builder work** is the Workflow Builder brief's; **Runner capture and end-to-end Q&A** are M-9's.
- **architecture-devops §12.4** lists the stage test's environment but not the Field Binder keys
  the run also requires (`FIELD_BINDER_SERVER_ROOT`, `FIELD_BINDER_INBOX_DB_NAME`,
  `FIELD_BINDER_DB_NAME`); it joins B-34.

_End of Brief_
