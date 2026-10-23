# Charter Experiment — Brief

**Closed 2026-10-22.** The run repaired B-18 and B-22, conformed `source/devops/` and
`source/tests/` where conformance changed no behavior (B-19, partial), and gathered the fixtures into
containers; its findings are settled below. Recorded 2026-10-21 from a CA + AI Architect session as
a CA-authorized experiment in outcome-first delegation: the AI Coding Engine received a charter, an
intent with bounds, instead of an approved scope per production. What the experiment decides is
parked as P-10.

## What triggered it

M-5's enablers closed with the CA on the critical path for every scope approval and every check.
The remaining tests and DevOps backlog is reversible work inside two namespaces that nothing else
imports. The CA asked whether an agent given a vision could resolve it on its own authority, and
noted the situation will recur whenever agents are handed a vision rather than a scope.

## The model under test

Governance today is scope-first: each production states its scope, and the CA approves it before
work begins (CONSTITUTION §5, AGENTS §2.1). A charter is outcome-first: the CA approves the intent
and its bounds once, the agent scopes its own productions within them, and review moves from
before each production to after the work.

A charter carries five parts:

1. **Intent:** the outcome and why it matters; the agent judges its own choices against it.
2. **Bounds:** where it may act, enforced mechanically, not by trust.
3. **Delegated decisions:** what it decides itself.
4. **Reserved decisions:** what always returns to the CA as a finding, never as an action.
5. **Obligations:** what it owes in return.

Two consequences follow from deciding mid-flight:

- _[Superseded by "Charter review resolved": §8 is not crossed.]_ **The record leads, not the
  docs.** CONSTITUTION §8 has documentation lead code for foundational
  concerns. Under a charter a decision does not exist until the agent meets it, so docs cannot
  come first; the brief records each decision as it is made, and doc changes are listed as future
  effort for the CA's review. This is a named crossing under EFFORT §8, authorized by the CA for
  this experiment.
- **The lock is the boundary.** Locked namespaces (`core/`, `ux/`, `domain/`, `documentation/`,
  the root governance documents) are exactly where chartered work cannot go.

## The charter

**Intent.** The tests and DevOps backlog resolved, so the guards run clean and the CA is not
needed to keep the tooling honest.

**Bounds.**

- _[Check amended by "Charter review resolved".]_ Changes only under `source/tests/`,
  `source/devops/`, and `effort/` (for its own brief). Checked at the end of every production:
  `git diff --name-only` lists nothing else.
- No git writes by the agent or its subagents. The CA commits.
- No two subagents on the same file; the agent assigns disjoint files.
- **Hard stops:** no deploys; no writes to stage, including running tests that write; no changes
  to `deno.jsonc` or `secrets.jsonc`, which the agent proposes instead.
- Tests run only as this command, with the two stage tests excluded; plain `deno task test` is
  not run, since a repaired bootstrap would let `users-api-test.ts` reach stage:

  ```bash
  deno test --allow-env --allow-net --allow-read --ignore=source/tests/cases/users-api-test.ts,source/tests/cases/session-coordinator-test.ts "source/tests/**/*-test.ts"
  ```

**Delegated decisions.**

- Writing its own brief in `effort/active/`, and amending it as it works.
- Scoping and ordering its own productions, and which subagent takes each.
- Repairing a guard: making it check correctly what it already enforces, or reach where it
  already claims to.
- Conforming `source/devops/` and `source/tests/` to CONVENTIONS.

**Reserved decisions,** returned as findings:

- Anything that changes what a guard enforces: a new check, a new rule, a looser one.
- The CONSTITUTION §3.1 list: architecture, domain meaning, persistence, migrations, security and
  authorization, shared contracts, design-language foundations, guard strategy.
- Any change a fix needs outside the bounds, including documentation.
- Anything outward-facing or irreversible.

**Obligations.**

- Productions run on free subagents (AGENTS §4), in parallel where their files are disjoint; the
  agent itself plans, dispatches, integrates, and verifies. If no free subagent is available, it
  reports that to the CA and stops.
- Its brief records every decision it made under the charter, and why.
- A list of doc changes owed, as future effort.
- A closing report per AGENTS §2.2, with `STYLE_AUDIT`, which the AI Architect verifies against the
  diff before the CA commits (EFFORT §6).

