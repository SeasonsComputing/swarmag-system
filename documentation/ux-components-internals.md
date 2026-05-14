![swarmAg Operations System](../swarmag-ops-logo.png)

# swarmAg Operations System — Component Internals

## 1. Overview

This document is the implementation reference for `ux/common` control primitives. It covers the CSS architecture, control contract, token inventory, and selector specification.

**Audience:** Implementers building, modifying, or auditing controls in `source/ux/common/components/controls/` or the shared CSS files.

Consumers of controls (feature devs, widget authors) should use `ux-components-guide.md` instead.

## 2. CSS Architecture

### 2.1 Files

Four files live in `ux/common/assets/css/`. Imported once at each app root — never duplicated per app.

**`tokens.css`** — Custom properties only. No element or attribute selectors. Defines primitive, semantic, typography, layout, motion, and component tokens consumed by the rest of the system.

**`base.css`** — Foundation selectors only. Owns `@font-face`, reset, `html`, `body`, global typography inheritance, global background treatment, shared keyframes, global focus, accessibility media queries, and global semantic HTML element styles (`pre`, `table`/`thead`/`th`/`td`/`tr`, `ol`/`ul`/`li`, `fieldset`/`legend`, `figure`/`figcaption`).

**`controls.css`** — App{Control} primitive selectors only. Targets declared `[data-ui]`, `[data-ui-variant]`, `[data-ui-state]`, Kobalte runtime state, and ARIA state attributes. Consumes tokens exclusively for color, size, shadow, motion, typography, and spacing.

**`forms.css`** — Form layout classes only. Defines `.app-field`, `.app-form-grid`, `.app-form-actions` as implementation details consumed by `AppField`, `AppFormGrid`, and `AppFormActions`. These class names are not a public API — consumers use the App form components, never the classes directly.

Import order:

```typescript
import '@ux/common/assets/css/tokens.css'
import '@ux/common/assets/css/base.css'
import '@ux/common/assets/css/controls.css'
import '@ux/common/assets/css/forms.css'
```

### 2.2 File Ownership

| File           | Owns                                                                                                      | Must not contain                                      |
|----------------|-----------------------------------------------------------------------------------------------------------|-------------------------------------------------------|
| `tokens.css`   | Custom properties, theme overrides, responsive token overrides                                            | Element selectors, control selectors, keyframes       |
| `base.css`     | Browser foundation, global page background, fonts, resets, keyframes, global semantic HTML element styles | Reusable control visuals, app/page layout rules       |
| `controls.css` | Reusable primitive control visuals and declared control parts                                             | Primitive palette references, app/page-specific rules |
| `forms.css`    | `.app-field`, `.app-form-grid`, `.app-form-actions` layout classes                                        | Visual styles, token references beyond spacing        |

Raw values are allowed in `tokens.css` because it defines the design vocabulary. Raw browser/platform values are allowed sparingly in `base.css`. `controls.css` must use tokens for meaningful visual values; CSS keywords (`none`, `unset`, `inherit`, `auto`, `transparent`) may appear where tokenization adds no meaning.

### 2.3 Layer Structure

| Layer           | Scope                          | Definition                             |
|-----------------|--------------------------------|----------------------------------------|
| Primitive layer | `:root`                        | Bare L C H triplets, internal use only |
| Semantic layer  | `:root`, `[data-theme='dark']` | Resolved `oklch()` values              |
| Light theme     | `[data-theme='light']`         | Overrides only                         |
| Brand theme     | `[data-theme='brand']`         | Overrides only                         |

### 2.4 Token Prefix Convention

All tokens use `--sa-` prefix.

