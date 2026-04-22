![swarmAg Operations System](../swarmag-ops-logo.png)

# swarmAg Operations System — UX Design Language

# 1. Overview

This document defines the normative design language, component contracts, and user interface patterns for the swarmAg ecosystem. It serves as the authoritative specification for all UX development across all applications.

**Document Organization:**

- **Foundations (§2–4)**: Typography, color systems, and CSS token governance.
- **Layout & Shell (§5–7)**: Responsive frames, navigation, and application boundaries.
- **Component Catalog (§8)**: Functional specifications for shared primitives and form controls.

## 2. Design Motif

### 2.1 Unified Design Language

The swarmAg product family is governed by a single, unified design language. While application layouts diverge to meet specific operational contexts (e.g., data-dense Admin vs. high-contrast Ops), they share a common foundation of brand primitives, tokens, and component logic.

| Property       | Specification                                         |
| -------------- | ----------------------------------------------------- |
| **Audience**   | Leadership, Operations Staff, and Field Crews         |
| **Motif**      | Dark-mode, data-dense, precision-oriented             |
| **Background** | Near-black oklch foundations                          |
| **Typography** | Lexend (Headings) + Inter (UI/Body) + Cascadia (Mono) |
| **Accent**     | Strategic brand gradient (Green → Teal → Blue)        |
| **Feel**       | Professional, rugged, and purposeful                  |

### 2.2 Brand Gradient

Extracted from the swarmAg Ops logo:

| Stop        | Hex       | oklch                     |
| ----------- | --------- | ------------------------- |
| Green       | `#03b673` | `76.849% 0.13454 123.993` |
| Green-teal  | `#0db17a` | `74.2% 0.122 158.432`     |
| Teal        | `#139d8d` | `68.5% 0.103 184.216`     |
| Teal-blue   | `#028aa8` | `60.8% 0.108 216.744`     |
| Blue        | `#077db2` | `54.3% 0.110 236.182`     |
| Deep anchor | `#1a5360` | `38.7% 0.072 228.640`     |

### 2.3 Dark Theme

The default theme is dark mode:

| Token                | Value                                 |
| -------------------- | ------------------------------------- |
| Page background      | `oklch(13.2% 0.012 264.5 / 0.95)`     |
| Surface 1 (cards)    | `oklch(22.1% 0.010 277.4)`            |
| Surface 2 (sidebars) | `oklch(24.6% 0.016 264.5)`            |
| Surface 3 (chrome)   | `oklch(27.4% 0.014 264.5)`            |
| Primary text         | `oklch(93.5% 0.006 264.5)`            |
| Gradient stripe      | 3px top-border accent on cards/panels |

### 2.4 Color Space

All color tokens use **oklch** throughout. Primitives are bare `L C H` triplets
enabling alpha composition at point of use:

```css
oklch(var(--sa-p-green))         /* fully opaque */
oklch(var(--sa-p-green) / 0.5)   /* 50% alpha */
```

Semantic tokens resolve to full `oklch()` values. Components reference only semantic tokens — never primitives, never raw values.

## 3. Typography

### 3.1 Font Stack

**`ux/common/assets/fonts`**

Fonts are **self-hosted woff2** assets.

| Font                       | File                            | Role                                                       |
| -------------------------- | ------------------------------- | ---------------------------------------------------------- |
| Lexend (variable, 100–900) | Lexend-VariableFont_wght.woff2  | Headings, navigation, buttons, logo                        |
| Inter (400, 600)           | inter-400.woff2 inter-600.woff2 | Form labels, inputs, table headers/cells, badges, metadata |
| Cascadia Mono              | CascadiaMono-Light.woff2        | IDs, coordinates, numeric data fields                      |

`body` inherits Lexend. `input`, `select`, `textarea`, `label`, `th`, `td`, `button`, `[role="option"]`, `[role="menuitem"]` inherit Inter automatically via the global base rule. No per-component font declarations needed for the common case.

### 3.2 Fluid Type Scale

All font sizes use `clamp()` for fluid scaling. See `tokens.css` for the full `--sa-font-*` scale.

## 4. Token Architecture

### 4.1 CSS Files

Two files. Both live in `ux/common/assets/css/`. Both imported once at the app root. Never duplicated per-app.

**`tokens.css`** — Custom properties only. No element or attribute selectors. Defines all primitive and semantic tokens consumed by the rest of the system.

