# Wizard + Customer Onboarding — Milestone Design (Phase 3)

**Date:** 2026-07-19
**Mode:** Foundation (Exploration → this proposal; production on ratification)
**Status:** PROPOSAL — D1–D15 below await CA ratification (D14 already
ruled by CA executive decision). Supersedes the open
questions in `2026-07-14-customer-onboarding-design.md` (the scaffold); its
context sections remain valid with paths mapped to the post-migration tree.
**Related:** `2026-07-18-foundation-game-plan-design.md` (Phase 3),
`architecture-front.md` §11.7 (ops screen mockup — the Notes flow evidence)

---

## 1. Milestone Framing

Phase 3 is its own milestone (CA directive 2026-07-19). It delivers:

1. **`wizard`** — the shell framework's second and final interaction
   archetype (CA shell-closure ruling): a guided, dependency-ordered
   multi-step flow, contract-driven like `AbstractionManager`.
2. **Customer Onboarding** — the wizard's first consumer (Feature Mode),
   implementing **user story 1.1 (Customer Prospect) whole and only**:
   contact → customer → sites → Finish, ending at a `'prospect'`
   customer. The prospect-before-assessment state is the END state, not an
   early exit. Assessment scheduling is story 2.1 — a separate follow-on
   flow (see §4).
3. **Notes-lite** — the reusable domain-aware Notes component, text-first
   (content, visibility, tags); the attach/camera/geo affordance row and
   buckets remain Phase 4 and light up inside this component later.

## 2. Already Ruled (inherited, not up for re-decision)

- Wizard is a **shell framework citizen**, not a new archetype — answers
  scaffold Q1. Single-word moniker `wizard` (CA).
- Shell hosts two interaction archetypes: abstraction-manager (persistent
  CRUD) + wizard (guided flow); after both, shell converges.
- Notes are first-class flow citizens (ops mockup §11.7.5); Notes-lite
  ships with the wizard, capture affordances are configured capability.
- House composition patterns: contract files (`*-contract.ts`), provider
  injection, composition root at the app package, SPI-style context flow.
- Domain chain verified: `Customer.primaryContactId: AssociationOne<User>`;
  `Job.customerId: AssociationOne<Customer>`; `JobAssessment` + `Note`
  compositions throughout.

## 3. Proposed Decisions

### D1 — Wizard framework shape (CA refinement: IoC/Strategy)

`front/ux/shell/wizard.tsx` (+ `wizard.css`, `wizard-contract.ts`). The
mechanical pattern is classic Inversion of Control with Strategy (CA):
stages are strategy objects declared by a `WizardContract` (name, title,
render, per-step validity gate, per-step commit); the host is the IoC
container owning chrome — stage indicator, Back/Next/Finish, feedback
banner surface, dialog route presentation (`makeDialogRoute`). Stages are
to the wizard what panels are to the manager — but the wizard is NOT a
manager. Where the two archetypes share mechanics (card header/body
regions, feedback surface plumbing, panel presentation/dismissal), those
aspects of `AbstractionManager` may be refactored into shared shell
machinery consumed by both — extraction on demonstrated overlap during
Group A, not big-bang. Step forms reuse the Phase 1 hooks
(`use-abstraction-form-validation`, `-keyboard`, `-feedback`) unchanged.
Generic-first is justified by the CA's foundation framing and the known
second consumer family: the ops workflow runner (§11.7) is wizard-shaped;
the contract must not preclude it, though ops work is out of scope.

### D2 — Steps commit durable entities; no rollback

Each step's product is an independently valid domain state: a User with no
Customer is normal (User Manager makes them daily); a Customer with no Job
is normal. Therefore step commits are real, immediate, and durable; a
failed step holds the wizard on that step with standard feedback (retry or
cancel); an abandoned wizard leaves valid entities, not corruption. No
compensation machinery — answers scaffold Q3 by domain construction rather
than infrastructure.

### D3 — Step 1 is select-or-create

The contact step offers "select existing User or create new." This makes
re-entry trivial (resume = run the wizard again, select the User that
already exists), absorbs the abandoned-wizard case, and reflects reality
(the contact may already exist). The customer and sites stages are
create-only — onboarding means a new account.

### D4 — Step state is in-memory; one dialog route

Single route (`/onboarding`) presented via `makeDialogRoute` at workbench
size; current step + accumulated ids live in wizard host signals. No
route-per-step: D2+D3 deliver recovery semantics without URL state, and
refresh restarting at select-or-create is correct behavior, not loss.
Escape/cancel discard only the current uncommitted step form (committed
steps are durable) — consistent with the D9/D12 dismissal rulings.
Answers scaffold Q2.

