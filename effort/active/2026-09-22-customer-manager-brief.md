# Customer Manager — Backlog Brief

**Backlog, not dispatched.** Captured from a design conversation that started with one question —
can Onboarding's Contact/Customer/Sites panels be reused as Customer Manager's edit surface —
and found that the honest answer required understanding why the two workbench archetypes
differ, not just where their files happen to sit. Closes the Users & Customers vertical slice
(`project-user-stories.md` §1.1: post-genesis editing and additional-contact assignment,
neither built today). Backlog: "Customer Manager" (`normal`).

## Objective

Give Customers an edit surface. `AbstractionManager` is the right host — `Customer` is a table
abstraction, full stop — but its editor needs multiple panels (Contact, Customer detail, Sites),
and those panels already exist, built for `Wizard`, inside the onboarding create-flow. This
brief is about what it actually takes to make that reuse real, not just possible.

## The governing finding: the two workbenches aren't unifiable, only their chrome is shared

Found by tracing actual contracts and CSS, not by assumption:

- **`AbstractionManager` is a table editor by design, not incidentally.**
  `AbstractionManagerContract<T extends Instance, Draft>`'s `listColumns: string[]` and
  `renderListCells: (item: T) => UiComponent` are literal table semantics, generically bound to
  exactly one abstraction type. `Wizard` has no analogous binding anywhere in its contract —
  it was never trying to be one.
- **The validity/draft handoff is genuinely different, not just named differently.**
  `AbstractionManagerContract.renderForm` receives `context.register(handle)`, where
  `handle = { validate, draft }` — a formal, typed registration. `Wizard`'s stages report
  validity through `onFormCheck`, an ad hoc callback prop `Onboarding.tsx` itself invented with
  local signals — it isn't even part of `WizardStage`'s type.
- **That traces to two different state-ownership models.** Onboarding's `createOnboardingState()`
  builds one shared, mutable state object up front that every stage mutates in place; `commit()`
  reads directly from it — there's nothing to hand back. `AbstractionManagerContract` assumes the
  opposite: an isolated draft per editor mount, explicitly returned via `register`'s handle,
  because there's no long-lived shared object.
