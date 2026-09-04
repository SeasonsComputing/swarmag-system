![Seasons Computing logo](seasonscomputing-logo.png)

# Effort Methodology (1.0)

- Source: [EFFORT.md](EFFORT.md)
- Version: 1.0
- Published: 2026 September 4th
- Author: Ted V. Kremer

## 1. Purpose & Scope

This document governs the lifecycle of effort itself: how an idea becomes tracked work, how tracked work is sequenced, and how it closes as deployed code.

It is distinct from, and does not restate, the documents it sits beside:

- `CONSTITUTION.md` governs authority, roles, and operating modes.
- `AGENTS.md` governs session and agent operating protocol.
- The project's conventions document governs code and content conventions.

This document governs neither authority nor procedure. It governs the _shape of work_ — how a real incident, a design need, or a decision becomes a durable record, moves through review, and closes — independent of who performs it or what mode authorizes it.

It applies to every reasoning system, human or artificial, that captures, tracks, sequences, or closes project work.

## 2. The Effort Namespace

Tracked work lives in `effort/`, in four namespaces:

| Namespace           | Holds                                                           |
| ------------------- | --------------------------------------------------------------- |
| `effort/active/`    | In-flight design records and production briefs.                 |
| `effort/completed/` | Closed work. A permanent historical record, not a staging area. |
| `effort/project/`   | `project-backlog.md` and `project-feature-parking-lot.md`.      |
| `effort/genesis/`   | Regenerable scaffolding prompt contracts, a separate lifecycle. |

A document's namespace states its status. Do not let a document's namespace and its own internal framing disagree — when a brief closes, its own opening line changes to say so; it does not simply move while still describing itself as open.

## 3. Backlog and Parking Lot

Two kinds of not-yet-started work exist, and they are not the same kind of thing:

- **Backlog** (`project-backlog.md`): the decision has been made. Only a slot is missing. Picking it up starts with doing it.
- **Parking lot** (`project-feature-parking-lot.md`): a decision is still missing. Picking it up starts with making that decision.

The test is decided versus undecided. It is never near-term versus far. A large, distant piece of decided work belongs in the backlog; a small, urgent piece of undecided work belongs in the parking lot.

Entries in both are flat and chronological, appended as they are identified, and carry no priority ordering by position — an undecided item has nothing to be ordered against; a decided item's priority is stated in its own entry, not implied by placement.

Do not resolve a parking-lot entry as a drive-by fix inside an unrelated session. Each one needs its own scoped conversation before it is picked up.

## 4. The Brief

A brief is a written design record for one unit of work.

**Capture it close to when the need is found.** A real incident or design decision, left ungrounded until later, is reconstructed from memory instead of recorded from evidence. Capture it at the close of the session that surfaced it, even if production is not yet authorized — mark it explicitly as backlog, not dispatched.

**Amend it, never silently rewrite it.** A brief accumulates dated, named amendments as understanding deepens or a conclusion reverses. State what changed and why. Preserve the original reasoning trail even after it is superseded — a decision that took several turns to reach is worth being able to see again, including the turns that were wrong.

**It reaches production through the production gate**, not through this document. `CONSTITUTION.md` §5 and `AGENTS.md` §2.1 define that mechanic; this document does not restate it.

**It closes when its production is shipped, reviewed, and independently verified** — not when a scope statement is merely approved, and not on a producer's own account that the work is done (§5). On closing:

- Rewrite the brief's own opening framing to state closure plainly.
- Move the file from `effort/active/` to `effort/completed/`.
- Fix cross-references to the old path — in other documents and in AI memory — rather than leave them dangling.

## 5. Verification Discipline

A completion report is a claim, not a fact.

Before treating any account of finished work as true — a producer's own report, a narrated summary, a prior session's memory — re-derive the claim against the actual artifact: the diff, the running system, the test output.

This applies regardless of who or what produced the account — human, AI Coding Engine, or AI Architect. Narration is not verification. A report that says a check passed is not the same as having run the check.

## 6. Milestones

A milestone groups related efforts toward one coherent outcome.

Milestone boundaries are living decisions, not fixed at the plan's inception. Building teaches things a plan cannot know in advance — a task item may turn out to be a different, larger piece of work than its own name described, or a navigation pattern chosen early may not survive contact with real usage. Renegotiate the boundary when that happens; do not force the outcome to match the original plan's shape.

An item may move between milestones, or a milestone may be split, as understanding improves. State the move and why. Do not silently reassign it.

A milestone closes with an explicit verification pass, not by informal agreement that it is basically done.

## 7. Escalation Is a Default, Not a Wall

A stated escalation boundary — named in a brief, a production scope statement, or an operating mode — requires the Chief Architect's attention before it is crossed. It is not self-authorizing, and it is not permanently closed either.

The Chief Architect may authorize crossing it directly, in conversation, without a full formal rescoping cycle, once the change is sized and understood well enough to judge in the moment.

Such a crossing must still be named and recorded — in the brief, in the production report — never silent, even when the authorization itself was quick.

## 8. Relationship to Other Governing Documents

This document does not amend `CONSTITUTION.md` §1's precedence chain. Where it sits in that ordering, if anywhere, is the Chief Architect's decision to ratify, not this document's to presume.

Where this document and `CONSTITUTION.md` conflict, `CONSTITUTION.md` governs.

## 9. Amendment Record

Each published version supersedes the one before it.

| Version | Published          | Change           |
| ------- | ------------------ | ---------------- |
| 1.0     | 2026 September 4th | Initial version. |

_End of Effort Document_
