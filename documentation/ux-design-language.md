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

### 4.1 Token File

**`ux/common/assets/css/tokens.css`**

Single token file. Imported once at the app root. Never duplicated per-app.

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
    └── components/          - shared design-system UI primitives and compositions
        ├── controls/        — Kobalte-based UI primitives
        ├── charts/          — PieChart, BarChart, LineChart, Sparkline
        ├── dashboard/       — dashboard layout foundation
        ├── widgets/         — widget catalog
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

## 8. Component Vocabulary

### 8.1 Controls (Kobalte Primitives)

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

### 8.2 Form Controls

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

Contract:

- `ChartWidget` composes `AppChart`; it does not use Chart.js directly.
- `AppChart` applies design-language tokens (color, typography, spacing, motion).
- `AppChart` presents a component contract style consistent with Kobalte usage.
- Chart.js remains replaceable without changing `ChartWidget` or page APIs.

| Component   | Purpose                             |
| ----------- | ----------------------------------- |
| `AppChart`  | Token-aware chart primitive wrapper |
| `PieChart`  | Composition at a point in time      |
| `BarChart`  | Frequency / volume over categories  |
| `LineChart` | Trend over rolling time period      |
| `Sparkline` | Inline mini trend                   |

_End of UX Design Language Document_
