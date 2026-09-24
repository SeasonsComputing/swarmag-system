# UI Control State Normalization — Production Brief

**Sequencing note (2026-08-30):** originally gated behind
`effort/active/2026-08-16-helm-button-boundary-repair-brief.md` on the
assumption both would edit `ui.css`/`ui-action-button.tsx`. The Helm boundary
repair has since shipped by a different mechanism (per-action `labelMode`
config, no `HelmButton`, no shared-file changes — see
`effort/completed/2026-08-16-helm-button-boundary-repair-brief.md`), so
`ui.css`/`ui-action-button.tsx` carry no Helm-specific leakage today and there
is no longer a file conflict gating this brief. It may run independently.

**Roadmap sequencing (2026-09-04):** CA has bundled this brief with the
`ux/shell` → `ux/shell` + `front/app` split into a single future refactoring
milestone, third in the current roadmap (after M1, after the Notes editor
milestone). Fully designed and ready to dispatch, but not picked up standalone
before that milestone starts — deferred on purpose, not blocked technically.

**Audit complete, reviewed by CA (2026-09-22):** the shell/app split closed 2026-09-21,
clearing the last sequencing gate. The "Required audit" section below has been run — full
state matrix, ranked inconsistencies, doc reconciliation, and a vocabulary check — embedded
in full under "Audit (2026-09-22)" further down, per EFFORT.md §4: a brief is amended in
place, not forked into a companion file that its own closure wouldn't carry along. Read it
before "Specific concerns to address": two of that section's three named symptoms are now
stale (already resolved elsewhere in the codebase since this brief was written on
2026-08-16), and the audit surfaces several real issues this brief's original text did not
anticipate, including a functional (not merely cosmetic) bug. Annotations below mark
exactly what changed and where.

## What triggered this

While inspecting the onboarding Job Sites panel and Helm action behavior, the
shared UI control layer showed a deeper inconsistency: controls do not share one
state model.

`UiActionButton` currently distinguishes visible-label and hidden-label actions
by resting color. Hidden-label action buttons rest in primary color, while
visible-label action buttons inherit surrounding text color. `UiCollectionCursor`
shows the problem clearly: navigation action-buttons rest in primary color while
life-cycle action-buttons rest in text-primary. Hover then makes labeled
action-button icons primary, so icon-only action buttons often have no visible
hover color change.

The inconsistency is broader than action buttons:

- checkbox and radio use primary to indicate checked state and also have hover
  text-primary behavior;
- toggle, tab, and accordion use primary to indicate selected/open state but do
  not share the same unselected-hover cue;
- button is the unique case and does not change text color on hover;
- single-select and multi-select have selected-hover background cues but do not
  change selected text to text-primary;
- hover, selected, active, checked, and resting affordance are not expressed as a
  single design-language state matrix.

This is not a feature defect. It is design-language drift in the shared control
foundation.

## Principle

Primary color must have a stable meaning.

It should not simultaneously mean:

- resting icon affordance;
- hover affordance;
- selected state;
- checked state;
- active tab state;
- open accordion state;
- random emphasis because a control has no visible label.

The UI primitive layer must define state roles once and map each control shape to
those roles consistently.

## Desired state model

The production should establish a shared state matrix for UI controls.

Required states:

- rest;
- hover;
- focus-visible;
- disabled;
- selected / checked / active / open;
- selected / checked / active / open + hover;
- danger / destructive where applicable.

Recommended semantic direction:

- Resting text and icons should generally inherit context or use a neutral text
  token.
- Hover should provide an affordance through background, border, frame, shadow,
  or similarly non-layout-changing treatment.
- Focus-visible should use a consistent focus ring.
- Primary should indicate selected, checked, active, open, or another explicit
  semantic state — not arbitrary resting affordance.
- Danger should use danger tokens consistently and should override ordinary
  primary treatment.
- Disabled should remain visually diminished and non-interactive.
- Hover and focus must not change whether labels participate in layout.
- State changes must not cause layout oscillation.

The exact token choices remain a Chief Architect/design-language decision. The
production is not authorized to invent a new color theory ad hoc while editing.

**Vocabulary — open CA decision, found by the 2026-09-22 audit.** Nothing in the repo's
documentation currently defines "rest/hover/focus-visible/selected-checked-active-open/
danger" as a named, cross-control category set — this brief would be establishing it
fresh, not restating something already agreed. Two things worth knowing before naming it:
(1) `--sa-state-*` tokens (`roles.css:201-223`) already exist for a _different_ state
axis — semantic banners/badges/alerts (`default|success|warning|danger|info`) — so the
new vocabulary needs a name that doesn't collide with "state" as that term is already
used elsewhere in the design language. (2) There's a latent, informal precedent worth
building on rather than ignoring: token names already tag a color's _role_ with a
`-selected`/`-primary` specialization suffix (`--sa-toggle-pressed-bg-selected`,
`--sa-accordion-expanded-color-primary`, `themes.css:29-34, 192-199`), even though each
control currently invents its own word for the state itself (`pressed`/`selected`/
`expanded`). Folding "selected/checked/active/open" into the existing `data-ui-state`
type (`UiControlState = 'error'|'disabled'|'loading'`, `ui-helpers.ts:54`) would be a
scope change this brief's own "do not add new props unless the audit proves an actual
missing state concept" rule forbids without an explicit decision — the audit found the
concept but the decision to formalize it is still CA's to make.

## Required audit

Before production, inspect the current implementation and produce a concise
state matrix for at least:

- `UiButton`
- `UiActionButton`
- `UiCheckbox`
- `UiRadioGroup`
- `UiToggle`
- `UiTabs`
- `UiAccordion`
- `UiSingleSelect`
- `UiMultiSelect`
- `UiCollectionCursor`

For each, identify current treatment for:

