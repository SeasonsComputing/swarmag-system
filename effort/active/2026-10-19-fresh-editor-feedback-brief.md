# Fresh Editor Feedback — Brief

**Active, draft.** Recorded 2026-10-19 from a CA + AI Architect session as an enabler of roadmap
§5 Mechanical Productions: both defects live in `AbstractionManager`, which every new manager
uses. Absorbs the backlog entry B-13 "A fresh New editor shows stale feedback and a premature field
error". Awaits CA review, AI Coding Engine review, and the production gate.

## What triggered it

Found by the CA on 2026-10-18 in User Manager, during stage acceptance of the soft-deleted
references production; neither defect is caused by it.

1. **Stale feedback.** After creating a User, the editor reopened as a blank New User showing
   "Created Frances V. Kremer." Deleting that User from the list left the banner in place, still
   announcing the creation of a User who no longer existed.
2. **A premature field error.** The fresh New editor drew its first field, Name, as an error
   before anything was typed. The other empty required fields were not marked. The CA saw it after
   a create and after a delete.

## What the repository holds

All in `ux/shell/workbench/abstraction-manager.tsx` and
`ux/shell/workbench/use-abstraction-form-validation.ts`:

- **After a create,** `saveEditor` calls `openFreshNew(false)`, which keeps the feedback, then sets
  the "Created …" banner. The fresh editor focuses its first field.
- **After a list action** (delete, eject), `runAction` reopens the editor only when the acted-on
  item is the one open: `if (selected()?.id === item.id) openFreshNew(true)`. A fresh New editor
  is not that item, so its banner from the create survives.
- **Validation timing:** `validateForm` marks every invalid field; `blurField` marks one field
  when it loses focus. Only Name was marked, so the per-field blur path fired: Name was focused,
  then lost focus, before the user typed. The likely cause, not confirmed in the browser, is the
  success banner mounting after `openFreshNew` and taking focus.

## Proposal

1. **Feedback describes the editor's current subject.** Any change of subject, by a create, a list
   action, or opening another item, clears feedback about a previous one. After a delete, the
   editor shows nothing about the deleted item unless it was the one open.
2. **No field is marked invalid before the user has interacted with it,** or before a save
   attempt. Focus moved by the workbench itself (initial focus, banner focus) is not a user blur.

## Open

1. **Confirm the blur cause** in the browser before choosing the fix: whether the banner takes
   focus, or something else does.
2. **Whether a list action's outcome gets its own banner** ("Deleted Frances V. Kremer.") or the
   editor simply clears, given the list already shows the result.

## Production scope

Operating mode: **Repair** within `ux/shell/workbench` (strict scrutiny): investigate Open 1 first
and report the cause, scope, files, and checks to the CA before changing anything. Escalate if
the fix reaches beyond `abstraction-manager.tsx` and `use-abstraction-form-validation.ts`.

## Checks

`deno task check`, `deno task fmt:check`, `deno task test` (the two tests awaiting stage test
authorization excepted); `STYLE_AUDIT`. The CA verifies in User Manager and Customer Manager:
after a create, the fresh New editor shows the success banner and no field error; deleting any
User clears a banner about another; a save attempt on an empty draft still marks every required
field.

_End of Brief_