**`controls.css`** — Selector rules only. Targets `[data-ui]`, `[data-ui-variant]`, and `[data-ui-state]` attributes emitted by App{Control} components. Consumes tokens exclusively — never raw values, never primitives.

Import order: `tokens.css` before `controls.css`.

### 4.2 Layer Structure

| Layer           | Scope                          | Definition                             |
| --------------- | ------------------------------ | -------------------------------------- |
| Primitive layer | `:root`                        | Bare L C H triplets, internal use only |
| Semantic layer  | `:root`, `[data-theme="dark"]` | Resolved `oklch()` values              |
| Light theme     | `[data-theme="light"]`         | Overrides only                         |

### 4.3 Theme Switching

Set `data-theme="light"` on `<html>` for light mode. Dark is the default — no
attribute required. Theme switching is a single attribute swap, no JS class
toggling.

### 4.4 Prefix Convention

All tokens use `--sa-` prefix. Sub-namespaces:

| Prefix           | Scope                                     |
| ---------------- | ----------------------------------------- |
| `--sa-p-`        | Primitives (internal, not for components) |
| `--sa-color-`    | Semantic colors                           |
| `--sa-bg-`       | Background surfaces                       |
| `--sa-text-`     | Text colors                               |
| `--sa-border-`   | Borders                                   |
| `--sa-shadow-`   | Shadows / elevation                       |
| `--sa-gradient-` | Gradients                                 |
| `--sa-font-`     | Typography                                |
| `--sa-radius-`   | Border radius                             |
| `--sa-space-`    | Spacing scale                             |
| `--sa-dash-`     | Dashboard layout spacing                  |
| `--sa-form-`     | Form container spacing                    |
| `--sa-field-`    | Field group spacing                       |
| `--sa-touch-`    | Touch target sizing                       |

### 4.5 Design System Locations

```text
ux/
└── common/
    ├── assets/              — static shared visual assets and token definitions
    │   ├── css/             — style sheets & design tokens
    │   ├── fonts/           — font typography
    │   ├── icons/           — icon library
    │   └── ...
    └── components/          — shared design-system UI primitives and compositions
        ├── controls/        — Kobalte-based UI primitives
        ├── charts/          — ChartJS-based charts (PieChart, BarChart, LineChart, Sparkline)
        ├── dashboard/       — dashboard layout foundation
        ├── widgets/         — catalog of dashboard widgets
        ├── shell/           — application shell foundation
        ├── forms/           — adaptive/responsive form foundation
        └── ...
```

# 5. Layout & Viewport

## 5.1 Grid & Spacing System

All layouts MUST align to a 4px base unit. This ensures visual rhythm across data-dense tables in Admin and large-format touch targets in Ops.

| Token             | Value | Usage                             |
| ----------------- | ----: | --------------------------------- |
| `var(--space-xs)` |   4px | Internal component padding        |
| `var(--space-sm)` |   8px | Button/Input grouping             |
| `var(--space-md)` |  16px | Standard gutter / Section padding |
| `var(--space-lg)` |  24px | Page margins (Mobile)             |
| `var(--space-xl)` |  32px | Page margins (Desktop)            |

## 5.2 Viewport Constraints (Normative)

The design language supports three primary viewport classes. Components MUST adapt their density based on these constraints:

1. **Compact (Mobile/Handheld)**: Used primarily by App-Ops. Single-column focus. Minimum touch target of 44x44px.
2. **Medium (Tablet/Large Handheld)**: Hybrid density. Supports sidebar navigation and split-pane views.
3. **Wide (Desktop)**: Used by App-Admin. Maximum data density. Multi-column layouts and persistent navigation.

## 5.3 Layering & Z-Index

To maintain interface predictability, the following z-index scale MUST be used:

| Token            | Value | Usage                     |
| ---------------- | ----: | ------------------------- |
| `--sa-z-below`   |    -1 | Decorations               |
| `--sa-z-base`    |     0 | Content                   |
| `--sa-z-docked`  |    10 | Sticky headers/footers    |
| `--as-z-overlay` |   100 | Modals, popovers, flyouts |
| `--as-z-toast`   |  1000 | System notifications      |

## 6. Dashboard

### 6.1 Widget Sizing

| Size        | Mobile behavior                                 | Desktop behavior       |
| ----------- | ----------------------------------------------- | ---------------------- |
| `landscape` | Full row width                                  | Full row width         |
| `square`    | Full row width, 2rem inline gap between squares | Fixed square dimension |