- rest;
- hover;
- focus-visible;
- disabled;
- selected / checked / active / open, where applicable;
- selected / checked / active / open + hover, where applicable;
- danger / destructive, where applicable.

Report inconsistencies before mutating files. If the state model requires Chief
Architect decisions, stop and ask rather than encoding assumptions.

**The audit is a gate, not a preface.** The matrix it produces must be reviewed
and approved by the Chief Architect before any file is mutated, because it is the
standard the behavioural verification below is measured against. A production
that normalizes first and describes afterwards has verified nothing — it has only
confirmed that the code agrees with itself.

**Done, reviewed 2026-09-22.** The full per-component matrix with `path:line` citations —
all ten components, all seven required state cells — is embedded below under
"Audit (2026-09-22)"; that section is the approved artifact this gate requires. Two open
decisions the matrix surfaced that this brief does not yet resolve, both needing a CA call
before mutation: the state-category vocabulary (see "Vocabulary" above), and whether the
`UiMultiSelect` functional bug (see "Specific concerns" below) is fixed as part of this
production or split out, since it's a correctness defect rather than a state-model
inconsistency.

## Audit (2026-09-22)

Produced against this brief's "Required audit" section above, extended per two additions:
reconciliation with `ux-components-guide.md`/`-lite.md`, and a check for existing
state-category vocabulary before assuming the categories above are novel. Read-only
reconnaissance — no files were modified. All citations are `path:line` against the working
tree at the time of the audit.

Primary files read in full: `source/ux/ui/components/ui-{button,action-button,checkbox,
radio-group,toggle,tabs,accordion,single-select,multi-select,collection-cursor}.tsx`,
`ui-helpers.ts`, `source/ux/ui/css/ui.css` (1539 lines), `tokens.css`, `roles.css`,
`themes.css`, `documentation/ux/ux-components-guide.md`, `ux-components-guide-lite.md`,
`ux-design-language.md`, `ux-components-internals.md`, `source/devops/guards/guard-css.ts`.

### 0. Shared mechanics every cell below depends on

- `controlState(props)` (`ui-helpers.ts:64-71`) derives `data-ui-state` from only three
  props, in this precedence: `loading` → `error` → `disabled`. `UiControlState = 'error' |
  'disabled' | 'loading'` (`ui-helpers.ts:54`). There is no `data-ui-state` value for hover,
  selected, checked, active, or open — those are carried entirely by native/Kobalte runtime
  attributes (`data-checked`, `data-pressed`, `data-selected`, `data-expanded`,
  `data-highlighted`, `data-disabled`) or by `:hover`/`:focus-visible` pseudo-classes, per the
  allowed list in `ux-components-internals.md:284-295` and the enforced list in
  `guard-css.ts:44-64`.
- Common disabled rule: `[data-ui][data-ui-state='disabled'] { opacity: 0.4; }`
  (`ui.css:12-14`) — the only state rule applying generically across all `data-ui` controls,
  and only when `data-ui-state` is literally `'disabled'` (not `'loading'`, not `'error'`).
- `guard-css.ts:44-64` allowlists `data-checked`, `data-disabled`, `data-expanded`,
  `data-highlighted`, `data-placeholder-shown`, `data-pressed`, `data-selected` as consumable
  runtime attributes — a superset of what `ux-components-internals.md:284-295` documents (see
  §c below).

### (a) State matrix, per component

#### 1. `UiButton` (`ui-button.tsx`, `ui.css:20-86`)

| State                          | Treatment                                                                                                                                                                                                                                                 | Citation                              |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| Rest (no variant)              | `background: transparent`, `border: var(--sa-border-brand)` (1px solid primary), `color: var(--sa-text-primary)`                                                                                                                                          | `ui.css:20-38`                        |
| Rest, `variant='primary'`      | `background: var(--sa-button-bg-primary)`, `color: var(--sa-button-color-primary)`, `border-color: transparent`, `box-shadow: var(--sa-shadow-glow-sm)`                                                                                                   | `ui.css:44-51`                        |
| Rest, `variant='secondary'`    | `background: var(--sa-bg-hover)` — resting background is the token named for the hover role                                                                                                                                                               | `ui.css:53-57`                        |
| Rest, `variant='ghost'`        | No dedicated rule exists; falls through to the base (no-variant) rule — indistinguishable from omitting `variant`                                                                                                                                         | absence confirmed by grep             |
| Rest, `variant='danger'`       | `background: var(--sa-button-bg-danger)`, matching border/color token family                                                                                                                                                                              | `ui.css:59-64`                        |
| Hover (no variant / secondary) | `background: var(--sa-bg-hover)`, `box-shadow: var(--sa-shadow-btn)`, `transform: translateY(-1px)` — no `color` change on hover, any variant                                                                                                             | `ui.css:66-72`                        |
| Hover, danger                  | `background: var(--sa-button-bg-danger-hover)` only                                                                                                                                                                                                       | `ui.css:74-76`                        |
| Hover, primary                 | `background: var(--sa-button-bg-primary-hover)`, `box-shadow: var(--sa-shadow-glow)`, `transform: var(--sa-button-transform-hover)`                                                                                                                       | `ui.css:78-82`                        |
| Focus-visible                  | `box-shadow: var(--sa-focus-ring)` (all variants, additive)                                                                                                                                                                                               | `ui.css:84-86`                        |
| Disabled                       | `opacity: 0.4` (common) + `cursor: not-allowed`                                                                                                                                                                                                           | `ui.css:12-14, 40-42`                 |
| Selected/checked/active/open   | N/A — no such axis                                                                                                                                                                                                                                        | —                                     |
| `error` prop                   | **No visual effect.** Feeds `controlState()`, would emit `data-ui-state='error'`, but no `[data-ui='button'][data-ui-state='error']` selector exists                                                                                                      | grep-confirmed                        |
| `loading` prop                 | Disables natively (`ui-button.tsx:62,69`) but does not set `data-ui-state='disabled'` (precedence puts `'loading'` first) — and no `[data-ui-state='loading']` rule exists. **A loading button is functionally inert but visually identical to resting.** | `ui-helpers.ts:64-71`; grep-confirmed |

