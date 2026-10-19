# Workbench Direct Load — Brief

**Completed 2026-10-19.** Fixed in `1bc7550` and verified by the CA in the app (see Resolution).
Recorded 2026-10-19 from a CA + AI Architect session, during app acceptance of
`effort/completed/2026-10-08-account-manager-brief.md`. Repair: the failure authorizes
investigation; the cause, repair scope, and checks come back to the CA before any change.

## What triggered it

Loading a workbench route directly, by typing its URL or reloading it, lands on `/` instead of
opening the workbench. Opening the same route from the header works.

## Reproduction

1. Sign in to Admin (`app-stage-local admin`, `http://localhost:5173`).
2. Load `/users`, `/customers`, or `/onboarding` directly, or reload while one is open.
3. The dashboard shows at `/`; no dialog opens. The console shows nothing.

Every workbench route is affected; `/about` was not tried.

## What the repository holds

- **The only navigation to `/` in the shell** is an overlay route's `close()` in
  `ux/shell/runtime/shell-compiler.tsx` (`ShellOverlayRoute`), called when its `UiDialog` reports
  `onOpenChange(false)`, or by the workbench's own cancel. So on a direct load the overlay closes
  itself after mounting, or something else routes to `/`.
- **Overlay routes render inside `AuthGuard`** with the dashboard (`makeDashboardShell`,
  `ux/shell/runtime/shell-makers.tsx`), behind the dashboard's `Outlet`.
- **`Routes.workbench`** declares `dismissible: false`; `UiDialog` blocks Escape and, since
  `f53da98`, every interact-outside dismissal when not dismissible.

## Ruled out (CA + AI Architect, 2026-10-19)

- **The readiness gate.** With `AuthGuard` temporarily restored to render on authentication alone
  (no `isPrepared()`), a direct load of `/users` still landed on `/`. The behavior predates the
  account manager production.
- **Focus-outside dismissal.** `UiDialog` now prevents Kobalte's `onInteractOutside` (pointer and
  focus) for non-dismissible dialogs (`f53da98`); a direct load still landed on `/`. The change
  stays on its own merits: `dismissible={false}` should block every outside interaction.

## Decision (CA, 2026-10-19)

A direct load or reload of a workbench route opens that workbench, as navigating to it does.

## Production scope

Operating mode: **Repair** (`ux/shell` under strict scrutiny). Investigate first and report the
failure, the cause, the repair scope, the affected files, and the checks to the CA before
changing anything. If the cause lies outside `ux/shell/runtime` or `ux/ui`, or the fix changes
routing or shell composition contracts, escalate.

## Checks

`deno task check`, `deno task fmt:check`, and `deno task test`; `STYLE_AUDIT`. The CA verifies in
the app: a direct load and a reload of `/users`, `/customers`, and `/onboarding` each open the
workbench; cancelling still returns to `/`; header navigation is unchanged.

## Resolution — 2026-10-19

Found and fixed by the AI Coding Engine; reviewed by the AI Architect.

- **Cause:** on a fresh load the session store starts with `userId: null`, so
  `SessionCoordinator` called `clear()` and then `setAuth()` for the persisted session. Between
  the two writes the store read "resolved, not authenticated" for one reactive tick; `AuthGuard`
  routed to `/login`, and Login, finding a valid session, went home to `/`. The original route
  was lost before its overlay could open. The transient predates the readiness gate, which is why
  both ruled-out experiments changed nothing.
- **Fix:** `front/app/shell/session-coordinator.ts` applies the identity-change `clear()` and
  `setAuth()` inside one Solid `batch`, so no observer sees the intermediate state. The diff is
  that wrapper and the `batch` import.
- **Verified by the CA:** direct load and reload of the workbench routes open the workbench.

_End of Brief_
