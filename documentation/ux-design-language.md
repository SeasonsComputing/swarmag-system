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

Set `data-theme` on `<html>`. All application HTML entry points set the theme
explicitly.

| Attribute            | Theme |
| -------------------- | ----- |
| `data-theme="dark"`  | Dark  |
| `data-theme="light"` | Light |

Theme switching is a single attribute swap — no JS class toggling.

### 2.4 Layer Structure

| Layer           | File         | Scope                  | Purpose                             |
| --------------- | ------------ | ---------------------- | ----------------------------------- |
| Primitive layer | `tokens.css` | `:root`                | Bare L C H triplets (internal only) |
| Semantic layer  | `themes.css` | `[data-theme='dark']`  | Resolved `oklch()` values           |
| Light theme     | `themes.css` | `[data-theme='light']` | Semantic overrides                  |

See `ux-components-internals.md §2.3–2.4` for the full prefix convention and token inventory.

### 2.4.1 Shell Chrome

Header and footer chrome is a first-class component token family. Each theme defines
`--sa-shell-chrome-*` tokens for app frame surfaces so chrome can diverge from card
surfaces without changing generic panels.

| Token                      | Intent                                 |
| -------------------------- | -------------------------------------- |
| `--sa-shell-chrome-bg`     | Header/footer background               |
| `--sa-shell-chrome-border` | Header/footer boundary rule            |
| `--sa-shell-chrome-filter` | Header/footer backdrop treatment       |
| `--sa-shell-chrome-muted`  | Secondary text on header/footer chrome |
| `--sa-shell-chrome-shadow` | Header/footer elevation                |
| `--sa-shell-chrome-text`   | Primary text on header/footer chrome   |

### 2.5 Typography

**`source/ux/common/components/fonts`** — Fonts are self-hosted woff2 assets.

| Font                       | File                           | Role                                                          |
| -------------------------- | ------------------------------ | ------------------------------------------------------------- |
| Comfortaa                  | Comfortaa-Regular.woff2        | Content — headings, paragraphs, body                          |
| Lexend (variable, 100–900) | Lexend-VariableFont_wght.woff2 | All UI text — labels, buttons, inputs, selects, nav, captions |
| Cascadia Mono              | CascadiaMono-Light.woff2       | Code / numeric — IDs, coordinates, code                       |

Themes may override role tokens, but the current shared implementation uses these
self-hosted font assets.

### 2.5.1 Token Architecture

Font primitives (`--sa-p-font-*`) hold raw font stack values and are internal —
consumed only by theme role tokens. `base.css` and `ui.css` consume role
tokens and component tokens.

| Primitive             | Value         |
| --------------------- | ------------- |
| `--sa-p-font-content` | Comfortaa     |
| `--sa-p-font-label`   | Lexend        |
| `--sa-p-font-mono`    | Cascadia Mono |

Role tokens provide semantic indirection. A role typeface is changed by changing
one token value, not by changing consuming selectors.

| Role token                    | Resolves to                | Intent                     |
| ----------------------------- | -------------------------- | -------------------------- |
| `--sa-heading-font-family`    | `var(--sa-p-font-content)` | Heading elements           |
| `--sa-body-font-family`       | `var(--sa-p-font-content)` | Paragraph and body content |
| `--sa-label-font-family`      | `var(--sa-p-font-label)`   | Labels                     |
| `--sa-annotation-font-family` | `var(--sa-p-font-label)`   | Legends, table heads       |
| `--sa-ui-font-family`         | `var(--sa-p-font-label)`   | Controls and data entry    |
| `--sa-data-font-family`       | `var(--sa-p-font-mono)`    | Code and numeric fields    |

### 2.5.2 Type Scale

Font sizes are fixed role tokens. `themes.css` defines heading, body, label, UI,
annotation, data, and entry font-size tokens consumed by `base.css` and
`ui.css`.

### 2.5.3 Typography Role Map

Each HTML element belongs to one typographic role. `base.css` declares the
foundation treatment; `ui.css` declares App control treatment.

| Role                      | Element(s)                   | Family token               | Size token                     | Weight token                  |
| ------------------------- | ---------------------------- | -------------------------- | ------------------------------ | ----------------------------- |
| Heading                   | `h1`–`h6`                    | `--sa-heading-font-family` | `--sa-heading-font-size-*`     | `--sa-heading-font-weight`    |
| Content                   | `p`, `li`                    | `--sa-body-font-family`    | `--sa-body-font-size`          | `--sa-body-font-weight`       |
| Label                     | `label`, `legend`            | `--sa-label-font-family`   | `--sa-label-font-size`         | `--sa-label-font-weight`      |
| Annotation / table header | `figcaption`, `th`           | `--sa-label-font-family`   | `--sa-label-font-size`         | `--sa-annotation-font-weight` |
| Data-adjacent label       | `td`                         | `--sa-label-font-family`   | `--sa-label-font-size`         | `--sa-body-font-weight`       |
| Data entry                | `input`, `textarea`          | `--sa-ui-font-family`      | control-specific               | `--sa-body-font-weight`       |
| Select / menu UI          | `select`, App select options | `--sa-ui-font-family`      | `--sa-ui-font-size` or compact | `--sa-ui-font-weight`         |
| Code / numeric            | `code`, `pre`, `kbd`, `samp` | `--sa-data-font-family`    | inherited                      | inherited                     |