#### 2. `UiActionButton` (`ui-action-button.tsx`, `ui.css:92-225`)

Structure: outer `[data-ui='action-button']` (hit/focus target, icon color via `currentColor`),
inner `[data-ui='action-button-frame']` (the ring behind the icon), `-icon`, `-label` (only
rendered when `labelMode='visible'`, else `display:none`, `ui.css:189-191`).

| State                      | Treatment                                                                                                                                                                                                                                                                                                                                                             | Citation                                   |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| Rest, icon                 | `color: var(--sa-text-primary)`                                                                                                                                                                                                                                                                                                                                       | `ui.css:99, 168-174`                       |
| Rest, frame                | `background: var(--sa-bg-control)`, `border: var(--sa-border-default)`                                                                                                                                                                                                                                                                                                | `ui.css:127-138`                           |
| Rest, label (visible only) | `color: var(--sa-text-secondary)` — a different resting token than the icon's, within one control                                                                                                                                                                                                                                                                     | `ui.css:176-183`                           |
| Hover/focus-visible, icon  | `color: var(--sa-color-primary)`                                                                                                                                                                                                                                                                                                                                      | `ui.css:148-151`                           |
| Hover/focus-visible, frame | `background: var(--sa-bg-hover)`, `border-color: var(--sa-color-primary)` — **not scoped by `data-ui-variant`**, see danger row                                                                                                                                                                                                                                       | `ui.css:162-166`                           |
| Hover/focus-visible, label | `color: var(--sa-text-primary)` — not `--sa-color-primary`; icon reaches brand-primary on hover while the label only reaches neutral                                                                                                                                                                                                                                  | `ui.css:217-220`                           |
| Focus-visible (box)        | `box-shadow: var(--sa-focus-ring)`                                                                                                                                                                                                                                                                                                                                    | `ui.css:158-160`                           |
| Disabled                   | `opacity: 0.4` + `cursor: not-allowed`; hover/focus rules correctly guarded `:not([data-ui-state='disabled'])`                                                                                                                                                                                                                                                        | `ui.css:12-14, 140-142, 148,153,162,217`   |
| Danger, rest               | Icon `color: var(--sa-button-bg-danger)` — **frame stays neutral at rest**, not danger-colored                                                                                                                                                                                                                                                                        | `ui.css:144-146` vs `127-138`              |
| Danger, hover/focus        | Icon correctly turns `--sa-button-bg-danger-hover` (`ui.css:153-156`) **but** the frame-hover rule (`162-166`) and label-hover rule (`217-220`) are both unscoped by variant, so frame turns brand-primary and label turns neutral. **A danger action-button on hover shows three different colors — danger / brand-primary / neutral — for one destructive action.** | `ui.css:153-156` vs `162-166` vs `217-220` |
| `labelMode`                | **No color rule anywhere is keyed on `data-ui-label-mode`** — only layout (`ui.css:121-125`) and the label's `display:none` (`189-191`). Both modes share identical color rules.                                                                                                                                                                                      | grep-confirmed                             |

**Vs. the brief's stated symptom** ("hidden-label rests primary, visible-label inherits text
color"): **stale as of the current tree** — both modes now rest at `--sa-text-primary`. What
persists in a different shape: the icon/label color mismatch on hover, and the danger-hover
three-tone issue above.

#### 3. `UiCheckbox` (`ui-checkbox.tsx`, `ui.css:733-851`)

| State               | Treatment                                                                                                                                                                                                                                                       | Citation                      |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| Rest                | Wrapper `color: var(--sa-text-primary)`; box `background: var(--sa-bg-control)`, `border: var(--sa-border-input)`; label explicitly `color: var(--sa-text-secondary)`                                                                                           | `ui.css:733-748, 766-777`     |
| Hover, unchecked    | Box `background: var(--sa-bg-hover)`, `border-color: var(--sa-color-primary)`; label `color: var(--sa-text-primary)`                                                                                                                                            | `ui.css:792-801`              |
| Focus-visible       | Box `box-shadow: var(--sa-focus-ring)` via `:has(input:focus)`                                                                                                                                                                                                  | `ui.css:833-836`              |
| Checked             | Box `background`/`border-color: var(--sa-color-primary)`, `color: var(--sa-text-on-brand)`; label `color: var(--sa-color-primary)`                                                                                                                              | `ui.css:803-813, 828-831`     |
| **Checked + hover** | **Bug** — see Finding #2 below: hovering a checked checkbox's label regresses its color from `--sa-color-primary` back to `--sa-text-primary` due to a specificity collision. Box itself is correctly guarded (`:not([data-checked])`) and shows no regression. | `ui.css:798-801` vs `828-831` |
| Disabled            | `opacity: 0.4` + `cursor: not-allowed`                                                                                                                                                                                                                          | `ui.css:12-14, 848-851`       |
| `error`             | Box `border-color: var(--sa-border-input-error)`, `box-shadow: var(--sa-control-shadow-error)`                                                                                                                                                                  | `ui.css:838-842`              |
| Danger              | N/A — no `variant` prop                                                                                                                                                                                                                                         | —                             |

#### 4. `UiRadioGroup`/`UiRadioItem` (`ui-radio-group.tsx`, `ui.css:750-849, 792-849`)

Shares rule blocks with checkbox via combined selectors.

