# Shell/App Split — Approved Foundation Scope

**CLOSED 2026-09-21.** Shipped, reviewed, and independently verified — all guards, type check,
and lint green; live-tested on Netlify stage by CA. Landed one structural step beyond this
brief's own text: after approval, CA worked directly with ACE to promote `ux/` from `front/ux/`
to a top-level `source/ux/` namespace with its own `@ux/` import alias, and to cluster
`ux/shell/`'s flat file list into `runtime/`/`dashboard/`/`panel/`/`workbench/` sub-namespaces.
Not a departure from this brief's design — its logical conclusion: `ux/` is now structurally,
not just conventionally, independent of `front/`.

Approved by the Chief Architect in the 2026-09-17 session after exploration of the original brief.
This scope supersedes the earlier proposed identity callback and AuthenticatedUser design.

## Objective

Keep `ux/` portable, bind swarmAg behavior and branding in `front/app/`, and compose both
in each application root. Preserve route behavior, visual presentation, and auth publication timing.

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

## Session and Configuration

- Add an app-owned SessionCoordinator implementation in `front/app/shell/session-coordinator.ts` and a UX-owned `init(): void` contract.
- Require `session` on ShellApplication; bootstrap invokes it synchronously during mount.
- Coordinator owns auth subscription/cleanup, hydration, eligibility, and a private prepared-user-ID
  sentinel. Discard the loaded User after validation. Reset the sentinel on logout/identity change.
- Remove SessionState.user/setUser; preserve isDataReady independently of the sentinel.
- UX consumes core Config; application roots initialize package UX configuration first.
- Bootstrap consumes AppState directly. API store re-exports remain valid.
- Configuration-property ownership and broader session lifecycle changes are parked.

## Presentation

- Move about-box, brand-hero, login and CSS to app/shell.
- Move brand-widget and CSS to app/widgets, and job-views.ts to app/views.
- Move three logos to flat app/assets; copy the style-guide logo locally into app-style-guide.
- Add app shell-maker wrappers binding Login, About, logout auth, and a footer component.
- Generic makers accept existing route component contracts; no routing behavior changes.
- Dashboard accepts a footer component and retains placement/layout.
- Retain generic helpers, ConfigTable, PanelProbe, and shell metadata in UX; fix cross-tier imports.
- Split widget catalogs, preserving widgetRegistry names; roots merge registries explicitly.
- Update all three roots and the Ops projection consumer. No placeholder files.

## Guard and Sequencing

The unsupported API namespace restriction was corrected separately. Preserve that correction;
no additional guard expansion. Login's existing violation is accepted until it moves.
Documentation leads implementation; require a green namespace guard after the integrated change.
Registry-versus-instance reasoning is not promoted into new architectural doctrine.

## Verification

Format changed files; run deno task check; build all apps and style guide. Verify login,
dashboard/widgets/footer, About, logout/session restoration, subscription cleanup, and sentinel reset.
Report file inventory, remaining failures, and STYLE_AUDIT. Authenticated browser verification may
require a real OTP session; do not claim unperformed checks.

## Boundaries

No domain/schema, backend auth, RLS, deployment, visual redesign, root governance, unrelated repairs,
configuration-property generalization, or broader guard changes. Escalate scope changes.
