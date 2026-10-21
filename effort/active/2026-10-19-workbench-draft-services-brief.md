# Workbench Draft Services — Brief

**Active.** Recorded 2026-10-19 from a CA + AI Architect session as an enabler of M-5
Mechanical Productions: the reference implementations are about to be copied into new managers, so
each fix lands once here instead of in every copy. Absorbs backlog entries B-11 "Draft fingerprints
are written four times" and B-12 "`workbench-context.tsx` mixes draft services with a component".
The AI Coding Engine reviewed it on 2026-10-21; the amendment "ACE review resolved" records the
outcome. The first round was produced on 2026-10-21; the amendment "Wizard owns its aggregate
draft" adds a second round, which awaits AI Coding Engine review and the production gate.

## What triggered it

One defect in the workbench's draft services, inherited by every manager built from the Users
and Customers reference implementations, and one piece of tidying beside it:

1. **"Has the draft changed?" is written four times,** each as a `JSON.stringify` comparison, two
   against a string baseline and two against a copied one. A copied manager adds a fifth; a change
   to the rule must find every copy.
2. **The draft services module carries a component.** `workbench-context.tsx` holds
   `createWorkbenchContext` and `WorkbenchDiscard`, a JSX dialog. A state module that imported it
   loaded JSX, which broke the state tests during the Notes Editor production; that was worked
   around by creating `workbench-draft.ts`, and no state module imports the context today. The
   split is tidying, not an enabler: M-5 copies `front/` managers, not `ux/shell`.

## What the repository holds

- **The four dirty checks:**
  - `ux/shell/workbench/abstraction-manager.tsx`: `baseline = JSON.stringify(detail.draft())`,
    then `isDirty: () => JSON.stringify(detail.draft()) !== baseline || workbench.isDirty()`.
  - `front/app-admin/customers/customer-steps.tsx`: `baseline` and `changed` over
    `customerDraft(state)`.
  - `front/app-admin/customers/customer-step-sites.tsx`: a local `draftFingerprint` helper.
  - `front/app/shell/notes-editor.tsx`: `JSON.stringify(draft) !== JSON.stringify(original)`.
- **`ux/shell/workbench/workbench-draft.ts`:** "JSX-free services for isolated workbench draft
  values", created as the draft services' home on the expectation that it would grow
  (`effort/completed/2026-10-08-notes-editor-brief.md`, amendment "Draft module"). It holds one
  service, `copyDraft`.
- **`ux/shell/workbench/workbench-context.tsx`:** PUBLIC lists `createWorkbenchContext` and
  `WorkbenchDiscard`. Its importers today are `abstraction-manager.tsx` and `wizard.tsx`, the only
  two users of `WorkbenchDiscard`.
- **`JSON.stringify` is key-order sensitive:** two drafts with the same values in a different key
  order compare as changed.

## Decisions

1. _[Sites amended by "Wizard owns its aggregate draft": `customer-steps.tsx` gives its check to
   `Wizard`.]_ **One draft comparison, `isDraftChanged(draft, baseline)`, in `workbench-draft.ts`**
   beside `copyDraft`, used by all four sites. The baseline is a `copyDraft` snapshot, as the
   header's SEMANTICS already states; `abstraction-manager.tsx` and `customer-steps.tsx` change
   their string baselines to copied ones. The sites keep their own baselines and lifetimes; only the
   comparison is shared.
2. _[Rationale narrowed by the amendment "ACE review resolved"; the decision stands.]_ **Key
   order keeps `JSON.stringify`'s behavior.** Key order changes only when a key is removed
   and re-added, and the cost is an unneeded discard prompt, never a lost edit. With one
   comparison, changing this later is one edit; the test states the behavior.
3. **`WorkbenchDiscard` moves to `ux/shell/workbench/workbench-discard.tsx`,** named for its
   export; `workbench-context.tsx` becomes `workbench-context.ts`, holding only
   `createWorkbenchContext`. `abstraction-manager.tsx` and `wizard.tsx` import the dialog from its
   new file.
4. **Documentation lands in the headers.** `architecture-front.md` points to the
   `workbench-draft.ts` header and needs no change; CONVENTIONS is unchanged.

## Production scope

Operating mode: **Foundation** (`ux/shell`, strict scrutiny).

