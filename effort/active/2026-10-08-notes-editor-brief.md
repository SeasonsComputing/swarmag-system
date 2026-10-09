# Notes Editor — Brief

**Active, not yet dispatched.** Chosen 2026-10-08 as roadmap §4's second step and written the same
day from a CA + AI Architect exploration session. Reviewed by the AI Coding Engine the
same day; the amendment at the end resolves that review and marks the items it changes. It awaits
the production gate. Its predecessor step, tags → facets, closed 2026-10-08
(`effort/completed/2026-10-06-tags-classification-brief.md`).

## What triggered it

Roadmap §4 calls for a stock, parameterized Index-Detail `NotesEditor` in `front/app/shell/`,
built for inclusion in a workbench. It replaces the local `NoteEditor` in `customer-step-sites.tsx`
and User Manager's notes text area, and it carries the backlog entry "Customer Manager cannot edit
account-level notes". User Management closes once it is integrated.

## What the repository holds

**Three note owners, three treatments:**

- **`CustomerSite.notes`,** in the Sites step inside a Site drill: a `CollectionPanel` drilling
  to a local `NoteEditor` that edits content only.
- **`Customer.notes`,** in the Customer Detail step: not editable. `scopes.Customers.detail`
  excludes it, and Onboarding writes `[]`.
- **`User.notes`,** in User Manager's single step: one text area. `user-state.ts` flattens the
  notes into one note, keeping the first note's `createdAt`.

**Visibility is not editable anywhere.** `Note.visibility` (`internal` | `shared`) is set to
`internal` by `newCustomerNote` and never shown.

**The drill plumbing is positional.** `DrillDown` is hosted only at the Sites step's root. The Site
and Note editors each decide whether they are the panel on screen by reading fixed positions of the
drill path (`drillPath()[0] === 'Site'`, `drillPath()[1] === 'Note'`), guard against stale editors
with an `activeDraft` token, and register their dirty check and Save through callbacks threaded
from the step (`onDirtyCheck`, `onTrailingAction`, `onReturnAfterSave`) into
`PanelStepContext.registerDirty` and `registerTrailingAction`. A note editor at another depth
would never consider itself active.

`architecture-front.md` §10.1.6: a drill-down inside a step replaces that panel's content and
remains the same step; the workbench owns the aggregate draft and commits it once; steps never
commit; the innermost Detail's Save takes the advance slot, validates, and returns to its parent
Index.

## Decisions

1. **The whole Index-Detail pair.** `NotesEditor` is the notes list (New, Delete with
   confirmation, empty state) plus the drill-down editor for one note: a component dropped into a
   form.
2. **Controlled.** It reads `notes` and writes the whole list back through `onChange`; it never
   persists. Each consumer adapts its own state to those two props, as `CollectionPanel` does with
   `items`. The editor owns only its internal state: the working copy of the note being edited,
   the new note not yet added, the delete confirmation, and its panel registrations.
