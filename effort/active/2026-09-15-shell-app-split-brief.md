# Shell/App Split — Backlog Brief

**Backlog, not dispatched.** Captured at the close of a roadmap-review session that walked
`front/ux/shell/`'s actual 45-file inventory against the app/ux split rather than working from
the original backlog entry's "candidates, unconfirmed" guess. Every file below is classified
from its own PURPOSE comment and, where that was misleading, from tracing an actual IoC
composition root (`app-admin/app.tsx`) rather than inferred from a name alone — CA correction
mid-session: "don't let a comment override the architectural intent here."

## The governing principle: registry vs. instance

Found mid-session, resolving a real inconsistency in the plan (why widgets compose one way and
shell makers wanted to compose another) rather than invented up front:

**A registry is required when the referenced type is variant — resolved against a key decided
somewhere else.** The dashboard's JSON config picks widget types by string; `widgetRegistry()`
doesn't know or care which ones until that lookup happens at runtime. **A fixed instance is
just bound once, at composition time, because there is no selection happening at all** — a
given app's Login page is not chosen from a set, it's the only answer that was ever going to be
there.

Test to apply to any future case that looks like this shape (Job Runner's local clients,
Workflow Builder's eventual catalog, anything else that splits into a generic/specialized
pair): is the specialized piece selected by an external key at some other layer's discretion
(→ registry, composed explicitly at the call site, because which one wins isn't fixed), or is
it just "the swarmAg one," full stop (→ wrapper/injection, bound once)?

**Amended:** raised as a candidate for a named principle in `architecture-front.md` §5, then
deliberately walked back — CA wasn't convinced an IoC pattern this new, derived from one case,
earns formal doctrine yet. `§10.3` keeps the concrete rationale (a registry exists because the
widget type is variant) without generalizing it into a named rule. The reasoning above stays in
this brief as the trail that produced the file-level triage below — it doesn't need to also live
in the architecture doc to have done its job here.

## The governing model: `ux/` as a third-party library

Found while verifying the split was actually complete, not just file-shaped — CA's framing:
"think about `ux/` as if it were a 3rd party library." A real third-party library never imports
back into the application that consumes it; it depends on itself, on truly generic foundations
(`@core/`, `@domain/` only where the domain concept is genuinely universal), and on nothing else.
Applied literally, this is a stricter, more general version of the split's own premise — not
"ux can't import `@front/app-*`," but **ux can't import out of ux at all**, `@front/*`-wise.

**`guard-namespaces.ts` Rule 2 generalized to enforce this (done, not just planned)** — see the
diff already made to `source/devops/guards/guard-namespaces.ts`: it now checks that a `ux/` file's
`@front/*` imports resolve to `ux` itself (previously it only checked for `@front/app-*`, missing
the new `@front/app/` tier entirely — the gap that prompted this). Running it today against
un-migrated code surfaces three real violations, not hypothetical ones:

- `ux/shell/login.tsx → @front/api/api.ts` — **spurious**, self-resolves once `login.tsx` moves
  to `app/shell/` per this brief; not a real fix target.
- `ux/shell/bootstrap.tsx → @front/api/api.ts`, `ux/shell/logout.ts → @front/api/api.ts` — real,
  persisting (`bootstrap.tsx`/`logout.ts` both stay in `ux/shell/`). Resolved below.
- `ux/stores/session-state.ts → @domain/abstractions/user.ts` — real, persisting, **resolved**
  — item 8 below.

Also found, not a guard violation but the same root cause: `bootstrap.tsx`'s calls to
`api.SessionState`/`api.AppState` are routing through `api.ts` for no reason — `api.ts` just
re-exports `SessionState`/`AppState` straight from `@front/ux/stores/` with no transformation.
Importing them directly is both simpler and correctly not a violation at all.

## The three-tier structure

- **`front/ux/`** — fully generic Seasons Computing UX toolkit. Every application built on it
  gets `session-state`/`app-state`/`dashboard-state` as baseline capability (CA: "additional
  capabilities for whomever is my next customer"). Portable outside swarmAg entirely.
- **`front/app/`** — swarmAg-suite-wide specialization. Shared across `app-admin`/`app-ops`/
  `app-customer` but not generic — branding, swarmAg's own data projections, the suite's widget
  catalog. "swarmAg has a wide backend and widgets are essentially views into the backend" — the
  add-widget UX is a closed, predefined list by deliberate decision, not an open plugin surface.
- **`app-admin/`, `app-ops/`, `app-customer/`** — per-application composition roots. Pre-existing,
  unaffected by this split; each already has its own `app.tsx` combining tier 1 + tier 2 into one
  running application, e.g. `makeDashboardShell(dashboardSeed, widgetRegistry(), [Routes.workbench(...)])`.

## File-level triage

**Moves to `front/app/shell/`:** `about-box.tsx`/`.css`, `brand-hero.tsx`/`.css`,
`login.tsx`/`.css` — all three are swarmAg-branded presentation, confirmed by their own PURPOSE
comments. Lands in `app/shell/`, not `app/components/` — CA correction: `app/components/` is a
placeholder for swarmAg-specific reusable UI _controls_ (the app-tier counterpart to
`ux/ui/components/`), nothing built there yet. `app/shell/` mirrors `ux/shell/`'s own shape —
branded chrome and composition wiring together, not a generic/specific split within the shell
concept itself.

**Moves to `front/app/views/`:** `job-views.ts` — `JobManifest`/`JobHub` are swarmAg domain
projections (`Job`, `JobAssessment`, `JobPlan`), not generic view machinery.

**Moves to `front/app/widgets/`:** `brand-widget.tsx`/`.css` (swarmAg-branded, same reasoning as
`brand-hero`). Plus a **new** `front/app/widgets/widget-registry.ts` — see below.

**New `front/app/shell/shell-makers.tsx`:** thin wrapper alongside `about-box.tsx`/`brand-hero.tsx`/
`login.tsx` in the same directory, pre-binds `Login`/`AboutBox` (relative imports, same folder)
and re-exports `makeAnonymousShell`/`makeDashboardShell` already wired for swarmAg. Every `app-{name}/app.tsx` imports the app-tier maker, not the generic one — same
name (`makeAnonymousShell`, `makeDashboardShell`), same shape, IoC by aliasing not renaming (CA:
"same shape, same name, imported and joined").

**Stays in `front/ux/shell/`, unchanged:** every `*-contract.ts` file, `abstraction-manager.*`,
`collection-panel.*`, `drill-down.*`, `panel-container.*`, `panel-form.*`, `panel-header*.*`,
`panel-list.*`, `panel-stepflow.*`, `wizard.*`, the three `use-abstraction-form-*` hooks,
`shell-navigate.tsx`/`use-shell-navigate.ts`, `shell-compiler.tsx`, `shell-metadata.ts`,
`bootstrap.tsx`, `auth-guard.tsx`, `dashboard.tsx`/`dashboard-contract.ts`, `logout.ts`. Also
`config-table.tsx` and `panel-probe.tsx` — CA explicit call: current narrow usage (login/about
only; one vertical slice deep) isn't evidence of narrow scope this early, and `panel-probe`'s
diagnostic value returns once UX work gets more sophisticated again. Neither moves nor deletes.

**Stays in `front/ux/stores/`, unchanged:** `session-state.ts`, `app-state.ts`,
`dashboard-state.ts` — all three, confirmed baseline toolkit capability, not swarmAg-specific.

**Stays in `front/ux/widgets/`, trimmed:** `helm-widget.tsx`/`.css` (CA: already parameterized,
app-neutral by design) plus `widget-registry.ts`, trimmed to export only `HelmWidget` —
**same exported name (`widgetRegistry`) as the new app-tier file**, disambiguated by import
alias at each call site, not by giving the two functions different names.

## Required code changes beyond file moves

1. **`ux/shell/shell-makers.tsx` (generic tier) must stop importing `AboutBox`/`Login` directly.**
   Today it hardcodes both (`Routes.page('/login', Login)` in `makeAnonymousShell`,
   `Routes.dialog('/about', AboutBox, ...)` in `makeDashboardShell`) — a real coupling this split
   would otherwise leave in place even after the files move. Both become parameters:
   ```ts
   export const makeAnonymousShell = (Login: UiComponent): Shell => ({ ... })
   export const makeDashboardShell = (
     seed: DashboardStateSeed,
     widgets: WidgetRegistry,
     AboutBox: UiComponent,
     routes: ShellRoute[]
   ): Shell => { ... }
   ```
2. **New `app/shell/shell-makers.tsx`** calls the above with swarmAg's `Login`/`AboutBox`
   pre-bound, re-exporting both names unchanged.
3. **`app/widgets/widget-registry.ts` (new)** — `export const widgetRegistry = (): WidgetRegistry => ({ BrandWidget })`, same shape as the trimmed `ux/widgets/widget-registry.ts`.
4. **Each `app-{name}/app.tsx`:**
   - Shell makers import moves from `@front/ux/shell/shell-makers.tsx` to
     `@front/app/shell/shell-makers.tsx` — no `Login`/`AboutBox` threading needed at this call
     site, the app-tier wrapper already did it.
   - Widget registry import becomes two aliased imports, merged by object spread (not array
     spread — `WidgetRegistry = Dictionary<WidgetComponent>`, confirmed in `widget-contract.ts`):
     ```ts
     import { widgetRegistry as uxWidgetRegistry } from '@front/ux/widgets/widget-registry.ts'
     import { widgetRegistry as appWidgetRegistry } from '@front/app/widgets/widget-registry.ts'
     ...
     makeDashboardShell(dashboardSeed, { ...uxWidgetRegistry(), ...appWidgetRegistry() }, [...])
     ```
5. **`app-ops/stores/jobs-store.ts`** — `@front/ux/views/job-views.ts` → `@front/app/views/job-views.ts`, the one other confirmed external consumer of a moved file.
6. **Internal relative imports survive unchanged** — `login.tsx` imports `./brand-hero.tsx`,
   `about-box.tsx` imports `./brand-hero.tsx`; all three land in `app/shell/` together, so
   the relative paths still resolve.
7. **`bootstrap.tsx`/`logout.ts` stop importing `api.ts`.** Three different fixes for three
   different reasons, not one blanket change:
   - `api.SessionState`/`api.AppState` → import `SessionState`/`AppState` directly from
     `@front/ux/stores/session-state.ts`/`app-state.ts`. Pure indirection removal, no design
     question — `api.ts` re-exports them unchanged.
   - `api.Auth.{getSession,onAuthStateChange,logout}` → inject `auth: ApiAuthContract`
     (`@core/api/api-auth-contract.ts` — already the portable, transport-agnostic contract type;
     `AuthSupabaseClient`, its concrete implementation, is `@core/cli/`). Both `bootstrap()` and
     `logout()` take it as a parameter; `app/shell/`'s wrapper (or each `app.tsx`) supplies
     `api.Auth`. Same shape as the `Login`/`AboutBox` fix in item 1 — a fixed instance, no
     variance, bound once.
   - `api.Users.get(session.userId)` inside `bootstrap.tsx`'s `applySession` — this is real
     swarmAg business logic (the ejection rule: force sign-out when `user.status !== 'active'`)
     living inside what's supposed to be generic lifecycle code. Not an object-injection case —
     it's a decision point the app needs to inject as a callback:
     ```ts
     export async function bootstrap(
       application: ShellApplication,
       auth: ApiAuthContract,
       resolveIdentity: (session: Session) => Promise<AuthenticatedUser | null>
     ): Promise<void> { ... }
     ```
     `resolveIdentity` returning `null` signals "force sign-out"; `app/shell/` (or `app.tsx`)
     supplies the closure that calls `api.Users.get`, checks `status`, and **maps** the loaded
     `User` down to an `AuthenticatedUser` (or returns `null`). The object-vs-callback split
     isn't arbitrary here: `ApiAuthContract` is fixed with no variance (object injection fits);
     this is an app-specific decision inside a generic lifecycle hook (callback fits) — both
     mechanisms were needed, not a choice between them.
8. **`ux/stores/session-state.ts` stops importing `@domain/abstractions/user.ts` — resolved.**
   CA's design, stated directly: "if I designed it from scratch I would have a shell
   `AuthenticatedUser` object and require the app to handle the mapping" — which is exactly what
   item 7's `resolveIdentity` callback already does; it just needed a real return type instead of
   `unknown`. Checked every current read of `SessionState.store.user` (one, in `bootstrap.tsx`,
   a plain existence check — no field is read anywhere) — nothing today needs more than:
   ```ts
   /** Minimal shell-owned identity shape — the app maps its own User down to this. */
   export type AuthenticatedUser = { id: Id }
   ```
   Defined in `session-state.ts` itself (its only consumer today). `SessionStore.user:
   AuthenticatedUser | null`, `SessionStateContract.setUser(user: AuthenticatedUser)`. No
   factory, no generic type parameter, no context/prop threading for `auth-guard.tsx` — the
   store stays a plain singleton, only its `user` field's type changes. Extend the shape later if
   a real generic (not swarmAg-specific) consumer needs a field from it; nothing does yet.

## Open items

- `front/app/stores/` and `front/app/components/` have no identified contents tonight — leave
  both empty rather than build a placeholder with nothing in it (the `make-validator.ts`/
  `tests/lib` mistake already on record elsewhere). `app/components/` is reserved for
  swarmAg-specific reusable UI _controls_ once any exist — not where `about-box`/`brand-hero`/
  `login` landed (those are `app/shell/`, branded chrome, not reusable controls).
- `front/ux/views/` becomes genuinely empty once `job-views.ts` moves out. Leave it as a
  placeholder directory (CA's own sketch names it as one) rather than remove it.
- `front/app/assets/` stays flat (logo files directly under it, no `logos/` subfolder) — one
  asset kind today doesn't earn a subdirectory. `source/front/app/logos/` already exists,
  empty, from earlier scaffolding — rename to `assets/` when logo files actually land there;
  zero consumers today, so zero risk either way.
- The registry-vs-instance reasoning did **not** get elevated to a named principle in
  `architecture-front.md` — CA call: not convinced an IoC pattern this new needs formal
  documentation as its own doctrine. `§10.3`'s widget-registry passage keeps the concrete
  rationale (registry because the widget type is variant) without generalizing it.

## Sequencing (CONSTITUTION §8 — documentation leads code)

1. Parameterize `ux/shell/shell-makers.tsx` (item 1), fix `bootstrap.tsx`/`logout.ts` (item 7),
   and add `AuthenticatedUser` to `session-state.ts` (item 8) together — do this before moving
   anything, so the generic tier never has a moment where it's broken by a half-finished move,
   and so `guard:namespaces` (already stricter — the fix is already made) is green before file
   moves start rather than red throughout them.
2. Move `about-box`, `brand-hero`, `login` to `app/shell/`; move `job-views.ts` to
   `app/views/`; move `brand-widget` to `app/widgets/`.
3. Create `app/shell/shell-makers.tsx` (item 2) and `app/widgets/widget-registry.ts` (item 3);
   trim `ux/widgets/widget-registry.ts` to `HelmWidget` only.
4. Update the three `app-{name}/app.tsx` composition roots and `app-ops/stores/jobs-store.ts`
   (items 4–5), threading `auth`/`resolveIdentity` (with its `User`→`AuthenticatedUser` mapping)
   through to the parameterized makers/bootstrap.
5. ~~Once ratified separately: add the registry-vs-instance principle to `architecture-front.md`.~~
   Not happening — see "The governing principle" above; the reasoning stays in this brief only.

## Checks

`deno task guard:namespaces` after step 1 — this is the one that would have silently missed
`bootstrap.tsx`/`logout.ts` before tonight's fix, so it's the actual proof step 1 landed, not
just `deno task check` passing in general. `deno task fmt`, `deno task check` after step 4.
Live verification after step 4 — this touches every app's composition root, so `deno task check`
passing is necessary but not sufficient: open each of `app-admin`/`app-ops`/`app-customer` and
confirm login, `/about`, and the dashboard (including at least one widget) still render, and that
signing out and back in still resolves session state correctly, before calling this closed.

_End of Backlog Brief_