### D5 — Notes-lite placement: shell

The component is domain-aware (imports `Note`), so `ui` is forbidden
territory by guard rule 1 — the Seasons seam settles the old
shared-vs-shell question mechanically. Proposed home:
`front/ux/shell/notes.tsx` (single word), a framework citizen consumed by
both archetypes' step/editor content. API sketch: value-in/value-out over
`CompositionMany<Note>` — content textarea, visibility, and tags rendered
with the existing `cluster` and control primitives; a capabilities prop is
reserved for the Phase 4 affordance row. User Manager's inline notes
textarea migrates to it (its first consumer is also its regression test).

### D6 — Onboarding feature shape

`front/app-admin/onboarding/` (single word): `onboarding.tsx` +
`onboarding.css`, registered as a dialog route beside `/users`. Stages per
story 1.1: contact (select-or-create User), customer (create, wiring
`primaryContactId`), sites (repeated capture per D9/D10) — Finish yields a
`'prospect'`. Stage forms are lean wizard-native forms sharing `@core/std`
rules and normalization with User Manager by convention, not by component
reuse — `UserEditor` stays a manager citizen (answers scaffold Q5;
extraction reconsidered at a third consumer).

### D7 — Gating contract, ops-compatible

The per-step validity gate in `WizardContract` is the same mechanism the
ops runner's `requiresNote` gate (§11.7.4) will need. Designed now,
consumed by onboarding now, inherited by ops later. No ops implementation
in this milestone.

### D8 — Deferred primitives: RE-deferred by the story reshape

The audit briefly summoned `isDate`/`isTime` + a `UiDatetime` control via
`JobAssessment.scheduledAt` — then the story reshape moved assessment
scheduling (story 2.1) out of this milestone, and the consumer evaporated.
The consumer rule cuts both ways: they land with the assessment flow, not
here.

### D9 — Stage field coverage (from the §6 audit)

- **Stage 1 (contact)**: capture roles (≥1 — `CompositionPositive`),
  displayName, primaryEmail, phoneNumber, preferredChannel, status —
  identical to User Manager's field set; notes/avatar deferred.
- **Stage 2 (customer)**: capture name, status, primaryContactId (wired
  from stage 1), full required address (line1, city, state, postalCode,
  country); optional line2 + accountManagerId. Payload explicitly sends
  `sites: []` and `notes: []` — the validator requires the fields present
  even when empty.
- **Stage 3 (sites)**: repeated lightweight site capture per story 1.1 —
  label, location as address-or-coordinates (per D13), optional acreage,
  optional per-site note. Commits as a Customer update carrying the sites
  composition (full-record update convention). Zero sites remains legal
  (`CompositionMany`) — a prospect can finish site-less.

### D10 — Sites ARE captured in onboarding (story-canonical)

Story 1.1 step 3 names "Locations/sites to service (each with label,
coordinates/address, acreage/notes)" as part of customer creation — the
onboarding call surfaces sites (prospect rate-shopping, sales upselling).
Full deferral (the earlier draft) contradicted canon. Capture is
lightweight and repeatable; site _management_ (edit/delete/geo-refinement)
remains a future Customer Manager concern.

### D11 — Location capture fieldset

A domain-aware location fieldset inside the onboarding feature composing
plain `ui` inputs: address fields first (what sales has on a call),
optional manual coordinates, plus a browser-geolocation fill button
(`navigator.geolocation`, no backend dependency). Map-based picking
belongs to Phase 4's geo affordance. No datetime control this milestone
(see D8).

### D12 — Onboarding defaults

Ratify: Customer.status defaults to `'prospect'` (the wizard's very end
state), User status `'active'`, contact's default role `['customer']`.
Job/assessment defaults move to the assessment-flow design (story 2.1).
One invariant to confirm during implementation: whether
`primaryContactId` implies a `CustomerContact` junction row (the docs
don't say — confirm against backend behavior and record the answer in
`domain-model.md`).

### D13 — Location relaxation (Foundation domain change)

Story 1.1 says sites carry "coordinates/address" — an OR. The domain type
is stricter than the story: `Location` requires numeric lat/lon, which
sales cannot supply on a call. Proposed: coordinates become optional; a
`Location` is valid with EITHER coordinate substance (lat+lon) OR address
substance (line1+city minimum). Type + `isLocation` validator change;
schema untouched (JSONB composite); GPS truth is filled onsite during
assessment (story 2.2, the ops 📍 world). Ripple audit across existing
Location consumers rides in the same production.