| Prefix            | Scope                                      |
|-------------------|--------------------------------------------|
| `--sa-p-`         | Primitives (internal — not for components) |
| `--sa-color-`     | Semantic colors                            |
| `--sa-bg-`        | Background surfaces                        |
| `--sa-text-`      | Text colors                                |
| `--sa-border-`    | Borders                                    |
| `--sa-shadow-`    | Shadows / elevation                        |
| `--sa-gradient-`  | Gradients                                  |
| `--sa-font-`      | Typography                                 |
| `--sa-weight-`    | Font weights                               |
| `--sa-leading-`   | Line heights                               |
| `--sa-radius-`    | Border radius                              |
| `--sa-space-`     | Spacing scale                              |
| `--sa-motion-`    | Motion durations and animation timing      |
| `--sa-lift-`      | Reusable elevation transforms              |
| `--sa-btn-`       | Button component tokens                    |
| `--sa-control-`   | Shared control component tokens            |
| `--sa-toggle-`    | Toggle component tokens                    |
| `--sa-tab-`       | Tabs component tokens                      |
| `--sa-separator-` | Separator component tokens                 |
| `--sa-card-`      | Card component tokens                      |
| `--sa-dash-`      | Dashboard layout spacing                   |
| `--sa-form-`      | Form container spacing                     |
| `--sa-field-`     | Field group spacing                        |
| `--sa-touch-`     | Touch target sizing                        |
| `--sa-jr-`        | Job runner specialized tokens              |

Primitive tokens (`--sa-p-*`) are internal vocabulary. `controls.css` consumes semantic, component, typography, layout, and motion tokens — never primitive palette tokens directly.

```
ux/
└── common/
    ├── assets/
    │   ├── css/         — tokens.css, base.css, controls.css, forms.css
    │   ├── fonts/       — self-hosted woff2 font assets
    │   ├── icons/       — icon library
    │   └── …
    ├── views/           — UX projection types
    ├── stores/          — reactive session, app, and dashboard stores
    └── components/
        ├── shell/       — application shell foundation
        ├── controls/    — Kobalte-based UI primitives + form layout primitives
        ├── forms/       — domain form compositions (bounded, app-policy layer)
        ├── charts/      — ChartJS-based charts
        ├── dashboard/   — dashboard layout foundation
        └── widgets/     — catalog of dashboard widgets
```

## 3. Control Contract

All primitive controls in `source/ux/common/components/controls/` must adhere to this contract.

### 3.1 Semantic Identity

All controls must emit:

```
data-ui="<control>"
```

Canonical values:

```
accordion
alert
avatar
badge
button
card
checkbox
checkbox-field
dialog
field
input
multi-select
popover
progress
radio
radio-group
radio-item
row
list
list-item
select
separator
skeleton
spinner
stack
table
table-body
table-cell
table-head
table-row
tabs
textarea
toggle
toggle-group
tooltip
```

Mapping is derived from component name:

- `AppButton` → `data-ui="button"`
- `AppInput` → `data-ui="input"`
- `AppSingleSelect` trigger → `data-ui="select"`

Rules:

- lowercase
- singular
- no prefixes (`app-`)
- compound identities use kebab-case

Controls may declare semantic part identities when the underlying primitive has separately styled parts. Declared part values include:

```
accordion-content
accordion-item
accordion-trigger
dialog-overlay
multi-select-item
progress-fill
progress-track
select-content
select-icon
select-icon-glyph
select-item
tab-list
tab
tab-panel
```

Part identities are `data-ui` values on child elements — not secondary attributes layered onto the root control identity. One element cannot hold two different `data-ui` identities.

### 3.2 Variants

Variants are only valid where explicitly declared.

```
data-ui-variant="primary | secondary | ghost | danger"   (button)
data-ui-variant="widget | workflow"                       (card)
data-ui-variant="bullet | numbered"                       (list)
data-ui-variant="fill"                                    (row)
data-ui-variant="inline"                                  (stack, field)
data-ui-variant="section"                                 (table-row)
data-ui-variant="success | warning | danger | info"       (badge, alert)
```

Rules:

- no undeclared variants
- no implicit defaults beyond what is defined
- controls must not invent new values

### 3.3 State

Controls may emit operational state:

```
data-ui-state="error | disabled | loading"
```

Selection state (Toggle, Tab, Radio) emits a unified active marker:

```
[data-active]
```

Rules:

- explicit only
- no free-form values
- must reflect actual runtime condition

### 3.4 Styling

Controls do not:

- apply visual classes
- define color, shadow, typography, spacing, or motion in component code
- use inline styles
- reference tokens directly

Controls must:

- emit semantic attributes only

Reusable primitive styling lives in `controls.css` and consumes variables from `tokens.css`. Selectors:

```
[data-ui="..."]
[data-ui-variant="..."]
[data-ui-state="..."]
[data-active]
```

### 3.5 Kobalte Binding

