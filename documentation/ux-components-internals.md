![swarmAg Operations System](../swarmag-ops-logo.png)

# swarmAg Operations System — Component Internals

## 1. Overview

This document is the implementation reference for `ux/common` control primitives. It covers CSS architecture, control contracts, token layers, and selector discipline.

**Audience:** Implementers building, modifying, or auditing controls in `source/ux/common/components/ui/`, the reserved chart-control directory in `source/ux/common/components/charts/`, or the shared CSS files.

Consumers of controls use `ux-components-guide.md`.

## 2. CSS Architecture

### 2.1 Files

Four foundation files live in `source/ux/common/components/css/`. App roots import the shared CSS barrel once:

```typescript
import '@ux/common/components/css/css.tsx'
```

| File         | Owns                                                                                                      | Must not contain                                      |
| ------------ | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `tokens.css` | Primitive tokens and shared foundation scales                                                             | Element selectors, control selectors, keyframes       |
| `themes.css` | Theme role tokens and UI control component tokens                                                         | Element selectors, control selectors, keyframes       |
| `base.css`   | Browser foundation, global page background, fonts, resets, keyframes, global semantic HTML element styles | Reusable control visuals, app/page layout rules       |
| `ui.css`     | Reusable UI control visuals and declared control parts                                                    | Primitive palette references, app/page-specific rules |

Shell-specific styles live with the shell component that owns them. For example,
`source/ux/common/shell/login.css` is imported by the login shell component
rather than by app roots.

Raw values are allowed in `tokens.css` and `themes.css` because they define the design vocabulary. Raw browser/platform values are allowed sparingly in `base.css`. `ui.css` uses tokens for meaningful visual values; CSS keywords (`none`, `unset`, `inherit`, `auto`, `transparent`) may appear where tokenization adds no meaning.

### 2.2 Token Layers

| Layer          | File            | Scope                                     |
| -------------- | --------------- | ----------------------------------------- |
| Primitive      | `tokens.css`    | Bare L C H triplets and foundation scales |
| Role / theme   | `themes.css`    | Resolved semantic roles per theme         |
| Component      | `themes.css`    | UI control tokens                         |
| Foundation CSS | `base.css`      | Browser and semantic HTML element styling |
| UI CSS         | `ui.css`        | UI control and declared part styling      |
| Shell CSS      | Shell-local CSS | Shell component-specific styling          |

Controls follow this dependency order:

```text
primitive tokens → role tokens → component tokens → selectors
```

Rules:

- `--sa-p-*` primitives are internal and are not consumed directly by `ui.css`.
- Role tokens describe semantic meaning: color, background, text, border, shadow, gradient, typography, spacing, motion, and interaction state.
- Component tokens describe UI control concerns and use the `--sa-{control}-{attribute}` or `--sa-{control}-{variant}-{attribute}` shape.
- Specialized component tokens append specialization last: `--sa-{control}-{variant}-{attribute}-{specialization}`.
- Selectors in `ui.css` consume role and component tokens, not raw color or spacing decisions.

### 2.3 Prefix Convention

All tokens use the `--sa-` prefix.

| Prefix            | Scope                                 |
| ----------------- | ------------------------------------- |
| `--sa-p-`         | Primitives                            |
| `--sa-color-`     | Semantic colors                       |
| `--sa-bg-`        | Background surfaces                   |
| `--sa-text-`      | Text colors                           |
| `--sa-border-`    | Borders                               |
| `--sa-shadow-`    | Shadows / elevation                   |
| `--sa-gradient-`  | Gradients                             |
| `--sa-*-font-`    | Typography role and component tokens  |
| `--sa-radius-`    | Border radius                         |
| `--sa-space-`     | Spacing scale                         |
| `--sa-motion-`    | Motion durations and animation timing |
| `--sa-button-`    | Button component tokens               |
| `--sa-control-`   | Shared control component tokens       |
| `--sa-input-`     | Input, textarea, and select tokens    |
| `--sa-shell-`     | App shell chrome tokens               |
| `--sa-toggle-`    | Toggle component tokens               |
| `--sa-tab-`       | Tabs component tokens                 |
| `--sa-accordion-` | Accordion component tokens            |
| `--sa-separator-` | Separator component tokens            |
| `--sa-card-`      | Card component tokens                 |
| `--sa-table-`     | Table component tokens                |
| `--sa-dash-`      | Dashboard layout spacing              |
| `--sa-form-`      | Form container spacing                |
| `--sa-field-`     | Field group spacing                   |
| `--sa-touch-`     | Touch target sizing                   |