### D14 — Pipeline vision ratified; Lead entity parking-lotted (CA executive)

The pipeline: leads arrive (voicemail/text/email) → a rep transforms them
into prospects (genesis — the wizard) → an outbound return call verifies
details, selects potential services, drafts scope, and schedules the
onsite assessment (the future assessment flow's true shape). A `Lead`
abstraction (auth-free, tracked, convertible) was proposed and
**parking-lotted by CA executive decision** — for now genesis is manual:
the rep checks the three inboxes three times daily and runs the wizard
when a lead has substance. Accepted consequences, recorded deliberately:
stage 1 requires an email (User demands one), and prospect contacts
receive auth identities at genesis — both retire when Lead lands (see
parking lot).

### D15 — COW entry: direct genesis now, prospect hub later (CA-ratified)

The Customer Onboarding Wizard (COW) launches directly into genesis stage
1 this milestone — no chooser panel, because "Initial Assessment" would be
a dead button until the return-call flow exists (honest-UI rule). The hub
entry (prospect list with time-since-creation + "New Prospect" + select →
"Initial Assessment") arrives WITH the assessment flow; it is
manager-family, not a wizard stage, and its query seeds story 1.2's
widget. The wizard contract stays pure sequencing — no branching entry.

### D16 — User stories are first-class design artifacts (practice)

`user-stories.md` is stubbed but its shape is canonical — treat it like
domain or ui elements: design sessions consult it first, decisions
reconcile against it, and ratified UX shape flows BACK into it (terse,
outline-preserving enrichment). Talk, design, document — lather, rinse,
repeat. This milestone exercises the practice: story 1.1 gets enriched
with the ratified wizard shape when this doc closes.

## 4. Explicitly Out of Scope

Attachments, buckets, the affordance row (Phase 4); ops workflow runner
implementation; any dev/prod deployment; wizard use in
app-customer/app-ops; **assessment scheduling (story 2.1)** — Service SKU
selection and workflow seeding make it its own flow, arriving as the
wizard framework's second consumer with its own domain audit
(Service/Workflow reaches). `UiDatetime` + `isDate`/`isTime` arrive with
it.

## 5. Production Sequencing (on ratification; order per CA 2026-07-19)

- **A0** — Location relaxation (D13): domain type + validator + consumer
  ripple audit (Foundation, small)
- **A** — Wizard framework: contract + host + chrome, incl. any
  manager-aspect extraction demonstrated by overlap (Foundation)
- **B0** — Customers API surface (Foundation; discovered in planning —
  `@front/api` composes no Customers today): maker + `api.Customers` +
  dual-storage + live RLS verification
- **B** — Onboarding feature riding A0+A+B0 (Feature Mode): story 1.1 to
  prospect. Per-site notes ship as plain text initially
- **C** — Notes-lite component; migrate consumers onto it (User Manager +
  site notes) in one production (Foundation)
- **D** — Verification: guards/types/tests + live wizard pass end-to-end
  (create a real prospect with sites on stage via CA browser) + story 1.1
  enrichment in `user-stories.md` (D14 practice)

Prerequisite satisfied: the §6 domain-coverage audit ran 2026-07-19 and
reshaped D8–D13.

Each group is its own gated production with its own checks; the tasks
ledger decomposes them on ratification.

## 6. Domain-Coverage Audit (2026-07-19, delegated + AA-reviewed)

Full audit ran over the abstractions, protocols, and validators of the
User → Customer → Job → JobAssessment chain plus Note/Attachment/Location.
Key findings feeding D8–D12:

- `JobAssessment.locations` is `CompositionPositive<Location>` — stage 3
  cannot skip location capture; `Location` requires numeric lat/lon,
  address metadata optional.
- `JobAssessment.scheduledAt` is a required `When` — datetime capture is
  mandatory (activates D8/D11).
- `validateCustomerCreate` requires `sites`/`notes` fields PRESENT (empty
  arrays legal, omission is not) — payloads must send `[]` explicitly.
- Each `CustomerSite` needs exactly one `Location` (`CompositionOne`) —
  drove the D10 deferral.
- `User.roles` is `CompositionPositive` — stage 1 cannot allow zero roles.
- Undocumented invariant: `primaryContactId` vs the `CustomerContact`
  junction — confirm-and-record item in D12.
- Validator soft spots noted for the backlog (not Phase 3 scope): lat/lon
  are unbounded numbers; `When` format is presence-checked, not
  shape-checked; `Note.createdAt` is client-supplied.

---

_End of Design Document_
