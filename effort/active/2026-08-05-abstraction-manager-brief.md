# Abstraction Manager — Ownership Correction Brief

**Date:** 2026-08-05
**Mode:** Foundation
**Author:** Chief Architect (decisions); AI Architect (capture, evidence, brief)
**Milestone:** M1 Customer Onboarding — foundation phase
**Consumers:** `app-admin/users` today; every future abstraction manager

Settled in conversation on 2026-08-05. This brief is the production instruction
derived from that conversation. It is Phase 1 of three; Phases 2 and 3 are
recorded at the end and are **not** in this scope.

## 1. Why this exists

`AbstractionManager` renders the manager chrome but does not own the manager's
lifecycle. Save, and what follows a Save, are decided inside the hosted form.

Evidence:

| Location                             | Defect                                                                                                                                            |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `abstraction-manager-contract.ts:50` | `renderForm(item, onClose)` hands lifecycle to the form                                                                                           |
| `user-manager.tsx:235`               | `props.onClose()` fires on **successful save**, from inside the form                                                                              |
| `user-manager.tsx:115`               | `onClose={user === null ? props.onCancel : onClose}` — post-save navigation chosen by a ternary in provider config                                |
| `abstraction-manager.tsx:85`         | `props.provider.cancel?.() ?? closeEditor()` — `cancel` returns `void`, so `closeEditor()` always fires; a provider can never own its cancel path |
| `use-abstraction-mutation.ts`        | list invalidation — a manager lifecycle step — runs from specialization-side mutations                                                            |
| `abstraction-manager-contract.ts:46` | `editorFeedback` is provider-owned, so save feedback cannot be governed centrally                                                                 |

The consequence is not one bug. `onClose` is **overloaded across two opposite
outcomes**: save-succeeded and user-abandoned arrive at the manager as the same
void call. The manager therefore cannot distinguish them, and can never select a
created record, confirm a save, or continue entry. Every future specialization
inherits that, and each one re-decides lifecycle for itself.

The chrome is already correct. `abstraction-manager.tsx:221` renders Save in the
panel header and submits the hosted form by id; New is `onNew` at `:79`; Cancel
is at `:126`. The correction is ownership, not layout.

**Scope is small only right now.** `renderForm` has exactly one consumer,
`user-manager.tsx`. That ends as soon as customers, assets, services or chemicals
get managers.

## 2. The ownership boundary

Three participants, not two.

**Host props own**

- workbench close/cancel behaviour, supplied to the manager as a required prop

**AbstractionManager owns**

- selected subject and editor mode
- the Save command and its create-vs-update branch
- pending and save-error state
- success feedback and the feedback-clearing policy
- the validation banner
- list refresh timing, through the provider's `refresh()`
- post-save editor state
- fresh-New / open-editor epoch semantics
- action-success lifecycle
- cancel/close dispatch to the **host**, never to the provider

**Provider owns**

- list projection, loading state, columns, cell rendering
- form field rendering
- create and update operations
- the `refresh()` implementation

**Editor instance owns**

- field signals, validation rings
- `validate()` and the draft projection, exposed through a per-instance handle

## 3. The editor handle

`validate()` and the draft are properties of the **mounted editor**, not of the
static provider object. The editor exposes them through a handle:

```ts
/** Per-instance surface a mounted editor exposes to its manager. */
export type AbstractionEditorHandle<Draft> = {
  validate: () => boolean
  draft: () => Draft
}
```

The provider still supplies `create(draft)` and `update(item, draft)`.

**Why a handle and not lifted state.** The editor is already remounted on every
open — `abstraction-manager.tsx:232` renders `<Show when={editorEpoch()} keyed>`.
Per-instance signals are destroyed and rebuilt each time, and _that remount is
the reset_. Lifting field state into the provider closure would defeat it and
require a hand-written reset, which is the eleven-signal `clearSite` shape this
project has already rejected elsewhere.

**Stale handle is the failure mode of this shape.** Registration is
per-instance. A handle surviving from a previous editor instance would validate
the old form and project the old draft — a silent save of stale data, worse than
the defect being fixed. Therefore:

- registration is tied to the editor instance's lifecycle
- the manager treats _no registered handle_ as **cannot save**, not as a no-op

## 4. Save policy

The manager classifies the operation by whether `selected` was null when Save
began. The specialization never decides.

```text
Create save success:
  use the created result to compose success feedback
  manager calls refresh()
  manager opens a fresh New editor
  manager shows create success feedback

Update save success:
  manager calls refresh()
  manager sets the selected subject to the returned persisted object
  manager re-seeds the editor from that object and remains on the record
  manager shows update success feedback
```

**No create rehydration into the editor.** The created result is evidence, not
the next editor subject.

**Re-seed means re-seed.** Remaining on the record must not mean leaving local
signals untouched. The persisted object carries trimming, normalisation, server
defaults and a new `updatedAt`; if the form is not re-seeded from it the user
never sees what was written and the next save projects from stale fields.

**Policy is expressed as editor state, never as navigation.** The manager is two
panels in one container: at wide widths the list is already on screen, at
collapsed widths it is a mode switch, so "return to list" means different things
by viewport. _Fresh New_ and _remain on record_ mean the same thing everywhere.

