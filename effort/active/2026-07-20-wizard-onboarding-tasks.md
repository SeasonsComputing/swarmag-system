# M1 — Wizard + Customer Onboarding Task List (Phase 3)

**Date:** 2026-07-19
**Mode:** Foundation (A0/A/C) + Feature (B)
**Status:** IN PROGRESS — D1–D17 ratified 2026-07-20; A0, A1, A, B0 complete
(A1 schema live on stage; A = wizard framework, contract+host+chrome;
B0 = `api.Customers` inline, RLS-verified). **B built 2026-07-22 — wired and
launching, but its stage layout is NOT accepted; layout rework is the open
thread and the next session opens there.** C (Notes-lite) and D (verification)
pending. Per-group go orders remain the gate.
**Source design:** `effort/active/2026-07-20-wizard-onboarding-design.md`

Each group is a gated production: scope declared, go received, checks run,
results reported. Delegation per budget discipline (haiku, git read-only).

## Phase 0 — Decisions

- [x] D14 (Lead parking-lotted) — CA executive decision 2026-07-19
- [x] D15 (COW direct-genesis entry) — CA ratified 2026-07-19
- [x] D1–D13, D16 ratified by CA 2026-07-20
- [x] D17 (Contact re-alived as subordinate composition; FK dropped;
      amends D2/D3/D9/D12/D14) — CA ratified 2026-07-20
- [ ] Group-by-group production go orders

## Group A0 — Location Relaxation (Foundation, small) — COMPLETE 2026-07-20

- [x] `common.ts`: `Location.latitude`/`longitude` become optional
- [x] `isLocation`: valid with EITHER coordinate substance (lat+lon
      together) OR address substance (line1 + city minimum); a present
      coordinate must be numeric and paired (half/mistyped = invalid)
- [x] Ripple audit: every `Location` consumer (assessment locations,
      adapters, fixtures, tests) — verify none assume coordinates.
      Result clean: customer/job validators delegate to `isLocation`;
      `common-adapter` maps field names only; no front/back/schema reach
      (subordinate composition — JSONB, no columns)
- [x] Fixture (address-only South Forty site) + direct `isLocation` tests
      added (9 cases); checks + tests green (pre-existing users-api env
      failure unrelated, fails identically on clean HEAD)

## Group A — Wizard Framework (Foundation)

