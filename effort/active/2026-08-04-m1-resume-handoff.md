# M1 Resume — Session Handoff

**Date:** 2026-08-04
**Status:** M1 Groups A0, A1, A, B0 and **B complete**. **C (Notes-lite) and D
(verification) remain.**
**Ledger:** `effort/active/2026-07-20-wizard-onboarding-tasks.md`
**Designs:** `2026-07-20-wizard-onboarding-design.md`,
`2026-08-04-composition-editor-design.md`
**Panel brief:** `2026-07-22C-panel-decomposition-brief.md` — P1 and P2 complete,
P3 design supplied

## What shipped since the last handoff

Produced across multiple ACE sessions under iterative CA direction, with design
settled in conversation rather than in a brief. Recorded here because the effort
docs did not track it as it happened.

**Panel family and wizard migration (P2).** `wizard.tsx` now renders
`PanelContainer` / `PanelHeader` / `PanelStepflow` / `PanelForm`. Back and Next
live in the Subject header, stage title beside Back, Back hidden on step one.

**Shell composition overhaul.** `ux/shell/shell.ts` defines the route grammar — a
six-arm `ShellRoute` union (`dashboard | page | workbench | dialog | redirect |
transition`) with makers, compiled by `bootstrap`. `widget-contract.ts` is the
widget SPI; `widget.tsx` and `dashboard-provider.tsx` are gone, and
`guard-namespaces` rule 4 now closes shell to the widget catalog outright — apps
bind widgets at their composition roots.

**Renames.** `PanelTimeline` → `PanelStepflow`; `action-widget` / `ActionWidget`
→ `helm-widget` / `HelmWidget`; `shell-registry.tsx` → `shell-makers.tsx`;
`RuntimeProvider` → `RuntimeContract`. Dataset prefixes split by layer —
`data-ui` / `data-shell` / `data-widget` / `data-app`, enforced in `guard-css.ts`.

**Onboarding stage rework, accepted 2026-08-04.** Stages split into
`onboarding-stage-{contact,customer,sites}.tsx` plus `onboarding-state.ts`;
titles clarified; false "(optional)" labels removed. `WizardStage` gained
`validate?()`, so Next stays live on an incomplete stage and the stage reports
its own field errors — this supersedes the recorded "disabled Next" deferral.

**Domain.** `CustomerSite.customerId` removed (`ba494f7`) — a back-pointer left
from when sites were their own table. `CustomerUser.customerId` and
`Job.customerId` are legitimate and stay.

**Genesis is now total.** `schema.sql` opens with `DELETE FROM auth.users;`.
That exposed a latent defect: the seed identity could never sign in, because the
seed block set neither `instance_id` nor an `auth.identities` row. Both are now
in the seed block. Symptom was "Signups not allowed for OTP" — the error names
signups, the cause is a GoTrue lookup miss. Verified from a clean genesis.

**Thirteen guards ship**, not twelve — `guard-tokens.ts` was added.

## Resume agenda

1. **Composition editor** (`ux/shell/`) — build it, then rehost stage 3 onto it.
   Design is settled; two decisions are open, both small and both reversible:
   what the frame renders at `[]`, and whether commit prunes blank records and
   gates on substance rather than dirtiness.
2. **C — Notes-lite** on the same control. `notes.tsx` over
   `CompositionMany<Note>`; migrate the User Manager textarea and the COW site
   notes. Second consumer is what proves the control is generic.
3. **D — Verification and close.** Full checks; live E2E on stage creating a real
   prospect with ≥2 sites, one address-only and one with coordinates; verify
   `primary_contact` in Supabase and that no auth identity was minted; story 1.1
   enrichment (D16); close the ledger with commit hashes.

## Open questions carried forward

- **Fieldset redundancy** — a panel with exactly one fieldset whose legend
  repeats the panel title. Reaches Group B stages 1 and 2, so B is not final
  until it is settled. `documentation/project/project-backlog.md`.
- **Undefined-token guard** — `guard:css` forbids raw literals but never checks
  that a referenced token exists, so an unresolvable `var()` is dropped silently
  by the browser. This produced square site tiles for weeks. Unbuilt.
  `guard-tokens.ts` is a different guard and does not close it.
- **`ux/screens`** — extract `login*`, `logout*`, `about-box*`, `brand-hero*`,
  `config-table*` and `shell-metadata.ts` into a sibling namespace. Verified
  self-contained: none of them import the panel family. The wider four-way `ux/`
  decomposition is parked; this is the accepted intermediate step.
- **`architecture-front.md`** — the shell section is one clause covering 27
  files, and `PanelStepflow` appears in no document at all. Decomposition
  analysis exists; sequence it after `ux/screens` so §2 is rewritten once.

## Standing protocol

Independent CA go per production. Delegates are haiku and git read-only. CA dev
server on :5173; the agent browser reaches only the OTP login and cannot
authenticate, so live passes are the CA's authenticated Chrome. **Claude never
commits.**

_End of Handoff_
