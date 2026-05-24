![swarmAg Operations System](../swarmag-ops-logo.png)

# swarmAg Operations System — UX Design Language

## 1. Overview

This document defines the brand application layer for the swarmAg ecosystem. It is organized into common foundations shared by all themes, followed by a section per theme that defines its distinct visual character.

**Document Organization:**

| Document                     | Scope                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------- |
| **This document**            | Brand identity: motif, typography, color, themes, layout, dashboard             |
| `ux-components-guide.md`     | Consumer reference: what controls exist, how to use them                        |
| `ux-components-internals.md` | Implementation reference: CSS architecture, control contract, tokens, selectors |

## 2. Common

### 2.1 Unified Design Language

The swarmAg product family is governed by a single, unified design language. All applications share a common foundation of brand primitives, tokens, and component logic. Layouts diverge to meet specific operational contexts — data-dense Admin, high-contrast Ops — but the brand character is constant across all of them.

| Property     | Specification                                                                                                                              |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Audience** | Leadership, Operations Staff, Field Crews                                                                                                  |
| **Feel**     | Professional, rugged, and purposeful                                                                                                       |
| **Accent**   | Gradient accent common to all themes, applied to interactive elements, button fills, card stripes, and surfaces — values defined per theme |

### 2.2 Color Space

All color tokens use **oklch** throughout. Primitives are bare `L C H` triplets enabling alpha composition at point of use:

```css
oklch(var(--sa-p-green))         /* fully opaque */
oklch(var(--sa-p-green) / 0.5)   /* 50% alpha */
```

Semantic tokens resolve to full `oklch()` values. Components reference semantic or component tokens — never primitive palette tokens, never raw visual values.

### 2.3 Theme Switching

Set `data-theme` on `<html>`. Dark is the default — no attribute required.

| Attribute            | Theme          |
| -------------------- | -------------- |
| _(absent)_           | Dark (default) |
| `data-theme="light"` | Light          |
| `data-theme="brand"` | Brand          |

Theme switching is a single attribute swap — no JS class toggling.

### 2.4 Layer Structure

| Layer           | File                  | Scope                  | Purpose                             |
| --------------- | --------------------- | ---------------------- | ----------------------------------- |
| Primitive layer | `tokens.css`          | `:root`                | Bare L C H triplets (internal only) |
| Semantic layer  | `controls-tokens.css` | `[data-theme='dark']`  | Resolved `oklch()` values           |
| Light theme     | `controls-tokens.css` | `[data-theme='light']` | Semantic overrides                  |
| Brand theme     | `controls-tokens.css` | `[data-theme='brand']` | Semantic overrides                  |

See `ux-components-internals.md §2.3–2.4` for the full prefix convention and token inventory.

### 2.5 Typography

**`ux/common/assets/fonts`** — Fonts are self-hosted woff2 assets.

| Font                       | File                           | Role                                                          |
| -------------------------- | ------------------------------ | ------------------------------------------------------------- |
| Comfortaa                  | Comfortaa-Regular.woff2        | Content — headings, paragraphs, body                          |
| Lexend (variable, 100–900) | Lexend-VariableFont_wght.woff2 | All UI text — labels, buttons, inputs, selects, nav, captions |
| Cascadia Mono              | CascadiaMono-Light.woff2       | Code / numeric — IDs, coordinates, code                       |

The brand theme overrides these with Playfair Display (headings) and Inter (UI) — see §5.1.

### 2.5.1 Token Architecture

Font primitives (`--sa-p-font-*`) hold raw font stack values and are internal — consumed only by role tokens, never directly by `base.css` or `controls.css`.

| Primitive             | Value         |
| --------------------- | ------------- |
| `--sa-p-font-content` | Comfortaa     |
| `--sa-p-font-label`   | Lexend        |
| `--sa-p-font-mono`    | Cascadia Mono |

Role tokens provide semantic indirection. A role typeface is changed by changing one token value, not by changing consuming selectors.

