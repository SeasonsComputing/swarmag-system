<img src="../../swarmag-ops-logo.png" title="" alt="swarmAg Operations System" data-align="center">

# swarmAg Operations System — Roadmap

The intended execution sequence for decided work — see `EFFORT.md` §3 for what this document
is and how it relates to the backlog and parking lot.

Each milestone carries a permanent ID (`M-n`), never reused or renumbered; references written as
`roadmap §n` mean `M-n`.

**Format per entry:** what it comprises, why it sits where it does, and what backlog items
block or ride with it. An entry marked **(open)** has no settled position yet — stated as open
rather than guessed at.

A milestone lists its **Enablers** ahead of its **Features**; work landing in the same window
without enabling it is listed as **Rides along**.

## M-0 · Platform Foundation — Closed 2026-06-28

Everything built before application features, from the first commit (2025-12-09) to the first
feature design, `effort/completed/2026-06-28-user-contact-customer-design.md`:

- **Physical architecture** — static PWA bundles on Netlify's CDN, bound to their Supabase backend
  at package time; Postgres under row-level security, called directly by the applications;
  Supabase Auth for passwordless sign-in; edge functions for privileged orchestration only; and
  IndexedDB on the field device, designed to carry a job's working set offline and return only an
  append-only log, so field work never needs a two-way sync (built in §8).
- **Governance** — `CONSTITUTION.md`, `AGENTS.md`, `CONVENTIONS.md` (grown from an 82-line style
  guide), and the Three-Role Model with its operating modes and production gate.
- **Domain** — the domain model and data dictionary; abstractions, protocols, validators, and
  adapters for every topic; the canonical schema generated from the domain; genesis prompts that
  regenerate it.
- **Core** — `@core/std` primitives and relations, `makeAdapter`, the API contracts, client makers
  for Supabase, IndexedDB, HTTP, and RPC, and runtime `Config` with injected providers.
- **Back end** — Supabase edge functions behind committed entrypoint shims, passwordless OTP
  authentication, and administrator-only User orchestration.
- **UX toolkit** — the design language (layered tokens and themes, typography, rhythm), the Ui
  control catalog over Kobalte, the icon catalog, and the shell: bootstrap, routing, and the
  dashboard with its widget contract.
- **DevOps** — architecture guards, packaging, the stage environment, and deployment of the three
  app bundles.

## M-1 · Users & Customers Reference Implementations — Closed 2026-10-11