3. **The interface is three props.**

   ```ts
   export type NotesEditorProps = {
     notes: () => readonly Note[]
     onChange: (notes: readonly Note[]) => void
     drill: DrillContract
   }
   ```

   Stock means the same everywhere. The legend, column title, New label, empty message, and row
   label (the content's first line) are fixed. The delete message is general.
4. **Content and Visibility.** Each note shows Content and, below it, a Visibility field: a toggle
   group, Internal / Shared, the control Customer Status uses. A new note starts Internal, so
   nothing becomes visible to a customer unless someone chooses Shared. `createdAt` is stamped on
   new notes and not shown for editing.
5. **The step hosts the drill-down.** A step containing a `NotesEditor` takes `DrillDown` as its
   root, as Sites does, and passes `drill` down. Opening a note replaces the whole step panel, so
   every drill-down in the app behaves the same way.
6. **The drill host tells each opened panel whether it is active.** _[Corrected by the amendment "ACE review resolved", Decision 1.]_ When `DrillDown` opens a panel,
   it gives that panel a context: `isActive`, `registerDirty`, `registerSave`, and
   `returnToParent`. The host routes the active panel's registrations to `PanelStepContext` and
   withdraws them when the panel is covered or closed. Panels stop reading drill-path positions,
   stop using tokens, and stop threading `onDirtyCheck`, `onTrailingAction`, and
   `onReturnAfterSave`. The same Note editor then works at any depth, and the Site editor uses the
   same context.
7. **User notes stop flattening.** `user-state.ts` holds `Note[]`, like every other owner.
8. **`Note.createdAt` keeps its name.** A rename to distinguish it from lifecycle `createdAt` was
   considered and declined: not worth a composition schema change and a stage genesis.
   `domain-archetypes.md` §6 already states that a composition's own `createdAt` is a domain
   attribute, mapped explicitly.

## Production scope

Operating mode: **Foundation** (`ux/shell/panel/`, under strict scrutiny, and the
`architecture-front.md` contract), then feature integration.

1. **Documentation.** _[Revised by the amendment "Customer step layout".]_ `architecture-front.md` §10.1.6: the drill panel context (Decision 6) beside
   `PanelStepContext`'s registrations, and the rule that a step containing a drill-down is its
   host. §2 and §10.1.3 trees: `notes-editor` under `front/app/shell/`. §11.6 if it describes
   notes editing.
2. **`ux/shell/panel/`.** _[Revised by the amendment "ACE review resolved", Decision 1.]_ `drill-contract.ts`: the panel context type. `drill-down.tsx`: each
   opened panel receives its context; registrations of the active panel route to the step context
   and are withdrawn on cover or close; `returnToParent` replaces the step's return threading.
   `CollectionPanel` passes the context to the panel it renders.
3. **`front/app/shell/notes-editor.tsx`** and its colocated stylesheet: Decisions 1–4, on
   `CollectionPanel` and the panel context.
4. **Sites step** (`customer-step-sites.tsx`). The local `NoteEditor` and its plumbing go; site
   notes use `NotesEditor`. The Site editor moves to the panel context. Remove helpers in
   `customer-state.ts` the move leaves unused.
5. **Customer Detail step.** _[Revised by the amendment "Customer step layout".]_ _[Extended by the amendment "ACE review resolved", Decision 2.]_ Account notes through `NotesEditor`; the step's root becomes a
   `DrillDown`. `CustomerAdapter.notes` joins `scopes.Customers.detail`; `customerDraft` projects
   `notes`.
6. **User Manager** (`user-step-detail.tsx`, `user-state.ts`). The notes text area becomes
   `NotesEditor`; the step's root becomes a `DrillDown`; `user-state.ts` holds `Note[]`.
7. **Tests.** _[Extended by the amendment "ACE review resolved", Decision 3.]_ Update fixtures and test literals affected by `user-state.ts`'s new shape. Where the
   editor's list operations are extracted as pure functions, test them.

**Out of scope:** _[Corrected by the amendment "ACE review resolved", Decision 2.]_ attachments (roadmap §5, `attachmentKinds` arrives then as an optional prop);
device media recording (roadmap §7); any `domain/` or schema change; Onboarding's note handling
beyond what the Sites step change carries; the Wizard's chrome.

## Checks

- `deno task check` (guards, types, lint) and `deno task fmt:check`.
- `deno task test`, with `users-api-test.ts`'s bootstrap failure reported as known.
- `STYLE_AUDIT` per `AGENTS.md` §2.2.

## Verification

_[Extended by the amendment "ACE review resolved", Decision 4.]_

- The AI Architect re-derives the report against the diff and the check output (EFFORT §6).
- The CA's walkthrough in Admin:
  - Sites step, notes at depth two: Save switches from Site to Note and back; Back from a dirty
    note asks first.
  - Customer Detail and User Manager, notes at depth one: add, edit, delete, Visibility toggle;
    the workbench's Save persists them.
  - A User with several notes keeps them all, each with its own `createdAt`.
  - Onboarding's Sites step behaves as before.

## Escalation boundaries

Stop and report if the panel context needs a change to `PanelStepContext` or to the sequence
controller; if any drill-down outside the three consumers changes behaviour; or if a consumer needs
a `NotesEditor` prop beyond the three.

## Amendment — 2026-10-08 — ACE review resolved

The AI Coding Engine reviewed the brief against the source on 2026-10-08. It confirmed the whole
Index-Detail pair, the three controlled props, the step-owned drill host, and the unchanged
`Note.createdAt`, and raised three issues. The AI Architect verified each in the source.

### Decisions

1. **Save and the dirty check have different lifetimes.** Decision 6 withdrew a panel's
   registrations when it was covered. That is right for Save and wrong for the dirty check:
   §10.1.6 has workbench exits check "the aggregate and all open nested drafts", and the current
   Site editor keeps its check registered beneath an open Note (`drillPath()[0] === 'Site'` stays
   true). Withdrawing it would let Cancel discard a changed Site without asking.
   - **Save** is held only by the active panel.
   - **The dirty check** is held by every open panel, active or covered, and counts in the
     workbench's discard protection until the panel closes. Local drill-back (Up) asks only about
     the active panel, per §10.1.6.
   - **Cover and close are distinct events.** A covered panel keeps its working copy and its dirty
     check. A closed panel releases its registrations and any pending draft. Drill-back from a
     dirty panel asks first; a successful Save updates the parent draft and returns without
     asking.

   This uses the existing `PanelStepContext.registerDirty` and `registerTrailingAction`; the
   escalation boundary on changing `PanelStepContext` stands.
2. **Onboarding gains account notes.** `OnboardingWizard` composes the same `customerSteps(state)`
   and `customerDraft` as Customer Manager, by design (§10.1.6: `customers/` supplies the Customer
   steps and nothing about their host). Account notes in Customer Detail therefore reach Onboarding
   and its create. Excluding them would require the step to know its host, so the inherited
   behavior is in scope. The `notes: []` create default is removed once `notes` is a declared field
   of `scopes.Customers.detail`. The out-of-scope line on Onboarding is withdrawn.
3. **Customer contract tests change.** `customer-api-test.ts`'s "detail scope preserves excluded
   account fields" asserts that `notes` is excluded. It becomes: account notes are created,
   replaced, and cleared through the detail scope, while `accountManagerId` stays excluded.
4. **The walkthrough adds:**
   - change a Site, open an existing Note without changing it, then Cancel the workbench: the
     workbench asks before discarding;
   - Onboarding: account notes added during intake persist at Finish;
   - a User with several notes keeps each note's visibility, `createdAt`, and attachments.

## Amendment — 2026-10-08 — Customer step layout

Decided by the CA after the ACE review, while placing account notes.

### Decisions

1. **The form's designer places `NotesEditor`.** It works at any depth and in any position: a
   step of its own, a step's form, or a drill-down item's panel. The only requirement is Decision
   5: the step containing it hosts the drill-down. No placement rule enters `architecture-front.md`.
2. **Placements.**
   - **Customer account notes:** in the Customer Detail step, below Name and Status.
   - **User notes:** in the User Detail step, where the text area is now.
   - **Site notes:** in the Site panel, below the location, as now.
3. **The billing address becomes its own step.** The Customer steps become **Detail, Contact,
   Billing, Sites**:
   - **Detail:** Name, Status, and account notes. It hosts the drill-down; opening a note replaces
     a short panel. In Customer Manager, account notes are on the first panel.
   - **Contact:** unchanged.
   - **Billing:** the billing address fieldset and its validation, moved out of Detail into a new
     `customer-step-billing.tsx`. A billing step has room for billing concerns to come (billing
     contact, terms, tax identifiers), which the address alone does not.
   - **Sites:** unchanged except for `NotesEditor`.

   Onboarding inherits the four steps. `customerDraft`, `scopes.Customers.detail`, and the
   persisted Customer are unchanged by the split: it moves fields between steps, not between
   abstractions.
4. **`architecture-front.md` §10.1.6 drift.** Its `customers/` bullet lists the steps as "contact,
   detail, and sites"; the code has run Detail, Contact, Sites since the CA reordered them. The
   bullet is updated to the four steps.
5. **The walkthrough adds:** the four-step order in Onboarding (progress and step tree) and Customer
   Manager; the billing address validates and saves from its own step.

## Amendment — 2026-10-08 — Draft copies

Added by the CA during AI Architect verification of the production, which found `cloneNote`
defined three times (`notes-editor.tsx`, `customer-state.ts`, `user-state.ts`), identically and
privately.

### Finding

Drafts are kept from sharing structure with their source by hand-written, type-specific copies:
`cloneNote` three times and `cloneCustomerSite`. Each copies exactly as deep as its author knew the
type to nest. They are correct today. When a domain type gains a nested level, its copy keeps
compiling and silently starts sharing that level, and the failure presents as unrelated defects:
Cancel does not revert; the dirty check compares against a baseline that changed with the draft and
reports unchanged, so no discard prompt; unsaved edits surface in the TanStack Query cache, the
aside list, and a reopened Item until a refetch discards them.

### Decisions

1. **A draft never shares structure with its source,** coming in or going out. Compositions have no
   identity (domain-model §3.3.1), so a draft holds copies of their values. The rule enters
   `architecture-front.md` §9.6 State Management.
2. **One copy for every type: `copyDraft<T>(value: T): T`,** implemented as
   `structuredClone(unwrap(value))`.
   - `structuredClone` is the platform's deep copy; domain data is plain values (`When` is a
     string), so it copies exactly, at any depth, with no knowledge of the type.
   - A Solid store is a Proxy, which `structuredClone` rejects; Solid's `unwrap` returns the plain
     object behind it and returns a plain value unchanged. One helper therefore covers copying into
     a draft and out of a store.