| Role token          | Resolves to                | Intent                                       |
| ------------------- | -------------------------- | -------------------------------------------- |
| `--sa-font-heading` | `var(--sa-p-font-content)` | Heading elements                             |
| `--sa-font-body`    | `var(--sa-p-font-content)` | Paragraph and body content                   |
| `--sa-font-label`   | `var(--sa-p-font-label)`   | All label roles (see §2.6)                   |
| `--sa-font-ui`      | `var(--sa-p-font-label)`   | Data entry controls — Lexend (same as label) |
| `--sa-font-mono`    | `var(--sa-p-font-mono)`    | Code and numeric fields                      |

### 2.5.2 Type Scale

Font sizes are fixed role tokens. `controls-tokens.css` defines the role-level font-size tokens consumed by `base.css` and `controls.css`.

### 2.5.3 Typography Role Map

Each HTML element belongs to exactly one typographic role. `base.css` declares the complete type treatment — family, size, and weight — in a single selector group per role. Splitting the treatment across multiple rules causes drift.

| Element(s)                                       | Role                      | Font token          | Size           | Weight |
| ------------------------------------------------ | ------------------------- | ------------------- | -------------- | ------ |
| `h1`–`h6`                                        | Heading                   | `--sa-font-heading` | role scale     | normal |
| `p`                                              | Content                   | `--sa-font-body`    | inherited      | thin   |
| `label`, `button`, `legend`                      | Label                     | `--sa-font-label`   | `--sa-font-sm` | thin   |
| `figcaption`, `th`                               | Annotation / table header | `--sa-font-label`   | `--sa-font-sm` | normal |
| `li` (bare)                                      | Data-adjacent label       | `--sa-font-label`   | `--sa-font-sm` | thin   |
| `[data-ui='list-item']` (`AppListItem`)          | List content              | `--sa-font-body`    | `--sa-font-sm` | normal |
| `td`                                             | Data-adjacent label       | `--sa-font-label`   | `--sa-font-sm` | thin   |
| `input`, `textarea`                              | Data entry                | `--sa-font-ui`      | `--sa-font-xs` | thin   |
| `select`, `[role='option']`, `[role='menuitem']` | Data entry                | `--sa-font-ui`      | `--sa-font-sm` | normal |
| `code`, `pre`, `kbd`, `samp`                     | Code / numeric            | `--sa-font-mono`    | inherited      | —      |

### 2.5.4 Element Overrides

`label` additionally carries `color: var(--sa-text-secondary)` — labels are subordinate to the content they describe. `legend` inherits primary text color as a group heading.

`blockquote`: teal left border (`--sa-color-primary`, 3px), italic, `--sa-text-secondary`, `--sa-font-body`, no inline margin. Styled in `base.css`.

### 2.6 Layout & Viewport

### 2.6.1 Grid & Spacing System

All layouts must align to a 4px base unit. This ensures visual rhythm across data-dense tables in Admin and large-format touch targets in Ops.

| Token           | Value | Usage                             |
| --------------- | ----: | --------------------------------- |
| `--sa-space-xs` |   4px | Internal component padding        |
| `--sa-space-sm` |   8px | Button/input grouping             |
| `--sa-space-md` |  16px | Standard gutter / section padding |
| `--sa-space-lg` |  24px | Page margins (mobile)             |
| `--sa-space-xl` |  32px | Page margins (desktop)            |

### 2.6.2 Viewport Classes

| Class                     | Primary app | Behavior                                              |
| ------------------------- | ----------- | ----------------------------------------------------- |
| Compact (Mobile/Handheld) | App-Ops     | Single-column focus. Minimum touch target 44×44px.    |
| Medium (Tablet)           | Both        | Hybrid density. Sidebar navigation, split-pane views. |
| Wide (Desktop)            | App-Admin   | Maximum data density. Multi-column, persistent nav.   |

### 2.6.3 Z-Index Scale

