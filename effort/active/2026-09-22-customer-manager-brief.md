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

_End of Backlog Brief_