- **User Manager** (`project-user-stories.md` §6) → generalized `AbstractionManager`.
- **Onboarding Wizard** (§1.1's "Prospect genesis") → generalized `Wizard`.
- **Customer Manager** (§3) → both workbenches over one shared `panel/` step contract.

Users and Customers stand as this project's **reference implementations** for Abstractions meant to be copied for the remaining ~80% of the app, not iterated on again in their own right. Onboarding wizard is the reference implementation for complex ux workflows.

Closed with its productions shipped and reviewed. Its remaining items moved to the milestones that
build them (`EFFORT.md` §7):

1. ~~Notes Editor completed & integrated into User Manager~~ — delivered 2026-10-08 (§4).
2. ~~Notes Editor integrated with Customer Manager feature completion~~ — delivered 2026-10-08
   (§4), including account notes and a Billing step.
3. Additional-contact assignment (`project-user-stories.md` §1.1) is portal users; moved to §9
   Customer Portal.
4. Onboarding's Initial Job Assessment stage needs Services, Workflows, and seeding (§6); moved to
   §7 Job Definition.

## M-2 · Shell/App Split — Closed 2026-09-21

`ux/shell/` split into `ux/shell/` and `front/app/`; CA then promoted `ux/` itself to a
top-level `source/ux/` namespace with its own `@ux/` import alias, sibling to `front/` rather
than nested under it — the literal conclusion of treating `ux/` as a third-party library.
`effort/completed/2026-09-15-shell-app-split-brief.md`.

## M-3 · Customer Manager — Closed 2026-10-19

Post-genesis Customer editing through `AbstractionManager`, reusing Onboarding's Customer steps.
Both workbenches now host a sequence of one or more steps over one shared `panel/` step contract.
Shipped 2026-09-30: `effort/completed/2026-09-22-customer-manager-brief.md`.

Additional-contact assignment (`project-user-stories.md` §1.1) is not built; it is slotted in §9
Customer Portal.

**The account manager field,** a User, set during Onboarding to the session user and changeable
in Customer Manager through a shared User picker — shipped 2026-10-19 (`4a3c403`) and verified by
the CA: `effort/completed/2026-10-08-account-manager-brief.md`.

1. **Soft-deleted references** — completed 2026-10-18:
   `effort/completed/2026-10-13-soft-deleted-references-brief.md`. A deleted account manager is
   still shown, so references had to resolve soft-deleted targets.
2. **Account manager production** — completed 2026-10-19, including the session user
   (`SessionUserContract` and `UserProvider`, the brief's decision 11 and Addendum 5).

**Continues on its own:** stage test authorization
(`effort/active/2026-10-13-stage-test-authorization-brief.md`), so `users-api-test.ts` and
`session-coordinator-test.ts` can run.

## M-4 · Notes Editor — Closed 2026-10-18

Stock, parameterized Index-Detail archetype `NotesEditor`, lands in `front/app/shell/`. It is
an application feature, not toolkit, so it belongs in `front/app/`, not `ux/`. It is built for
inclusion in a workbench archetype, which rules out other surfaces such as a simple popup
dialog.

Two capabilities, each landing with the milestone that first needs it:

- **Attachments** — with §5 Mechanical Productions, for operator and maintenance documents on
  assets.
- **Device media recording** — with onsite Job Assessment (§7). Assessment, planning, and
  running all need it.

**Tags:** decided 2026-10-06. There is no tag capability: `Note.tags` is removed, and Service and
Workflow classification moves to curated facets. The Notes Editor shows no tags.

**Sequence:**

1. **Tags → facets** — completed 2026-10-08: `effort/completed/2026-10-06-tags-classification-brief.md`.
2. **Notes Editor brief** — completed 2026-10-08: `effort/completed/2026-10-08-notes-editor-brief.md`.
3. **Notes Editor production** — shipped 2026-10-08 (`991bc90`), with the brief.
4. ~~**Milestone verification**~~ — verified by the CA in User Manager and Customer Manager.

Rode with it, delivered 2026-10-08: User Manager consumes it, so User Management is closed; the
Sites step's local `NoteEditor` and User Manager's flattening text area are replaced; Customer
account notes are editable (the backlog entry "Customer Manager cannot edit account-level notes",
now removed).

## M-5 · Mechanical Productions

Standard production from the Users/Customers reference implementations — no design conversation
needed, pick up whenever convenient once §2 lands. Named "Asset Manager"/"Chemical Manager" here
deliberately, not "Maintenance": that's `project-user-stories.md` §3/§4's own theme name, but it
describes a larger destination (schedules, inventories, parts — parking lot: P-8) than the stock
CRUD shipping first. A `project-user-stories.md` iteration rides with this milestone, once §1 is
closed, to scope both themes properly before that fuller work is picked up.

**Enablers** — make the reference implementations copy-ready before this milestone replicates
them; each fix lands once instead of chasing every copy:

- **Workbench draft services** — closed 2026-10-21,
  `effort/completed/2026-10-19-workbench-draft-services-brief.md`: one shared dirty check, draft
  services that load no JSX, and each host owning its aggregate draft check.
- **Fresh editor feedback** — `effort/active/2026-10-19-fresh-editor-feedback-brief.md`:
  `AbstractionManager`, which every new manager uses.
- **Stage test authorization** — `effort/active/2026-10-13-stage-test-authorization-brief.md`: new
  managers arrive with integration tests that run.

**Rides along:**

- **File header conformance** — closed 2026-10-20,
  `effort/completed/2026-10-09-file-header-conformance-brief.md`: copied files carry their headers.
- **CONVENTIONS reconciliation** — closed 2026-10-20,
  `effort/completed/2026-10-03-core-reconciliation-brief.md`: CONVENTIONS becomes the programming
  guide, and `architecture-core.md` is cut to the system.
- **Containers in CONVENTIONS** — closed 2026-10-20,
  `effort/completed/2026-10-09-containers-conventions-brief.md`: types, interfaces, classes, and
  module singletons as containers.
- **Architecture documents cut to the system** — closed 2026-10-20,
  `effort/completed/2026-10-20-architecture-system-cut-brief.md`: `architecture-back`, `-devops`,
  and `-front` keep the system; portable material moves to CONVENTIONS.
- **UX toolkit decomposition** — closed 2026-10-20,
  `effort/completed/2026-10-20-ux-toolkit-decomposition-brief.md` (B-3):
  `architecture-front.md`'s toolkit material moves by rank to the archetypes, the components guide,
  CONVENTIONS, and the `ux/` headers.
- **EFFORT milestones** — closed 2026-10-20,
  `effort/completed/2026-10-19-effort-milestones-brief.md`: codifies milestones, reconciliation,
  deferrals, and enablers in `EFFORT.md`. It makes nothing here copy-ready; it lands in the same
  window so the method is written down as practiced.

File header conformance, the CONVENTIONS reconciliation, and Containers in CONVENTIONS ride along
for the same reason: mechanical productions are built on conformant conventions, and together
these settle CONVENTIONS and bring the code into conformance in the same window.

**Features:**

- **Asset Manager** (`project-user-stories.md` §3.1–3.2) — Manager, wire `api.Assets`.
- **Chemical Manager** (`project-user-stories.md` §4) — Manager, wire `api.Chemicals`.

## M-6 · Workflow, Task, Question & Service

`project-user-stories.md` §5, currently unwritten, plus `Service` (domain type exists, `api.Services` commented out). Needs the Workflow Builder archetype — named in `architecture-front.md`'s normative tree (`workflow-builder/`) but never built. The one theme with no existing archetype to extend at all, and the most depended-upon: Job Definition's own §2.1 "workflow seeding" (preload a default workflow per Service/SKU) can't be built until this exists.

Seeding filters the Workflow library by the selected Services' facets, and the rep chooses from the
result. Design input, including the open questions on facet values, curation, and Service versus
Service Category: `effort/pending/2026-10-06-facets-workflow-seeding-brief.md`.

Assessment and planning edit job-specific Workflow clones with the Workflow builder
(`architecture-front.md` §11.2.3), so this milestone is expected to produce the job assessment and
job planning briefs that §7 builds.

## M-7 · Job Definition

Admin-side (`project-user-stories.md` §2.1–2.6, 2.9): service selection through assessment,
planning, finalization, and followup. Backlog: B-25 "Onboarding has no Initial Job Assessment stage"
(`normal`) covers §2.1 specifically, and completes the Onboarding Wizard (moved from §1). Needs
`api.Jobs` wired (currently commented out in `api.ts` — not itself a backlog entry, a real gap)
and depends on §6 above for Service/Workflow seeding.

Rides with it: backlog B-27 "A Customer with Jobs can be deleted" (`normal`) — the first Job that
references a Customer is where the delete guard lands. Also the **Hub widget** (B-30, `normal`),
the primary approach for grouping dashboard commands by topic, with a hierarchical left-nav panel
as the named fallback. Job's three independently-tabled phases are its motivating case, so it is
built with the first milestone that presents a Job — this one — and reused by §8 and §9.

## M-8 · Ops Application

The `app-ops` app, at minimum a hub widget for the Jobs that are its subject plus the Job Runner.
It closes when a crew member can open an assigned Job and run it offline.

The first app to need the access model, so it lands here: app entry by role, the capability
module, the `SubjectWidget`, and RLS for the job-reaching tables
(`effort/pending/2026-10-10-access-model-brief.md`).

**Job Runner** — Ops-side (§2.7–2.8): offline field execution. `architecture-front.md`'s normative tree already
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

## M-9 · Customer Portal

The `app-customer` app, at minimum a hub widget and a customer job report, plus portal users in
Customer Manager, which carries §1's additional-contact assignment.
Design outline: `effort/pending/2026-10-08-customer-portal-brief.md`.

Gate: RLS for every customer- and job-reaching table is locked down before the first `customer`
User exists. Under today's `_all` policies such a User could read and write every table.

## M-10 · Dashboard Widget Development

The read-only dashboard widgets each app wants: a shared widget catalog plus per-app instances —
specialization direction, building diverse content atop already-generalized primitives (contrast
with §2's generalization direction). Last, because it decorates apps that already work. Houses:

- **ux/ui/charts** - 4 chart types available to dashboard widgets
- **Prospect Pipeline Visibility** (§1.2) — a prospects-by-age widget plus aging charts, buildable
  off `Customer.status = 'prospect'` alone. The simplest entry in this milestone: no new
  archetype needed, doesn't depend on the parked `Lead` abstraction.

## Orthogonal to project themes

Features not belonging to any theme are added to whatever session happens to touch its territory.

- **DevOps hygiene** — B-19 "`source/devops/` is not held to CONVENTIONS" (`normal`) bundled with
  B-20 "`edge-deploy` lacks the target-resolution and verification parity `app-deploy.sh` already
  has" (`high`) — same territory, same session.
- **Doc hygiene** — B-1 "`architecture-devops.md` buries what an agent scan needs" (`normal`),
  B-2 "`domain-archetypes.md` and the domain genesis prompt restate CONVENTIONS" (`normal`).
- **Guard gaps** — B-14 "`guard:css` does not verify that a referenced token resolves" (`normal`),
  B-16 "`guard:leaf` does not sweep the repository root" (`normal`), B-17 "`guard:leaf` fails on
  git-ignored files" (`low`), B-18 "`guard:css` misreads multiline selectors and misses selector-list
  branches" (`normal`), B-15 "No guard enforces conformity to established conventions" (`low`).
- **Shared UI controls do not use one state model** (`high`) — rides with no milestone for now.
  Real and fully scoped, but not assigned to any of the above; pick up on its own schedule.
- **Collection-Detail surfaces do not draw the Selection** (`normal`) — small UX gap on every
  shipped and future `AbstractionManager` above its container threshold.
- **Auth bundle** — B-7 "A stale session survives genesis..." and B-8 "Eject should ban, not delete..."
  (both `normal`, downgraded/bundled 2026-09-12 — see backlog for why), sharing one unresolved
  verification with the DevOps `edge-deploy` entry above.
- **Login needs an "Already have a code?" action** (`normal`).
- **Testing** — not a slot, a practice change: every milestone from here forward scopes its own
  test coverage as part of its own brief, rather than shipping and being driven-and-reported
  afterward. `CONVENTIONS.md` §18's convention only covers domain/adapter/API today; extending it
  to the UX layer is foundation work belonging with whichever milestone needs it first (most
  likely §2 or §3).
- **Style guide into `ux/`** — B-31 "`app-style-guide` belongs in `ux/`, not `front/`" (`low`).
  Unblocked now that the Customer Manager production has landed.
- **UX gaps** — B-6 "The overlay controls over-specify their triggers" (`normal`), B-10 "PanelHeaderTitle's
  heading-depth mapping is already at its hardcoded ceiling" (`normal`).
- **Data gaps** — B-23 "A unique-key conflict with a soft-deleted record reports a general failure"
  (`normal`), B-24 "Timestamps read from Postgres are not in the form the app writes" (`normal`).

_End of Roadmap Document_