### 2.4 Common Component Structure

```text
ux/
└── common/
    └── components/
        ├── charts/      — reserved chart-control directory        
        ├── css/         — CSS barrel, tokens, themes, base, controls
        ├── fonts/       — self-hosted woff2 font assets
        ├── icons/       — icon library
        └── ui/          — UI control primitives
```

## 3. Control Contract

All primitives in `source/ux/common/components/ui/` emit semantic attributes and keep visual styling in `ui.css`.

### 3.1 Semantic Identity

Canonical `data-ui` values:

```text
accordion
accordion-content
accordion-item
accordion-trigger
alert
avatar
badge
button
card
checkbox
dialog
dialog-overlay
field
fieldset
footer
footer-logo
form-actions
input
layout
list
list-item
multi-select
multi-select-item
popover
progress
progress-fill
progress-track
radio
radio-group
radio-item
separator
single-select
single-select-content
single-select-icon
single-select-icon-glyph
single-select-item
skeleton
spinner
tab
tab-list
tab-panel
table
table-body
table-cell
table-container
table-head
table-row
tabs
textarea
toggle
toggle-group
toggle-item
tooltip
```

Mapping is derived from component name:

- `UiButton` → `data-ui="button"`
- `UiInput` → `data-ui="input"`
- `UiSingleSelect` → `data-ui="single-select"`

Rules:

- lowercase
- singular
- no `app-` prefix
- compound identities use kebab-case
- one element has one `data-ui` identity

### 3.2 Variants

Variants are only valid where explicitly declared.

| Control / Part | Attribute         | Declared Values                                     |
| -------------- | ----------------- | --------------------------------------------------- |
| `alert`        | `data-ui-variant` | `success`, `warning`, `danger`, `info`              |
| `badge`        | `data-ui-variant` | `success`, `warning`, `danger`, `info`              |
| `button`       | `data-ui-variant` | `primary`, `secondary`, `ghost`, `danger`           |
| `card`         | `data-ui-variant` | `widget`, `workflow`                                |
| `field`        | `data-ui-variant` | `caption`, `inline`                                 |
| `layout`       | `data-ui-variant` | `block-fit`, `inline`, `inline-fill`, `inline-wrap` |
| `list`         | `data-ui-variant` | `bullet`, `numbered`                                |
| `table-row`    | `data-ui-variant` | `section`                                           |

Controls and parts may additionally declare these extension attributes:

| Control / Part    | Attribute          | Declared Values          |
| ----------------- | ------------------ | ------------------------ |
| `layout`          | `data-ui-gap`      | `loose`, `tight`, `none` |
| `table-cell`      | `data-ui-align`    | `start`, `center`, `end` |
| `table-container` | `data-ui-overflow` | `hidden`, `scroll`       |

Rules:

- no undeclared variants
- no implicit defaults beyond what is defined
- controls do not invent free-form values

### 3.3 State

Controls may emit operational state:

```text
data-ui-state="error | disabled | loading"
```

Rules:

- explicit only
- no free-form values
- state reflects actual runtime condition

### 3.4 Styling

Controls do not:

- apply visual classes
- define color, shadow, typography, spacing, or motion in component code
- use inline styles
- reference tokens directly

