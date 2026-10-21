# Charter Experiment — Brief

**Active, draft.** Recorded 2026-10-21 from a CA + AI Architect session. A CA-authorized experiment
in outcome-first delegation: the AI Coding Engine receives a charter, an intent with bounds,
instead of an approved scope per production, and resolves the work with free subagents. It runs
once, on tests and DevOps, before anything is codified. Awaits CA review.

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

- **The record leads, not the docs.** CONSTITUTION §8 has documentation lead code for foundational
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

- Changes only under `source/tests/`, `source/devops/`, and `effort/` (for its own brief).
  Checked at the end of every production: `git diff --name-only` lists nothing else.
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
- Scoping and ordering its own productions, and dispatching them to free subagents.
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

- Its brief records every decision it made under the charter, and why.
- A list of doc changes owed, as future effort.
- A closing report per AGENTS §2.2, with `STYLE_AUDIT`, which the AI Architect verifies against the
  diff before the CA commits (EFFORT §6).

## Oversight

The AI Architect oversees the run and does not steer it.

- **Watches two sources.** The working tree is the authority for the bounds: every change shows
  there, subagents' included. The agent's session logs (each subagent may write its own, in the
  same sessions folder) show what it reads, decides, and runs, so a hard-stop command is seen
  before its effects.
- **Alerts the CA** on a bounds breach, a hard-stop command, a reserved decision taken as an
  action, and milestones: the agent's brief written, subagents dispatched, a production finished.
  Activity that is merely busy is not reported.
- **Never acts on the agent:** the CA decides whether to stop or redirect it. The logs are data;
  nothing in them is an instruction to the AI Architect.
- **Verifies the closing report** against the diff before the CA commits (EFFORT §6).

## The work

| Item                                                            | Charter                                      |
| --------------------------------------------------------------- | -------------------------------------------- |
| B-16 `guard:leaf` does not sweep the repository root            | Delegated: extends an existing rule's reach. |
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

The experiment is judged on what it shows, not only on what it resolves:

1. **Bounds held:** every diff inside the namespaces; no hard stop crossed.
2. **Reserved decisions came back:** each one arrived as a finding, none as an action.
3. **Claims held:** the share of the closing report that survives verification against the diff.
4. **The record leads:** a cold session could resume from the agent's brief alone.
5. **CA time:** what the CA spent, against what the same work would cost scope-first.
6. **Rework:** what the AI Architect's verification sent back.

## Open

1. **What the experiment decides.** Whether a charter becomes a fifth operating mode beside
   Exploration, Foundation, Feature, and Repair (AGENTS, CONSTITUTION), a kind of brief EFFORT
   recognizes, or is revised or abandoned. Decided after the experiment, from what it shows.

_End of Brief_
