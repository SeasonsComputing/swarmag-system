# User Manager UX Rework — Confirmations, Feedback, and Shared Primitives

**Date:** 2026-07-16
**Mode:** Feature (with one Repair-mode backend fix, see §3)
**Status:** Complete, `deno task check` green, uncommitted at time of writing (CA's call on when to commit)
**Related:** `documentation/project/2026-07-12-edge-functions-remediation-design.md` (D12 — the CORS fix that unblocked User Manager entirely, closed same week); `documentation/project/project-feature-parking-lot.md` (eject semantics, deferred here)

---

## 1. Context

This picks up after the edge-functions CORS fix (D12) made User Manager's create/update/delete/eject actually work end-to-end for the first time. With the plumbing proven, this pass (started by ACE, continued jointly) focused on the UX itself: consequential-action confirmation, in-editor feedback, and generalizing what was built so Customer Onboarding's editors don't have to re-derive it.

## 2. What Changed

### Confirmation dialogs for consequential actions

`AbstractionAction<T>` gained an optional `confirmation: { title: string; message: (item: T) => string }`. `AbstractionManager` now shows a real confirmation dialog (`UiDialog`) before running an action that declares one, with its own pending/error state independent of the editor. `user-manager.tsx` wires this for Delete and Eject — both previously fired immediately on click with no confirmation at all.

### Editor feedback banner replaces local per-field error state

`AbstractionManagerContract` gained `editorFeedback?: () => AbstractionManagerFeedback | null`. Entity editors report `{ message, variant }` up through this instead of managing their own local `error` signal + `<Show>`/`<UiAlert>` block — one consistent feedback surface, driven by the shell, not re-implemented per entity.

### Native validation → feedback bridge (`useAbstractionFormFeedback`)

Two bugs found and fixed while wiring this up, worth knowing before touching it again:

1. **`onInvalid` on the `<form>` element never fires.** The native `invalid` event does not bubble — it fires on the individual invalid control, not the form. A capture-phase listener (`addEventListener('invalid', handler, true)`) is required to observe it from the form element at all.
2. **The native validation bubble ("Please fill out this field") is browser-rendered chrome that ignores the dialog's own bounds** — it visibly escaped the card/dialog boundary since it isn't part of the page's DOM/CSS layout at all. Fix: call `event.preventDefault()` inside the capture-phase handler, which suppresses only the bubble (the browser still auto-focuses the invalid field) while the panel's own feedback banner carries the message instead.

An earlier attempt used `noValidate` on the form and reimplemented validation manually — this was a regression (lost native per-field focus/targeting) and was reverted in favor of the capture-phase-listener approach above.

Extracted to `source/ux/common/shell/use-abstraction-form-feedback.ts` (`useAbstractionFormFeedback(formRef, onFeedback)`) so any future entity editor wires this in one line instead of re-deriving it.

### Backend fix: `update()` was diffing the wrong thing

Separate from the UX work, a real bug surfaced through it: editing _any_ field (notes, phone — not email) on a user with no Auth identity (e.g. a previously-ejected user) failed with "Failed to update auth user" on every save. Root cause: `user-orchestra.ts`'s `update()` treated "`primaryEmail` present in the payload" as "the caller wants to change the email," and the client always sends the full record (by design — this system does not do columnar/diffed updates from the client side). So every save attempted an Auth email sync to the _same_ email the user already had, which Supabase's Auth API — or, for an ejected user, the simple fact that no Auth identity exists at all — rejected.

**Fix, at the correct layer:** `update()` now compares the fetched previous email against the post-update value and only attempts `updateAuthEmail` when they actually differ (`previousEmail !== user.primaryEmail`), rather than inferring intent from payload presence. The client's "always send the full record" behavior is unchanged and correct; the backend now does its own diffing instead of relying on the client to shape the payload. Deployed to `user-update` in stage.

### Generalization pass

- `useAbstractionFormFeedback` and a new `useAbstractionMutation(queryKey, mutationFn)` (`source/ux/common/shell/use-abstraction-mutation.ts`) — wraps `createMutation` + `queryClient.invalidateQueries` into one call, replacing four near-identical `createMutation({ ..., onSuccess: () => invalidateQueries(...) })` blocks in `user-manager.tsx`.
- `USER_ROLE_LABELS` changed from `StringDictionary` to `Record<UserRole, string>` — now exhaustiveness-checked; a future role added to `USER_ROLES` without a label fails the build instead of rendering blank.
- `PendingAction<T>['action']` now uses the already-exported `AbstractionAction<T>` directly instead of an indexed-access type (`AbstractionManagerContract<T>['actions'][number]`).
- Removed: a pass-through `reportEditorFeedback` wrapper, two one-line `deleteUser`/`ejectUser` async wrappers (inlined into the actions array), and a hand-written `invalidateUsers` helper (superseded by `useAbstractionMutation`).

## 3. Known Remaining Gaps (not fixed, not forgotten)

- **`requestAction`'s no-confirmation branch in `abstraction-manager.tsx` still fire-and-forgets** (`void runAction(action, item)`) with no error handling. Doesn't affect Delete/Eject today (both declare `confirmation`), but the next action added _without_ one will fail silently. Fix whenever that next action is added — route it through the same error-surfacing path confirmed actions use.
- **Eject's actual mechanism (full Auth-identity deletion) makes reactivation impossible**, and the editor currently lets you flip a user's `status` back to `active` with no indication that it won't restore access. Reframing eject as a ban (`auth.admin.updateUserById(id, { ban_duration })`, identity-preserving) instead of a delete is the fix, but it reopens D4/D5 and deserves its own scoped conversation — see `project-feature-parking-lot.md`.

## 4. For Customer Onboarding

Both `useAbstractionFormFeedback` and `useAbstractionMutation` are ready to use as-is for any new `AbstractionManager` consumer — no need to re-derive either. See `2026-07-14-customer-onboarding-design.md`, updated to reference them.

_End of Document_