3. _[Superseded by the amendment "Draft module": a JSX-free `workbench-draft.ts`.]_ **It lives in `ux/shell/workbench/workbench-context.tsx`,** whose header owns draft services,
   in its PUBLIC block. Not `core/`: drafts are a UI concern and the useful form needs Solid, which
   `core/` must not import. Not `ux/ui/components/ui-helpers.ts`: that file is control semantics
   and text conversion. Not its own file: a single function in a file not expected to grow.

### Production scope additions

8. **`architecture-front.md` §9.6:** the rule and its helper.
9. _[Superseded by the amendment "Draft module": a JSX-free `workbench-draft.ts`.]_ **`workbench-context.tsx`:** `copyDraft`, with the header's PUBLIC entry.
10. **Replace** `cloneNote` (three definitions) and `cloneCustomerSite` with `copyDraft`, and
    remove them.
11. **Audit** every draft seeded from domain or query data in `front/` and every copy out of a
    store; report each site and whether it uses `copyDraft`.
12. **Test** that a `copyDraft` result shares no nested object with its source, from plain data and
    from a store, if `solid-js/store` runs in the test runtime; otherwise report it.

**Escalate** if a draft needs a copy that `structuredClone` cannot make (a function, class
instance, or non-plain value in draft data).

## Amendment — 2026-10-08 — Draft module

