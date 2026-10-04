# Effort — Pending Namespace

**Backlog, not dispatched.** Recorded 2026-10-03 from a CA + AI Architect process session.
Writing this brief is authorized; amending `EFFORT.md` requires its own production
authorization. This brief lives in `effort/active/` only because the namespace it establishes
does not exist yet.

## What triggered it

`effort/active/` holds briefs that are not in progress. On 2026-10-03 it contained five
documents, of which only the roadmap handoff was current work. The rest were captured,
undispatched briefs. They distract from the effort actually in flight.

The cause is in `EFFORT.md` itself. §4 The Brief encourages capturing a brief close to when
the need is found, "even if production is not yet authorized — mark it explicitly as backlog,
not dispatched." It names no place for such a brief, so every brief begins in `active/` by
default, whether or not anyone chose it as current work.

That default also contradicts §2 The Effort Namespace, which requires a document's namespace
and its internal framing to state the same status. A brief in `active/` that opens with
"Backlog, not dispatched" states two statuses at once. The methodology produces the violation.

`project-backlog.md` does not fill the gap. Its entries are short defect-or-gap statements, not
design records. A decided, fully written brief awaiting selection has no home.

## Decision

Add a fifth namespace, `pending`, for captured briefs that have not been chosen as current work.

- **A new brief begins in `effort/pending/`.**
- **It goes directly to `effort/active/` only when dispatched immediately** — for example, a
  repair brief taken straight to production.
- **A pending brief moves to `effort/active/` when its effort is chosen from the roadmap.**

The test throughout is whether the effort has been chosen as current work. The purpose of
`active/` is to keep in-progress work in focus.

The move happens at selection, not at the production gate. Once an effort is chosen, its first
step is an exploration review, which is already in-flight work. Holding the brief in `pending/`
until production approval would recreate the §2 status mismatch this brief exists to remove.

Handoffs never enter `pending/`. A handoff records in-flight work by definition (§5 The Handoff).

When a brief is created for work that already has a `project-backlog.md` entry, the entry's
text is replaced by a link to the brief, so the work is described in one place. When the brief
moves to `effort/active/`, the link is updated to the new path. This formalizes what the backlog
already does informally: several entries already link their briefs.

The name is `pending`, not `backlog`. "Backlog" already has a precise meaning in §3 Work
Definitions (`project-backlog.md`: decided work awaiting a slot), and reusing it for a folder
would blur the two.

## Production scope

Operating mode: **Foundation** — this amends the effort methodology.

Goal: establish `effort/pending/` as a namespace.

| File / directory  | Intended change                                                                                                                                                                                                                        |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `EFFORT.md`       | Version 1.1. §2 table gains a `pending` row. §4 places a newly captured brief in `effort/pending/`, states the move rule, and states the backlog-link rule. §4's closing condition names withdrawal (amendment below). §9 records 1.1. |
| `effort/pending/` | Created.                                                                                                                                                                                                                               |

Checks: read the amended §2 and §4 back against §3 Work Definitions and §5 The Handoff for
consistency.

## Amendment — 2026-10-03 — Withdrawal closes a brief

Recorded by a second AI Architect reviewing this brief with the CA.

**The gap.** The decision states how a brief enters `pending/` and how it leaves for `active/`.
It does not state how a pending brief leaves when it is superseded or abandoned before selection.

**Practice already answers it.** Briefs and handoffs closed without shipping are in
`effort/completed/` with their opening lines adjusted (for example, a handoff opening
"**SUPERSEDED.**", and Group C (Notes-lite) recorded as retired). §2 The Effort Namespace states
the mechanics generally: "When a brief closes, update its opening line to state closure and move
it to the completed namespace."

**The text does not.** §4 The Brief defines closing only as shipping: "It closes when its
production is shipped, reviewed, and independently verified." Read literally, a withdrawn brief
never closes, so §2's move never applies to it.

**Decision.** §4's closing condition gains withdrawal:

> It closes when its production is shipped, reviewed, and independently verified — or when it is
> withdrawn, superseded or abandoned, with its opening line saying which and why.

**Rejected: deleting a withdrawn brief,** as §3 Work Definitions removes a stale backlog entry. A
backlog entry is a statement that becomes false; a brief is a design record, and §4 already
requires preserving the reasoning trail after supersession. A withdrawn brief often holds reasoning
a successor builds on, and a reasoning system starting cold recovers it from `effort/completed/`,
not from git history.

The production scope's `EFFORT.md` row is updated to include this change.

## Amendment — 2026-10-04 — Scope widened during production

Recorded by the AI Architect who produced it. Each widening was authorized by the CA in
conversation (EFFORT §8 Escalation Is a Default, Not a Wall).

- **Migration came in.** The four undispatched briefs (ui-control-state-normalization,
  devops-style-error-handling, core-reconciliation, css-guard-selector-parsing) moved to
  `effort/pending/`, each opening "Backlog, not dispatched.", and their backlog links moved with
  them. That also gives `effort/pending/` content, which git needs to track it.
- **`README.md` §1.4 Effort** said status-bearing records begin in `effort/active/`. It now
  describes `pending`.
- **Record kinds and file naming.** README §1.4 declared four record kinds and a file-naming
  pattern that `EFFORT.md` never defined. Two of the kinds, `design` and `tasks`, were retired in
  practice before EFFORT 1.0: none has been written since 2026-08-04, and the brief absorbed both.
  `EFFORT.md` §2 now names the two kinds, brief and handoff, and the
  `{yyyy-mm-dd}-{topic}-{kind}.md` pattern. README §1.4 lists only those two and points to
  EFFORT for both.

## Explicitly out of scope

- **Migrating existing briefs.** Once the namespace exists, moving today's undispatched briefs
  out of `active/` is incidental housekeeping, not part of this effort.
- **Guards.** No guard reads `effort/active/`; `guard:completed-immutable` watches only
  `effort/completed/`.