- Each control binds to its declared Kobalte primitive
- Kobalte provides behavior and accessibility
- Controls attach semantic attributes to the root interactive DOM element or declared primitive parts
- Kobalte must not be exposed externally

### 3.6 Structural Boundary

Controls are atomic in scope. They do not:

- manage layout
- coordinate other controls
- implement workflows
- perform validation orchestration

### 3.7 Attribute Discipline

App control wrappers manually emit only:

```
data-ui
data-ui-variant
data-ui-state
data-active
```

**The Normalization Principle:** Underlying primitives emit various ARIA and library-specific state attributes (`[data-checked]`, `[data-pressed]`). App control wrappers normalize these into the unified `[data-active]` attribute. `controls.css` targets `[data-active]` for selection visuals — a stable styling API independent of the underlying primitive's ARIA role.

`controls.css` may consume Kobalte and ARIA runtime attributes when they represent real primitive state:

```
[data-checked]
[data-pressed]
[data-selected]
[aria-checked='true']
[aria-pressed='true']
[aria-selected='true']
[role='tab']
[role='progressbar']
```

Feature and app code must not invent styling attributes (`data-card-mode`, `data-page-section`, `data-feature-state`). Any new `data-ui` value for a primitive or primitive part must be declared in this document before use.

### 3.8 Enforcement

Violations:

- missing `data-ui`
- invalid or undeclared variant
- invalid or undeclared state
- undeclared control or part identity
- styling inside control
- bypassing control when one exists

All violations must be detectable via guard scripts in `source/devops/guards/`.

## 4. Control Tokens

Declared in `tokens.css`. Consumed by `controls.css`. Dark values are in `:root`. Light overrides are in `[data-theme='light']`. Tokens with — in both value columns are defined elsewhere in `tokens.css`; they are listed to document the full set `controls.css` depends on.

### 4.1 Button

| Token                                 | Dark value                  | Light value                 |
|---------------------------------------|-----------------------------|-----------------------------|
| `--sa-btn-primary-bg`                 | `var(--sa-color-brand-end)` | `oklch(var(--sa-p-teal))`   |
| `--sa-btn-primary-bg-hover`           | `oklch(80% 0.13 185)`       | `oklch(72% 0.11 184.216)`   |
| `--sa-btn-primary-text`               | `oklch(var(--sa-p-white))`  | `oklch(var(--sa-p-white))`  |
| `--sa-btn-danger-bg`                  | `oklch(var(--sa-p-danger))` | `oklch(var(--sa-p-danger))` |
| `--sa-btn-danger-text`                | `oklch(var(--sa-p-white))`  | `oklch(var(--sa-p-white))`  |
| `--sa-color-primary`                  | —                           | —                           |
| `--sa-color-transparent`              | —                           | —                           |
| `--sa-color-danger`                   | —                           | —                           |
| `--sa-border-brand`                   | —                           | —                           |
| `--sa-gradient-btn`                   | —                           | —                           |
| `--sa-shadow-btn`                     | —                           | —                           |
| `--sa-shadow-glow`                    | —                           | —                           |
| `--sa-button-primary-hover-transform` | —                           | —                           |
| `--sa-text-disabled`                  | —                           | —                           |

### 4.2 Input / Textarea / Select

| Token                     | Dark value                         | Light value                        |
|---------------------------|------------------------------------|------------------------------------|
| `--sa-control-ring-error` | `oklch(var(--sa-p-danger) / 0.22)` | `oklch(var(--sa-p-danger) / 0.18)` |
| `--sa-bg-input`           | —                                  | —                                  |
| `--sa-bg-input-focus`     | —                                  | —                                  |
| `--sa-bg-input-disabled`  | —                                  | —                                  |
| `--sa-border-input`       | —                                  | —                                  |
| `--sa-border-input-focus` | —                                  | —                                  |
| `--sa-border-input-error` | —                                  | —                                  |
| `--sa-focus-ring`         | —                                  | —                                  |
| `--sa-text-placeholder`   | —                                  | —                                  |

### 4.3 Toggle / ToggleGroup

