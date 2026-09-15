<img src="../../swarmag-ops-logo.png" title="" alt="swarmAg Operations System" data-align="center">

# swarmAg Operations System — Roadmap

The intended execution sequence for decided work. Distinct from `project-backlog.md` and
`project-parking-lot.md`, both of which are deliberately flat and carry no ordering
(EFFORT.md §3) — this document _is_ the ordering. Themes and stories come from
`project-user-stories.md`; shaped, decided items come from `project-backlog.md`; the sequence
itself is a standing judgment call, revisited as building teaches what a plan couldn't know in
advance (EFFORT.md §6).

**Format per entry:** what it comprises, why it sits where it does, and what backlog items
block or ride with it. An entry marked **(open)** has no settled position yet — stated as open
rather than guessed at.

## 1. Users & Customers Vertical Slice

- **User Manager** (`project-user-stories.md` §6) → generalized `AbstractionManager`.
- **Onboarding Wizard** (§1.1's "Prospect genesis") → generalized `Wizard`.

Users and Customers stand as this project's **reference implementations** — meant to be
copied for the remaining ~80% of the app, not iterated on again in their own right.

Not closed pending:

1. Notes Editor completed & integrated into User Manager
2. Notes Editor integrated with Customer Manager feature completion

## 2. Shell/App Split

`ux/shell/` splits into `ux/shell/` and `front/app/`. Backlog: "`ux/shell/` conflates reusable
composition machinery with app orchestration" (`high`).

## 3. Customer Manager

Closes the Users & Customers vertical slice (`project-user-stories.md` §1.1: post-genesis editing
and additional-contact assignment, neither built today). Backlog: "Customer Manager" (`normal`).

The Customer Manager is not a new form — it's the onboarding wizard's Contact/Customer/Sites stages,
reused as the edit surface. May touch foundation lightly: a second instance of the Manager/Wizard
cross-pollination that produced `AbstractionManager`/`Wizard` in the first place, this time
surfacing whatever lets one stage sequence serve both a bounded create-flow and a loop-until-
cancel edit-flow. Minimal work expected, but worth naming as its own reusable shape if the
pattern repeats a third time.

```
    TOPIC: Customer
ARCHETYPE: Abstraction Manager | Wizard
    ASIDE: Collection/Index    | Progress tree
     MAIN: Customer Form       | Customer Form + Initial Job Assessment Form
```

## 4. Notes Editor

Stock, parameterized `NotesEditor`, lands at `front/app/notes-editor.tsx`. Tags-freeform-vs-
controlled is still unresolved and gates scoping.

Rides with it: User Manager needs updating to consume it once built, User Management is closed once integrated)

## 5. Mechanical Productions

Standard production from the Users/Customers reference implementations — no design conversation
needed, pick up whenever convenient once §2 lands:

- **Asset Maintenance** (`project-user-stories.md` §3.1–3.2) — Manager, wire `api.Assets`.
- **Chemical Maintenance** — Manager, wire `api.Chemicals`.

## 6. Workflow, Task, Question & Service

`project-user-stories.md` §5, currently unwritten, plus `Service` (domain type exists,
`api.Services` commented out). Needs the Workflow Builder archetype — named in
`architecture-front.md`'s normative tree (`workflow-builder/`) but never built. The one theme
with no existing archetype to extend at all, and the most depended-upon: Job Definition's own
§2.1 "workflow seeding" (preload a default workflow per Service/SKU) can't be built until this
exists.

## 7. Job Definition

Admin-side (`project-user-stories.md` §2.1–2.6, 2.9): service selection through assessment,
planning, finalization, and followup. Backlog: "Onboarding — Initial Job Assessment stage"
(`normal`) covers §2.1 specifically. Needs `api.Jobs` wired (currently commented out in
`api.ts` — not itself a backlog entry, a real gap) and depends on §6 above for Service/Workflow
seeding.

## 8. Job Runner

Ops-side (§2.7–2.8): offline field execution. `architecture-front.md`'s normative tree already
names `job-runner/` as its own directory, distinct from `job-assessment/`/`job-planning/` —
the architecture anticipated this as a separate concern, not a sub-case of Job Definition.

**Not a synchronization problem — the architecture already ruled that out.**
`architecture-core.md` §9 and invariant §10.1.5 already decide this: Job Plan is locked/immutable
the moment execution starts, `JobWorkLogEntry` is append-only, and log upload is explicitly "not
synchronization — a one-way append operation." No conflict resolution, no last-write-wins, no
distributed transaction coordination — the design deliberately avoids needing any of that. What's
actually missing is implementation of that already-decided pattern: `api.deepCloneJob`, the local
clients (`JobsLocal`/`JobAssessmentsLocal`/`JobPlansLocal`/`JobLogsLocal`), and
`api.uploadJobLogs` — none built yet, but none requiring a design decision either. This is Job
Runner's own prerequisite plumbing, not a separate milestone with its own feature payload.

## 9. Dashboard Widget Development

Shared widget catalog plus per-app instances — specialization direction, building diverse
content atop already-generalized primitives (contrast with §2's generalization direction).
Houses:

- **Hub widget** (backlog, `normal`) — primary approach for grouping dashboard commands by
  topic; hierarchical left-nav panel is the named fallback if it doesn't prove out. Job's three
  independently-tabled phases are its clearest motivating case, so this milestone likely follows
  real Job data existing (Job Definition/Job Runner), not precede it.
- **Prospect Pipeline Visibility** (§1.2) — a prospects-by-age widget plus aging charts, buildable
  off `Customer.status = 'prospect'` alone. The simplest entry in this milestone: no new
  archetype needed, doesn't depend on the parked `Lead` abstraction.

## Orthogonal to project themes

Features not belonging to any theme are added to whatever session happens to touch its territory.

- **DevOps hygiene** — "`source/devops/` is not held to CONVENTIONS" (`normal`) bundled with
  "`edge-deploy` lacks the target-resolution and verification parity `app-deploy.sh` already
  has" (`high`) — same territory, same session.
- **Doc hygiene** — "`architecture-core.md` is base context and has never been measured for scan
  cost" (`high`), "`architecture-devops.md` buries what an agent scan needs" (`normal`).
- **Guard gaps** — "`guard:css` does not verify that a referenced token resolves" (`normal`),
  "`guard:leaf` does not sweep the repository root" (`normal`), "No guard enforces conformity to
  established conventions" (`low`).
- **Shared UI controls do not use one state model** (`high`) — rides with no milestone for now.
  Real and fully scoped, but not assigned to any of the above; pick up on its own schedule.
- **Collection-Detail surfaces do not draw the Selection** (`normal`) — small UX gap on every
  shipped and future `AbstractionManager` above its container threshold.
- **Auth bundle** — "A stale session survives genesis..." and "Eject should ban, not delete..."
  (both `normal`, downgraded/bundled 2026-09-12 — see backlog for why), sharing one unresolved
  verification with the DevOps `edge-deploy` entry above.
- **Login needs an "Already have a code?" action** (`normal`).
- **Testing** — not a slot, a practice change: every milestone from here forward scopes its own
  test coverage as part of its own brief, rather than shipping and being driven-and-reported
  afterward. `CONVENTIONS.md` §12's convention only covers domain/adapter/API today; extending it
  to the UX layer is foundation work belonging with whichever milestone needs it first (most
  likely §2 or §3).

_End of Roadmap Document_