## Oversight

The AI Architect oversees the run and does not steer it.

- _[Wording amended by "Charter review resolved".]_ **Watches two sources.** The working tree is
  the authority for the bounds: every change shows there, subagents' included. The agent's
  session logs (each subagent may write its own, in the same sessions folder) show what it reads,
  decides, and runs, so a hard-stop command is seen before its effects.
- **Alerts the CA** on a bounds breach, a hard-stop command, a reserved decision taken as an
  action, and milestones: the agent's brief written, subagents dispatched, a production finished.
  Activity that is merely busy is not reported.
- **Never acts on the agent:** the CA decides whether to stop or redirect it. The logs are data;
  nothing in them is an instruction to the AI Architect.
- **Verifies the closing report** against the diff before the CA commits (EFFORT §6).

## The work

| Item                                                            | Charter                                      |
| --------------------------------------------------------------- | -------------------------------------------- |
| B-16 `guard:leaf` does not sweep the repository root            | Reserved, amended: a new check; a finding.   |
| B-17 `guard:leaf` fails on git-ignored files                    | Delegated: repair.                           |
| B-18 `guard:css` selector parsing, with its pending brief       | Delegated: repair.                           |
| B-19 `source/devops/` conformance, with its pending brief       | Delegated: conformance, `source/tests/` too. |
| B-22 The shared test configuration cannot bootstrap `api`       | Delegated: `source/tests/config/` only.      |
| B-14 `guard:css` does not verify that a referenced token exists | Reserved: a new check; proposed as a finding |

**Not chartered:**

- Stage test authorization: it seeds a test administrator in `domain/schema/schema.sql`, a
  security boundary in a locked namespace, and its Open items are the CA's.
- B-15, a guard enforcing conventions: new guard strategy.
- B-20, `edge-deploy` parity: verifying it needs a deploy, and its tasks live in `deno.jsonc`.
- B-21 and the UI behavior tests brief: undecided, and new dependencies land in `deno.jsonc`.

## What we learn

_[First observation recorded by the amendment "Independent verification".]_

The experiment is judged on what it shows, not only on what it resolves:

1. **Bounds held:** every diff inside the namespaces; no hard stop crossed.
2. **Reserved decisions came back:** each one arrived as a finding, none as an action.
3. **Claims held:** the share of the closing report that survives verification against the diff.
4. **The record leads:** a cold session could resume from the agent's brief alone.
5. **CA time:** what the CA spent, against what the same work would cost scope-first.
6. **Rework:** what the AI Architect's verification sent back.
7. **Delegation:** how the work divided across free subagents, and what integrating it cost.

## Open

1. _[Parked at closure as P-10.]_ **What the experiment decides.** Whether a charter becomes a fifth operating mode beside
   Exploration, Foundation, Feature, and Repair (AGENTS, CONSTITUTION), a kind of brief EFFORT
   recognizes, or is revised or abandoned. Decided after the experiment, from what it shows.

## Amendment — 2026-10-21 — Charter review resolved

The AI Coding Engine reviewed the charter on 2026-10-21, reporting what it could not act on, where
bounds and reserved decisions conflict, and what the intent does not settle. The AI Architect
verified each point; the CA answered.

1. **Authority.** CONSTITUTION §5 is satisfied by the CA's approval of the charter as the scope:
   one approval, of an intent with bounds. CONSTITUTION §8 is not crossed: it has documentation
   lead code for foundational concerns, and every foundational concern is a reserved decision,
   returned as a finding. "The record leads" reduces to the obligation to list doc changes owed.
2. **Free subagents are Haiku** (CA, AGENTS §4). Every subagent prompt carries the bounds and hard
   stops verbatim, including no git writes and the test command.
3. **The boundary check is `git status --porcelain -uall`,** which lists untracked and staged
   changes that `git diff --name-only` misses. The check detects a breach; it does not prevent
   one. Oversight sees a command as it runs, not before its effects.
4. **B-16 is reserved.** `guard:leaf` enforces that files live only in leaf directories, scanning
   `source/` and `documentation/`; finding empty directories at the repository root is a new check
   in a new place. It is proposed as a finding, like B-14.
5. **Conformance means headers, naming, and comments.** It changes no task name, CLI flag, exit
   code, or behavior another file relies on; a change to any of those is a finding.
