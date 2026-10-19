# Workbench Direct Load — Brief

**Active.** Recorded 2026-10-19 from a CA + AI Architect session, during app acceptance of
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

_End of Brief_
