# Notes Editor — Brief

**Active, not yet dispatched.** Chosen 2026-10-08 as roadmap §4's second step and written the same
day from a CA + AI Architect exploration session. It awaits AI Coding Engine review and the
production gate. Its predecessor step, tags → facets, closed 2026-10-08
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
6. **The drill host tells each opened panel whether it is active.** When `DrillDown` opens a panel,
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

1. **Documentation.** `architecture-front.md` §10.1.6: the drill panel context (Decision 6) beside
   `PanelStepContext`'s registrations, and the rule that a step containing a drill-down is its
   host. §2 and §10.1.3 trees: `notes-editor` under `front/app/shell/`. §11.6 if it describes
   notes editing.
2. **`ux/shell/panel/`.** `drill-contract.ts`: the panel context type. `drill-down.tsx`: each
   opened panel receives its context; registrations of the active panel route to the step context
   and are withdrawn on cover or close; `returnToParent` replaces the step's return threading.
   `CollectionPanel` passes the context to the panel it renders.
3. **`front/app/shell/notes-editor.tsx`** and its colocated stylesheet: Decisions 1–4, on
   `CollectionPanel` and the panel context.
4. **Sites step** (`customer-step-sites.tsx`). The local `NoteEditor` and its plumbing go; site
   notes use `NotesEditor`. The Site editor moves to the panel context. Remove helpers in
   `customer-state.ts` the move leaves unused.
5. **Customer Detail step.** Account notes through `NotesEditor`; the step's root becomes a
   `DrillDown`. `CustomerAdapter.notes` joins `scopes.Customers.detail`; `customerDraft` projects
   `notes`.
6. **User Manager** (`user-step-detail.tsx`, `user-state.ts`). The notes text area becomes
   `NotesEditor`; the step's root becomes a `DrillDown`; `user-state.ts` holds `Note[]`.
7. **Tests.** Update fixtures and test literals affected by `user-state.ts`'s new shape. Where the
   editor's list operations are extracted as pure functions, test them.

**Out of scope:** attachments (roadmap §5, `attachmentKinds` arrives then as an optional prop);
device media recording (roadmap §7); any `domain/` or schema change; Onboarding's note handling
beyond what the Sites step change carries; the Wizard's chrome.

## Checks

- `deno task check` (guards, types, lint) and `deno task fmt:check`.
- `deno task test`, with `users-api-test.ts`'s bootstrap failure reported as known.
- `STYLE_AUDIT` per `AGENTS.md` §2.2.

## Verification

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
- **`Note.createdAt`.** The CA had called the name ambiguous during the instantiable adapter brief
  (`effort/completed/2026-10-06-instantiable-adapt-brief.md`) and was torn; declined here.

_End of Brief_