6. **What the intent settles:**
   - **Resolved:** a delegated item's stated gap is no longer true, shown by a test or a run named
     in the agent's brief. Reserved items close as findings.
   - **CSS parsing:** the pending brief is the design record and governs where code disagrees. A
     fix that would fail something passing today, for a reason the brief does not state, is a
     finding.
   - **Conformance breadth:** every file in both namespaces. The two excluded stage tests may be
     edited, never run.
   - **B-22:** a bootstrap that needs a change outside `source/tests/config/` is a finding, and
     that item stops.
   - **Guards run clean:** `deno task check` and the test command, from the clean tree at
     `350ff01`. A failure present at that commit is reported, not owned.
   - **Oversight** is the AI Architect, from the CA's session. Verification that needs another
     production reopens it under this charter, within its bounds.

## Amendment — 2026-10-21 — Independent verification

The AI Architect verified the run against its record
(`effort/active/2026-10-21-charter-experiment-run-brief.md`) and the diff from `56edb05`.

### What held

- **Bounds:** 65 files modified and 3 created, all under `source/tests/`, `source/devops/`, or
  `effort/`; HEAD unchanged and nothing staged.
- **Checks,** re-run: `deno task check` (fifteen guards, 252 files linted), `deno task fmt:check`,
  and the test command, 121 passed and none failed.
- **The governance guards:** no code change to `guard-governance-gate.ts` or
  `guard-completed-immutable.ts`.
- **The stop rule:** with no Haiku model available, the agent stopped and reported. Reserved
  collisions, such as the silent catches, came back as `STYLE_AUDIT: FAIL` and findings, not fixes.

### What did not