| State               | Treatment                                                                                                                                                                                                                                                                        | Citation                                                    |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Rest                | Wrapper `color: var(--sa-text-primary)`; dot `background: var(--sa-bg-control)`, `border: var(--sa-border-input)`; label `color: var(--sa-text-secondary)`                                                                                                                       | `ui.css:755-764, 779-790, 744-748`                          |
| Hover, unchecked    | Dot `background: var(--sa-bg-hover)`, `border-color: var(--sa-color-primary)`; label `color: var(--sa-text-primary)`                                                                                                                                                             | `ui.css:792-801`                                            |
| Focus-visible       | Dot `box-shadow: var(--sa-focus-ring)` via `:has(input:focus)`                                                                                                                                                                                                                   | `ui.css:833-836`                                            |
| Checked             | Dot `background`/`border-color: var(--sa-color-primary)`, inner disc `background: var(--sa-text-on-brand)`; label `color: var(--sa-color-primary)`                                                                                                                               | `ui.css:803-808, 815-826, 828-831`                          |
| **Checked + hover** | **Same specificity-collision bug as checkbox**, identical selector shape — label regresses to `--sa-text-primary` on hover.                                                                                                                                                      | `ui.css:798-801` vs `828-831`                               |
| Disabled            | **Two different mechanisms.** Group-level disable → `opacity:0.4` cascades. Per-item disable (`ui-radio-group.tsx:96,110`) only gets `cursor: not-allowed` (`ui.css:848-851`) — **no opacity or color dimming at all** for a single disabled item in an otherwise-enabled group. | `ui-radio-group.tsx:42-51, 87-119`; `ui.css:12-14, 848-851` |
| `error`             | Border-color only, no matching `box-shadow` (unlike checkbox)                                                                                                                                                                                                                    | `ui.css:844-846` vs `838-842`                               |
| Danger              | N/A                                                                                                                                                                                                                                                                              | —                                                           |

#### 5. `UiToggle` (`ui-toggle.tsx`, `ui.css:923-1003`)

| State              | Treatment                                                                                                                                                        | Citation                           |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| Rest               | `background: var(--sa-toggle-bg)`, `border: var(--sa-toggle-border)`, `color: var(--sa-text-secondary)`                                                          | `ui.css:927-949`                   |
| Hover              | `background: var(--sa-bg-hover)`, `color: var(--sa-text-primary)`                                                                                                | `ui.css:951-955`                   |
| Focus-visible      | `box-shadow: var(--sa-focus-ring)` (both `:focus-visible` and plain `:focus`)                                                                                    | `ui.css:957-962`                   |
| Pressed (selected) | `background: var(--sa-toggle-pressed-bg-selected)`, `border-color: var(--sa-toggle-pressed-border-primary)`, `color: var(--sa-toggle-pressed-color-primary)`     | `ui.css:964-969`                   |
| Pressed + hover    | **No explicit rule** — equal specificity, later source rule (pressed, `964`) wins over hover (`951`). A hovered, already-pressed toggle shows no hover feedback. | `ui.css:951-955, 964-969`          |
| Disabled           | `opacity: 0.4`                                                                                                                                                   | `ui-toggle.tsx:62`; `ui.css:12-14` |
| Danger             | N/A                                                                                                                                                              | —                                  |

#### 6. `UiTabs` (`ui-tabs.tsx`, `ui.css:1005-1061`)

| State            | Treatment                                                                                                                                                                                                                                                                                           | Citation                      |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| Rest             | `background: transparent`, `border-color: transparent`, `color: var(--sa-text-secondary)`                                                                                                                                                                                                           | `ui.css:1030-1044`            |
| Hover            | `background: var(--sa-bg-hover)`, `color: var(--sa-text-primary)`                                                                                                                                                                                                                                   | `ui.css:1046-1049`            |
| Focus-visible    | `box-shadow: var(--sa-focus-ring)`                                                                                                                                                                                                                                                                  | `ui.css:1058-1061`            |
| Selected         | `background`/`border-color`/`color: var(--sa-color-primary)` family, plus `box-shadow: var(--sa-shadow-sm)`                                                                                                                                                                                         | `ui.css:1051-1056`            |
| Selected + hover | **No explicit combined rule** — equal specificity, source order gives selected (1051) precedence over hover (1046). No distinct hover cue on the active tab.                                                                                                                                        | `ui.css:1046-1049, 1051-1056` |
| Disabled         | **No CSS treatment whatsoever.** Kobalte emits native `disabled`/`data-disabled` but `ui.css` has no selector consuming it for tabs at all — a disabled tab looks identical to a rest, enabled, unselected tab. Every other audited control gets _some_ explicit disabled treatment; tabs get none. | grep-confirmed absence        |
| Danger           | N/A                                                                                                                                                                                                                                                                                                 | —                             |

#### 7. `UiAccordion` (`ui-accordion.tsx`, `ui.css:853-921`)

| State           | Treatment                                                                                                                                                             | Citation                    |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| Rest            | `background: var(--sa-bg-control)`, `color: var(--sa-text-secondary)`; item border `var(--sa-border-default)`                                                         | `ui.css:862-888`            |
| Hover           | `background: var(--sa-bg-hover)`, `color: var(--sa-text-primary)`                                                                                                     | `ui.css:890-893`            |
| Focus-visible   | Trigger suppresses its own ring (`box-shadow: none`); the **parent item** gets it instead — the only audited control relocating focus-visible to a different DOM node | `ui.css:895-903`            |
| Open (expanded) | Trigger `background`/`color: var(--sa-color-primary)` family; item border matches                                                                                     | `ui.css:867-869, 905-912`   |
| Open + hover    | **No explicit rule** — equal specificity, expanded (905) wins over hover (890) by source order. No hover feedback on an open trigger.                                 | `ui.css:890-893, 905-908`   |
| Disabled        | Per-item only: `color: var(--sa-text-disabled)` substitution, **not opacity** — a third distinct disabled strategy vs. the other two above                            | `ui.css:918-921` vs `12-14` |
| Danger          | N/A                                                                                                                                                                   | grep-confirmed              |

#### 8. `UiSingleSelect` (`ui-single-select.tsx`, `ui.css:357-511`)

**Trigger:**