- [x] `front/ux/shell/wizard-contract.ts` — `WizardContract` (interface,
      meta-type/role) with `WizardStage`/`WizardFeedback` (type, data):
      ordered stage strategies (name, title, render, `canAdvance` gate,
      optional `commit` — gate-and-carry per D17's D2 relaxation); linear,
      no branching (D15). Typechecks clean. Ratified 2026-07-20 (drove the
      STYLE-GUIDE §2 meta-type-vs-data refinement; manager already conforms)
- [x] `front/ux/shell/wizard.tsx` — IoC host: stage indicator, Back /
      Next→Finish, feedback surface (local commit error over provider
      feedback), gate→commit→hold-on-throw advance, Back re-enters live.
      Host holds no domain state (consumers own via closures); no
      `@front/api`. Delegated (haiku) against frozen contract; AA review +
      cascade fix applied (see below)
- [x] `front/ux/shell/wizard.css` — chrome on rhythm tokens; grid rows
      title/indicator/body/footer; card-body scroll inset; stage mount
      fade + reduced-motion guard; ≤480 edge-to-edge full-screen (pairs
      with UiDialog full-screen). Two AA corrections:
      (1) cascade — `UiList` bare-html-guard substitution for `<ol>/<li>`
      dragged in `[data-ui-variant='numbered']` `list-style:decimal` +
      list-indent at (0,2,0); dropped the variant (→`<ul>`, my ordinals)
      and zeroed list-item spacing via a (0,2,0) compound selector.
      (2) motion — the mount fade was a local `@keyframes`, but its `from`/
      `to` steps fail `guard:css` for feature files (must root at
      `[data-feat`) once dprint expands them; the single-line form wasn't
      fmt-stable. Per CA: promoted the fade to base.css as the reusable
      `@keyframes sa-fade-in` (beside `sa-spinner-rotate`/`sa-skeleton-sweep`);
      `wizard.css` now only references `animation: sa-fade-in …` (guard-clean).
      Verified fmt-then-check green (dprint-stable)
- [x] Manager-aspect extraction — NOT done: `WizardFeedback` is
      structurally identical to `AbstractionManagerFeedback` but there is
      no proven second consumer until B (COW). Flagged candidate, not a
      speculative refactor of committed manager code (extraction discipline)
- [x] Ops-compatibility sanity (D7) — reviewed against §11.7: PASSES. The
      ops job-runner's turn-by-turn model is LINEAR, so its
      Workflow→Task→Question hierarchy flattens into `WizardStage[]`
      (each question = a stage; hierarchy is progress/label presentation,
      not branching). `requiresNote`-style NEXT gating maps to
      `canAdvance`; per-question widget to `render`; answer capture to
      `commit`; Back(secondary)/Next(primary) matches forward-momentum.
      Richer task-grouped progress would want an optional `WizardStage`
      field later — additive, not precluded. No ops code written
- [x] Chrome refinement 2026-07-22 (CA locus-of-attention principle): the
      step indicator is ONE contiguous progress rail directly under the
      dialog title — track `--sa-bg-progress-track`, fill
      `--sa-gradient-brand`, host-driven inline-size
      `(stepIndex + 0.5) / stageCount`, animated via `--sa-transition-base`.
      Numbered `(N) Title` labels sit beneath, one per stage, distributed
      under the rail; current stage renders in `--sa-color-accent`. The old
      pip-circle row and the "Step X of N" caption are retired

## Group A1 — Contact Composition (Foundation, D17, A0×2)

- [x] `customer.ts`: `Contact` object (`displayName`, `phoneNumber`,
      `preferredChannel`, `email?`) — customer topic per the consumer rule
      (CA ruling; migrates to common at a second consumer);
      `primaryContact: CompositionOne<Contact>` (required, all statuses);
      `primaryContactId` dropped outright
- [x] `common.ts`: `CONTACT_PREFERRED_CHANNELS` + `ContactPreferredChannel`
      migrated here from `user.ts` (two consumers: User + Contact;
      dependency direction forbids user→customer); `user.ts`,
      `user-validator.ts`, `user-manager.tsx` import from common
- [x] Adapters: `ContactAdapter` in `customer-adapter.ts` (§5.5 topic
      locality); maps `primary_contact` composition; protocols derive
      unchanged
- [x] `customer-validator.ts`: `isContact` guard (§5.5 house form, email
      shape-checked when present); create/update reworked (composition
      check in, FK check out)
- [x] Docs: `domain-data-dictionary.md` — `Contact` + channel enum topics
      relocated to Common with regeneration-safe Purposes, `Customer`
      topic updated; `domain-model.md` §Customers prose rewritten to D17;
      `project-user-stories.md` 1.1 step 2 contact line corrected
- [x] **CA REVIEW GATE** — passed 2026-07-20
- [x] `schema.sql`: `customers` drops `primary_contact_id`, gains
      `primary_contact JSONB NOT NULL DEFAULT '[]'` + two named checks
      (`_array_check`, `_one_check` = exactly one); `primary_contact_id`
      column + index removed. Genesis applied to stage
      (greenfield — no local docker; CA directive). Verified live: 22
      public tables, seeds 1/9/12/14, `primary_contact` jsonb NOT NULL
      present, `primary_contact_id` gone, both checks present
- [x] Fixtures + tests updated (direct `isContact` cases added; 37/37
      green); ripple audit re-verified (domain SDK + fixtures only, no
      front/back reach); full checks green

## Group B0 — Customers API Surface (Foundation) — COMPLETE 2026-07-21

The composed `@front/api` namespace had NO Customers surface — nothing
consumed it before the COW. First real exercise of the customer domain
end-to-end:

- [x] ~~`front/api/make-customers.ts` maker~~ — NOT created (CA ruling
      2026-07-21). A maker is specialization: `makeAuthUsers` swaps
      create/update/delete to edge clients and adds `eject`/`hasAccess`.
      Customers are plain CRUD with nothing to encapsulate; a passthrough
      maker aliasing `makeCrudSupabaseClient<Customer>` is ceremony, not
      composition. Composed inline in `api.ts` instead
- [x] `api.Customers` composed into `api.ts`:
      `makeCrudSupabaseClient<Customer>` → `ApiCrudContract<Customer>`
      (create/get/update/delete/list). Typecheck clean
- [x] Dual-storage contract honored — `makeCrudSupabaseClient` is
      transport-agnostic (the same contract a local/IndexedDB maker
      implements); no local client wired, customers need no offline
      (selective application per architecture, not a universal mandate)
- [x] `customers` RLS verified live on stage before first write: RLS
      enabled; INSERT (with_check true), UPDATE (`deleted_at IS NULL`/true),
      SELECT (`deleted_at IS NULL`), DELETE — the COW's create/update writes
      are permitted
- [ ] DEFERRED — status-filtered / ordered `list`: no M1 consumer (COW never
      lists customers, D17 stage 1 is pure contact capture); the real
      consumers (prospect hub D15, story 1.2 widget) arrive with the
      assessment flow. It is a core-layer `ListOptions`/`ApiCrudContract`
      contract evolution whose shape the CA intends to design directly —
      parked 2026-07-21 (see `project-feature-parking-lot.md`)

## Group B — COW Feature (Feature Mode) — BUILT 2026-07-22, layout OPEN

- [x] `front/app-admin/onboarding/onboarding.tsx` + `.css`; dialog route
      `/onboarding` (workbench) beside `/users`; dashboard action-widget
      launch entry (`building` glyph). Wired and launching
- [x] Stage 1 contact (per D17): pure contact capture — `Contact` fields
      (`displayName`, `phoneNumber`, `preferredChannel`, `email?`); no
      users search, no User creation; gate-and-carry stage (no commit),
      product rides in-memory into stage 2's create payload
- [x] Stage 2 customer: name, status (default `'prospect'`), required
      address, optional line2; `primaryContact` composition carried from
      stage 1. Commit is **create-or-update, not create-only**: the host
      runs `commit` on every Next, so Back→Next was minting a duplicate
      customer (AA review catch). `sites` is threaded through the payload
      so a re-commit cannot wipe sites already added
- [x] Stage 3 sites: repeated capture (label, address-or-coords fieldset
      per D11 with `navigator.geolocation` fill, optional acreage,
      plain-text note); zero sites legal; commits as Customer full-record
      update
- [x] Stages that commit, commit durably (D2 as relaxed by D17);
      Escape/cancel discards only uncommitted stage forms
- [x] Customers API surface exercised: `api.Customers.create/update`
      (first consumer!)
- [x] Checks: 188 files — types + 12 guards + lint green; fmt clean; app
      boots with zero console errors
- [ ] **OPEN — general stage layout not accepted (CA, 2026-07-22).** The
      flow wires and launches; the layout needs rework. Design
      conversation pending — the next session opens here
- [ ] DEFERRED (recorded, not lost): `accountManagerId` capture (no user
      picker, commits `undefined`); per-field inline error text (the gate
      is the disabled Next plus `required` markers); geolocation-denied
      feedback (currently silent); post-Finish success confirmation — the
      create-only / no-readback gap, resolved by the prospect hub (D15)

## Group C — Notes-lite (Foundation)

- [ ] `front/ux/shell/notes.tsx` — value-in/value-out over
      `CompositionMany<Note>`: content, visibility, tags (`cluster`);
      capabilities prop reserved for Phase 4 affordances
- [ ] Migrate User Manager notes textarea onto it (regression: live
      manager pass unchanged)
- [ ] Migrate COW site notes onto it
- [ ] Style: no new tokens unless demanded; guard suite green

## Group D — Verification & Close

- [ ] Full checks: guards + types + lint + tests + fmt
- [ ] Live E2E via CA browser on stage: run COW start-to-finish, create a
      real prospect with ≥2 sites (one address-only, one with
      coordinates), verify in Supabase data (`primary_contact`
      composition present, no auth identity minted)
- [ ] Story 1.1 enrichment reconciled with as-built (D16 practice)
- [ ] Ledger closed with commit hash(es); memory updated

---

_End of Task List_
