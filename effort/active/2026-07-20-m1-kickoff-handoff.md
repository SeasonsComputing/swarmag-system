# M1 Kickoff — Session Handoff (24h budget pause)

**Date:** 2026-07-19 (evening)
**Status:** M1 fully designed and planned; ZERO production code written.
Paused at CA budget limit; resume ~Monday 5pm+.

## Worktree

Uncommitted (CA commits at will — all documentation, no source):
`2026-07-19-wizard-onboarding-design.md` (D1–D16 + §6 audit),
`2026-07-19-wizard-onboarding-tasks.md` (M1 ledger, groups A0/A/B0/B/C/D),
`user-stories.md` (1.1 pipeline enrichment, 1.2 stub, renumbering 1–6,
§6 User Management marked complete), `project-feature-parking-lot.md`
(Lead abstraction entry), this file. Last commit: `6ad111c` (ACE devops,
deployed + AA-verified on stage).

## Session decisions (all in the design doc — read it first on resume)

D14 Lead parking-lotted (CA executive; manual 3-inbox genesis for now).
D15 COW direct-genesis entry; prospect hub + assessment flow next
milestone (hub seeds story 1.2 widget). Story reshape: wizard = story 1.1
ONLY, ends at `'prospect'`; assessment (story 2.1: services, scope,
scheduling) is the follow-on flow → `UiDatetime`/`isDate`/`isTime`
re-deferred with it. D13 Location relaxation (coords OR address) is the
one domain change. B0 discovered: `@front/api` has NO Customers surface —
must be composed (maker pattern) before COW.

## Resume agenda

1. CA ratifies D1–D13 + D16 (D14/D15 already ruled)
2. Go for **A0** (Location relaxation — smallest, own commit)
3. Then A (wizard framework) → B0 (Customers API + live RLS check) →
   B (COW) → C (Notes-lite) → D (live E2E: real prospect with ≥2 sites
   on stage via CA browser)

## Standing session protocol (unchanged)

Independent CA go per production; delegates are haiku + git-read-only
(see memory `delegates-no-git-writes`); CA dev server on :5173; CA Chrome
authenticated for live passes (foregrounded for motion); budget-lean
delegation per CA directive.
