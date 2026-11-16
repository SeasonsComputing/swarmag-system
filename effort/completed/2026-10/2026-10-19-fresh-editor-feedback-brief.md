# Fresh Editor Feedback — Brief

**Closed 2026-10-21.** A list action now clears editor feedback, so a fresh New editor no longer
keeps a stale "Created …" banner. Recorded 2026-10-19 from a CA + AI Architect session as an
enabler of M-5 Mechanical Productions, from backlog entry B-13 "A list action leaves a stale
banner on a fresh New editor". Narrowed on 2026-10-21 to the defect the code identifies; one
amendment, "ACE review resolved", follows the design. The premature field error it once carried
was traced at closure to window blur and judged proper behavior.

## What triggered it

Found by the CA on 2026-10-18 in User Manager, during stage acceptance of the soft-deleted
references production, and not caused by it. After creating a User, the editor reopened as a
blank New User showing "Created Frances V. Kremer." Deleting that User from the list left the
banner in place, still announcing the creation of a User who no longer existed.

## What the repository holds

In `ux/shell/workbench/abstraction-manager.tsx`:

- **After a create,** `saveEditor` calls `openFreshNew(false)`, which keeps the feedback, then sets
  the "Created …" banner. The fresh New editor has no selected item.
- **After a list action** (delete, eject), `runAction` reopens the editor only when the acted-on
  item is the one open: `if (selected()?.id === item.id) openFreshNew(true)`. A fresh New editor
  is not that item, so its banner from the create survives.
- **Nothing else clears it:** opening an item or New clears feedback (`openEditor`), but no list
  action does, and the banner does not dismiss itself.

The stale banner did not reproduce in the CA's run on 2026-10-21; the path above is identified in
the code, and the AI Coding Engine confirms it before production.

## Proposal

**Feedback announces the outcome of the most recent action; the next action clears it.** The
"Created …" banner on the fresh New editor stays, since it reports the action that opened it. Any
list action clears editor feedback, and reopens the editor only when the acted-on item is the one
open. A list action's outcome gets no banner of its own: the list shows the result.

## Production scope

Operating mode: **Repair** within `ux/shell/workbench`, open for M-5's enablers (strict scrutiny).
The AI Coding Engine first confirms in the code that a list action on an item other than the open
one leaves the banner in place; if it does not, the brief is withdrawn. Escalate if the fix reaches
beyond `abstraction-manager.tsx`.

## Checks

_[Acceptance cases amended by "ACE review resolved".]_ `deno task check`, `deno task fmt:check`,
and the tests with the two awaiting
[Stage Test Authorization — Brief](2026-10-13-stage-test-authorization-brief.md) excluded:

```bash
deno test --allow-env --allow-net --allow-read --ignore=source/tests/cases/users-api-test.ts,source/tests/cases/session-coordinator-test.ts "source/tests/**/*-test.ts"
```

`STYLE_AUDIT`. The CA verifies in User Manager and Customer Manager: after a create, the fresh New
editor shows the success banner; deleting a different item clears it.

## Amendment — 2026-10-21 — ACE review resolved

The AI Coding Engine traced the create and list-action paths in two passes, and the AI Architect
verified the trace in the source.

1. **The path is confirmed.** After a create, `openFreshNew(false)` leaves `selected()` `null`,
   so `runAction`'s `selected()?.id === item.id` is false for every list action. List-action
   clicks stop propagation, so they never reach `openEditor`. Of every writer of editor feedback
   (initialization, `openEditor`, `openFreshNew`, `saveEditor`, step Back and Next, and the
   workbench context's setter, which no step calls), none runs during a list action on another
   item. `PanelForm` renders feedback and never dismisses it.
2. **Feedback clears at the start of `runAction`,** before the handler runs. A cancelled
   confirmation never reaches `runAction`, so it keeps the banner; a confirmed action clears it,
   and a failure shows in the confirmation dialog through `actionError`. The conditional reopening
   is unchanged.
3. **The CA's walkthrough adds:**
   - cancelling a confirmation keeps the banner;
   - acting on another item leaves the open draft in place, without reopening it;
   - acting on the open item still opens a fresh New editor;
   - User Eject follows the same rule as Delete.

## Design history

- **2026-10-21, feedback rule restated.** The draft had any change of subject clear feedback about
  a previous one, which would also clear the "Created …" banner its own checks expect. The rule is
  now the most recent action's outcome, cleared by the next action. A banner for list actions was
  settled as none.
- _[Settled at closure: window blur, judged proper behavior.]_ **2026-10-21, premature field
  error withdrawn.** The draft also carried a second defect: the
  fresh New editor drew Name as an error before anything was typed, seen by the CA on 2026-10-18
  after a create and after a delete. Only Name was marked, so the per-field blur path had fired.
  - The draft's suspected cause, the success banner taking focus, was ruled out by the code: the
    error also followed a delete, where no banner exists, and nothing focuses the banner after a
    create. The leading candidate became the focus steal `focusFirstField`
    (`use-abstraction-form-keyboard.ts`) records, when the panel-collapse transition hides the
    outgoing panel and the dialog reclaims focus.
  - The CA gathered focus telemetry on 2026-10-21: after a create, Name gained focus once and kept
    it, with no blur before typing. A delete and a narrow window were also clean, and no focus or
    validation code had changed since 10-18.
  - The CA withdrew the defect rather than fix what could not be confirmed; it returns only with
    new evidence, as a new backlog entry carrying its reproduction steps.
  - Decided before withdrawal, for a future fix: no field is marked invalid before the user has
    interacted with it, or before a save attempt. Interaction means touched, not edited: the user
    clicked or keyed in the field, so tabbing through an empty required field still marks it, as
    the validation timing contract does today; focus moved by the workbench itself is not
    interaction. The fix would live in `use-abstraction-form-validation.ts`.

## Closure (2026-10-21)

Production by the AI Coding Engine in Repair mode: `runAction` in `abstraction-manager.tsx` clears
editor feedback before the handler runs, and its doc comment says so; the header is unchanged. The
AI Architect verified the one-line diff and re-ran the checks: guards, types, lint, formatting,
and 105 tests with the two blocked tests excluded. The CA ran the walkthrough in User Manager and
Customer Manager and closed the brief.

Settled at closure:

- **The premature field error is not a defect.** During the walkthrough the CA saw Name drawn red
  when focus left the browser window: switching away blurs the focused field, and blur validation
  marks an empty required field. The CA judged that proper behavior. The touched-not-edited
  decision in Design history is not taken.
- **A failed action with no confirmation surfaces nowhere:** `requestAction` runs it as
  `void runAction(...)`. No list action lacks a confirmation today; dropped.

B-13 is removed from the backlog.

_End of Brief_