Recorded under EFFORT §8: the AI Coding Engine stopped at a scope boundary during production, and
the CA decided the crossing.

**What happened.** With `copyDraft` in `workbench-context.tsx`, `customer-state.ts` and
`user-state.ts` imported a module that also holds `WorkbenchDiscard`, a JSX component. Deno cannot
execute that JSX, so the new state isolation tests failed at import (three failures). The engine
proposed moving `WorkbenchDiscard` to its own file and updating its callers. The AI Architect traced
the cause to the placement in Decision 3, which put a pure helper in a module holding a component
without checking for one.

### Decisions

1. **`copyDraft` moves to `ux/shell/workbench/workbench-draft.ts`,** a JSX-free module for draft
   services, with its own header and PUBLIC block. Its importers (`customer-state.ts`,
   `user-state.ts`, `notes-editor.tsx`, `customer-step-sites.tsx`, and the test) import it from
   there. `workbench-context.tsx` returns to its prior contents; `WorkbenchDiscard` stays where it
   is.
2. **A dedicated file is warranted because it will grow.** The draft fingerprint, "has the draft
   changed?", is written four times as a `JSON.stringify` comparison (`abstraction-manager.tsx`,
   `customer-steps.tsx`, the Sites step's `draftFingerprint`, `notes-editor.tsx`). It is the
   module's natural second service. Consolidating it is not part of this production.