| Token            | Value | Usage                     |
| ---------------- | ----: | ------------------------- |
| `--sa-z-below`   |    -1 | Decorations               |
| `--sa-z-base`    |     0 | Content                   |
| `--sa-z-docked`  |    10 | Sticky headers/footers    |
| `--sa-z-popover` |    20 | Menus, lists, popovers    |
| `--sa-z-overlay` |   100 | Modals, overlays, flyouts |
| `--sa-z-toast`   |  1000 | System notifications      |

### 2.7 Dashboard

The dashboard is the primary view for all applications. Layout, spacing, and widget sizing are governed by a responsive token system with independent dials across four breakpoints.

### 2.7.1 Widget Sizing

| Size        | Mobile behavior                                 | Desktop behavior       |
| ----------- | ----------------------------------------------- | ---------------------- |
| `landscape` | Full row width                                  | Full row width         |
| `square`    | Full row width, 2rem inline gap between squares | Fixed square dimension |

On mobile, landscape widgets fill the viewport width. Square widgets also fill the viewport width — horizontal swipe reveals adjacent squares.

### 2.7.2 Widget Taxonomy

| Tier               | Height         | Purpose                               |
| ------------------ | -------------- | ------------------------------------- |
| `Widget` square    | Equal w/h      | Self-contained domain or utility unit |
| `Widget` landscape | Full row width | Data-dense domain view                |

A widget is a self-contained dashboard unit that owns its own state and rendering. It is not required to be domain-aware — a clock widget or upload progress widget are valid widgets.

### 2.7.3 Dashboard Spacing Tokens

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

## 3. Dark Theme

The default theme. Precision-oriented and data-dense — built for operations staff working under low-light conditions and field crews who need high-contrast readability.

### 3.1 Motif

| Property       | Specification                                                        |
| -------------- | -------------------------------------------------------------------- |
| **Background** | Near-black `rgb(21 24 30 / 0.95)` with restrained radial brand depth |
| **Surfaces**   | Dark blue-gray glassmorphism — semi-transparent layered surfaces     |
| **Gradient**   | Multi-stop Blue → Teal → Green (cool-to-warm sweep)                  |
| **Accent**     | Teal (H=184) — all interactive states key off this hue               |
| **Text**       | Near-white primary; all heading levels render white                  |

The global page background is part of the foundation, not an app-level decoration. App shells and style-guide harnesses must leave the background visible unless a concrete content surface requires an opaque treatment. The radial layer is static and biased dark on the left so card chrome and brand accents remain legible.

### 3.2 Page & Surfaces

| Token             | Value                          |
| ----------------- | ------------------------------ |
| Page background   | `rgb(21 24 30 / 0.95)`         |
| Surface 1 (cards) | `oklch(21% 0.018 252 / 0.88)`  |
| Surface 2         | `oklch(28% 0.018 252 / 0.78)`  |
| Surface 3         | `oklch(25% 0.02 248 / 0.7)`    |
| Primary text      | `oklch(93.5% 0.006 264.5)`     |
| Gradient stripe   | 3px top-border accent on cards |

### 3.3 Dark Theme Gradient

Extracted from the swarmAg Ops logo. Used as the button gradient, brand stripe, and avatar fill.

| Stop        | Hex       | oklch                     |
| ----------- | --------- | ------------------------- |
| Green       | `#03b673` | `76.849% 0.13454 123.993` |
| Green-teal  | `#0db17a` | `74.2% 0.122 158.432`     |
| Teal        | `#139d8d` | `68.5% 0.103 184.216`     |
| Teal-blue   | `#028aa8` | `60.8% 0.108 216.744`     |
| Blue        | `#077db2` | `54.3% 0.110 236.182`     |
| Deep anchor | `#1a5360` | `38.7% 0.072 228.640`     |

## 4. Light Theme

Clean and professional. Intended for office and web contexts where ambient light is high and a dark background would feel heavy.

### 4.1 Motif