### 2.5.4 Element Overrides

`label` additionally carries `color: var(--sa-text-muted)` — labels are
subordinate to the content they describe. `legend` uses primary text color as a
group heading.

`blockquote`: left border (`--sa-blockquote-border`), italic,
`--sa-text-secondary`, `--sa-body-font-family`, no inline margin. Styled in
`base.css`.

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

| Token            | Meaning                                     |
| ---------------- | ------------------------------------------- |
| `--sa-dash-gap`  | Between widgets, between rows               |
| `--sa-dash-pad`  | Outer edge margin, row to first/last widget |
| `--sa-card-pad`  | Inside a widget, border to content          |
| `--sa-stat-pad`  | Inside a StatCard, border to content        |
| `--sa-form-pad`  | Inside the modal form container             |
| `--sa-field-pad` | Inside a field group within a form          |

Implemented values in `tokens.css`:

| Token            | Default desktop | ≤1024px  | ≤768px  | ≤425px  | ≤380px   |
| ---------------- | --------------- | -------- | ------- | ------- | -------- |
| `--sa-dash-gap`  | 4rem            | 3rem     | 1.5rem  | 1.5rem  | 1rem     |
| `--sa-dash-pad`  | 4rem            | 2rem     | 1.5rem  | 1.5rem  | 1rem     |
| `--sa-card-pad`  | `--sa-gap`      | 1.75rem  | 1rem    | 1rem    | 0.875rem |
| `--sa-stat-pad`  | 1rem            | 0.875rem | 0.75rem | 0.75rem | 0.625rem |
| `--sa-form-pad`  | 2.5rem          | 2rem     | 1.5rem  | 1.25rem | 1rem     |
| `--sa-field-pad` | 1rem            | 0.875rem | 0.75rem | 0.75rem | 0.625rem |

## 3. Dark Theme

The default theme. Precision-oriented and data-dense — built for operations staff working under low-light conditions and field crews who need high-contrast readability.

### 3.1 Motif

| Property       | Specification                                                        |
| -------------- | -------------------------------------------------------------------- |
| **Background** | Near-black `rgb(21 24 30 / 0.95)` with restrained radial brand depth |
| **Surfaces**   | Dark blue-gray glassmorphism — semi-transparent layered surfaces     |
| **Gradient**   | Multi-stop blue → cyan-teal sweep                                    |
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
| Shell chrome      | Card-panel surface and border  |

### 3.3 Dark Theme Gradient

Implemented in `tokens.css` and used for the button gradient, brand stripe, and
avatar fill.

| Stop                | Primitive token               | oklch tuple           |
| ------------------- | ----------------------------- | --------------------- |
| Blue start          | `--sa-p-gradient-1-start`     | `54.3% 0.11 236.182`  |
| Blue-cyan mid-start | `--sa-p-gradient-2-mid-start` | `61.4% 0.107 210.2`   |
| Teal mid            | `--sa-p-gradient-3-mid`       | `68.5% 0.103 184.216` |
| Cyan mid-end        | `--sa-p-gradient-4-mid-end`   | `74.25% 0.117 184.6`  |
| Cyan-teal end       | `--sa-p-gradient-5-end`       | `80% 0.13 185`        |

## 4. Light Theme

Clean and professional. Intended for office and web contexts where ambient light is high and a dark background would feel heavy.

### 4.1 Motif

| Property       | Specification                                                     |
| -------------- | ----------------------------------------------------------------- |
| **Background** | Warm paper `oklch(96.8% 0.018 101)`                               |
| **Surfaces**   | Warm near-white with restrained paper tint and crisp borders      |
| **Primary**    | Deep ink-blue `oklch(43% 0.115 222)` with teal/green support      |
| **Text**       | Near-black primary; heading hierarchy introduces color (see §4.2) |
| **Shell**      | Solid deep ink-blue chrome for header and footer                  |

### 4.2 Page & Surfaces

| Token             | Value                    |
| ----------------- | ------------------------ |
| Page background   | `oklch(96.8% 0.018 101)` |
| Surface 1 (cards) | `oklch(99.4% 0.006 98)`  |
| Surface 2         | `oklch(96.2% 0.014 104)` |
| Surface 3         | `oklch(91.8% 0.018 112)` |
| Primary text      | `oklch(22% 0.026 238)`   |
| Shell chrome      | `oklch(27% 0.045 224)`   |

### 4.2.1 Heading Hierarchy

| Level | Color                  | Character  |
| ----- | ---------------------- | ---------- |
| h1    | `oklch(17% 0.03 238)`  | Ink        |
| h2    | `oklch(42% 0.12 221)`  | Blue       |
| h3    | `oklch(50% 0.13 186)`  | Teal       |
| h4    | `oklch(44% 0.105 154)` | Green-teal |
| h5    | `oklch(40% 0.055 105)` | Olive      |

_End of UX Design Language Document_