Controls emit semantic attributes only. Reusable primitive styling lives in `ui.css` and consumes variables from `tokens.css` and `themes.css`.

Selectors:

```text
[data-ui="..."]
[data-ui-variant="..."]
[data-ui-gap="..."]
[data-ui-align="..."]
[data-ui-state="..."]
```

### 3.5 Behavior Binding

- Interactive controls bind to their declared browser or Kobalte primitive.
- Kobalte provides behavior and accessibility for controls that need composite interaction.
- Controls attach semantic attributes to the root DOM element or declared primitive parts.
- Kobalte is not exposed externally.

### 3.6 Reference Identity

`data-ui` identifies the UI control or UI control part. It is not a consumer
reference hook. Consumer reference identity is driven by `name`.

Rules:

- Public UI control identity prop is `name`.
- Components derive DOM `id` internally from `name` when a rendered element needs a reference target.
- Optional `id` is an escape hatch only where the component public API explicitly declares it.
- Native `name` is forwarded only where it has actual browser form semantics; otherwise `name` is design-system identity input.
- When both `id` and `name` are supported and provided, `id` is the rendered DOM target and `name` remains the Ui reference identity or native form name according to the component contract.
- `UiField.for` is used only in label mode and must target a real labelable rendered element.
- `UiField variant='caption'` is used for non-labelable controls and renders caption semantics instead of `<label for>`.

Labelable controls must derive the same DOM `id` from the same `name` value, so
consumers can write `<UiField for='x'>` with `<UiInput name='x'>`.
Non-labelable controls such as `UiList`, `UiTable`, and Kobalte listbox roots
must use `UiField variant='caption'`.

Caption mode is a semantic change only. `[data-ui='field'] > figcaption` renders
with the same local field treatment as `[data-ui='field'] > label`.

### 3.7 Structural Boundary

Controls are atomic in scope. They do not:

- coordinate application state
- implement workflows
- perform validation orchestration

Layout controls such as `UiLayout` and `UiFormActions` manage local child arrangement only.

### 3.8 Attribute Discipline

UI control wrappers manually emit only declared semantic attributes:

```text
data-ui
data-ui-variant
data-ui-gap
data-ui-align
data-ui-overflow
data-ui-state
```

Underlying primitives emit ARIA and library-specific state attributes. `ui.css`
may consume Kobalte and ARIA runtime attributes when they represent real primitive
state:

```text
[data-checked]
[data-pressed]
[data-selected]
[data-highlighted]
[data-disabled]
[aria-checked='true']
[aria-pressed='true']
[aria-selected='true']
[role='tab']
[role='progressbar']
```

Feature and app code do not invent styling attributes (`data-card-mode`, `data-page-section`, `data-feature-state`). New `data-ui` values for controls or control parts are declared in this document before use.

### 3.9 Enforcement

Violations:

- missing `data-ui`
- invalid or undeclared variant
- invalid or undeclared state
- undeclared control or part identity
- styling inside control
- bypassing control when one exists

All violations are detectable via guard scripts in `source/devops/guards/`.

## 4. Selector Pattern

All component visual rules live in `ui.css`. This section defines the selector pattern and per-control intent.

```css
[data-ui='<control>'] {
  /* base */
}

[data-ui='<control>'][data-ui-variant='<variant>'] {
  /* variant */
}

[data-ui='<control>'][data-ui-state='<state>'] {
  /* state */
}

[data-ui='<control>'][data-ui-gap='<gap>'] {
  /* layout gap density */
}

[data-ui='<control>'][data-ui-overflow='<overflow>'] {
  /* overflow behavior */
}

[data-ui='<control>']:focus-visible {
  /* focus */
}
```

Primitive part selectors use distinct `data-ui` identities:

```css
[data-ui='tab-list'] [data-ui='tab'] { … }
[data-ui='toggle-group'] [data-ui='toggle-item'] { … }
[data-ui='progress'] [data-ui='progress-fill'] { … }
```