On mobile, landscape widgets fill the viewport width. Square widgets also fill the viewport width — horizontal swipe reveals adjacent squares.

### 6.2 Widget Taxonomy

Three distinct tiers:

| Tier               | Height                           | Purpose                               |
| ------------------ | -------------------------------- | ------------------------------------- |
| `StatCard`         | Fixed short (`--sa-stat-height`) | KPI metric, tap to drill              |
| `Widget` square    | Equal w/h                        | Self-contained domain or utility unit |
| `Widget` landscape | Full row width                   | Data-dense domain view                |

A widget is a self-contained dashboard unit that owns its own state and
rendering. It is not required to be domain-aware — a clock widget or upload
progress widget are valid widgets.

### 6.3 Dashboard Spacing Tokens

Five independent dials, all responsive across four breakpoints:

| Token             | Meaning                                     |
| ----------------- | ------------------------------------------- |
| `--sa-dash-gap`   | Between widgets, between rows               |
| `--sa-dash-pad`   | Outer edge margin, row to first/last widget |
| `--sa-widget-pad` | Inside a widget, border to content          |
| `--sa-stat-pad`   | Inside a StatCard, border to content        |
| `--sa-form-pad`   | Inside the modal form container             |
| `--sa-field-pad`  | Inside a field group within a form          |

Starting values (tune by eyeball):

| Token             | ≥1024px | ≥768px   | ≥425px  | ≥380px   |
| ----------------- | ------- | -------- | ------- | -------- |
| `--sa-dash-gap`   | 4rem    | 3rem     | 1.5rem  | 1rem     |
| `--sa-dash-pad`   | 4rem    | 2rem     | 1.5rem  | 1rem     |
| `--sa-widget-pad` | 1.5rem  | 1.25rem  | 1rem    | 0.875rem |
| `--sa-stat-pad`   | 1rem    | 0.875rem | 0.75rem | 0.625rem |
| `--sa-form-pad`   | 2.5rem  | 2rem     | 1.5rem  | 1rem     |
| `--sa-field-pad`  | 1rem    | 0.875rem | 0.75rem | 0.625rem |

## 7. Form Pattern

### 7.1 AppForm

Forms are modal-like — they consume all available real estate with a darkened
backdrop and a rounded card container. Implemented with Kobalte `Dialog`.

| Viewport         | Behavior                                                                  |
| ---------------- | ------------------------------------------------------------------------- |
| Mobile           | Full screen takeover                                                      |
| Tablet / Desktop | Centered card, max-width `--sa-form-max-width` (640px), darkened backdrop |

### 7.2 Form Container Tokens

| Token                 | Value                  |
| --------------------- | ---------------------- |
| `--sa-form-max-width` | `640px`                |
| `--sa-bg-backdrop`    | `oklch(0% 0 0 / 0.60)` |
| `--sa-form-pad`       | Responsive — see §6.3  |
| `--sa-field-pad`      | Responsive — see §6.3  |

### 7.3 Form Card Treatment

| Property                   | Token                  |
| -------------------------- | ---------------------- |
| Rounded card               | `--sa-radius-xl`       |
| Gradient stripe top border | `--sa-gradient-stripe` |
| Surface                    | `--sa-bg-surface-1`    |
| Shadow                     | `--sa-shadow-xl`       |

## 8. Component System

### 8.1 Control Primitives

Controls are based on Kobalte primitives and exposed as App{Control} components that bind behavior and emit design-language semantics.

**Location:** `source/ux/common/components/controls`

| Component        | Kobalte Primitive | Notes                                       |
| ---------------- | ----------------- | ------------------------------------------- |
| `AppButton`      | `Button`          | variants: primary, secondary, ghost, danger |
| `AppIconButton`  | `Button`          | round, icon-only                            |
| `AppInput`       | `TextField`       | text, number variants                       |
| `AppTextarea`    | `TextField`       | multiline                                   |
| `AppSelect`      | `Select`          | single value                                |
| `AppMultiSelect` | `Listbox`         | multi value                                 |
| `AppCheckbox`    | `Checkbox`        |                                             |
| `AppRadioGroup`  | `RadioGroup`      |                                             |
| `AppToggle`      | `ToggleButton`    |                                             |
| `AppToggleGroup` | `ToggleButton`    | e.g. calendar/list switcher                 |
| `AppDialog`      | `Dialog`          | modal base                                  |
| `AppPopover`     | `Popover`         | context menu, tooltips                      |
| `AppTooltip`     | `Tooltip`         |                                             |
| `AppTabs`        | `Tabs`            |                                             |
| `AppAccordion`   | `Accordion`       |                                             |
| `AppProgress`    | `Progress`        | linear, workflow progress                   |
| `AppBadge`       | —                 | status pill, signal word severity           |
| `AppAvatar`      | —                 | user avatar, initials fallback              |
| `AppSeparator`   | `Separator`       |                                             |
| `AppAlert`       | —                 | success / warning / danger / info           |
| `AppSpinner`     | —                 | loading state                               |
| `AppSkeleton`    | —                 | loading placeholder                         |