3. **`customer-state.ts` imports `UiText` directly** from `@ux/ui/components/ui-helpers.ts`. The
   `@ux/ui` barrel loads every control, and with it JSX; the direct path is CONVENTIONS §3.2's
   preferred form. This is needed for the new Customer state test whatever `copyDraft`'s location.
4. **§9.6 also states: state modules must not import JSX modules,** so draft state stays testable
   without a browser. _[Ratified by the amendment "State module rule".]_

**Not taken:** the engine's split of `WorkbenchDiscard` with a rename of `workbench-context.tsx` to
`.ts` (seven importers). It separates a component from services, a real improvement, but this
problem does not require it.

## Amendment — 2026-10-08 — State module rule

Recorded under EFFORT §8.

- **The rule was introduced without a CA decision.** The AI Architect wrote "state modules must not
  import JSX modules" into the "Draft module" amendment as Decision 4, when the CA had agreed only
  to moving `copyDraft`. The AI Coding Engine then extended `source/devops/guards/guard-front-state.ts`
  to enforce it, citing AGENTS §3.3, outside the approved files and without asking.
- **The CA ratified both on the merits.** Many more state and store modules are coming, and they
  should be testable without a browser.
- **The guard.** It follows the runtime imports of every `*-state.ts` and `*-store.ts` under
  `source/front/` and `source/ux/`, transitively and through the `@ux/ui` barrel, ignores type-only
  imports, and fails when a path reaches a `.tsx` file. Verified by the AI Architect with scratch
  fixtures, since removed: a value import of `UiText` from `@ux/ui` fails; a type-only import from
  `@ux/ui` and an import of `copyDraft` pass.

## Design history

- **Contents.** A single-note editor, with each consumer building its own list, was weighed against
  the whole pair. The drill plumbing is where the duplication and risk live, so the pair won.
- **State.** The CA asked how a component handles state that comes from different owners. The
  answer, a controlled component, follows `CollectionPanel` and §10.1.6's rule that steps never
  commit.
- **Props.** A first draft carried `owner` (for the delete message) and `defaultVisibility`. The
  CA made the message general and visibility the user's choice, with Internal as the safe start.
- **Drill host.** The editor hosting its own `DrillDown` was simpler to drop in but would replace
  only the notes fieldset, against §10.1.6, and nest drill-downs inside Sites. The step hosts it.
- **Placement.** The AI Architect proposed account notes as a last step, then a rule ("a record's
  collections are steps; an item's collections live in its panel") that would also have made User
  notes a step. The CA rejected the rule: Sites is its own step because it is logically one, not
  because it is a collection, and the form's designer places notes where they make sense. The CA's
  first instinct, notes above the address, led to the question of which belonged on its own panel;
  the address did, as Billing.
- **`Note.createdAt`.** The CA had called the name ambiguous during the instantiable adapter brief
  (`effort/completed/2026-10-06-instantiable-adapt-brief.md`) and was torn; declined here.

_End of Brief_