This selector shape is invalid because one element cannot hold two different `data-ui` identities:

```css
/* INVALID */
[data-ui='tabs'][data-ui='tab']
[data-ui='toggle-group'][data-ui='toggle-item']
[data-ui='progress'][data-ui='progress-fill']
```

`ui.css` does not depend on app-specific structure, arbitrary descendant content (`h3`, `p`, etc.), or page-layout sibling relationships. Repeated structural styling belongs in a named common control or in app-local CSS when it is app-specific.

## 5. Per-Control Intent

### 5.1 Interactive Controls

| Control         | Intent                                                                 |
| --------------- | ---------------------------------------------------------------------- |
| `button`        | Action trigger with primary, secondary, ghost, and danger variants     |
| `input`         | Single-line text entry                                                 |
| `textarea`      | Multi-line text entry                                                  |
| `single-select` | Dropdown single-value picker                                           |
| `multi-select`  | Inline multi-value listbox                                             |
| `checkbox`      | Checkbox with inline label                                             |
| `radio-group`   | Radio selection group                                                  |
| `toggle`        | Standalone pressed/unpressed toggle                                    |
| `toggle-group`  | Single-select segmented toggle group                                   |
| `tabs`          | Tabbed content primitive                                               |
| `accordion`     | Collapsible content primitive                                          |
| `dialog`        | Modal content primitive with overlay                                   |
| `popover`       | Floating content panel anchored to a trigger                           |
| `tooltip`       | Hover/focus advisory content                                           |
| `progress`      | Linear determinate progress, with `progress-track` and `progress-fill` |

### 5.2 Display Controls

| Control     | Intent                                                        |
| ----------- | ------------------------------------------------------------- |
| `badge`     | Inline status pill                                            |
| `alert`     | Inline feedback message with left-border accent               |
| `avatar`    | User or entity initials/avatar marker                         |
| `card`      | Framed content surface with panel, widget, and workflow looks |
| `separator` | Horizontal or vertical visual rule                            |
| `spinner`   | Indeterminate loading indicator                               |
| `skeleton`  | Loading placeholder shimmer                                   |

### 5.3 Layout Controls

| Control           | Intent                                                            |
| ----------------- | ----------------------------------------------------------------- |
| `layout`          | General block and inline child arrangement                        |
| `list`            | Semantic list with unset, bullet, and numbered variants           |
| `table`           | Semantic table family with header/body/row/cell parts             |
| `table-container` | Optional overflow wrapper emitted by `UiTable`                    |
| `footer`          | Branded footer primitive using shell chrome and safe-area support |
| `field`           | Label + control wrapper                                           |
| `fieldset`        | Semantic group boundary with legend                               |
| `form-actions`    | Right-aligned action row for form submission and dismissal        |

## 6. Chart Controls

Charts are standardized through `UiChart`. Chart.js is the internal engine and must not be consumed directly by views or widgets.

**Location:** `source/ux/common/components/charts`

| Component   | Purpose                             |
| ----------- | ----------------------------------- |
| `UiChart`   | Token-aware chart primitive wrapper |
| `PieChart`  | Composition at a point in time      |
| `BarChart`  | Frequency / volume over categories  |
| `LineChart` | Trend over rolling time period      |
| `Sparkline` | Inline mini trend                   |

## 7. Style Guide Harness

The style-guide application is a demonstration harness for the design system. It imports shared CSS in canonical order and may style specimen layout, inspection grids, and demo-only spacing. It does not redefine reusable UI control visuals.

Style-guide CSS does not target Ui primitive identities with `[data-ui]` selectors. Demo-only sizing and layout uses wrapper classes.

Style-guide app surfaces preserve the global foundation background unless a specific specimen requires an opaque content surface. Repeated demo treatment that becomes product UI belongs in `source/ux/common/components/` or the shared CSS foundation before application code consumes it.

_End of Component Internals Document_