| Property       | Specification                                                       |
| -------------- | ------------------------------------------------------------------- |
| **Background** | Light gray `oklch(96% 0.004 264.5)`                                 |
| **Surfaces**   | White and near-white — opaque, no glassmorphism                     |
| **Primary**    | Darker green-teal `oklch(50% 0.1 150)` — shifted for light contrast |
| **Text**       | Near-black primary; heading hierarchy introduces color (see §4.2)   |

### 4.2 Page & Surfaces

| Token             | Value                          |
| ----------------- | ------------------------------ |
| Page background   | `oklch(96% 0.004 264.5)`       |
| Surface 1 (cards) | `oklch(100% 0 0)`              |
| Surface 2         | `oklch(97% 0.004 264.5)`       |
| Surface 3         | `oklch(93% 0.006 264.5)`       |
| Primary text      | `oklch(var(--sa-p-surface-1))` |

### 4.2.1 Heading Hierarchy

Light theme introduces a color hierarchy across heading levels — headings are no longer uniformly white.

| Level | Color                   | Character   |
| ----- | ----------------------- | ----------- |
| h1    | `oklch(15% 0.01 264.5)` | Near-black  |
| h2    | `oklch(50% 0.1 150)`    | Green-teal  |
| h3    | `oklch(66% 0.14 235)`   | Blue        |
| h4    | `oklch(58% 0.12 190)`   | Teal        |
| h5    | `oklch(46% 0.08 200)`   | Deeper teal |

## 5. Brand Theme

Editorial and brand-forward. Used for customer-facing surfaces (`app-customer`) where the swarmAg brand identity takes precedence over operational density.

### 5.1 Motif

| Property       | Specification                                                       |
| -------------- | ------------------------------------------------------------------- |
| **Background** | Warm near-white `oklch(99.09% 0.0122 91.51)` — subtle golden warmth |
| **Surfaces**   | White with warm tint; clean, editorial                              |
| **Primary**    | Logo green `oklch(76.849% 0.13454 123.993)`                         |
| **Secondary**  | Golden-green `oklch(76.885% 0.1231 80.8277)`                        |
| **Text**       | Warm dark brown `oklch(44.44% 0.0096 73.63)` — not neutral gray     |
| **Gradient**   | Green → Golden (warm, brand-forward; no blue in the sweep)          |

### 5.2 Page & Surfaces

| Token             | Value                                     |
| ----------------- | ----------------------------------------- |
| Page background   | `oklch(99.09% 0.0122 91.51)`              |
| Surface 1 (cards) | `oklch(100% 0 0)`                         |
| Surface 2         | `oklch(99.09% 0.0122 91.51)`              |
| Surface 3         | `oklch(92.76% 0.0058 264.53)`             |
| Primary text      | `oklch(44.44% 0.0096 73.63)` (warm brown) |

### 5.2.1 Heading Hierarchy

Brand theme heading colors follow the logo palette — green and golden-green, not teal-blue.

| Level | Color                            | Character    |
| ----- | -------------------------------- | ------------ |
| h1    | `oklch(44.44% 0.0096 73.63)`     | Warm brown   |
| h2    | `oklch(76.849% 0.13454 123.993)` | Logo green   |
| h3    | `oklch(76.885% 0.1231 80.8277)`  | Golden-green |
| h4    | `oklch(65.207% 0.1322 81.5716)`  | Deep golden  |
| h5    | `oklch(44.44% 0.0096 73.63)`     | Warm brown   |

### 5.3 Typography Overrides

The brand theme substitutes the default font stack. These overrides are declared in `[data-theme='brand']` in `controls-tokens.css`.

| Role token          | Brand override                                  | Rationale                                        |
| ------------------- | ----------------------------------------------- | ------------------------------------------------ |
| `--sa-font-heading` | `'Playfair Display', ui-serif, serif`           | Editorial — serif headings signal brand presence |
| `--sa-font-ui`      | `'Inter', ui-sans-serif, system-ui, sans-serif` | Neutral — clean UI in editorial context          |

`--sa-font-body` and `--sa-font-mono` are not overridden in the brand theme.

_End of UX Design Language Document_