- **The chrome is purpose-built for each, not interchangeable.** `Wizard`'s progress bar and
  step list (`barFill()`, `wizard.css`'s `data-shell='wizard-bar'`) frame the experience as
  journey-toward-completion — right for creating a new Customer, but it was never built to serve
  editing an already-complete one, and nothing here proposes making it. Its
  last-stage action is hardcoded `'Finish'`, not `'Save'`.
- **Aside/main layout is a different mechanism, not just different proportions.**
  `wizard.css` and `abstraction-manager.css` share identical floors and the identical 676px
  collapse threshold (by the CSS's own documented arithmetic), but the weights are deliberately
  reversed (1.3fr/1.7fr vs. 1.7fr/1.3fr — main-weighted vs. aside-weighted) and the collapse
  _behavior_ differs outright: `Wizard` hides its aside entirely below threshold; `AbstractionManager`
  keeps both panels mounted and slides between a `list`/`editor` mode via
  `data-shell-mode`, transform, and opacity — a real two-state master-detail navigation `Wizard`
  has no concept of.
- **`AbstractionManager` is structurally single-abstraction; `Wizard` isn't.**
  `AbstractionManagerContract<T, Draft>` has no second type slot — it cannot express "this form
  also touches a different abstraction." `WizardStage.commit?: () => void | Promise<void>` has no
  return type and no tie to a shared `Draft`; nothing stops independent stages from persisting to
  different abstractions entirely. Today's Onboarding only exercises this on its last stage (one
  `Customer`, contact and sites nested inside it), but the _capability_ is real and already
  built in — and the roadmap's own future extension of Onboarding into Initial Job Assessment
  (a separate `Job`/`JobAssessment` record after the `Customer` exists) is exactly the shape that
  would need it.

**Conclusion:** these are not two flavors of one archetype sharing implementation details by
accident. They share container/chrome plumbing (`PanelContainer`'s header/aside/main slots) and
nothing else load-bearing. Trying to make one host the other's panels directly doesn't reduce to
a small adapter — it requires picking one state-ownership model and accepting the other
archetype's chrome stops making sense.

## The resolution: a third, host-agnostic panel-sequence primitive

Extract the one thing both archetypes would otherwise reinvent — a gated sequence of panels —
into something neither owns, that both can embed.

**What it owns, deliberately minimal:**

- An ordered list of panels
- A cursor: which panel is active
- Gated linear advancement — panel N+1 is unreachable until panel N validates
- Per-panel `validate()` — show that panel's own field errors when advance is attempted

**The gating invariant is not negotiable, and here's why, worked through directly:** with gating,
being on panel N is a _guarantee_ that panels 0..N-1 already passed — no panel ever has to
explain another panel's error, because it structurally can't be reached otherwise. Without it
(jump-navigation), you could land on a later panel with an earlier one never validated, and there
is no single correct answer for where to route a user facing two simultaneous errors — first-in-
sequence (mirrors native HTML form validation, but silently makes stage order double as error
priority), stay-on-current-if-it's-an-offender, or abandon the single-error-slot model for a
cross-stage summary are all defensible and none is forced. Three genuinely different answers with
no way to choose between them is itself the argument against building it, not a problem to solve
later. **Jump-to-any-panel navigation is explicitly out of scope, not merely undone.**

**What it deliberately does not own** — chrome, persistence, or a canonical draft type. Those stay
host-specific on purpose:

- No progress bar, no aside, no layout of its own — it renders its active panel inside whatever
  slot its host gives it.
- No commit mechanism, no opinion on how many abstractions a flow touches.

## How each host embeds it

**`Wizard`** — keeps its progress bar, step list, aside, and `'Finish'` label exactly as today;
keeps per-stage independent `commit()`, so a genuinely multi-abstraction flow (Customer today,
Customer + JobAssessment once Initial Job Assessment lands) still works. Its stages become the
primitive's panels; existing chrome renders around it unchanged.

**`AbstractionManager`** — keeps its own aside (the table), its own list↔editor collapse toggle,
its own single-`Draft` contract, all untouched. For `Customer`'s multi-panel form, `renderForm`
embeds the primitive inside `main` only, never touching `aside`. The primitive aggregates its
panels' state into one `draft()` that satisfies `context.register()` — appropriate, because
editing one Customer really is single-abstraction, table-editor-shaped, even though the flow that
originally created it isn't. Chrome stays Manager-native: `'Save'`, no progress bar.

## Hydration is not a new mechanism

`renderForm(item: T | null, context)`'s `item` parameter already is the hydration path — whatever
composes the panels inside `renderForm` reads `item`'s fields to seed local state, exactly like
every other `AbstractionManager`-hosted editor already works (confirmed against the backlog's own
note: `renderForm`'s `null` already means create, a real item is the same slot's non-null branch).
Onboarding's create-only flow never needed hydration and still doesn't. No new gap here — an
earlier pass through this design treated this as unresolved; it isn't.

## File-level plan

**The primitive** lives in `source/ux/shell/panel/`, not `workbench/`. It has no chrome and no
persistence opinion — it belongs at the same tier as `PanelStepflow`/`PanelForm`/`DrillDown`,
which `Wizard` already consumes _from_ `panel/`, not at the tier of the opinionated archetypes
(`AbstractionManager`, `Wizard`) themselves that live in `workbench/`. Exact name TBD at
production time — a candidate is `PanelSequence`, not decided here.

**Naming, applied consistently across both existing Managers, not just the new one:**

- Hosts reveal their archetype: `user-manager.tsx`, `customer-manager.tsx`,
  `onboarding-wizard.tsx`.
- Panels reveal topic and role: `{topic}-stage-{name}.tsx` — `user-stage-detail.tsx`,
  `customer-stage-contact.tsx`, `customer-stage-detail.tsx`, `customer-stage-sites.tsx`.
- This means two renames beyond new work: `app-admin/users/user-manager-editor.tsx` →
  `user-stage-detail.tsx`, and `app-admin/onboarding/onboarding.tsx` (component `Onboarding`) →
  `onboarding-wizard.tsx` (component `OnboardingWizard`). Worth doing now, while these are still
  the reference implementations everything else copies — the convention only means something if
  it's true everywhere at once.

**Ownership inverts from today.** The Contact/Customer/Sites panels currently live under
`app-admin/onboarding/`, making Onboarding their owner and Customer Manager the borrower. Flip
it: `app-admin/customers/` — reference-implementation-shaped, table-editor-native — becomes the
canonical home; `app-admin/onboarding/onboarding-wizard.tsx` imports the panels _from_
`app-admin/customers/`, wrapping them in Wizard chrome for the guided create experience. The
"customer" stage (today's `onboarding-stage-customer.tsx`, the Customer's own identity/address
fields) is renamed `customer-stage-detail.tsx` in its new home, avoiding a redundant
`customer-stage-customer`.

```
app-admin/customers/
  customer-manager.tsx             — new, AbstractionManager host
  customer-stage-contact.tsx       — moved + renamed from onboarding/onboarding-stage-contact.tsx
  customer-stage-detail.tsx        — moved + renamed from onboarding/onboarding-stage-customer.tsx
  customer-stage-sites.tsx         — moved + renamed from onboarding/onboarding-stage-sites.tsx
  customer-state.ts                — successor to onboarding-state.ts's Contact/Customer/Sites slice

app-admin/onboarding/
  onboarding-wizard.tsx            — renamed from onboarding.tsx; imports panels from ../customers/
```

**Note on `app/shell/`:** briefly renamed to `app/components/` and reverted back to `shell/` in
the same session this brief was drafted — about-box, brand-hero, login, `shell-makers.tsx`, and
`session-coordinator.ts` stay there under the original name. `NotesEditor` (out of scope below,
its own future brief) also lands in `app/shell/` once built, not a namespace of its own — the
same complexity-management call as this section's own file grouping: don't split into
single-purpose namespaces until one actually outgrows sharing.

## Explicitly open — not decided here

- The primitive's exact TypeScript contract (panel type, cursor API, what `validate()` returns)
  is sketched in shape, not in signatures. Production writes the real interface against the
  constraints above.
- Whether `customer-state.ts` is a straight port of `onboarding-state.ts`'s relevant slice or a
  genuine rewrite — depends on what the primitive's panel contract ends up requiring.
- Exact commit semantics for editing: presumably one `update(item, draft)` call when the sequence
  completes, mirroring Onboarding's one-`create()`-at-the-end shape, but not yet written down as
  a decision.

## Out of scope

- Notes Editor and its placement (`front/app/shell/`, alongside about-box/brand-hero/login) —
  decided in the same conversation this brief came from, but it's an unrelated feature; belongs
  in its own brief when picked up.
- Additional-contact assignment (the other named gap in the Users & Customers vertical slice) —
  not addressed by this brief; Customer Manager's initial scope is single-primary-contact editing
  matching what Onboarding already collects.
- Any change to `Wizard`'s or `AbstractionManager`'s existing consumers (User Manager, the
  onboarding create-flow's actual behavior) beyond the renames and import-path updates named
  above.
- Domain/schema changes, backend changes, deployment.

## Sequencing

1. Design and write the primitive's real contract (in `ux/shell/panel/`), informed by this
   brief's constraints — no chrome, no persistence opinion, gated linear advancement only.
2. Move and rename the three onboarding stage files into `app-admin/customers/`, rewritten
   against the primitive's contract. Rename `user-manager-editor.tsx` →
   `user-stage-detail.tsx` alongside them, for the convention to be true everywhere at once.
3. Build `customer-manager.tsx` (`AbstractionManager` host), embedding the primitive in
   `renderForm`.
4. Rewrite `onboarding.tsx` → `onboarding-wizard.tsx`, importing the moved panels from
   `../customers/` and embedding the same primitive inside `Wizard`'s existing chrome.
5. Wire `Wizard`'s per-stage `commit` and `AbstractionManager`'s `register`/`draft()` against
   the primitive's actual validate/draft surface once it exists.

## Checks

`deno task check` (all guards, type check, lint) after each of steps 2-4 lands, not just at the
end — this touches two existing, working features (User Manager, Onboarding) as well as the new
one. Live verification: User Manager still edits a user correctly after its rename; Onboarding
still creates a Customer correctly after its rewrite and rename; Customer Manager lists, opens,
edits, and saves an existing Customer through all three panels; sign-out/back-in and Job Sites
functionality (which already depends on `job-views.ts`, unaffected here) remain unaffected.

## Amendment — 2026-09-24 — Chief Architect production decisions

Foundation production is authorized by the Chief Architect's decisions below. This amendment
supersedes conflicting proposals above while preserving their reasoning history.

1. **Ownership.** The Customer editor owns state and `draft()`. `PanelSequence` owns ordered
   panels, cursor, Back, validated Next, completion validation, and validation registration/cleanup.
   It owns no persistence, draft, or chrome. The earlier assignment of draft aggregation to the
   primitive is superseded. Customer edits commit once on final Save.
2. **Navigation composition.** The CA updated UX archetypes §§3.3, 4.1, and 4.2 to the shipped
   Wizard design. This is not a Wizard correction. Only one axis is live: inside Detail, sequence
   controls are absent, drill-back is the sole ascend action, and the innermost Detail's commit
   occupies the advance position. Commit validates and returns to its Index; failure stays in
   Detail. Drill-back confirms discard only for a changed draft. Headers name paths by kind,
   not instance. Glyphs and motion belong to design language. Customer Manager reproduces this
   composition. Read and report divergences in `ux-design-archetypes.md`; do not edit it or add
   a Supporting Library row without a separate CA decision.
3. **New included.** New opens a blank Customer draft in the same Manager editor. Customers
   exist independently; Onboarding remains the intake workflow and shares the stage panels.
4. **Delete included.** Use `api.Customers.delete` with confirmation, following User Manager.
   Delete removes a mistaken, duplicate, or abandoned account; inactive identifies a real former
   customer. Soft deletion preserves recoverability and references. Hard deletion belongs only
   to explicit retention policy. A Jobs dependency guard is deferred to Job Definition because
   no Jobs exist yet.
5. **Integration accepted.** Add optional Manager editor navigation registration. Aggregate Save
   is available only at sequence completion without an open nested draft. Host nested Sites
   Save/drill-return. Add one combined update scope excluding `accountManagerId` and account-level
   `notes`, `/customers`, and its dashboard entry. The seed-hash reset is accepted. Complete the
   named stage/host renames. This effort supplies post-genesis editing; it does **not** close the
   Users & Customers vertical slice, since additional-contact assignment remains out of scope.
6. **State port.** Port existing state, adding hydration and draft isolation. Introduce intent-method
   setters only if those requirements need them, and justify any such change in the production report.
7. **List cap.** Match User Manager's `list({ limit: 100 })`. Full-collection pagination is excluded;
   the shared first-page cap is separate backlog work for both managers.
8. **Tests.** Add API-level tests only, under `source/tests/cases/`: combined update scope,
   excluded-field preservation, and optional-field clearing. UX controller tests are excluded until
   the testing convention is extended through a separately authorized CONVENTIONS amendment.

Documentation precedes code: this amendment, then `architecture-front.md`. Expected production
touches Customer and Onboarding files, User detail naming/imports, panel sequence and workbench
integration, the API update-scope declaration, Admin route/dashboard composition, and API tests.
Domain/schema, backend, deployment, governance documents, UX archetypes, and unrelated repairs
remain excluded. Run `deno task check` at integration checkpoints, focused API tests, formatting
verification, and the live regression checks above (including New/Delete and nested draft behavior).
Record checks actually performed and remaining verification; closure requires CA review and
independent verification under EFFORT.md.

## Amendment — 2026-09-25 — Chief Architect review: both workbenches host steps

The Chief Architect and AI Architect reviewed the uncommitted production against this brief.
The committed foundation (User Manager, Onboarding, `Wizard`, `AbstractionManager`) was sound;
the defects were in production. Two were structural:

- `customer-editor.tsx` added a layer the design never had. It copied `Wizard`'s composed header
  logic, glyphs included, into feature code.
- The same file rendered the Wizard's stepflow inside the Manager's main panel. That shows the
  Customer's three steps as a whole Sequence. They are a fragment of Onboarding's.

The review settled why the layer appeared. `AbstractionManager` hands one opaque form to
`renderForm`, so a multi-step Detail had nowhere to live except a wrapper.

**Superseded.** This amendment replaces:

- from "How each host embeds it", `Wizard`'s per-stage independent `commit()` and
  `renderForm` embedding the primitive;
- from the 2026-09-24 amendment, item 1's "The Customer editor owns state and `draft()`";
- item 5's optional Manager editor-navigation registration;
- the "File-level plan" names `*-stage-*` and `customer-panels`.

Everything else in the 2026-09-24 amendment stands: New, Delete, update scope, list cap, tests,
route, and dashboard.

### Decisions

1. **Vocabulary is _step_,** as in the pattern book. The code follows: `*-stage-*` files become
   `*-step-*`, and the `WizardStage` types are removed (decision 4).
2. **Both workbenches host a sequence of one or more steps.** A step is one panel. A drill-down
   inside a step replaces that panel's content and is still the same step. User Manager has one
   step and Customer Manager three. Onboarding has the Customer's three today, and more once
   Initial Job Assessment joins.
3. **The workbench owns the aggregate draft and commits it once.** `Wizard` commits at Finish
   through its contract. That commit may write one abstraction, several, or none. The Manager
   commits at Save through its existing `create`/`update`. Steps never commit.
4. **The step contract lives in `ux/shell/panel/`,** because both workbenches share it:

   | Name                                           | Role                                                                                                                                |
   | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
   | `PanelStep`                                    | `name`, `title`, optional `validate`, `render(context)`                                                                             |
   | `PanelSequence`                                | `readonly PanelStep[]` — the type, not a component                                                                                  |
   | `PanelStepContext`                             | Validation registration, drill-return and trailing-action registration, `feedback`, `busy`                                          |
   | `createPanelSequence` / `PanelSequenceControl` | Cursor, Back, validated Next, completion validation, validation registration. Role unchanged; no chrome, draft, or persistence      |
   | `PanelSequenceStep`                            | Renders the current step and owns the step transition motion (renamed from the `PanelSequence` component)                           |
   | `PanelSequenceHeader`                          | The composed header of UX archetypes §4.2, lifted from `wizard.tsx`. The host supplies its commit action for the final advance slot |
   | `PanelSequenceProgress`                        | The horizontal progress indicator, lifted from `Wizard`'s accessory. Rendered for any sequence of more than one step                |

   The glyphs, the header states, and the transition motion exist once, here. No feature restates
   them.
5. **Progress belongs to the Sequence, not to either workbench.** A sequence of more than one step
   presents `PanelSequenceProgress` in whatever host it runs. A one-step sequence presents none.
   `Wizard` also lays the sequence out as a tree in its aside (`PanelStepflow`); that is Wizard
   chrome and it stays so. The Manager contributes no progress chrome, and its aside is always its
   Collection.
6. **Only the composer of a sequence knows the whole of it.** `customerSteps(state)` is a
   fragment. It knows nothing of position, progress, or what precedes or follows it.
   `onboarding-wizard.tsx` composes Onboarding's sequence from `customers/` today, and from Initial
   Job Assessment's steps later. Both of the Wizard's progress presentations derive from that
   composed sequence.
7. **Wizard contract:** `WizardContract = { formTitle, steps: PanelSequence, commit, feedback? }`.
   `WizardStage`, `WizardStageContext`, `canAdvance`, `trailingAction`, and per-step `commit` are
   removed. There is one mechanism for each concern: sequence validation, context-registered
   trailing action, and one commit.
8. **Manager contract:** `renderForm` is removed, and so is every `AbstractionEditor*` type:
   handle, registration, navigation, and context. They are replaced by
   `detail: (item: T | null) => AbstractionDetail<Draft>`, where
   `AbstractionDetail<Draft> = { steps: PanelSequence; draft: () => Draft }`. The Manager calls
   `detail` for each Item it opens, which is how hydration works, and it validates through
   sequence completion. Save occupies the final advance slot and is offered only when no nested
   Detail is open.
9. **Manager navigation.**
   - **Collapsed (Index-Detail).** One axis is live. Step 1's leading control returns to the
     Index; later steps show Back. There is no shortcut to the Index.
   - **Expanded (Collection-Detail).** Selecting another Item, or New, is a shortcut from any step.
10. **Any exit that discards a changed draft asks first.** That covers another Item, New, the
    collapsed return from step 1, and Cancel. The Manager snapshots the draft when it opens an Item
    and compares before any exit. This is new behavior for both managers: User Manager discards
    silently today.
11. **Feature files.**

    | Now                                                     | Becomes                                                                         |
    | ------------------------------------------------------- | ------------------------------------------------------------------------------- |
    | `customers/customer-editor.tsx`                         | Deleted                                                                         |
    | `customers/customer-panels.tsx`                         | `customers/customer-steps.tsx`, exporting `customerSteps(state)` only           |
    | `CustomerDraft`, `customerDraft()`                      | Move to `customers/customer-state.ts`, beside the state they project            |
    | `CustomerPanelContext`                                  | Deleted — `PanelStepContext` replaces it                                        |
    | `customers/customer-stage-{contact,detail,sites}.tsx`   | `customers/customer-step-{contact,detail,sites}.tsx` (`CustomerStepContact`, …) |
    | `users/user-stage-detail.tsx`                           | `users/user-step-detail.tsx` (`UserStepDetail`)                                 |
    | Step name `'customer'` (title "Customer address")       | `'detail'`, matching its file                                                   |
    | Sites step's `onReturnControl`/`onTrailingAction` props | `PanelStepContext`, like every other step                                       |
    | `customer-manager.css` step motion                      | Removed — owned by `PanelSequenceStep`                                          |

    - `customer-manager.tsx`: `detail` creates Customer state and returns `customerSteps(state)`
      and `customerDraft(state)`.
    - `onboarding-wizard.tsx`: passes `customerSteps(state)` and a `commit` that creates the
      Customer. It no longer mutates a stage array.
12. **Corrections.** In `Wizard.advance`, validate once. Replace stale headers in the renamed and
    moved files: "User manager editor", "Customer editor state", and `onboarding-wizard.css`.

UX archetypes and `architecture-front.md` §10.1.6 were updated alongside this amendment by the
AI Architect under Chief Architect authorization. Production resumes from these documents.
The 2026-09-24 amendment's checks and verification stand, with these additions:

- **User Manager.** Edit and save a user; dirty-exit confirmation on another Item, New, and Cancel.
- **Customer Manager.** No progress chrome outside the Detail. Collapsed return only from step 1.
- **Onboarding.** Both progress presentations unchanged.

## Amendment — 2026-09-28 — Round 2 production and contextual dirty exits

The Chief Architect authorized Round 2 Foundation production against the September 25
amendment. Dirty-state remains local to the context holding a draft. Local Save validates and
applies to the parent; local Up discards only that Detail, confirming only when changed.
Sequence Back/Next preserves state and does not prompt.

Workbench Cancel and collection select/New abandon the enclosing session. The workbench checks
its aggregate and open nested drafts and asks once before discarding. The collapsed first-step
return to the collection receives the same protection. Declining preserves the entire session.
`PanelStepContext.registerDirty` registers a change check and returns cleanup. Checks for retained
feature state live for the workbench session, independently of mounted step controls; checks for
local nested drafts are removed when those drafts close. Dirty-state does not enter the sequence
controller. Equivalent dialog dismissal paths are inspected; any required new shell contract is
an escalation boundary. Browser-tab closure is excluded.

Production covers the shared sequence contracts and presentation, both workbench integrations,
and Customer, User, and Onboarding adaptation. Verification remains API-level automated tests,
repository checks, formatting/style audit, and live walkthroughs. UX archetypes and governance
remain read-only. CA review and independent verification remain required for closure.

### Round 2 production record — 2026-09-28

**Mode:** Foundation. Implementation follows the September 25 amendment and the contextual
dirty-exit agreement above. This record is not effort closure; CA review and independent
verification remain outstanding.

**Created or renamed relative to Round 1:**

- `source/ux/shell/panel/panel-sequence-contract.ts`.
- `source/ux/shell/panel/panel-sequence-header.tsx` and `.css`.
- `source/ux/shell/panel/panel-sequence-progress.tsx` and `.css`.
- `source/ux/shell/panel/panel-sequence-step.tsx` and `.css`.
- `source/ux/shell/workbench/workbench-context.tsx` for contextual registration and discard confirmation.
- `source/front/app-admin/customers/customer-steps.tsx`, replacing `customer-panels.tsx`.
- Customer `customer-step-contact.tsx`, `customer-step-detail.tsx`, and `customer-step-sites.tsx`,
  replacing the corresponding Round 1 `customer-stage-*` files.
- `source/front/app-admin/users/user-step-detail.tsx`, replacing `user-stage-detail.tsx`.

**Modified:** this brief; `documentation/architecture/architecture-front.md`; shared
`panel-sequence.tsx` and `panel-form.tsx`; both workbench contracts and components; `wizard.css`;
Customer state, manager, and manager CSS; User Manager; Onboarding wizard and its CSS.
`customer-editor.tsx` was deleted. Renames remove the superseded Round 1 paths above. Existing
Round 1 API scope, route/dashboard integration, and API tests remain in the working tree.
CA-owned archetype, roadmap, backlog, and unrelated brief edits were preserved.

**Implementation notes:** no Customer intent-method setter refactor was introduced. User signals
and draft projection were ported into a per-open factory so the Manager owns their lifetime.
A new User note's timestamp is allocated once per draft, keeping repeated projections stable.
Nested dirty checks follow active draft contexts; retained Customer state checks survive step
unmount. Busy step content is inert while aggregate persistence is pending.

**Checks and results:**

- `deno task check`: passes after integration (guards, type check, lint).
- `deno test --allow-env --allow-read source/tests/cases/customer-api-test.ts`: 3 passed.
- Targeted dprint verification, `git diff --check`, and header/line-width audit: passed.
- `STYLE_AUDIT: PASS` for Round 2 panel, workbench, Customer, User, and Onboarding source changes.
- Local Admin walkthrough at port 5173 used browser-intercepted fixture API/auth responses, with
  no live-record writes and no application runtime exceptions. Verified Customer hydration,
  validation gates, nested Note/Site saves, one aggregate update, optional address clearing,
  failed-write retry, New, confirmed soft Delete, changed/unchanged/reverted exits, and a dirty
  parent Site beneath an unchanged Note. Verified narrow first-step return, later-step Back,
  and nested drill-back/local Save. Verified User save and select/New/Cancel guards, Onboarding
  progress, retained earlier-step dirty detection, one Finish write, and mocked sign-out/sign-in.
- Production fixes during verification: Solid keyed-render callback typing; a progress/content
  CSS selector collision; stale naming and header alignment. Fixture harness mapping/response
  issues were corrected separately from application code.

**Remaining:** Escape closes a changed workbench through the shell route without its dirty check.
This was reproduced in the browser. Approval was requested to make non-dismissible `UiDialog`
surfaces block Escape as they already block outside clicks; the primitive remains unchanged
pending that decision. UX archetypes §6 still names the removed `WizardStage`; reported only.
No UX automated tests, pagination, Jobs deletion guard, additional contacts, domain/schema,
backend, deployment, or browser-tab closure changes were made. Real-service auth/persistence
verification and independent review remain outside this fixture walkthrough.

### Amendment — 2026-09-30 — Escape dismissal

The Chief Architect authorized blocking Escape for non-dismissible dialogs. Foundation scope:
`UiDialog` applies its existing `dismissible` policy to Escape as well as outside clicks.
Workbenches continue to leave through explicit controls and their contextual dirty checks.
Dismissible dialogs retain Escape dismissal. No new shell navigation contract is introduced.
Expected changes are the dialog primitive, this brief, and architecture-front; verification is
repository checks, formatting, and a focused browser walkthrough. No files are created or deleted.

**Result:** implemented in `source/ux/ui/components/ui-dialog.tsx`; this brief and
`documentation/architecture/architecture-front.md` document the policy. `deno task check`, targeted
dprint verification, and `git diff --check` pass. The fixture-backed local browser walkthrough
confirmed that Escape preserves a changed Customer workbench and its discard confirmation,
explicit Cancel still invokes the dirty check, declining discard retains the draft, and the
dismissible About dialog still closes with Escape. `STYLE_AUDIT: PASS` for the dialog change.
The September 28 Escape escalation is resolved. No credential rotation or other out-of-scope
production was performed. CA review and independent verification remain required for effort closure.

_End of Backlog Brief_