| Where                                               | Change                                                |
| --------------------------------------------------- | ----------------------------------------------------- |
| `ux/shell/workbench/workbench-draft.ts`             | Adds `isDraftChanged`; header PUBLIC and SEMANTICS.   |
| `ux/shell/workbench/workbench-context.tsx`          | Renamed `.ts`; `WorkbenchDiscard` moves out; header.  |
| `ux/shell/workbench/workbench-discard.tsx` (new)    | `WorkbenchDiscard`, unchanged in behavior; header.    |
| `ux/shell/workbench/abstraction-manager.tsx`        | Copied baseline, `isDraftChanged`, the dialog's file. |
| `ux/shell/workbench/wizard.tsx`                     | Imports the dialog from its new file.                 |
| `front/app-admin/customers/customer-steps.tsx`      | Copied baseline, `isDraftChanged`.                    |
| `front/app-admin/customers/customer-step-sites.tsx` | `isDraftChanged`; `draftFingerprint` removed.         |
| `front/app/shell/notes-editor.tsx`                  | `isDraftChanged`.                                     |
| `tests/cases/workbench-draft-test.ts`               | Tests `isDraftChanged`, key order included.           |

**Out of scope:** what each editor treats as its draft, and when baselines are taken.

## Checks

_[Test exclusion and acceptance cases amended by "ACE review resolved".]_ `deno task check`,
`deno task fmt:check`, `deno task test` (the two tests awaiting stage test authorization
excepted); `STYLE_AUDIT`. The CA verifies the discard prompt in User Manager, Customer Manager,
Onboarding, the Sites step, and the notes editor: untouched drafts close without a prompt; changed
drafts prompt.

## Amendment — 2026-10-21 — ACE review resolved

The AI Coding Engine reviewed the brief against the source on 2026-10-21. It confirmed the four
comparison sites, the two importers of `workbench-context.tsx`, and the file scope, and raised
four points. The AI Architect verified each in the source.

1. **The test exclusion is a command.** `deno task test` runs every `source/tests/**/*-test.ts`,
   so "excepted" excluded nothing. The two tests are `users-api-test.ts` and
   `session-coordinator-test.ts`, blocked by
   [Stage Test Authorization — Brief](2026-10-13-stage-test-authorization-brief.md). Tests run as:

   ```bash
   deno test --allow-env --allow-net --allow-read --ignore=source/tests/cases/users-api-test.ts,source/tests/cases/session-coordinator-test.ts "source/tests/**/*-test.ts"
   ```

2. **The `isDraftChanged` test covers:** an unchanged copy; a nested object or array edit;
   reverting to the baseline; a Solid store input; key order; and absent versus `undefined`
   properties, which `JSON.stringify` treats alike.
3. **The CA's walkthrough adds** one case for each changed site:
   - change a draft, revert it, then close: no prompt (`isDraftChanged`);
   - cancel a discard prompt: the draft stays open (`workbench-discard.tsx`);
   - an unsaved Note during an enclosing Cancel: the workbench asks (`notes-editor.tsx`);
   - edits kept across Back/Next (`customer-steps.tsx`).
4. **Decision 2's rationale is narrowed.** Key order also changes when a builder assembles the
   same keys in a different order, not only when a key is removed and re-added;
   `customerDraft(state)` rebuilds its draft on every call. The cost is the same unneeded prompt,
   so the decision stands.

## Amendment — 2026-10-21 — Wizard owns its aggregate draft

CA + AI Architect review of the first round found the aggregate draft check owned by the host in
`AbstractionManager` and by the steps in `Wizard`. The Customer Manager brief settled ownership
(decision 3: "The workbench owns the aggregate draft and commits it once"); `WizardContract`
carries no draft, so `customer-steps.tsx` registers an aggregate check (`retainCheck`) to cover
Onboarding, and Customer Manager checks its aggregate twice. A manager or wizard copied in M-5
should receive discard protection by supplying its draft, not by each step remembering to register
one.

1. **`WizardContract` gains `draft: () => Draft`,** with a `Draft` type parameter matching
   `AbstractionManagerContract`.
2. **`Wizard` checks its aggregate:** a `copyDraft` baseline when it mounts, and
   `isDraftChanged(contract.draft(), baseline) || workbench.isDirty()`.
3. **`OnboardingWizard` supplies `draft: () => customerDraft(state)`.**
4. **`customer-steps.tsx` drops `retainCheck` and its baseline.** Steps register only drafts they
   own locally: the Site and Note editors.
5. **Headers** of the changed files follow. CONVENTIONS §17.1 already states the step rule and is
   unchanged; §17.3 names the contract's members and gains `draft`.

Out of scope: `AbstractionManager`, the drill-down relay, and nested editors. The walkthrough adds
Onboarding: edit an earlier step, go Next, then Cancel; the wizard asks first.

_End of Brief_