| Token                        | Dark value                       | Light value                      |
|------------------------------|----------------------------------|----------------------------------|
| `--sa-toggle-pressed-bg`     | `oklch(var(--sa-p-teal) / 0.15)` | `oklch(var(--sa-p-teal) / 0.12)` |
| `--sa-toggle-pressed-border` | `oklch(var(--sa-p-teal) / 0.60)` | `oklch(var(--sa-p-teal) / 0.50)` |
| `--sa-toggle-pressed-text`   | `oklch(var(--sa-p-teal))`        | `oklch(var(--sa-p-teal))`        |
| `--sa-bg-surface-2`          | —                                | —                                |
| `--sa-border-default`        | —                                | —                                |
| `--sa-text-muted`            | —                                | —                                |

### 4.4 Semantic / Interactive

All interactive states key off the teal primitive — green and green-teal must not appear here.

| Token                   | Dark value                               | Light value                              |
|-------------------------|------------------------------------------|------------------------------------------|
| `--sa-bg-hover`         | `oklch(var(--sa-p-teal) / 0.1)`          | `oklch(var(--sa-p-teal) / 0.08)`         |
| `--sa-bg-selected`      | `oklch(var(--sa-p-teal) / 0.28)`         | `oklch(var(--sa-p-teal) / 0.15)`         |
| `--sa-shadow-glow`      | `0 0 30px oklch(var(--sa-p-teal) / 0.3)` | `0 0 30px oklch(var(--sa-p-teal) / 0.2)` |
| `--sa-shadow-glow-sm`   | `0 0 20px oklch(var(--sa-p-teal) / 0.3)` | `0 0 20px oklch(var(--sa-p-teal) / 0.2)` |
| `--sa-table-section-bg` | `oklch(var(--sa-p-teal) / 0.2)`          | `oklch(var(--sa-p-teal) / 0.12)`         |

### 4.5 Tabs

Active tab state reuses toggle-pressed tokens — no separate tab active tokens.

| Token                        | Dark value | Light value |
|------------------------------|------------|-------------|
| `--sa-toggle-pressed-bg`     | —          | —           |
| `--sa-toggle-pressed-border` | —          | —           |
| `--sa-toggle-pressed-text`   | —          | —           |
| `--sa-bg-hover`              | —          | —           |
| `--sa-text-muted`            | —          | —           |

### 4.6 Skeleton / Spinner

| Token                   | Dark value                   | Light value              |
|-------------------------|------------------------------|--------------------------|
| `--sa-skeleton-shimmer` | `oklch(42% 0.025 252 / 0.6)` | `oklch(85% 0.008 264.5)` |
| `--sa-bg-surface-2`     | —                            | —                        |
| `--sa-bg-surface-3`     | —                            | —                        |
| `--sa-color-primary`    | —                            | —                        |
| `--sa-border-default`   | —                            | —                        |
| `--sa-motion-spinner`   | —                            | —                        |
| `--sa-motion-skeleton`  | —                            | —                        |

### 4.7 Badge / Alert

| Token                       | Dark value | Light value |
|-----------------------------|------------|-------------|
| `--sa-color-success`        | —          | —           |
| `--sa-color-success-bg`     | —          | —           |
| `--sa-color-success-border` | —          | —           |
| `--sa-color-warning`        | —          | —           |
| `--sa-color-warning-bg`     | —          | —           |
| `--sa-color-warning-border` | —          | —           |
| `--sa-color-danger`         | —          | —           |
| `--sa-color-danger-bg`      | —          | —           |
| `--sa-color-danger-border`  | —          | —           |
| `--sa-color-info`           | —          | —           |
| `--sa-color-info-bg`        | —          | —           |
| `--sa-color-info-border`    | —          | —           |

### 4.8 Card

| Token                      | Dark value | Light value |
|----------------------------|------------|-------------|
| `--sa-bg-card`             | —          | —           |
| `--sa-border-card`         | —          | —           |
| `--sa-shadow-card`         | —          | —           |
| `--sa-gradient-stripe`     | —          | —           |
| `--sa-card-stripe-height`  | —          | —           |
| `--sa-card-stripe-opacity` | —          | —           |
| `--sa-widget-pad`          | —          | —           |

## 5. Control Selectors

All component visual rules live in `controls.css`. This section defines the selector pattern and per-control intent. CE derives the CSS from these specifications and the token values in §4.

### 5.1 Selector Pattern

