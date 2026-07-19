# Foundation — Game Plan

**Date:** 2026-07-18
**Mode:** Foundation
**Status:** APPROVED — four-phase plan ratified by Chief Architect
2026-07-18; Phase 1 production authorized same day
**Related:** documentation/project/2026-07-16-user-manager-ux-rework.md,
documentation/project/2026-07-14-customer-onboarding-design.md

---

## 1. Design Authority

The `front/ux/ui` target architecture is the Chief Architect's design,
held for over a month before any AI restatement. ACE and AA (AI Architect)
are advisory: they analyze and propose; the CA decides. Record attribution
accordingly.

---

## 2. Target Architecture _(executes in Phase 2, not now)_

**Mapping:** `source/ux` → `source/front`; `common` → `ux`; `components` →
`ui`; inner `ui` → `components`.

**Resulting namespaces:** `@front/ux/ui/components`, `@front/ux/ui/css`,
`@front/ux/shell`, `@front/ux/stores`, `@front/api`, `@front/app-admin`
(and app-customer, app-ops, app-style-guide). `ui` is strictly
domain-agnostic — a general-purpose set of user interface controls.

**Seasons Computing extraction:** `core` and the design language (`ui` +
css/tokens) are planned to become reusable Seasons Computing libraries;
`ui`'s dependency discipline (Solid/Kobalte/assets only) is the future
library seam and the centerpiece of the Phase 2 dependency guard. Shell
stays project-local.

**Docs rename in Phase 2:** architecture-ux.md adopts front naming with
content patched — no permanent two-meanings-of-"ux" drift.

---

## 3. Shell Ruling

The shell IS the application framework. Dashboard, abstraction-manager,
about-box, config-table, login, dialogs belong in it; its components are
compile-time bound to it and not independently consumable. No decomposition
into ownership subfolders; no `features/` layer (proposal withdrawn).

The invariant that matters is dependency direction (apps → shell → ui/
stores/api), not physical taxonomy.

Shell has exactly two interaction archetypes: the abstraction-manager
(persistent CRUD surface) and a forthcoming `wizard` (guided multi-step
flow — CA chose the single-word moniker). Once both are baked, little else
enters shell.

---

## 4. Game Plan _(four phases, each independently authorized production)_

**Phase 1** — Validation + repeated-value presentation (Foundation, current
structure). Exit gate: User Manager done.

**Phase 2** — `front/` migration (Foundation, mechanical, one commit):
renames, deno.jsonc import map, guard path updates, doc renames + content
patches, new UX namespace dependency guard written against final paths.

**Phase 3** — `wizard` shell archetype (Foundation), then Customer
Onboarding rides it (Feature Mode).

**Phase 4** — Notes (Foundation feature): one general-purpose Notes
component used everywhere; Notes contain Attachments, requiring the final
backend piece — storage buckets. Placement (shell vs shared) decided here.

**Open dependency question, answer before Phase 3 commits:** does the
onboarding wizard need inline note capture? If yes, Notes swaps ahead of
onboarding.

---

## 5. Phase 1 Design Decisions

### D1 — `UiField` gains a `required` prop

Rendering a visible `*` (label and caption modes). The associated control
still owns actual validation via native `required`.

### D2 — Invalid controls use existing error state

Audit found the components already support this; the one gap is CSS — no
`[data-ui='multi-select'][data-ui-state='error']` rule exists. Phase 1
adds it.

### D3 — Alert stays form-level only

"Correct the highlighted fields." (replaces "Review the required fields.").
Field-specific visual states identify the failures.

### D4 — Validation timing

Text inputs validate on blur; after a failed submission, invalid text
inputs revalidate as corrected; selects, multi-selects, checkboxes, radios
revalidate immediately on change. The mechanism is abstraction-general — a
new shell hook `use-abstraction-form-validation.ts`, sibling to
`use-abstraction-mutation` and `use-abstraction-form-feedback`. Field
policy stays declarative in each manager.

### D5 — Field-aware normalization

Email: trim + lowercase. Display name: trim, preserve casing. Phone: trim,
otherwise permissive until canonical phone format adopted. Notes: preserve
formatting though whitespace-only remains invalid.

### D6 — Field-type primitives live in `core/std/validators.ts`

`isEmail` + `expectEmail` (anchored to the WHATWG `input[type=email]` regex
— definitionally identical to native browser validation, honoring the
no-stricter-expressions rule) and a new transform family `to*`: `toTrimmed`,
`toEmail`. Because the domain layer compile-time bundles into both the UX
and the edge functions, one implementation serves both ends — decision-by-
linker, no drift possible.

### D7 — Deferred with cause

`isPhone` (blocked on canonical phone format decision — today it would be
either uninformative or stricter than decided policy); `isDate`/`isTime`
(natural `isWhen` siblings; land in Phase 3 with their first consumers in
Job Assessment).

### D8 — Roles requires at least one selection

The whole multi-select gets the standard error ring.

### D9 — Escape dismisses dialogs

Outside-click dismissal stays disabled; `UiDialog`'s single `dismissible`
switch is split so the two behaviors are independent. Cancel, Close, and
Escape discard edits immediately without confirmation.

### D10 — Repeated-value presentation

New `UiLayout` variant `cluster` — flex-wrap flow of intrinsic-width items
with uniform gaps. Existing `inline-wrap` is a responsive auto-fit grid
(children stretch to fill columns) and is the wrong shape. A dedicated
chips component was considered and rejected: composition of `UiLayout
cluster` + `UiBadge` covers presentation; an interactive chips component is
revisited only if Phase 4 tags need removable/clickable items.

### D11 — Out of scope for Phase 1

Notes, wizard, structural renames, domain validator application of
normalization (small follow-up wiring `toEmail`/`expectEmail` at the
boundary once the UX pass proves the primitives), app-customer/app-ops.

---

_End of Design Document_
