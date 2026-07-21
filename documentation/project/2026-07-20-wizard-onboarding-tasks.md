# M1 — Wizard + Customer Onboarding Task List (Phase 3)

**Date:** 2026-07-19
**Mode:** Foundation (A0/A/C) + Feature (B)
**Status:** IN PROGRESS — D1–D17 ratified 2026-07-20; A0, A1, A complete
(A1 schema live on stage; A = wizard framework, contract+host+chrome).
B0 (Customers API surface) next. Per-group go orders remain the gate.
**Source design:** `documentation/project/2026-07-20-wizard-onboarding-design.md`

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

## Group B0 — Customers API Surface (Foundation, discovered in planning)

The composed `@front/api` namespace has NO Customers surface — nothing
consumed it before the COW. First real exercise of the customer domain
end-to-end:

- [ ] `front/api/make-customers.ts` per the maker pattern (`makeAuthUsers`
      precedent); plain client CRUD through the customer adapter — no
      auth-sync coupling (customers are not identities)
- [ ] `api.Customers` composed into `api.ts`: `create`, `update`, `get`,
      `list` (list filtered by status serves both COW select paths and the
      future prospect hub / story 1.2 widget)
- [ ] Dual-storage contract honored per architecture (Supabase +
      IndexedDB same contract)
- [ ] `customers` table RLS verified live before first write (genesis
      schema claims vs. hosted reality — the User Manager lesson)

## Group B — COW Feature (Feature Mode)

- [ ] `front/app-admin/onboarding/onboarding.tsx` + `.css`; dialog route
      `/onboarding` (workbench) beside `/users`; dashboard action-widget
      launch entry
- [ ] Stage 1 contact (per D17): pure contact capture — `Contact` fields
      (`displayName`, `phoneNumber`, `preferredChannel`, `email?`); no
      users search, no User creation; gate-and-carry stage (no commit),
      product rides in-memory into stage 2's create payload
- [ ] Stage 2 customer: name, status (default `'prospect'`), required
      address, optional line2/accountManagerId; payload sends explicit
      `sites: []`, `notes: []`; `primaryContact` composition carried from
      stage 1
- [ ] Stage 3 sites: rapid repeated capture (label, address-or-coords
      fieldset per D11 with `navigator.geolocation` fill, optional
      acreage, plain-text note) — Enter-advance adds next site; zero
      sites legal; commits as Customer full-record update
- [ ] Stages that commit, commit durably (D2 as relaxed by D17);
      Escape/cancel discards only uncommitted stage forms
- [ ] Customers API surface confirmed: `api.Customers.create/update`
      exist and are exercised (first consumer!)

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