```css
[data-ui='<control>'] {
  /* base state */
}
[data-ui='<control>'][data-ui-variant='<variant>'] {
  /* variant */
}
[data-ui='<control>'][data-ui-state='<state>'] {
  /* state */
}
[data-ui='<control>']:hover {
  /* hover — only where interactive */
}
[data-ui='<control>']:focus-visible {
  /* focus — defer to --sa-focus-ring where possible */
}
```

Primitive part selectors use distinct `data-ui` identities:

```css
[data-ui='tab-list'] [data-ui='tab'] { … }
[data-ui='toggle-group'] [data-ui='toggle'] { … }
[data-ui='progress'] [data-ui='progress-fill'] { … }
```

The following selector shape is invalid because one element cannot hold two different `data-ui` identities:

```css
/* INVALID */
[data-ui='tabs'][data-ui='tab']
[data-ui='toggle-group'][data-ui='toggle']
[data-ui='progress'][data-ui='progress-fill']
```

`controls.css` must not depend on app-specific structure, arbitrary descendant content (`h3`, `p`, etc.), or page-layout sibling relationships. When a repeated composition needs structural styling, it graduates to a named common component or remains in app-local CSS if app-specific.

### 5.2 Per-Control Intent

**`[data-ui="button"]`**

- Base (ghost): transparent background, `--sa-color-primary` border and text
- `variant="primary"`: `--sa-gradient-btn` background, transparent border, `--sa-btn-primary-text`, `--sa-shadow-btn`
- Primary hover: preserves `--sa-gradient-btn`, adds `--sa-shadow-glow`, applies `--sa-button-primary-hover-transform`
- `variant="secondary"`: `--sa-bg-surface-2` background, `--sa-border-default` border, `--sa-text-primary` text
- `variant="danger"`: solid `--sa-btn-danger-bg`, `--sa-btn-danger-text`
- `state="disabled"`: opacity 0.35, cursor not-allowed
- `state="loading"`: opacity 0.65, cursor wait
- Font: `--sa-font-ui`, `--sa-weight-medium`; primary/danger use `--sa-weight-semibold`
- min-width: `7rem`

**`[data-ui="input"]`, `[data-ui="textarea"]`, `[data-ui="select"]`**

- Base: `--sa-bg-input` background, `--sa-border-input` border, `--sa-radius-md`
- Focus: `--sa-border-input-focus` border, `--sa-focus-ring` box-shadow, `--sa-bg-input-focus` background
- `state="error"`: `--sa-border-input-error` border, `--sa-control-ring-error` box-shadow — no background change
- `state="disabled"`: `--sa-bg-input-disabled`, opacity 0.38, cursor not-allowed
- Placeholder: `--sa-text-placeholder`
- Font: `--sa-font-ui`, `--sa-font-xs`
- `input`, `textarea`: `width: 100%`

**`[data-ui="checkbox"]`, `[data-ui="radio"]`**

- Base: `--sa-bg-input` background, `--sa-border-input` border
- Checked: `--sa-color-primary` fill and border
- `state="error"`: `--sa-border-input-error` border
- Font context (labels): `--sa-font-ui`, `--sa-font-xs`

**`[data-ui="toggle"]`**

- Base: `--sa-bg-surface-2` background, `--sa-border-default` border, `--sa-text-muted` text
- Active state (`[data-active]`): `--sa-toggle-pressed-bg`, `--sa-toggle-pressed-border`, `--sa-toggle-pressed-text`
- min-width: `7rem` standalone; `unset` inside `[data-ui="toggle-group"]`

**`[data-ui="toggle-group"]`**

- Flex container. Child `[data-ui="toggle"]` elements have their inner borders collapsed. First child: left radius only. Last child: right radius only, right border restored.

**`[data-ui="tabs"]`**

- `tab-list`: `inline-flex` row, `gap: --sa-space-sm`, no container background — tabs are individual bordered pills
- `tab`: `--sa-border-default` border, `--sa-radius-sm`, `--sa-text-muted`, `--sa-bg-control` background
- Active tab (`[data-selected]`): `--sa-toggle-pressed-bg`, `--sa-toggle-pressed-border`, `--sa-toggle-pressed-text`
- Keyboard: `activationMode='manual'` (default) — arrow keys move focus, Enter/Space activates

**`[data-ui="progress"]`**

- Track: `--sa-bg-progress-track`, `--sa-radius-full`, fixed height `--sa-jr-progress-height` (job-runner, `1rem`) or `5px` (general)
- `progress-fill`: `--sa-gradient-brand`, same radius