### 8.1.1 Control Contract

All primitive controls MUST adhere to this contract.

#### 8.1.1.1 Semantic Identity

All controls MUST emit:

```
data-ui="<control>"
```

Canonical values:

```
button
input
checkbox
progress
select
dialog
tabs
accordion
...
```

Mapping is derived from component name:

- `AppButton` → `data-ui="button"`
- `AppInput` → `data-ui="input"`

**Rules:**

- lowercase
- singular
- no prefixes (`app-`)

#### 8.1.1.2 Variants

Variants are ONLY valid where explicitly declared.

**Example:**

```
data-ui="button"
data-ui-variant="primary | secondary | ghost | danger"
```

**Rules:**

- no undeclared variants
- no implicit defaults beyond what is defined
- controls must not invent new values

#### 8.1.1.3 State

**Controls may emit state:**

```
data-ui-state="<state>"
```

**Allowed values:**

```
error
disabled
loading
```

**Rules:**

- explicit only
- no free-form values
- must reflect actual runtime condition

#### 8.1.1.4 Styling

**Controls do NOT:**

- apply visual classes
- define spacing, color, or layout
- use inline styles
- reference tokens directly

**Controls MUST:**

- emit semantic attributes only

All styling is defined in `css/tokens.css`.
Selectors:

```
[data-ui="..."]
[data-ui-variant="..."]
[data-ui-state="..."]
```

#### 8.1.1.5 Kobalte Binding

- Each control binds to its declared Kobalte primitive
- Kobalte provides behavior and accessibility
- Controls MUST attach semantic attributes to the root interactive DOM element.
- Kobalte must not be exposed externally

#### 8.1.1.6 Structural Boundary

Controls are atomic in scope.

**They do NOT:**

- manage layout
- coordinate other controls
- implement workflows
- perform validation orchestration

#### 8.1.1.7 Attribute Discipline

**Allowed attributes:**

```
data-ui
data-ui-variant
data-ui-state
```

No other `data-*` attributes are allowed.

#### 8.1.1.8 Enforcement

**Violations:**

- missing `data-ui`
- invalid or undeclared variant
- invalid or undeclared state
- styling inside control
- bypassing control when one exists

All violations must be detectable via guard scripts.

### 8.1.2 Control Tokens

These tokens are declared in `tokens.css` and consumed by `controls.css`. Dark values are in `:root`. Light overrides are in `[data-theme='light']`. Tokens with `—` in both value columns are defined elsewhere in `tokens.css`; they are listed here to document the full set of tokens `controls.css` depends on.

#### Button

| Token                       | Dark value                  | Light value                 |
| --------------------------- | --------------------------- | --------------------------- |
| `--sa-btn-primary-bg`       | `oklch(var(--sa-p-green))`  | `oklch(var(--sa-p-teal))`   |
| `--sa-btn-primary-text`     | `oklch(var(--sa-p-black))`  | `oklch(var(--sa-p-white))`  |
| `--sa-btn-primary-bg-hover` | `oklch(80% 0.13 123.993)`   | `oklch(72% 0.11 184.216)`   |
| `--sa-btn-danger-bg`        | `oklch(var(--sa-p-danger))` | `oklch(var(--sa-p-danger))` |
| `--sa-btn-danger-text`      | `oklch(var(--sa-p-white))`  | `oklch(var(--sa-p-white))`  |
| `--sa-color-primary`        | —                           | —                           |
| `--sa-color-danger`         | —                           | —                           |
| `--sa-border-brand`         | —                           | —                           |
| `--sa-text-disabled`        | —                           | —                           |

#### Input / Textarea / Select