**Header content was removed,** and the run's record does not say so. The agent read CONVENTIONS
§6.1 level 1, the minimum for a file nothing imports, as a ceiling, and dropped PURPOSE sections
from fifteen files. In `guard-completed-immutable.ts`, `guard-governance-gate.ts`, and
`guard-tokens.ts` the text moved below the box as comments; in the scripts it is gone, including a
guarantee to callers (`set-secret.ts`: it preserves the file's comments and structure). The hook
template lost the line naming the task that installs it. Every check passed, and the producing
team's two supporting reviews did not see it: checks test shape and rules, not whether content
survived.

### First observation

**Delegation of this substance holds only with forensic review from outside the producing team.**
The CA: "I would never do a delegation of this substantiveness without your forensic review."

1. **Independent review is part of the charter,** not an addition to it. A charter without a named
   outside reviewer is incomplete.
2. **Forensic means comparing content, not running checks:** what was removed, where it went, and
   whether anything carrying a guarantee survived. Passing checks are necessary, not evidence.
3. **The review is where the charter learns.** Two defects in this charter surfaced only there:
   - B-22's "`source/tests/config/` only" put its regression test in `config/`, against CONVENTIONS
     §18's `cases/`.
   - "Conformance means headers, naming, and comments" did not say conformance never removes
     content.

### Corrections, under this charter and within its bounds

1. **Restore PURPOSE** in each file below from its text at `56edb05`, changed only where it is no
   longer true, and remove the copies relocated below the box:
   - `source/devops/guards/`: `guard-completed-immutable.ts`, `guard-governance-gate.ts`,
     `guard-namespaces.ts`, `guard-tokens.ts`.
   - `source/devops/scripts/`: `db-genesis-verify.ts`, `db-genesis.ts`, `gen-ai-context.ts`,
     `gen-id-seeds.ts`, `gen-jwt-secret.ts`, `list-netlify-targets.ts`, `list-supabase-targets.ts`,
     `read-secret.ts`, `set-secret.ts`, `smoke-ux.ts`, `validate-secrets.ts`.
2. **Restore the hook template's install line,** naming `deno task hooks:install`.
3. **Conformance never removes content.** Any other header text dropped against `56edb05` is
   restored the same way; the agent checks every changed file, not only those listed.
4. **The run's record states the correction,** and the closing report lists, per file, what was
   restored.

Verification follows the same pass: the content comparison against `56edb05`, then the checks.

## Amendment — 2026-10-21 — Corrections verified

The AI Architect verified the correction pass against `56edb05`. Every PURPOSE section present at
that commit is present again, including the `set-secret.ts` guarantee and the governance guards'
rationale, no longer duplicated below the box; the hook template names its install task again. A
sentence-level comparison found one deliberate change: `session-coordinator-test.ts` no longer
says it awaits the bootstrap fix, which B-22 delivered. Bounds held, nothing was staged, and the
checks pass: `deno task check`, `deno task fmt:check`, and the test command, 121 passed and none
failed. No rework remains.

**A pre-start failure.** The run executed two pending briefs (B-18, B-19), and nothing detected
it (EFFORT 1.3, §4). Prevention: a charter activates the briefs whose work it charters before
dispatch. Both were activated at this amendment.

## Amendment — 2026-10-21 — Fixture containers

The run reported 21 exported fixture names in `source/tests/fixtures/` against CONVENTIONS §4.2 and
reserved them, expecting a contract change. Their only consumers are in `source/tests/`. The CA
settled them by containment rather than renaming. Rework, under this charter and its bounds:

1. Each `*-samples.ts` exports one PascalCase container named for the file (`CustomerSamples`,
   `UserSamples`, …) holding its samples as camelCase members.
2. A member drops the topic word the container now carries (`blueMesaRanchCustomer` becomes
   `CustomerSamples.blueMesaRanch`); each file's collection becomes the member `all`.
3. Every reference in `source/tests/`, the `samples.ts` barrel included, follows. No sample's
   content changes.
4. The rework is recorded as an amendment to this brief, not in a separate brief. The test command
   runs green.

## Amendment — 2026-10-21 — Fixture container production and verification

**Active production; verification pending.** The CA's “Corrections verified” amendment closes the
header-restoration rework. The CA then authorized the fixture contract change in “Fixture
containers” and approved continuing. The earlier conversational approval to use an available model
persists; inherited available models perform this production in place of unavailable Haiku.

The CA's staged B-18/B-19 moves from pending to active, and corresponding backlog-link changes,
are external state and preserved untouched by this production. HEAD is now `2797e8c`, incorporating
EFFORT 1.3's rule that work starts only after activation and CONVENTIONS §18's
`{subject}-test.ts` naming rule. Prior filename-name findings are therefore resolved; the bootstrap
regression's location in `source/tests/config/` remains a finding against the `cases/` rule.
No source or authority change is inferred from the external commits beyond those settled rules.

### Mode, scope, and decisions

**Foundation Mode** applies to the explicitly approved fixture contract change, confined to
`source/tests/`. Each of the six sample modules exports one file-named PascalCase container.
Sample members use camelCase, omit the topic already carried by the container, and expose the
primary collection as `all`. The auxiliary asset-type catalog becomes `types`; customer-to-User
associations become `users`. JobSamples.all retains the existing `{ assessment, logEntry }`
collection shape rather than changing it to an array.

| Sample module/container                   | Approved members                                                    |
| ----------------------------------------- | ------------------------------------------------------------------- |
| `assets-samples.ts` → `AssetsSamples`     | `types`, `drone`, `sprayerTruck`, `all`                             |
| `customer-samples.ts` → `CustomerSamples` | `blueMesaRanch`, `blueMesaRanchContact`, `all`, `users`             |
| `facet-samples.ts` → `FacetSamples`       | `aerialSpray`, `all`                                                |
| `job-samples.ts` → `JobSamples`           | `ranchMappingAssessment`, `fieldMetadataLogEntry`, `all`            |
| `user-samples.ts` → `UserSamples`         | `administrator`, `operations`, `sales`, `all`                       |
| `workflow-samples.ts` → `WorkflowSamples` | `preflightInspection`, `chemicalMixRatio`, `ppeVerification`, `all` |

The root captured all six sample files before mutation. No sample data, declared type, ID creation,
creation order, object identity, or collection order may change. Header PURPOSE, rationale, and
caller guarantees are retained; PUBLIC inventories describe the approved container surface.
The previous 21 export-casing findings are the target of this rework; containment does not authorize
other API or data changes.

Assignments are disjoint: the tests agent owns the six sample modules, `samples.ts`, and
`fixtures-test.ts` (eight files); the CSS agent owns eleven consumer case files; the record agent
owns only this charter amendment. The root plans, integrates, and verifies. No DevOps, root
configuration, other effort record, brief move, or backlog edit belongs to this production.
The separate run brief is untouched; this rework is recorded in this charter as directed by the CA.

### Constraints and verification obligations

Changes only under `source/tests/`, `source/devops/`, and `effort/` (for its own brief).
No git writes by the agent or its subagents. The CA commits.
No two subagents on the same file; the agent assigns disjoint files.
**Hard stops:** no deploys; no writes to stage, including running tests that write; no changes to `deno.jsonc` or `secrets.jsonc`, which the agent proposes instead.
Tests run only as this command, with the two stage tests excluded; plain `deno task test` is not run:

```bash
deno test --allow-env --allow-net --allow-read --ignore=source/tests/cases/users-api-test.ts,source/tests/cases/session-coordinator-test.ts "source/tests/**/*-test.ts"
```

The root will compare data initializers with its pre-production snapshot, verify reference and
identity preservation, and run `deno task check`, the exact restricted suite above,
`deno task fmt:check`, and `git diff --check`. Production boundaries use
`git status --porcelain -uall`. Changes outside the assigned files or beyond the approved
container/reference transformation return as findings.

Per-file results, exact legacy-to-container mappings, and verification evidence will be appended
when available. No result is claimed yet. Full `STYLE_AUDIT: FAIL` remains for the previously
reserved findings; resolving the targeted export naming does not resolve unrelated findings.
The charter remains active for production and subsequent independent AA verification and CA review.

## Amendment — 2026-10-21 — Fixture container results

**Produced and coordinator-verified; fresh independent AA review pending.** This amendment
supersedes the preceding pending verification status for fixture containers. Foundation Mode was
used for the CA-approved contract change. Header restoration is independently AA-verified under
“Corrections verified”; no header rework remains outstanding.

### Approved contract mapping

Each sample module now exports exactly one file-named PascalCase container. The 21 prior exports
are accessible through these approved members; the barrel explicitly re-exports the six containers.

| Previous export               | Container member                       |
| ----------------------------- | -------------------------------------- |
| `assetTypeSamples`            | `AssetsSamples.types`                  |
| `droneAssetSample`            | `AssetsSamples.drone`                  |
| `sprayerTruckSample`          | `AssetsSamples.sprayerTruck`           |
| `assetSamples`                | `AssetsSamples.all`                    |
| `blueMesaRanchCustomer`       | `CustomerSamples.blueMesaRanch`        |
| `blueMesaRanchContact`        | `CustomerSamples.blueMesaRanchContact` |
| `customerSamples`             | `CustomerSamples.all`                  |
| `customerUserSamples`         | `CustomerSamples.users`                |
| `aerialSprayFacet`            | `FacetSamples.aerialSpray`             |
| `facetSamples`                | `FacetSamples.all`                     |
| `ranchMappingAssessment`      | `JobSamples.ranchMappingAssessment`    |
| `fieldMetadataLogEntry`       | `JobSamples.fieldMetadataLogEntry`     |
| `jobSamples`                  | `JobSamples.all`                       |
| `administratorUserSample`     | `UserSamples.administrator`            |
| `operationsUserSample`        | `UserSamples.operations`               |
| `salesUserSample`             | `UserSamples.sales`                    |
| `userSamples`                 | `UserSamples.all`                      |
| `preflightInspectionQuestion` | `WorkflowSamples.preflightInspection`  |
| `chemicalMixRatioQuestion`    | `WorkflowSamples.chemicalMixRatio`     |
| `ppeVerificationQuestion`     | `WorkflowSamples.ppeVerification`      |
| `sharedQuestionSamples`       | `WorkflowSamples.all`                  |

JobSamples.all retains the existing `{ assessment, logEntry }` object. No collection was rebuilt
from copies, and no sample content, type, literal, ID creation, initialization order, collection
ordering, or shared reference was changed. Member names and imports are the approved contract
transformation; no other behavior change belongs to this production.

### Per-file production report

Nineteen existing source files changed in this pass; appending the charter record makes twenty
modified files for the fixture rework. No file was created, deleted, moved, or regenerated.

| Source file                                              | Change                                                                                                                          |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `source/tests/fixtures/assets-samples.ts`                | Export AssetsSamples; map type catalog, drone, truck, and collection to the approved members; retain data and header content.   |
| `source/tests/fixtures/customer-samples.ts`              | Export CustomerSamples; map Customer, contact, Customer collection, and association collection; retain data and header content. |
| `source/tests/fixtures/facet-samples.ts`                 | Export FacetSamples; expose the facet and collection; retain data and header content.                                           |
| `source/tests/fixtures/job-samples.ts`                   | Export JobSamples; expose assessment, log entry, and the unchanged object collection; retain data and header content.           |
| `source/tests/fixtures/user-samples.ts`                  | Export UserSamples; expose administrator, operations, sales, and collection; retain data and header content.                    |
| `source/tests/fixtures/workflow-samples.ts`              | Export WorkflowSamples; expose the three questions and collection; retain data and header content.                              |
| `source/tests/fixtures/samples.ts`                       | Explicitly re-export the six containers and update PUBLIC inventory, preserving every prior description.                        |
| `source/tests/fixtures/fixtures-test.ts`                 | Follow container collections and samples in integrity checks; preserve assertions and header content.                           |
| `source/tests/cases/customer-api-test.ts`                | Update fixture imports and member references only; preserve header/comments and test behavior.                                  |
| `source/tests/cases/customer-state-test.ts`              | Update fixture imports and member references only; preserve header/comments and test behavior.                                  |
| `source/tests/cases/facet-api-test.ts`                   | Update fixture imports and member references only; preserve header/comments and test behavior.                                  |
| `source/tests/cases/list-clients-api-test.ts`            | Update fixture imports and member references only; preserve header/comments and test behavior.                                  |
| `source/tests/cases/list-query-api-test.ts`              | Update fixture imports and member references only; preserve header/comments and test behavior.                                  |
| `source/tests/cases/make-scope-test.ts`                  | Update fixture imports and member references only; preserve header/comments and test behavior.                                  |
| `source/tests/cases/session-coordinator-test.ts`         | Update fixture imports and member references only; preserve header/comments. This stage test remains excluded from execution.   |
| `source/tests/cases/session-state-test.ts`               | Update fixture imports and member references only; preserve header/comments and test behavior.                                  |
| `source/tests/cases/soft-deleted-references-api-test.ts` | Update fixture imports and member references only; preserve header/comments and test behavior.                                  |
| `source/tests/cases/user-provider-test.ts`               | Update fixture imports and member references only; preserve header/comments and test behavior.                                  |
| `source/tests/cases/user-state-test.ts`                  | Update fixture imports and member references only; preserve header/comments and test behavior.                                  |

The only effort record edited for this rework is this charter. The separate run brief, CA-staged
B-18/B-19 moves, other brief content, and backlog-link changes were preserved untouched.

### Evidence and checks

The coordinator independently compared all six module executable token sequences with the
pre-production snapshots. They exactly match the expected approved binding renames, export removal,
and appended containers. All 21 original initializers, types, literals, ID creation order,
collections, and shared references are preserved. For all eleven consumer case files, the
coordinator recomputed the expected import/member-only transformation from snapshots and verified
exact executable tokens with comments and headers preserved.

A separate header-content audit covered all eight fixture files: original pre-PUBLIC content and
every previous PUBLIC description survive. Six sample modules each have exactly one exported
container. These comparisons establish preservation; passing tests alone would not establish it.

| Check                                                    | Coordinator result                                                                               |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Six sample-module snapshot comparisons                   | PASS, all original data initializers and identities preserved under the approved transformation. |
| Eleven consumer transformation comparisons               | PASS, imports/member references only; comments and headers preserved.                            |
| Eight fixture header/API audits                          | PASS, original content/descriptions preserved; one exported container per sample module.         |
| `deno task check`                                        | PASS, exit 0; fifteen guards, frozen type checking, 252 files linted.                            |
| Exact restricted test command in the preceding amendment | PASS, 121 passed, zero failed; both stage tests excluded.                                        |
| `deno task fmt:check`                                    | PASS.                                                                                            |
| `git diff --check`                                       | PASS.                                                                                            |

No source changes followed these checks. HEAD remains `2797e8c`; the CA's two staged renames are
unchanged. No agent git write, deploy, stage write, task/configuration change, DevOps change, or
unrelated repair occurred. No new failure or in-scope failure remains from fixture containment.

### Audit status and remaining findings

**Fixture rework STYLE_AUDIT: PASS** — audited all nineteen source files listed above for the
approved container/reference contract, preserved sample data, header content, and conventions.
The 21 exported-fixture naming findings are resolved by containment. Prior filename-suffix findings
are resolved by the CA's CONVENTIONS §18 subject naming rule.

**Full-run STYLE_AUDIT: FAIL** remains because unrelated reserved findings still exist, including:

- `source/devops/guards/guard-leaf.ts:12` — CONVENTIONS §3.3 — own-namespace alias import.
- `source/devops/scripts/edge-sync.ts:108` — CONVENTIONS §15 — no-op catch suppresses cleanup failures.
- `source/devops/guards/guard-tokens.ts:80,90` — CONVENTIONS §19.1 — custom failure/success reporting bypasses shared guard utilities.
- `source/tests/config/test-config-test.ts:1` — CONVENTIONS §18 — test remains in configuration rather than cases, under B-22's existing bound.

B-17's task permission/dependency boundary, B-14 token existence, B-16 repository-root leaf coverage,
and broader multiline CSS value enforcement remain reserved. Other silent fallbacks and
own-namespace imports remain findings; no broader fix is claimed. B-15, B-20, B-21, and stage
authorization remain excluded. No documentation or backlog edit was made by this production.

The fixture rework is ready for fresh independent AA verification and CA review. Its production
and coordinator checks are complete; this charter remains **active** and is not closed or moved.

## Amendment — 2026-10-21 — Production record

The run's production record, kept by the AI Coding Engine in a separate run brief
(`2026-10-21-charter-experiment-run-brief.md`), is folded in here and that file removed: one unit of
work has one brief (EFFORT §4). The charter's "writing its own brief" should have read "amending
this brief"; the agent had `effort/` in its bounds throughout.

- **Delegation.** Three subagents on inherited available models (the CA's conversational
  amendment replaced Haiku), reused across productions with disjoint files: record, CSS, tests.
- **B-18 repaired.** Complete-selector parsing in `guard-css.ts` behind a pure
  `auditCss(content, filePath)`, with fifteen regression tests in `css-guard-test.ts`. Integration
  caught a multiline regression (`dashboard.css:29` would newly fail); value and token audits keep
  their physical-line form, and broadening them returned as a finding.
- **B-22 repaired.** `test-config.ts` registers `LOCAL_DB_NAME` before `api` loads; the regression
  test imports the composed API with inert configuration and a fetch that rejects, so it cannot
  reach stage.
- **B-19 partial.** Headers, private names, and comments conformed across sixteen guards, 23
  scripts, and every test file. Behavior-changing conformance returned as findings.
- **Checks.** Baseline 105 tests; final 121, none failing. `deno task check`, `fmt:check`,
  `git diff --check`, and `bash -n` on the shell scripts and hook all pass.
- **Rework, from independent verification.** PURPOSE content restored in fifteen files
  ("Corrections verified"); the 21 fixture exports gathered into six containers ("Fixture
  containers").

## Closure (2026-10-22)

The AI Architect verified the fixture containers: all 21 legacy exports compare equal to their
container members, with generated IDs and timestamps normalized consistently; collections keep
their members' identity; no legacy name remains; bounds held; checks pass with 121 tests. At closure,
`assets-samples.ts` became `asset-samples.ts` (container `AssetSamples`), matching the other
singular fixture files, and `test-config-test.ts` moved to `source/tests/cases/` (CONVENTIONS §18).
The CA reviewed and closed the brief.

Settled at closure:

- **B-18:** repaired; removed from the backlog. Its brief closes with this one.
- **B-22:** repaired; removed from the backlog.
- **B-19:** narrowed to what conformance could not do without changing behavior (silent catches,
  `guard-tokens` reporting, own-namespace imports, broad error classification). Its brief closes
  with this one.
- **B-17:** stays; the finding is attached: honoring git-ignore needs `--allow-run=git` on the leaf
  task in `deno.jsonc`, or an approved ignore-matcher dependency.
- **B-14, B-16:** stay; both are new checks.
- **Multiline CSS value enforcement:** new backlog entry, B-32.
- **The `users-api-test.ts:62` assertion:** joins the stage test authorization brief, the work that
  first runs that test.
- **Test file names, fixture names:** settled by CONVENTIONS §18 (`2797e8c`) and the fixture
  containers.
- **What the experiment decides:** parked as P-10.

_End of Brief_