**`[data-ui="spinner"]`**

- Ring: `--sa-border-default`; active arc: `--sa-color-primary`
- Animation: rotate with `--sa-motion-spinner`

**`[data-ui="skeleton"]`**

- Shimmer: 3-stop gradient — `--sa-bg-surface-2` → `--sa-skeleton-shimmer` → `--sa-bg-surface-3`
- Animation: background-position sweep with `--sa-motion-skeleton`

**`[data-ui="badge"]`**

- Pill shape (`--sa-radius-full`), `--sa-font-xs`, `--sa-weight-medium`
- Default (no variant): ghost — transparent background, `--sa-border-default` border
- Per semantic variant: `--sa-color-{state}-bg` background and `--sa-color-{state}` text pairs

**`[data-ui="alert"]`**

- Left border accent (2px), `--sa-radius-md`, `--sa-font-xs`
- Per semantic variant: `--sa-color-{state}-bg` background, `--sa-color-{state}-border` left border, `--sa-color-{state}` text
- Default left border: `oklch(var(--sa-p-white) / 0.4)`

**`[data-ui="separator"]`**

- `--sa-separator-size` rule, `--sa-border-table` color, no border shorthand

**`[data-ui="avatar"]`**

- Circle (`--sa-radius-full`), `--sa-gradient-brand` background, `--sa-text-on-brand` text
- Font: `--sa-font-body`, `--sa-weight-semibold`

**`[data-ui="list"]`**

- Default (no variant): clean unstyled `<ul>` — `list-style: none`, no margin, no padding
- `variant="bullet"`: disc bullets `<ul>`, `padding-inline-start: --sa-space-md`
- `variant="numbered"`: decimal numbered `<ol>`, `padding-inline-start: --sa-space-md`
- `list-item`: `--sa-font-body`, `--sa-font-sm`, `--sa-weight-normal` — content font, not label font

**`[data-ui="card"]`**

- Default (panel): `--sa-card-panel-bg`, `--sa-card-panel-border`, `--sa-card-panel-shadow` — quiet interior surface, no stripe (`--sa-card-panel-stripe-opacity: 0`)
- `variant='widget'`: dashboard surface with stripe and shadow
- `variant='workflow'`: elevated form container with stronger shadow and stripe
- Shared: `--sa-card-radius`, `--sa-widget-pad`, `overflow: hidden`
- "Panel" is the prose name for the default look; `data-ui-variant` is absent on default cards
- No hover lift or hover shadow treatment

**`[data-ui="table"]`, `[data-ui="table-head"]`, `[data-ui="table-body"]`, `[data-ui="table-row"]`, `[data-ui="table-cell"]`**

- `table`: full-width `<table>`, border-collapse, `--sa-border-table` row separators
- `table-head`: `<thead>`; cells render as `<th>` (context provided via Solid context)
- `table-body`: `<tbody>`
- `table-row`: `<tr>`; `section` prop applies `--sa-table-section-bg` accent row treatment
- `table-cell`: context-aware — `<th>` inside header, `<td>` otherwise
- No hover lift. Section row uses `--sa-table-section-bg` (teal, H=184) and indented start padding.

**`[data-ui="row"]`**

- Default: `display: inline-flex`, `flex-wrap: wrap`, gap `--sa-space-md`
- `variant='fill'`: `display: flex`, `width: 100%`
- No state, no Kobalte binding

**`[data-ui="stack"]`**

- Default: `display: grid`, `gap: --sa-space-md`, `width: 100%`
- `variant='inline'`: `justify-items: start`, `width: fit-content`
- No state, no Kobalte binding

## 6. Style Guide Harness

The style-guide application is a demonstration harness for the design system. It imports shared CSS in canonical order and may style specimen layout, inspection grids, and demo-only spacing. It must not redefine reusable App control visuals.

Style-guide CSS must not target App primitive identities with `[data-ui]` selectors. Demo-only sizing and layout must be applied through wrapper classes.

Style-guide app surfaces must preserve the global foundation background unless a specific specimen requires an opaque content surface. Repeated demo treatment that becomes product UI must move into `source/ux/common/components/` or the shared CSS foundation before application code consumes it.

_End of Component Internals Document_