| Token                     | Dark value                         | Light value                        |
| ------------------------- | ---------------------------------- | ---------------------------------- |
| `--sa-control-bg-error`   | `oklch(18% 0.015 25)`              | `oklch(98% 0.010 25)`              |
| `--sa-control-ring-error` | `oklch(var(--sa-p-danger) / 0.22)` | `oklch(var(--sa-p-danger) / 0.18)` |
| `--sa-bg-input`           | —                                  | —                                  |
| `--sa-bg-input-focus`     | —                                  | —                                  |
| `--sa-bg-input-disabled`  | —                                  | —                                  |
| `--sa-border-input`       | —                                  | —                                  |
| `--sa-border-input-focus` | —                                  | —                                  |
| `--sa-border-input-error` | —                                  | —                                  |
| `--sa-focus-ring`         | —                                  | —                                  |
| `--sa-text-placeholder`   | —                                  | —                                  |

#### Toggle / ToggleGroup

| Token                        | Dark value                             | Light value                      |
| ---------------------------- | -------------------------------------- | -------------------------------- |
| `--sa-toggle-pressed-bg`     | `oklch(var(--sa-p-green-teal) / 0.15)` | `oklch(var(--sa-p-teal) / 0.12)` |
| `--sa-toggle-pressed-border` | `oklch(var(--sa-p-green-teal) / 0.60)` | `oklch(var(--sa-p-teal) / 0.50)` |
| `--sa-toggle-pressed-text`   | `oklch(var(--sa-p-green))`             | `oklch(var(--sa-p-teal))`        |
| `--sa-bg-surface-2`          | —                                      | —                                |
| `--sa-border-default`        | —                                      | —                                |
| `--sa-text-muted`            | —                                      | —                                |

#### Tabs (segmented pill)

| Token                  | Dark value                      | Light value                    |
| ---------------------- | ------------------------------- | ------------------------------ |
| `--sa-tab-pill-bg`     | `oklch(var(--sa-p-surface-2))`  | `oklch(88% 0.006 264.5)`       |
| `--sa-tab-active-bg`   | `oklch(var(--sa-p-surface-3))`  | `oklch(100% 0 0)`              |
| `--sa-tab-active-text` | `oklch(var(--sa-p-near-white))` | `oklch(var(--sa-p-surface-1))` |
| `--sa-text-muted`      | —                               | —                              |

#### Skeleton / Spinner

| Token                 | Dark value | Light value |
| --------------------- | ---------- | ----------- |
| `--sa-bg-surface-2`   | —          | —           |
| `--sa-bg-surface-3`   | —          | —           |
| `--sa-color-primary`  | —          | —           |
| `--sa-border-default` | —          | —           |

#### Badge / Alert

| Token                       | Dark value | Light value |
| --------------------------- | ---------- | ----------- |
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

### 8.1.3 Control Selectors

All component visual rules live in `controls.css`. This section defines the selector pattern and per-control intent. CE derives the CSS from these specifications and the token values in §8.1.2.

#### Selector pattern

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

#### Per-control intent

**`[data-ui="button"]`**

- Base (ghost): transparent background, `--sa-color-primary` border and text
- `variant="primary"`: solid `--sa-btn-primary-bg`, `--sa-btn-primary-text`, hover lightens via `--sa-btn-primary-bg-hover`
- `variant="secondary"`: `--sa-bg-surface-2` background, `--sa-border-default` border, `--sa-text-primary` text
- `variant="danger"`: solid `--sa-btn-danger-bg`, `--sa-btn-danger-text`
- `state="disabled"`: opacity 0.35, cursor not-allowed
- `state="loading"`: opacity 0.65, cursor wait
- Font: `--sa-font-display`, `--sa-weight-medium`; primary/danger use `--sa-weight-semibold`

**`[data-ui="input"]`, `[data-ui="textarea"]`, `[data-ui="select"]`**

- Base: `--sa-bg-input` background, `--sa-border-input` border, `--sa-radius-md`
- Focus: `--sa-border-input-focus` border, `--sa-focus-ring` box-shadow, `--sa-bg-input-focus` background
- `state="error"`: `--sa-border-input-error` border, `--sa-control-ring-error` box-shadow, `--sa-control-bg-error` background
- `state="disabled"`: `--sa-bg-input-disabled`, opacity 0.38, cursor not-allowed
- Placeholder: `--sa-text-placeholder`
- Font: `--sa-font-ui`, `--sa-font-xs`

**`[data-ui="checkbox"]`, `[data-ui="radio"]`**