**Update re-seed must not steal focus.** `abstraction-manager.tsx:66-69` runs
`focusFirstField` on every epoch bump. Re-seeding update through a plain epoch
bump would throw focus to the first field after every save — correct for
create→New, wrong for update→remain, where the user was working somewhere
specific. Either the open-kind is distinguished in that effect, or re-seed uses a
different mechanism. Mechanism is the implementer's call; the requirement is not.

## 5. Feedback policy

Feedback splits by source:

| Source                                | Owner                                          |
| ------------------------------------- | ---------------------------------------------- |
| field-level invalid state and rings   | editor instance                                |
| validation-failure banner             | manager — it invoked Save and received `false` |
| save success and save error           | manager                                        |
| action confirmation and action errors | manager (already)                              |

`use-abstraction-form-feedback.ts` survives as native `invalid` capture plumbing —
the capture-phase listener is real and non-obvious. Only its destination changes:
it no longer writes through a provider-owned feedback signal. The manager raises
`FORM_FEEDBACK_MESSAGE`.

**Clearing policy — subject-aware.**

```text
Clear save feedback when:
  - a new save attempt begins
  - the user explicitly selects another record
  - the user explicitly clicks New
  - the user cancels or closes the manager
```

Create-success feedback **survives typing** in the fresh New form: it describes
the record just created, which is not the subject on screen, so typing does not
falsify it. Without it, a successful create leaves a blank form and no evidence
anything happened — and at collapsed widths the list is not visible either.

The symmetric update rule — _clear when the subject is an updated record and the
form becomes dirty_ — is **deferred to Phase 3**. No dirty concept exists
anywhere in `source/front` today (verified 2026-08-05: zero occurrences of
dirty/pristine/baseline). The four rules above require none and are complete on
their own.

## 6. Production scope

### 6.1 `ux/shell/abstraction-manager-contract.ts`

- `renderForm` loses its `onClose` parameter
- delete `cancel?: () => void`
- remove `editorFeedback` from the provider
- add `refresh()`, `create(draft)`, `update(item, draft)`
- add `AbstractionEditorHandle<Draft>` and the registration member the editor
  uses to expose it

### 6.2 `ux/shell/abstraction-manager.tsx`

- accept a required host `onCancel` / `onClose` prop
- own Save: `validate → create | update → refresh() → transition → feedback`
- implement the §4 transitions and the §5 feedback and clearing policy
- raise the validation banner on `validate() === false`
- remove the `?? closeEditor()` fall-through with `cancel`; dispatch cancel to the
  host prop
- promote action-success lifecycle out of `runAction`'s inline
  `if (selected()?.id === item.id) clearSelection()` at `:88` into stated manager
  policy — delete/eject of the record under edit transitions to fresh New
- treat a missing editor handle as cannot-save

### 6.3 `app-admin/users/user-manager.tsx`

- `UserEditor` loses `onClose` and its own `createUser` / `updateUser` calls; it
  keeps field signals, validation rings, and draft projection, and registers its
  handle
- the host `onCancel` moves off the `renderForm` ternary at `:115` and onto the
  manager — note it **already exists** on `UserManager`, one level too high
- provider gains `create`, `update` and `refresh`
- `use-abstraction-mutation.ts` no longer performs invalidation as a lifecycle
  step; refresh timing is the manager's. Change its role or remove it — do not
  leave it silently performing a manager job

### 6.4 Preserve

`abstraction-manager.tsx:60-64` — the `editorEpoch` mechanism. Its comment
records an already-fixed bug: opening the editor is an event, not a state,
because New-then-New leaves `selected` null both times and stale errors and focus
survive into what reads as a fresh form. **This correction adds a third caller
into `openEditor(null)`** — create-save success — so the mechanism matters more
after the change, not less. Do not drop it in the rewrite.

## 7. Out of scope

`WizardContract` and the wizard; onboarding stages; the embedded list editor;
notes; the `ux` / `app` layer refactor; `ux/screens`; list traversal members
(sort, direction, page index, page size, search) — the manager gains a home for
them, not an implementation; the dirty/pristine primitive.

**Escalate and stop** if the correction forces `WizardContract` to change. That
is a second shared contract and a separate authorization.

## 8. Checks

```bash
deno task fmt && deno task check
```

`check` chains `check:guards` (all thirteen guards), `check:types` and
`check:lint`. `fmt:check` is the non-mutating alternative to `fmt`.

`STYLE-GUIDE.md` is a hard gate — violations are correctness failures, not
preferences.

**No automated UI coverage exists for the reference implementation.** Final
behavioural verification is the Chief Architect's authenticated browser, not a
delegate's. A delegate reports checks green and behaviour unverified.

**Delegates are read-only on git.** No commits, no branches, no reverts.

## 9. Phases 2 and 3 — not this scope

**Phase 2 — embedded list editor, then Job sites rehost.** Blocked on a design
decision: what _initial_, _new_, _delete_, _post-new_ and _post-delete_ actually
do. Design is in `effort/active/2026-08-04-composition-editor-design.md`, with
the chrome-only reframing added 2026-08-05.

**Phase 3 — the dirty/pristine primitive.** Designed once, against two settled
consumers — the manager's fifth clearing rule and the list editor — rather than
twice against two shapes still in motion.

_End of Brief_
