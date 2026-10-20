# Workbench Draft Services — Brief

**Active, draft.** Recorded 2026-10-19 from a CA + AI Architect session as an enabler of roadmap
§5 Mechanical Productions: the reference implementations are about to be copied into new
managers, so each fix lands once here instead of in every copy. Absorbs the backlog entries "Draft
fingerprints are written four times" and B-12 "`workbench-context.tsx` mixes draft services with a
component". Awaits CA review, AI Coding Engine review, and the production gate.

## What triggered it

Two defects in the workbench's draft services, both inherited by every manager built from the
Users and Customers reference implementations:

1. **"Has the draft changed?" is written four times,** each as a `JSON.stringify` comparison. A
   copied manager adds a fifth; a change to the rule must find every copy.
2. **The draft services module carries a component.** `workbench-context.tsx` holds
   `createWorkbenchContext` and `WorkbenchDiscard`, a JSX dialog. A plain state module that
   imports the context loads JSX, which broke the state tests during the Notes Editor production.

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

## Proposal

1. **One draft comparison in `workbench-draft.ts`,** beside `copyDraft`, used by all four sites;
   the sites keep their own baselines and lifetimes, and only the comparison is shared.
2. **`WorkbenchDiscard` moves to its own `.tsx` file in `ux/shell/workbench/`;**
   `workbench-context.tsx` becomes `workbench-context.ts`, holding only `createWorkbenchContext`.
   `abstraction-manager.tsx` and `wizard.tsx` import the dialog from its new file.

## Open

1. **Key order.** Whether the shared comparison ignores key order (a stable serialization) or
   keeps `JSON.stringify`'s behavior. Drafts are built by the same code each time, so key order is
   stable today; ignoring it costs a little and guards copied code that builds drafts differently.
2. **Names** for the comparison and for the dialog's file.

## Production scope

Operating mode: **Foundation** (`ux/shell`, strict scrutiny), once Open is settled.

| Where                                               | Change                                                  |
| --------------------------------------------------- | ------------------------------------------------------- |
| `ux/shell/workbench/workbench-draft.ts`             | Add the shared comparison; header PUBLIC updated.       |
| `ux/shell/workbench/workbench-context.tsx`          | Renamed `.ts`; `WorkbenchDiscard` moves out.            |
| `ux/shell/workbench/` (new file)                    | `WorkbenchDiscard`, unchanged in behavior.              |
| `ux/shell/workbench/abstraction-manager.tsx`        | Uses the shared comparison and the dialog's new file.   |
| `ux/shell/workbench/wizard.tsx`                     | Imports the dialog from its new file.                   |
| `front/app-admin/customers/customer-steps.tsx`      | Uses the shared comparison.                             |
| `front/app-admin/customers/customer-step-sites.tsx` | Uses the shared comparison; `draftFingerprint` removed. |
| `front/app/shell/notes-editor.tsx`                  | Uses the shared comparison.                             |
| `architecture-front.md`                             | Where it describes the workbench's draft services.      |

**Out of scope:** what each editor treats as its draft, and when baselines are taken.

## Checks

`deno task check`, `deno task fmt:check`, `deno task test` (the two tests awaiting stage test
authorization excepted); `STYLE_AUDIT`. A test of the shared comparison, including key order as
decided. The CA verifies the discard prompt in User Manager, Customer Manager, Onboarding, the
Sites step, and the notes editor: untouched drafts close without a prompt; changed drafts prompt.

_End of Brief_
