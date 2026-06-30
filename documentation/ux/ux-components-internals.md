<img src="../../swarmag-ops-logo.png" title="" alt="swarmAg Operations System" data-align="center">

# swarmAg Operations System — Component Internals

## 1. Overview

This document is the implementation reference for `ux/common/components/ui` controls.

## 2. CSS Architecture

`ux-design-language.md` defines the normative CSS layer model, namespace containers,
token naming, immutable foundation tokens, role tokens, and theme behavior. This document
only specifies the component implementation boundary:

- component-specified tokens consumed by `ui.css`, shell CSS, or component-local CSS
- valid `data-ui` selectors and component part identities
- component state and variant attributes
- guard-enforced selector expectations for component CSS

### 2.1 Component Token Catalog

Component-specified tokens live in `themes.css` and are consumed by `ui.css`, shell CSS, or
component-local CSS.

| Family         | Tokens                                                        | Consumer                      |
| -------------- | ------------------------------------------------------------- | ----------------------------- |
| Button         | `--sa-button-*`                                               | `UiButton`                    |
| Shared control | `--sa-control-shadow-error`                                   | Input-like error treatments   |
| Input/select   | `--sa-input-*`, `--sa-single-select-*`, `--sa-multi-select-*` | Text inputs and select parts  |
| Toggle         | `--sa-toggle-*`, `--sa-toggle-group-*`                        | Toggle controls               |
| Tabs           | `--sa-tab-*`                                                  | Tab triggers and panels       |
| Accordion      | `--sa-accordion-*`                                            | Accordion triggers/content    |
| Skeleton       | `--sa-skeleton-*`                                             | Loading placeholders          |
| Card           | `--sa-card-*`                                                 | Card decoration and elevation |
| Table          | `--sa-table-*`                                                | Table parts                   |
| Fieldset       | `--sa-fieldset-*`                                             | Fieldset group boundaries     |
| Progress       | `--sa-progress-*`                                             | Progress track and fill       |
| List           | `--sa-list-*`                                                 | List and list item parts      |
| Avatar         | `--sa-avatar-*`                                               | Avatar marker                 |
| Alert          | `--sa-alert-*`                                                | Alert treatment               |
| Separator      | `--sa-separator-*`                                            | Separator primitive           |
| Shell          | `--sa-shell-*`                                                | Header and footer chrome      |

Shell chrome is a first-class component token family. It lets app frame surfaces diverge from
card surfaces without changing generic panel or card roles.

### 2.2 Common Component Structure

```text
ux/
└── common/
    └── components/
        ├── charts/      — reserved chart-control directory        
        ├── css/         — CSS barrel, tokens, roles, themes, base, controls
        ├── fonts/       — self-hosted woff2 font assets
        ├── icons/       — icon library
        └── ui/          — UI control primitives
```

## 3. Component Contract

All primitives in `source/ux/common/components/ui/` emit semantic attributes and keep visual styling in `ui.css`.

### 3.1 Semantic Identity

Canonical `data-ui` values:

```text
accordion
accordion-content
accordion-item
accordion-trigger
action-button
action-button-icon
action-button-label
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

| Control / Part  | Attribute            | Declared Values                                     |
| --------------- | -------------------- | --------------------------------------------------- |
| `action-button` | `data-ui-variant`    | `default`, `danger`                                 |
| `alert`         | `data-ui-variant`    | `success`, `warning`, `danger`, `info`              |
| `badge`         | `data-ui-variant`    | `success`, `warning`, `danger`, `info`              |
| `button`        | `data-ui-variant`    | `primary`, `secondary`, `ghost`, `danger`           |
| `card`          | `data-ui-decoration` | `gradient`                                          |
| `card`          | `data-ui-elevation`  | `raised`, `floating`                                |
| `field`         | `data-ui-variant`    | `caption`, `inline`                                 |
| `layout`        | `data-ui-variant`    | `block-fit`, `inline`, `inline-fill`, `inline-wrap` |
| `list`          | `data-ui-variant`    | `bullet`, `numbered`                                |
| `table-row`     | `data-ui-variant`    | `section`                                           |

Controls and parts may additionally declare these extension attributes:

| Control / Part    | Attribute          | Declared Values           |
| ----------------- | ------------------ | ------------------------- |
| `action-button`   | `data-ui-icon`     | `edit`, `eject`, `delete` |
| `layout`          | `data-ui-gap`      | `loose`, `tight`, `none`  |
| `tab-list`        | `data-ui-drag`     | `enabled`, `active`       |
| `tab-list`        | `data-ui-layout`   | `between`                 |
| `table-cell`      | `data-ui-align`    | `start`, `center`, `end`  |
| `table-container` | `data-ui-overflow` | `hidden`, `scroll`        |

Rules:

- no undeclared variants
- no implicit defaults beyond what is defined
- controls do not invent free-form values

### 3.3 State

Controls may emit operational state:

```text
data-ui-state = 'error' | 'disabled' | 'loading'
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

Controls emit semantic attributes only. Reusable component styling lives in `ui.css` and
consumes variables from `tokens.css`, `roles.css`, and `themes.css`.

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
data-ui-icon
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

Feature, shell, widget, and app-local styling uses `data-feat` and `data-feat-*`
attributes instead of `data-ui`. Feature identities and modifier values use
lowercase kebab-case. Feature CSS roots selectors at `[data-feat='...']`; it may
descend into `[data-ui='...']` controls only from a feature root.

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
| `action-button` | Compact icon action button for dense surfaces; icon via `data-ui-icon` |
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

| Control     | Intent                                                       |
| ----------- | ------------------------------------------------------------ |
| `badge`     | Inline status pill                                           |
| `alert`     | Inline feedback message with left-border accent              |
| `avatar`    | User or entity initials/avatar marker                        |
| `card`      | Framed content surface with decoration and elevation control |
| `separator` | Horizontal or vertical visual rule                           |
| `spinner`   | Indeterminate loading indicator                              |
| `skeleton`  | Loading placeholder shimmer                                  |

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