| State         | Treatment                                                                                                                                              | Citation         |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------- |
| Rest          | `background: var(--sa-input-bg)`, `border: var(--sa-border-input)`, `color: var(--sa-text-primary)`                                                    | `ui.css:357-375` |
| Hover         | `background: var(--sa-input-bg-hover)` (shared with input/textarea)                                                                                    | `ui.css:397-401` |
| Focus-visible | `background`/`border-color: var(--sa-*-focus)`, `box-shadow: var(--sa-focus-ring)`                                                                     | `ui.css:407-413` |
| Disabled      | `background`/`border`/`color: var(--sa-*-disabled)`, `cursor: not-allowed`                                                                             | `ui.css:430-437` |
| `error`       | `border-color: var(--sa-border-input-error)`, `box-shadow: var(--sa-control-shadow-error)`                                                             | `ui.css:415-421` |
| Selected/open | N/A at trigger — the chevron icon is unconditionally `color: var(--sa-color-primary)` at all times, a permanent decorative tint unrelated to any state | `ui.css:377-382` |

**Popup items:**

| State                         | Treatment                                                                                                                                             | Citation         |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| Rest                          | `background: var(--sa-single-select-item-bg)`, `color: var(--sa-text-secondary)`                                                                      | `ui.css:463-478` |
| Hover/highlighted, unselected | `background`/`color` shift, combined selector for `:hover` and `[data-highlighted]`                                                                   | `ui.css:480-484` |
| Selected                      | `background: var(--sa-bg-selected)`, `border-inline-start-color`/`color: var(--sa-color-primary)`, `✓` glyph                                          | `ui.css:491-501` |
| Selected + hover/highlighted  | **Has an explicit rule** — the only audited "selected+hover" cell with one: intensified `background` via `color-mix`, color unchanged (no regression) | `ui.css:503-510` |
| Disabled                      | `color: var(--sa-text-disabled)`, `cursor: default`                                                                                                   | `ui.css:486-489` |
| Focus-visible                 | N/A — keyboard nav expressed only via `[data-highlighted]`                                                                                            | grep-confirmed   |
| Danger                        | N/A                                                                                                                                                   | —                |

#### 9. `UiMultiSelect` (`ui-multi-select.tsx`, `ui.css:512-567`)

