![Seasons Computing logo](seasonscomputing-logo.png)

# Effort Methodology (1.0)

- Source: [EFFORT.md](EFFORT.md)
- Version: 1.0
- Published: 2026 September 15th
- Author: Ted V. Kremer

**MANDATORY: THIS FILE MAY NOT BE EDITED BY ANY AI AGENT WITHOUT PRIOR AUTHORIZATION**

## 1. Purpose & Scope

This document governs the lifecycle of effort itself: how an idea becomes tracked work, how tracked work is sequenced, and how it closes as deployed code.

It governs the _shape of work_ — how a real incident, a design need, or a decision becomes a durable record, moves through review, and closes — independent of who performs it or what mode authorizes it.

It applies to every reasoning system, human or artificial, that captures, tracks, sequences, or closes project work.

## 2. The Effort Namespace

Tracked work lives in `effort/`, in four namespaces:

| Namespace   | Purpose                                                                                |
| ----------- | -------------------------------------------------------------------------------------- |
| `active`    | In-flight project records: production briefs and their handoffs.                       |
| `completed` | Closed work. A permanent historical record, not a staging area.                        |
| `project`   | Project work definitions organized into backlog, parking lot, roadmap or user-stories. |
| `genesis`   | Regenerable scaffolding prompt contracts, a separate lifecycle.                        |

A document's namespace and internal framing must state the same status. When a brief closes, update its opening line to state closure and move it to the completed namespace.

A closed document's cross-references are frozen at closure. If a cited document later retires or moves, retain the original path as part of the historical record. A dangling path inside `effort/completed/` is not a defect and must not be repaired.

## 3. Work Definitions

Two kinds of not-yet-started work exist, and they are not the same kind of thing:

- **Backlog** (`project-backlog.md`): the decision has been made. Only a slot is missing. Picking it up starts with doing it.
- **Parking lot** (`project-parking-lot.md`): a decision is still missing. Picking it up starts with making that decision.

The test is decided versus undecided. It is never near-term versus far. A large, distant piece of decided work belongs in the backlog; a small, urgent piece of undecided work belongs in the parking lot.

Entries in both are flat and chronological, appended as they are identified, and carry no priority ordering by position — an undecided item has nothing to be ordered against; a decided item's priority is stated in its own entry, not implied by placement.

Do not resolve a parking-lot entry as a drive-by fix inside an unrelated session. Each one needs its own scoped conversation before it is picked up.

An entry that stops being true — verified against the actual code, not assumed — is removed outright, not archived in place. Neither document is a history; each describes only what is currently pending. The record of removal is the commit that makes it, with a message naming why. This differs from closing a brief (§4 The Brief): a backlog entry resolved incidentally, with no dedicated production of its own, has no report to move into `effort/completed/`.

**Roadmap** (`project-roadmap.md`) is a different kind of document from either — not a third kind of not-yet-started work, but the intended execution order across it. Where the backlog and parking lot are deliberately unordered, the roadmap is the ordering — position states sequence, so that a later milestone can rely on an earlier one having supplied what it needs. It draws its content from the **backlog** (`project-backlog.md`) and from **user stories** (`project-user-stories.md`); its milestone boundaries follow §7 Milestones, a living judgment call revisited as building teaches what a plan could not know in advance.

## 4. The Brief

A brief is a written design record for one unit of work.

**Capture it close to when the need is found.** A real incident or design decision, left ungrounded until later, is reconstructed from memory instead of recorded from evidence. Capture it at the close of the session that surfaced it, even if production is not yet authorized — mark it explicitly as backlog, not dispatched.

**Amend it, never silently rewrite it.** A brief accumulates dated, named amendments as understanding deepens or a conclusion reverses. State what changed and why. Preserve the original reasoning trail even after it is superseded — a decision that took several turns to reach is worth being able to see again, including the turns that were wrong.

**It reaches production through the production gate**, not through this document. `CONSTITUTION.md` §5 and `AGENTS.md` §2.1 define that mechanic; this document does not restate it.

**It closes when its production is shipped, reviewed, and independently verified** — not when a scope statement is merely approved, and not on a producer's own account that the work is done (§6 Verification Discipline). On closing:

- Rewrite the brief's own opening framing to state closure plainly.
- Move the file from `effort/active/` to `effort/completed/`.
- Fix cross-references to the old path — in other documents and in AI memory — subject to the historical-reference rule in §2 The Effort Namespace.

A brief carries the decision. Carrying an unfinished session's working state to the next one is a different job — see §5 The Handoff.

## 5. The Handoff

A handoff is a session-end snapshot: what a resuming session — any reasoning system, on any provider, with no memory of how the work got to this point — needs to pick up an in-flight effort. It is the operational analog of an architecture document: an architecture document lets any session reconstruct the settled shape of the system; a handoff lets any session reconstruct the current state of one effort in progress. This is what makes the Three-Role Model (`CONSTITUTION.md` §3 Roles) actually workable across a session boundary, a provider switch, or both — neither is possible from memory alone.

Write a new handoff at the close of any session that leaves work unfinished, whether or not a brief already exists for that effort. A handoff does not replace or restate a brief's design record — it captures what was tried, what changed, what remains, and any open thread not yet substantial enough to be its own brief entry.

Unlike a brief, a handoff is not amended. Each session's handoff is its own dated record, even when several accumulate in sequence for the same ongoing effort. A handoff may exist with no corresponding brief, for continuity needs narrower than a full design record — a debugging session, an interrupted investigation.

A handoff closes with the effort it supports, following the same namespace move as a brief (§2 The Effort Namespace).

## 6. Verification Discipline

A completion report is a claim, not a fact.

Before treating any account of finished work as true — a producer's own report, a narrated summary, a prior session's memory — re-derive the claim against the actual artifact: the diff, the running system, the test output.

This applies regardless of who or what produced the account — human, AI Coding Engine, or AI Architect. Narration is not verification. A report that says a check passed is not the same as having run the check.

## 7. Milestones

A milestone groups related efforts toward one coherent outcome.

Milestone boundaries are living decisions, not fixed at the plan's inception. Building teaches things a plan cannot know in advance — a task item may turn out to be a different, larger piece of work than its own name described, or a navigation pattern chosen early may not survive contact with real usage. Renegotiate the boundary when that happens; do not force the outcome to match the original plan's shape.

An item may move between milestones, or a milestone may be split, as understanding improves. State the move and why. Do not silently reassign it.

A milestone closes with an explicit verification pass, not by informal agreement that it is basically done.

## 8. Escalation Is a Default, Not a Wall

A stated escalation boundary — named in a brief, a production scope statement, or an operating mode — requires the CA's attention before it is crossed. It is not self-authorizing, and it is not permanently closed either.

The CA may authorize crossing it directly, in conversation, without a full formal rescoping cycle, once the change is sized and understood well enough to judge in the moment.

Such a crossing must still be named and recorded — in the brief, in the production report — never silent, even when the authorization itself was quick.

## 9. Amendment Record

Each published version supersedes the one before it. Amendments reference sections by name as well as number, since number alone drifts silently when a section moves — the mismatch between a stated number and its actual target is only visible when the name is stated alongside it.

| Version | Published           | Change           |
| ------- | ------------------- | ---------------- |
| 1.0     | 2026 September 15th | Initial version. |

_End of Effort Document_
