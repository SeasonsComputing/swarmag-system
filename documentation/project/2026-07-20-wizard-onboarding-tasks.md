# M1 — Wizard + Customer Onboarding Task List (Phase 3)

**Date:** 2026-07-19
**Mode:** Foundation (A0/A/C) + Feature (B)
**Status:** IN PROGRESS — D1–D17 ratified 2026-07-20; A0 complete;
per-group go orders remain the gate.
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

- [ ] `front/ux/shell/wizard-contract.ts` — `WizardContract`: ordered
      stage strategies (name, title, render, validity gate, optional
      commit — gate-and-carry stages per D17's D2 relaxation);
      early-finish support NOT in contract (D15: linear flow)
- [ ] `front/ux/shell/wizard.tsx` — IoC host: stage indicator, Back /
      Next / Finish, feedback surface, dialog-route presentation
- [ ] `front/ux/shell/wizard.css` — chrome styles on rhythm tokens;
      collapse-era motion language reused where stages transition
- [ ] Manager-aspect extraction ONLY on demonstrated overlap (card
      header/body regions, feedback plumbing) — refactor, not rewrite;
      manager behavior provably unchanged (checks + live manager pass)
- [ ] Ops-compatibility sanity: contract shape reviewed against §11.7
      (one-question-per-screen fits a stage; no ops code)

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
- [ ] **CA REVIEW GATE** — steps below run only on CA go
- [ ] `schema.sql`: `customers` drops `primary_contact_id`, gains
      `primary_contact JSONB NOT NULL` + named check; genesis lint + apply
      (local, then stage)
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