| State                      | Treatment                                                                                                                                                                                                                                                                                                                                                                    | Citation                         |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| Rest (root)                | `background: var(--sa-input-bg)`, `border: var(--sa-border-input)` — static only                                                                                                                                                                                                                                                                                             | `ui.css:516-524`                 |
| Hover/focus-visible (root) | **No rule.** Absent from the shared hover/focus group that covers input/textarea/single-select. Structurally defensible (root isn't the interactive surface) but inconsistent with how single-select handles its trigger.                                                                                                                                                    | `ui.css:397-413` (absence)       |
| `error` (root)             | Present — included in the shared error group                                                                                                                                                                                                                                                                                                                                 | `ui.css:415-421`                 |
| Disabled (root)            | **No rule, and no functional effect — see Finding #1.** `UiMultiSelectProps.disabled`/`.loading` are destructured (`ui-multi-select.tsx:23,26,42,45`) and used only to compute `data-ui-state` — **neither is ever passed to the underlying Kobalte `Listbox`.** Contrast `ui-single-select.tsx:65`, which correctly threads `disabled={local.disabled \|\| local.loading}`. | `ui-multi-select.tsx` whole file |
| Rest (item)                | `background: var(--sa-multi-select-item-bg)`, `color: var(--sa-text-secondary)`                                                                                                                                                                                                                                                                                              | `ui.css:526-541`                 |
| Hover (item)               | `background`/`color` shift — **unconditional `:hover`, no `[data-highlighted]` companion** (single-select pairs the two; multi-select has only hover)                                                                                                                                                                                                                        | `ui.css:543-546`                 |
| Selected (item)            | `background: var(--sa-bg-selected)`, `border-inline-start-color`/`color: var(--sa-color-primary)`, `✓` glyph                                                                                                                                                                                                                                                                 | `ui.css:548-558`                 |
| Selected + hover (item)    | Mirrors single-select's intensified-background treatment, but without single-select's separate `[data-highlighted][data-selected]` variant                                                                                                                                                                                                                                   | `ui.css:560-562` vs `503-510`    |
| Disabled (item)            | `color: var(--sa-text-disabled)`, `cursor: not-allowed` — **different cursor value than single-select-item's `default`** for the identical semantic state                                                                                                                                                                                                                    | `ui.css:564-567` vs `488`        |
| Focus-visible (item)       | No rule (same gap as single-select)                                                                                                                                                                                                                                                                                                                                          | grep-confirmed                   |
| Danger                     | N/A                                                                                                                                                                                                                                                                                                                                                                          | —                                |

#### 10. `UiCollectionCursor` (`ui-collection-cursor.tsx`, `ui.css:231-331`)

Composes `UiActionButton` (nav + lifecycle) and `UiButton` (delete-confirmation dialog), plus
a bespoke pip readout — defines no state colors of its own.

- Nav actions (`ui-collection-cursor.tsx:113-172`): Previous/Next are icon-only
  (`labelMode` defaults `'hidden'`); Delete and New are `labelMode='visible'`, **neither
  carries `variant='danger'`** despite Delete being destructive. Since `UiActionButton`'s CSS
  has no rule keyed on `labelMode` (§2), **all four nav actions now share one color model** —
  the "two competing state models" the brief describes no longer exists in the cursor's own
  composition.
- Destructive intent is expressed _only_ in the confirmation dialog's `UiButton
  variant='danger'` (`ui-collection-cursor.tsx:205`), not on the nav trigger itself.
- Pip readout: present-state uses `background: currentColor` (inherits text-secondary);
  **selected-state uses `--sa-color-accent`** (`ui.css:283-287`) — a third brand-adjacent role
  token, distinct from `primary`/`secondary`, used nowhere else in the audited set.

**Vs. the brief's stated symptom** ("navigation rests primary, life-cycle rests text-primary"):
**also stale** — both now rest identically at `text-primary`, because the underlying
`UiActionButton` resting-color-by-labelMode split (§2) no longer exists. Remaining live
concern: Delete's lack of a danger cue before the confirmation dialog opens — a design
question, not a broken contract.

### (b) Ranked list of inconsistencies

1. **`UiMultiSelect` `disabled`/`loading` are functionally inert — a real bug, not a style
   gap.** Never forwarded to Kobalte's `Listbox`; a "disabled" multi-select stays fully
   interactive at full opacity. `ui-multi-select.tsx` whole file; `ui.css:430-437`.
2. **Checked/selected + hover regresses color** for both `UiCheckbox` and `UiRadioItem`
   labels, via a CSS specificity collision (`:hover` selector at (0,0,3,1) beats `[data-checked]`
   at (0,0,2,1)). Hovering a _checked_ control visibly downgrades its color. `ui.css:798-801`
   vs `828-831`.
3. **`UiTab` disabled has zero visual treatment** — colorimetrically identical to rest,
   enabled, unselected. Every other audited control dims or recolors on disable; tabs don't.
4. **Danger `UiActionButton` hover is three-toned** — icon correctly danger, frame turns
   brand-primary, label turns neutral, all on hover, all on one destructive action.
   `ui.css:144-166, 217-220`.
5. **`error` is a no-op for five of ten components** — `UiButton`, `UiActionButton`,
   `UiToggle`, `UiTabs`, `UiAccordion` all accept the prop and feed `controlState()`, but no
   `[data-ui-state='error']` rule exists for any of them.
6. **`loading` has no visual expression anywhere** in `ui.css`, despite disabling every
   control that supports it natively — a loading control looks like a normal resting one.
7. **Secondary `UiButton`'s resting background equals the generic hover background token**,
   so secondary buttons show no background change on hover — only shadow/transform move.
   Primary has an analogous near-duplication in the dark theme.
8. **Disabled is implemented three incompatible ways** across the ten controls: opacity-dim at
   the root, bare cursor-only with no color change (per-item radio), explicit color
   substitution with no opacity change (accordion/select items) — plus inconsistent cursor
   values (`default` vs `not-allowed`) for what two components document as the same concept.
9. **Pressed/selected/expanded + hover has no explicit rule** for toggle, tabs, or accordion —
   the "keeps state look, no hover feedback" outcome is a byproduct of CSS source order, not
   design intent, same brittleness as #2 just currently landing on a less-visible outcome.
10. **A third brand-adjacent role, `--sa-color-accent`**, is used only for the
    collection-cursor's selected pip — "selected" is expressed with three different tokens
    across the ten controls depending which one you're in.
11. **The single-select chevron's `--sa-color-primary` tint is permanent**, unconditioned by
    any state — the purest instance of the brief's core complaint (primary used as decoration,
    not signal).
12. **Focus-visible is entirely absent for popup-list items in both selects** — reasonable for
    single-select's `[data-highlighted]` substitution, but multi-select's inline listbox has
    neither `:focus-visible` nor `[data-highlighted]`, only `:hover`.
13. **`UiAccordion` relocates its focus ring to the parent item** — the only audited control
    where the interactive element suppresses its own ring in favor of an ancestor. Possibly
    intentional; worth confirming before normalizing.
14. **`variant='ghost'` on `UiButton` has no rule of its own** — visually identical to omitting
    `variant`, despite being a declared type option.

### (c) Documentation reconciliation

Neither `ux-components-guide.md` nor `ux-components-guide-lite.md` describes visual state
behavior (rest/hover/focus-visible/selected/danger) for **any** of the ten components — both
are scoped to purpose, props, composition, emitted attribute _names_, and usage examples. So
for the color axis specifically, there's nothing to diverge from anywhere.

What the docs _do_ claim, checked against code:

| Component                                                         | Doc claim                                                                                                      | Reality                                                                                                                                                                                                                  | Verdict                                                                                                                                 |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| `UiActionButton`                                                  | Hidden label never reveals on hover (`ux-components-guide.md:786-788`)                                         | Confirmed accurate                                                                                                                                                                                                       | Matches                                                                                                                                 |
| `UiActionButton`, `UiButton`, `UiToggle`, `UiTabs`, `UiAccordion` | Props tables list `error`/`loading` implying visible effect                                                    | No `[data-ui-state='error']` rule exists for any of these five; `loading` has none anywhere                                                                                                                              | **Diverges**, five times                                                                                                                |
| `UiCollectionCursor`                                              | "Emitted Attributes" lists `data-ui-current`, three other attribute names (`ux-components-guide.md:1250-1263`) | None of the five listed exist in the component. Actual attributes (`collection-cursor-nav`, `-readout`, `-pip` with `data-ui-pip` not `data-ui-current`, `-count`, `-body`, `-empty*`, `-confirm*`) aren't listed at all | **Diverges — stale documentation**, worth fixing alongside or ahead of this brief since it sits directly in the file this brief touches |
| `UiSingleSelect`, `UiButton`, `UiActionButton`                    | Emitted-attribute lists                                                                                        | Match exactly                                                                                                                                                                                                            | Matches                                                                                                                                 |
| Remaining six components                                          | Props/composition tables                                                                                       | Match declared props; spot-checked, no divergence                                                                                                                                                                        | Matches (props-level only — state was never documented either way)                                                                      |

### (d) Existing state-category vocabulary

**No document defines the brief's proposed category set** (rest/hover/focus-visible/
selected-checked-active-open/danger) as a named, cross-control vocabulary. What exists
instead:

1. A **separate, unrelated "state" taxonomy** already lives in the design language:
   `--sa-state-*` tokens (`default|success|warning|danger|info`, `roles.css:201-223`) are the
   semantic banner/badge/alert axis, not the interactive-affordance axis this brief is about.
   Worth naming the new vocabulary distinctly to avoid colliding with an existing, documented
   meaning of "state."
2. The **token-naming grammar already has a latent, informal convention**: each control
   invents its own past-participle word for "selected" (`pressed` for toggle, `selected` for
   tabs, `expanded` for accordion) in the `{variant}` slot, but the `{specialization}` slot
   consistently uses `-selected`/`-primary` to tag a color's _role_ (e.g.
   `--sa-toggle-pressed-bg-selected`, `--sa-accordion-expanded-color-primary`,
   `themes.css:29-34, 192-199`). A normalization brief could build on this existing suffix
   convention rather than inventing a new one.
3. `ux-components-internals.md:317-345`'s documented selector skeleton
   (`[data-ui]→[data-ui-variant]→[data-ui-state]→:focus-visible`) is the closest thing to a
   documented state pattern, but `data-ui-state` is explicitly scoped to `error|disabled|
   loading` only — "selected/checked/active/open" is a category the brief itself is inventing
   by retroactively grouping five separate, per-primitive Kobalte attributes
   (`data-pressed`/`data-selected`/`data-checked`/`data-expanded`) that current docs
   deliberately keep apart from the `data-ui-state` channel. Folding them into `data-ui-state`
   would be a scope change to `UiControlState` the brief explicitly says not to make without
   proof.
4. That same internals doc's allowlist (`ux-components-internals.md:280-295`) is itself stale
   against `guard-css.ts:44-64`, which additionally allows `data-expanded` and
   `data-placeholder-shown` — neither mentioned in the doc.
5. `ux-design-archetypes.md` uses "Selection" for a different, non-conflicting concept
   (whether a selected-item indicator belongs on a surface at the IA level) — worth keeping
   distinct from this brief's control-level usage.

**Recommendation:** treat the category vocabulary as an open Chief Architect naming decision,
not something inferable from precedent — the closest existing material (the `-selected`/
`-primary` suffix convention) is a reasonable starting point, not a ready-made answer.

## Recommended production

Normalize shared control-state styling primarily in:

- `source/ux/ui/css/ui.css`

Update component comments only where stale or misleading:

- `source/ux/ui/components/ui-action-button.tsx`
- other `source/ux/ui/components/ui-*.tsx` files only if their comments
  misstate the normalized state contract.

The production should prefer deleting inconsistent special-case rules over adding
new compensating rules.

Do not add new props unless the audit proves an actual missing state concept.
The expected repair is CSS/token-state normalization, not API expansion.

## Specific concerns to address

### `UiActionButton`

**Stale as of the 2026-09-22 audit — the visible/hidden-label resting-color split
described below no longer exists.** Both label modes now rest at `--sa-text-primary`
(`ui.css:99, 176-183`); this section's original premise doesn't match current code.

What the audit found still live instead: the **danger variant is three-toned on
hover/focus** — icon correctly turns `--sa-button-bg-danger-hover`, but the frame ring
and the visible label are not scoped by `data-ui-variant` and fall back to
brand-primary and neutral respectively (`ui.css:153-156` vs `162-166` vs `217-220`). One
destructive action showing danger, primary, and neutral simultaneously on hover is a
sharper instance of this brief's own "primary must have one stable meaning" principle
than the original symptom was. Resolve this instead:

- danger's frame and label hover/focus must scope to the danger variant, not fall
  through to the shared/default rule;
- base action-button color inherits context or uses neutral text (still true, keep);
- hover/focus affordance remains visible without label display changes (still true, keep);
- icon-only actions do not rest in primary solely because they are icon-only (already
  true today per the audit — verify it stays true, don't regress it).

### `UiCollectionCursor`

**Stale as of the 2026-09-22 audit — the navigation/life-cycle color-model split
described below no longer exists.** Both action groups now rest identically at
`text-primary`, a direct consequence of `UiActionButton`'s resting-color split (above)
already having resolved. There is no longer "two unrelated action-button state models"
in this component to reassess.

What the audit found still live instead: the cursor's **Delete nav action carries no
`variant='danger'`** (`ui-collection-cursor.tsx:154-161`), so a destructive action shows
no visual cue at all until its confirmation dialog opens (which does correctly use
`UiButton variant='danger'`, `ui-collection-cursor.tsx:205`). This is a design question
for CA, not a broken contract — nothing today requires nav-level destructive actions to
be styled danger. Decide whether Delete should carry the danger variant as part of this
production, or stay as-is.

### Selection controls

Checkbox, radio, toggle, tab, accordion, single-select, and multi-select should
share a coherent meaning for selected/checked/active/open state.

Primary may remain the selected-state signal, but unselected hover and
selected-hover must be consistent enough that users can predict the treatment.

### Buttons

Buttons may remain distinct where their surface model requires it, but the
distinction must be intentional. If buttons never change text color on hover,
that should be consistent with the wider hover model rather than an accident.

### `UiMultiSelect` — functional bug, found by the 2026-09-22 audit, not in original scope

`UiMultiSelectProps.disabled`/`.loading` are destructured and fed into
`data-ui-state` computation but are **never forwarded to the underlying Kobalte
`Listbox`** (contrast `ui-single-select.tsx:65`, which correctly threads
`disabled={local.disabled || local.loading}`). A "disabled" `UiMultiSelect` today
stays fully interactive — every item remains clickable — at full opacity, since no
`[data-ui='multi-select'][data-ui-state='disabled']` rule exists either. This is a
correctness defect, not a state-model inconsistency: the control does not do what its
own prop says. **CA decision needed**: fix as part of this production (it's the same
file family, `ui-multi-select.tsx`/`ui.css`) or split into its own small fix landing
first, since it doesn't require the state-matrix design work the rest of this brief
does.

### Checked/selected + hover regression — CSS specificity bug, found by the audit

`UiCheckbox` and `UiRadioItem` share one selector shape where hovering a _checked_
control's label visibly downgrades its color from `--sa-color-primary` back to
`--sa-text-primary`: the unconditional hover-label rule
(`[data-ui='checkbox']:not([data-ui-state='disabled']):hover label`, specificity
0,0,3,1) outranks the checked-label rule (`[data-ui='checkbox'][data-checked] label`,
0,0,2,1) — `ui.css:798-801` vs `828-831`, identical shape at the same lines for radio.
This is exactly the "selected + hover" cell required by this brief's own audit
section, and it doesn't merely go unaddressed — it actively contradicts the checked
state on hover. Fix belongs in the normalized selector set this production produces;
the checked/selected rule must win over the plain hover rule for every control, not
just checkbox/radio.

### `UiTabs` disabled — found by the audit

Tabs have no disabled CSS treatment of any kind — Kobalte emits the native
`disabled`/`data-disabled` attributes, but `ui.css` has no selector consuming them for
tabs. A disabled tab is visually identical to a rest, enabled, unselected tab. Every
other audited control gets some explicit dimming or recoloring on disable; tabs
should too, to whatever the approved disabled treatment turns out to be.

### `error` and `loading` props — found by the audit

`error` is a declared, wired-through prop on `UiButton`, `UiActionButton`, `UiToggle`,
`UiTabs`, and `UiAccordion` (all feed `controlState()` and can emit
`data-ui-state='error'`), but no `[data-ui-state='error']` rule exists for any of the
five — setting `error` on these currently changes nothing visually. `loading` has no
visual rule anywhere in `ui.css` for any component, despite disabling the control
natively wherever it's supported — a loading control looks identical to a normal
resting one. Both belong in the normalized state matrix as real, addressable cells,
not left as documented-but-inert props.

## Files likely in scope

In:

- `source/ux/ui/css/ui.css`

Possibly in:

- `source/ux/ui/components/ui-action-button.tsx`
- `source/ux/ui/components/ui-button.tsx`
- `source/ux/ui/components/ui-checkbox.tsx`
- `source/ux/ui/components/ui-radio-group.tsx`
- `source/ux/ui/components/ui-toggle.tsx`
- `source/ux/ui/components/ui-tabs.tsx`
- `source/ux/ui/components/ui-accordion.tsx`
- `source/ux/ui/components/ui-single-select.tsx`
- `source/ux/ui/components/ui-multi-select.tsx`
- `source/ux/ui/components/ui-collection-cursor.tsx`

Only touch component files if their comments, emitted state attributes, or
contracts are stale or insufficient for the normalized state model.

**Possibly in — found by the 2026-09-22 audit, CA to decide:**
`documentation/ux/ux-components-guide.md`'s "Emitted Attributes" list for
`UiCollectionCursor` (lines 1250-1263) names five attributes that don't exist in
`ui-collection-cursor.tsx` and omits the five that do — including calling the pip's
`data-ui-pip` attribute `data-ui-current`, which isn't its name. This sits directly
next to the file this brief already touches. Fold the correction in here, or leave it
for a separate documentation pass — either is defensible, but it shouldn't fall through
unnoticed a second time.

Out:

- Domain, persistence, protocols, migrations, and API contracts.
- Dashboard schema, widget registry, seeds, or app state.
- Helm-specific boundary repair beyond what is necessary to keep shared control
  states coherent. The HelmButton boundary repair has its own brief.
- Application feature styling outside `ux/ui`, unless the normalized UI state
  reveals an app-local override that must be removed and the Chief Architect
  explicitly expands scope.
- Guard rule changes.
- Git operations; the Chief Architect commits.

## Checks

Run:

```sh
deno task fmt
deno task check
```

`deno task check` runs all thirteen guards, `guard:namespaces` among them. The
tree is green as of 2026-08-17. Report any failure rather than working around it
or declaring it unrelated.

## Behavioural verification

Manual browser verification is required. Report each item.

**"Coherent" below means "matches the approved state matrix" — not "looks
consistent to the implementer."** Each item is checked against the artifact
approved at the audit gate, cell by cell. Without that matrix these items are not
falsifiable, and an unfalsifiable check is the seam this production would drift
through.

1. `UiButton` rest, hover, focus-visible, disabled, primary, secondary, and
   danger treatments are coherent.
2. `UiActionButton` visible-label and hidden-label modes share the same semantic
   color model.
3. `UiActionButton` hover/focus does not change label display or layout width.
4. `UiActionButton` danger variant remains visually destructive at rest and on
   hover/focus.
5. `UiCollectionCursor` navigation and life-cycle actions no longer demonstrate
   conflicting action-button state models.
6. Checkbox rest, hover, focus-visible, checked, checked-hover, and disabled
   states are coherent.
7. Radio rest, hover, focus-visible, checked, checked-hover, and disabled states
   are coherent.
8. Toggle rest, hover, focus-visible, selected, selected-hover, and disabled
   states are coherent.
9. Tabs rest, hover, focus-visible, selected, selected-hover, and disabled states
   are coherent.
10. Accordion trigger rest, hover, focus-visible, open, open-hover, and disabled
    states are coherent.
11. Single-select rest, hover, focus-visible, selected option, selected-hover,
    and disabled states are coherent.
12. Multi-select rest, hover, focus-visible, selected option, selected-hover, and
    disabled states are coherent.
13. No control changes label display on hover/focus.
14. No control has hover-induced layout oscillation.

## Escalation

Stop and report if the repair appears to require:

- new semantic token definitions;
- changing design-language documentation;
- changing guard rules;
- adding state props to multiple primitives;
- changing app-local feature behavior outside the shared UI control layer;
- resolving Helm-specific boundary work that belongs to the separate HelmButton
  brief;
- accepting an inconsistency because it is difficult to normalize.

_End of Brief_
