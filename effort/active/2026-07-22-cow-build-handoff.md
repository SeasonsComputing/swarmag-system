# COW Build — Session Handoff

**Date:** 2026-07-22
**Status:** Group B (COW) BUILT, wired, and launching. The CA does NOT accept
the general stage layout — **layout rework is the open thread and the next
session opens there.** C (Notes-lite) and D (verification) remain.
**Ledger:** `effort/active/2026-07-20-wizard-onboarding-tasks.md`
**Design:** `effort/active/2026-07-20-wizard-onboarding-design.md`

## Worktree

Uncommitted (CA commits at will):

- `source/front/app-admin/onboarding/` — new: `onboarding.tsx` + `onboarding.css`
- `source/front/app-admin/app.tsx` — `/onboarding` dialog route (workbench)
- `source/front/app-admin/dashboard-admin.json` — launch entry (CA-authored)
- `source/front/ux/shell/wizard.tsx` + `wizard.css` — progress-rail chrome
- `effort/active/2026-07-20-wizard-onboarding-tasks.md` — ledger

Last commit: `a6f9fdb` (icon catalog work, committed during this session).

## What shipped

**Icon catalog generalization (committed).** Completed the interrupted ACE work.
The ActionWidget config layer was already general; the `UiActionButton` glyph
binding was not — it was 18 hand-written per-icon CSS rules. Now `icons.css`
maps `[data-ui-icon='name'] { --sa-icon: url(...) }`; the custom property
inherits into the icon span and its `::before`, where two generic
`mask: var(--sa-icon)` rules consume it. `guard:css` learned the file
(`auditIconCatalogCSS`: selectors must root at `[data-ui-icon`, only `--sa-icon`
declared). The catalog carries the full 333-glyph library (14 brand
`*-logo.svg` excluded as non-product marks). Bundle cost is neutralized by a
Vite `assetsInlineLimit` predicate emitting `/icons/` SVGs as hashed files
instead of inlining them — verified build: 0 inlined, CSS 15.5 KB gzipped.
Documented in `ux-design-language.md` (§2.2, §2.3, §3.1),
`architecture-devops.md` §7.7, and the component guides.

**B0 closed.** `api.Customers` is composed INLINE in `api.ts` — deliberately no
`make-customers.ts` maker (CA ruling: a maker is specialization à la
`makeAuthUsers`; a passthrough alias is ceremony). `customers` RLS verified live
before first write. Status-filtered/ordered `list` is DEFERRED and parked: it is
a core-layer `ListOptions`/`ApiCrudContract` evolution the CA intends to design
directly.

**Wizard chrome (CA locus-of-attention principle).** The step indicator is now
ONE contiguous progress rail directly under the dialog title — track
`--sa-bg-progress-track`, fill `--sa-gradient-brand`, host-driven inline-size
`(stepIndex + 0.5) / stageCount`, animated with `--sa-transition-base`. Numbered
`(N) Title` labels sit beneath it, distributed under the rail; the current stage
renders in `--sa-color-accent`. The pip circles and the "Step X of N" caption
are retired.

**Group B (COW).** `onboarding.tsx` is the composition root: all state lives in
closures, it builds a `WizardContract` and renders the `Wizard` host. Stages are
contact (gate-and-carry, no commit) → customer (commit) → sites (commit). Built
by a haiku delegate against a frozen spec, then AA-reviewed.

## AA review catches — read before trusting the stage commits

1. **Duplicate customer (serious).** The wizard host runs `commit` on EVERY
   Next, so stage 2 → Back → Next fired a second `Customers.create` and minted a
   duplicate prospect. Stage 2 is now **create-or-update**, and `sites()` is
   threaded through the payload so a re-commit cannot wipe sites already added.
2. `Number.isNaN(undefined)` is `false` — empty coordinate fields were writing
   `latitude: undefined` keys onto the Location. Now properly guarded.
3. `acreage` used truthiness, silently dropping a legitimate `0`. Now
   `Number.isFinite`.
4. Site coordinate display used `&&`, so a latitude of `0` (the equator) would
   not render. Now `!== undefined`.

## Resume agenda

1. **Layout rework on the COW stages** — the open thread. Grounding questions:
   stage density, fieldset grouping, the billing-address block, and the sites
   repeat-capture stage (busiest by far, the prime suspect); plus overall dialog
   proportions. A screenshot from the CA's authenticated Chrome is the fastest
   way in.
2. **C — Notes-lite:** `ux/shell/notes.tsx` over `CompositionMany<Note>`;
   migrate the User Manager notes textarea and the COW site notes onto it.
3. **D — Verification & close:** full checks; live E2E on stage creating a real
   prospect with ≥2 sites (one address-only, one with coordinates); verify
   `primary_contact` in Supabase and that no auth identity was minted; story 1.1
   enrichment (D16); close the ledger with commit hashes.

## Deferred — recorded so it is not lost

`accountManagerId` capture (no user picker; commits `undefined`); per-field
inline error text (the gate is the disabled Next plus `required` markers);
geolocation-denied feedback (currently silent); post-Finish success confirmation
— the create-only / no-readback gap, resolved by the prospect hub (D15).
Fast-follow: the single-select chevron still uses a hardcoded mask and can adopt
the icon catalog pattern.

## Standing session protocol (unchanged)

Independent CA go per production; delegates are haiku and git-read-only; CA dev
server on :5173 — the agent browser reaches only the OTP login and cannot
authenticate, so **live passes are the CA's authenticated Chrome**; budget-lean
delegation per CA directive; Claude never commits.