- Base: `--sa-bg-input` background, `--sa-border-input` border
- Checked: `--sa-color-primary` fill and border
- `state="error"`: `--sa-border-input-error` border
- Font context (labels): `--sa-font-ui`, `--sa-font-xs`

**`[data-ui="toggle"]`**

- Base: `--sa-bg-surface-2` background, `--sa-border-default` border, `--sa-text-muted` text
- `.pressed` / `[aria-pressed="true"]`: `--sa-toggle-pressed-bg`, `--sa-toggle-pressed-border`, `--sa-toggle-pressed-text`

**`[data-ui="toggle-group"]`**

- Flex container. Child `[data-ui="toggle"]` elements have their inner borders collapsed. First child: left radius only. Last child: right radius only, right border restored.

**`[data-ui="tabs"]`**

- Tab list: pill container, `--sa-tab-pill-bg` background, `--sa-radius-md`, tight internal padding
- Inactive tab: `--sa-text-muted`, transparent background
- Active tab (`[data-ui="tab"].active` / `[data-selected]`): `--sa-tab-active-bg`, `--sa-tab-active-text`, `--sa-weight-medium`
- No underline separator. The pill pattern is the L&F.

**`[data-ui="progress"]`**

- Track: `--sa-bg-surface-3`, `--sa-radius-full`, fixed height `--sa-jr-progress-height` (job-runner) or 5px (general)
- Fill: `--sa-gradient-brand`, same radius

**`[data-ui="spinner"]`**

- Ring: `--sa-border-default`; active arc: `--sa-color-primary`
- Animation: rotate 0.8s linear infinite

**`[data-ui="skeleton"]`**

- Shimmer: gradient sweep between `--sa-bg-surface-2` and `--sa-bg-surface-3`
- Animation: background-position sweep 1.4s ease-in-out infinite

**`[data-ui="badge"]`**

- Pill shape (`--sa-radius-full`), `--sa-font-xs`, `--sa-weight-medium`
- Per semantic variant: consumes `--sa-color-{state}-bg` and `--sa-color-{state}` text pairs

**`[data-ui="alert"]`**

- Left border accent (2px), `--sa-radius-md`, `--sa-font-xs`
- Per semantic variant: `--sa-color-{state}-bg` background, `--sa-color-{state}-border` left border, `--sa-color-{state}` text

**`[data-ui="separator"]`**

- 1px rule, `--sa-border-table` color, no border shorthand (height: 1px, background)

**`[data-ui="avatar"]`**

- Circle (`--sa-radius-full`), `--sa-gradient-brand` background, `--sa-text-on-brand` text
- Font: `--sa-font-display`, `--sa-weight-semibold`

### 8.2 Form Controls

**Location:** `source/ux/common/components/forms`

| Component             | Purpose                                                |
| --------------------- | ------------------------------------------------------ |
| `AppForm`             | Dialog wrapper, full-screen mobile, card desktop       |
| `AppFieldGroup`       | Labeled group of related fields                        |
| `AppField`            | Label + input + error + help text                      |
| `AppReorderList`      | Drag or up/down sequence — TaskQuestion, WorkflowTask  |
| `AppOptionEditor`     | Dynamic SelectOption list with requiresNote toggle     |
| `AppLocationPicker`   | GPS capture or manual address entry                    |
| `AppAttachmentPicker` | Camera / video / map / document                        |
| `AppSignalWord`       | Visual severity selector — none/caution/warning/danger |
| `AppDatePicker`       | Date + time                                            |
| `AppDurationPicker`   | Duration estimate — hours/minutes                      |
| `AppRoleSelector`     | Multi-role assignment                                  |

### 8.3 Chart Primitives

Charting is standardized through `AppChart`. Chart.js is the selected internal
engine and is not consumed directly by application views or widgets.

**Contract:**

- `ChartWidget` composes `AppChart`; it does not use Chart.js directly.
- `AppChart` applies design-language tokens (color, typography, spacing, motion).
- `AppChart` presents a component contract style consistent with Kobalte usage.
- Chart.js remains replaceable without changing `ChartWidget` or page APIs.

**Location:** `source/ux/common/components/charts`

| Component   | Purpose                             |
| ----------- | ----------------------------------- |
| `AppChart`  | Token-aware chart primitive wrapper |
| `PieChart`  | Composition at a point in time      |
| `BarChart`  | Frequency / volume over categories  |
| `LineChart` | Trend over rolling time period      |
| `Sparkline` | Inline mini trend                   |

_End of UX Design Language Document_
