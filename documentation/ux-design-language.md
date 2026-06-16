![swarmAg Operations System](../swarmag-ops-logo.png)

# swarmAg Operations System — UX Design Language

## 1. Overview

This document defines the brand application layer for the swarmAg ecosystem. It is organized into common foundations shared by all themes, followed by a section per theme that defines its distinct visual character.

**Document Organization:**

| Document                     | Scope                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------- |
| _This document_              | Brand identity: motif, typography, color, themes, layout, dashboard             |
| `ux-components-guide.md`     | Consumer reference: what controls exist, how to use them                        |
| `ux-components-internals.md` | Implementation reference: CSS architecture, control contract, tokens, selectors |

## 2. Common

### 2.1 Layer Structure

The swarmAg product family is governed by a single, unified design language. All applications share a common foundation of brand primitives, tokens, and component logic. Layouts diverge to meet specific operational contexts — data-dense Admin, high-contrast Ops — but the brand character is constant across all of them.

CSS layers are imported once through the shared barrel:

```ts
import '@ux/common/components/css/css.tsx'
```

| Layer            | File         | Scope                    | Owns                                                       |
| ---------------- | ------------ | ------------------------ | ---------------------------------------------------------- |
| Foundation layer | `tokens.css` | `:root`, `:root` media   | Immutable typography, geometry, motion, and rhythm tokens  |
| Theme layer      | `themes.css` | `[data-theme]`           | Semantic roles, theme values, LCH tuples, component tokens |
| Base layer       | `base.css`   | HTML and global elements | Browser reset, fonts, global background, semantic HTML     |
| Component layer  | `ui.css`     | `[data-ui]`              | Reusable component selectors and declared component parts  |

Dependency direction is one-way:

```text
tokens.css → themes.css → base.css / ui.css → app and shell-local CSS
```

Rules:

- `tokens.css` declarations are **immutable**. They are stable foundation tokens and are not
  redeclared by themes, components, shell CSS, or app CSS.
- `themes.css` converts immutable foundation tokens and theme-specific values into semantic
  roles. It also owns component-specified tokens consumed by `ui.css`.
- `base.css`, `ui.css`, shell CSS, and app CSS consume tokens; they do not introduce foundation
  or semantic token systems.
- `ui.css` must not reference `--sa-lch-*` tokens directly. Component selectors consume semantic
  or component-specified tokens.

### 2.2 Unified Design Language

| Property        | Specification                                                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Audience**    | Leadership, Operations Staff, Field Crews                                                                                                  |
| **Feel**        | Professional, rugged, and purposeful                                                                                                       |
| **Decorations** | Gradient accent common to all themes, applied to interactive elements, button fills, card stripes, and surfaces — values defined per theme |

### 2.3 Token Catalog

#### 2.3.1 Immutable Foundation Tokens

Immutable foundation tokens live in `tokens.css`.

| Family       | Tokens                                                                                  | Intent                             |
| ------------ | --------------------------------------------------------------------------------------- | ---------------------------------- |
| Font family  | `--sa-font-content-*`, `--sa-font-app-*`, `--sa-font-info-*`                            | Self-hosted font stacks by role    |
| Font weight  | `--sa-font-weight-*`                                                                    | Shared weight scale                |
| Font size    | `--sa-font-size-*`, `--sa-base-size`                                                    | Shared size scale and root size    |
| Line height  | `--sa-line-leading-normal`                                                              | Shared content line height         |
| Radius       | `--sa-radius-*`                                                                         | Shared corner scale                |
| Spacing      | `--sa-space-*`, `--sa-gutter`, `--sa-pad`, `--sa-gap`                                   | 4px grid and responsive rhythm     |
| Viewport     | `--sa-size-*`                                                                           | Shared viewport and wrap sizes     |
| Touch target | `--sa-touch-target`, `--sa-touch-target-sm`                                             | Field-safe and compact target size |
| Z-index      | `--sa-z-*`                                                                              | Shared elevation ordering          |
| Effects      | `--sa-blur`, `--sa-filter-mono`                                                         | Shared filter values               |
| Motion       | `--sa-motion-*`, `--sa-transition-*`                                                    | Motion duration and transition     |

#### 2.3.2 Semantic And Role Tokens

Semantic and role tokens live in `themes.css`.

| Family         | Tokens                                                                                | Intent                                 |
| -------------- | ------------------------------------------------------------------------------------- | -------------------------------------- |
| LCH tuples     | `--sa-lch-*`                                                                          | Theme color tuples for composition     |
| Brand color    | `--sa-color-primary`, `--sa-color-secondary`, `--sa-color-accent`                     | Brand and accent roles                 |
| Background     | `--sa-bg-*`                                                                           | Page, surface, overlay, and state fill |
| Text           | `--sa-text-*`                                                                         | Primary, secondary, heading, label     |
| Border         | `--sa-border-*`                                                                       | Semantic border treatments             |
| Shadow         | `--sa-shadow-*`                                                                       | Semantic elevation and glow            |
| Gradient       | `--sa-gradient-*`                                                                     | Brand, button, card, and stripe fills  |
| State          | `--sa-state-*`                                                                        | Success, warning, danger, info states  |
| Typography     | `--sa-heading-*`, `--sa-body-*`, `--sa-label-*`, `--sa-ui-*`, `--sa-annotation-*`     | Role typography consumed by selectors  |
| Data           | `--sa-data-*`                                                                         | Technical data typography              |
| Base elements  | `--sa-focus-ring`, `--sa-blockquote-border`, `--sa-radial-*`                          | Global focus, quote, and page depth    |

Component-specified tokens also live in `themes.css`, but their catalog is maintained in
`ux-components-internals.md` because they are implementation contracts for `ui.css`.

#### 2.3.3 Color Space

Theme color tuples use **oklch** and are prefixed with `--sa-lch-`. Values are bare
`L C H` triplets enabling alpha composition at point of use:

```css
oklch(var(--sa-lch-brand-end))         /* fully opaque */
oklch(var(--sa-lch-brand-end) / 0.5)   /* 50% alpha */
```

Semantic tokens resolve to full `oklch()` values. Components reference semantic or
component-specified tokens — never LCH tuple tokens, never raw visual values.

### 2.4 Theme Switching

Set `data-theme` on `<html>`. All application HTML entry points set the theme
explicitly.

| Attribute            | Theme |
| -------------------- | ----- |
| `data-theme="dark"`  | Dark  |
| `data-theme="light"` | Light |

Theme switching is a single attribute swap — no JS class toggling.

### 2.5 Typography

**`source/ux/common/components/fonts`** — Fonts are self-hosted woff2 assets.

| Font                       | File                           | Role                                                         |
| -------------------------- | ------------------------------ | ------------------------------------------------------------ |
| Comfortaa                  | Comfortaa-Regular.woff2        | Content — used for both headings and body paragraphs.        |
| Lexend (variable, 100–900) | Lexend-VariableFont_wght.woff2 | App UI — labels, buttons, inputs, selects, nav, captions.    |
| Mono (Cascadia Mono Light) | CascadiaMono-Light.woff2       | Info / Data — IDs, coordinates, numeric fields (weight 300). |

### 2.5.1 Token Architecture

Typography tokens are organized into three categories: **Content**, **App**, and **Info**.

| Category    | Immutable Token(s)    | Role Token Prefix                             | Intent                         |
| :---------- | :-------------------- | :-------------------------------------------- | :----------------------------- |
| **Content** | `--sa-font-content-*` | `--sa-heading-`, `--sa-body-`                 | Long-form reading and headings |
| **App**     | `--sa-font-app-*`     | `--sa-label-`, `--sa-ui-`, `--sa-annotation-` | Interface chrome and controls  |
| **Info**    | `--sa-font-info-*`    | `--sa-data-`                                  | Technical data and code        |

### 2.5.2 Type Scale

Font sizes are responsive role tokens. `themes.css` uses `clamp()` for headings and
responsive overrides for body text. `tokens.css` owns only the immutable size scale and
`--sa-base-size`.

- **Fluid Headings:** H1–H3 use fluid scaling via `clamp()`.
- **Breakpoint Logic:**
  - **< 425px:** `--sa-body-font-size` and `--sa-heading-font-size-h4` drop to `sm` (0.875rem).
  - **< 380px:** The root `--sa-base-size` drops to `sm`, scaling the entire UI down.

| Role        | Token(s)                         | Treatment                                   |
| :---------- | :------------------------------- | :------------------------------------------ |
| **Heading** | `--sa-heading-font-size-h1`–`h5` | Fluid (clamp) scale                         |
| **Body**    | `--sa-body-font-size`            | Responsive base (16px desktop, 14px mobile) |
| **UI**      | `--sa-ui-font-size`, `-compact`  | Fixed scale for interface density           |

### 2.5.3 Typography Role Map

| Role           | Element(s) / Component                       | Family token                  | Size token                  | Weight token                  |
| :------------- | :------------------------------------------- | :---------------------------- | :-------------------------- | :---------------------------- |
| **Heading**    | `h1`–`h6`, `UiFieldset` Legend               | `--sa-heading-font-family`    | `--sa-heading-font-size-*`  | `--sa-heading-font-weight`    |
| **Body**       | `p`, `blockquote`, `UiList`                  | `--sa-body-font-family`       | `--sa-body-font-size`       | `--sa-body-font-weight`       |
| **Label**      | `label`, `UiButton`, `UiCheckbox`, `UiTable` | `--sa-label-font-family`      | `--sa-label-font-size`      | `--sa-label-font-weight`      |
| **Annotation** | `figcaption`, `legend`, `UiSelect` items     | `--sa-annotation-font-family` | `--sa-annotation-font-size` | `--sa-annotation-font-weight` |
| **UI Control** | `input`, `textarea`, `UiSingleSelect`        | `--sa-ui-font-family`         | `--sa-ui-font-size`         | `--sa-body-font-weight`       |
| **Compact UI** | `UiTab`, `UiBadge`, `UiAlert`, `UiAccordion` | `--sa-ui-font-family`         | `--sa-ui-font-size-compact` | `--sa-ui-font-weight`         |
| **Data**       | `code`, `pre`, `kbd`, `samp`                 | `--sa-data-font-family`       | inherited                   | `--sa-data-font-weight`       |

### 2.5.4 Visual Semantics

- **Heading Colors:** H1 uses primary text; H2–H5 are tied to brand gradient colors (`--sa-text-h2`–`h5`) for content flow.
- **Labels:** Carry `color: var(--sa-text-label)` (resolves to muted) to remain subordinate to data.
- **Legends:** Standard `legend` uses primary text; however, `UiFieldset` legends are elevated to `var(--sa-text-h3)` for clearer section grouping.
- **Data Highlights:** Mono elements (`code`, `kbd`, etc.) use `color: var(--sa-color-accent)` to pop from body text.
- **Interactive Weights:** Most text uses weight `300` (thin); however, interactive elements use `500` (medium), primary buttons use `600` (semibold), and checkmarks use `800` (extrabold).
- **Blockquotes:** Styled in `base.css` with a left border (`--sa-blockquote-border`), italic style, and `--sa-text-secondary` color.

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

The dashboard is the primary view for all applications. Layout, spacing, and widget sizing are governed by shared responsive rhythm tokens.

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

| Token         | Meaning                                             |
| ------------- | --------------------------------------------------- |
| `--sa-gutter` | Page and dashboard outer rhythm                     |
| `--sa-pad`    | Reusable content-surface interior rhythm            |
| `--sa-gap`    | Reusable gap between widgets, controls, and regions |

Implemented values in `tokens.css`:

| Token         | Default desktop | ≤1440px        | ≤1024px        | ≤768px         | ≤425px        | ≤380px        |
| ------------- | --------------- | -------------- | -------------- | --------------- | -------------- | -------------- |
| `--sa-gutter` | `--sa-space-4xl` | `--sa-space-3xl` | `--sa-space-3xl` | `--sa-space-xl + --sa-space-xx` | `--sa-space-lg` | `--sa-space-lg - --sa-space-xs` |
| `--sa-pad`    | `--sa-space-lg`  | `--sa-space-md + --sa-space-xx` | `--sa-space-md + --sa-space-xs` | `--sa-space-md` | `--sa-space-sm + --sa-space-xx` | `--sa-space-sm + --sa-space-xs` |
| `--sa-gap`    | `--sa-space-md + --sa-space-xx` | `--sa-space-md + --sa-space-xs` | `--sa-space-md` | `--sa-space-sm + --sa-space-xs` | `--sa-space-sm + --sa-space-xs` | `--sa-space-sm + --sa-space-xs` |

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

| Role              | Token                  | Value / Source                  |
| ----------------- | ---------------------- | ------------------------------- |
| Page background   | `--sa-bg-page`         | `rgb(21 24 30 / 0.95)`          |
| Surface 1         | `--sa-bg-surface-1`    | `oklch(21% 0.018 252 / 0.88)`   |
| Surface 2         | `--sa-bg-surface-2`    | `oklch(28% 0.018 252 / 0.78)`   |
| Surface 3         | `--sa-bg-surface-3`    | `oklch(25% 0.02 248 / 0.7)`     |
| Primary text      | `--sa-text-primary`    | `oklch(var(--sa-lch-neutral-1))` |
| Gradient stripe   | `--sa-gradient-stripe` | `--sa-gradient-brand-90`         |

### 3.3 Dark Theme Gradient

Implemented in `themes.css` and used for brand gradients, semantic colors, and
theme-specific component tokens.

| Stop                | LCH token                       | oklch tuple           |
| ------------------- | ------------------------------- | --------------------- |
| Blue start          | `--sa-lch-gradient-1-start`     | `54.3% 0.11 236.182`  |
| Blue-cyan mid-start | `--sa-lch-gradient-2-mid-start` | `61.4% 0.107 210.2`   |
| Teal mid            | `--sa-lch-gradient-3-mid`       | `68.5% 0.103 184.216` |
| Cyan mid-end        | `--sa-lch-gradient-4-mid-end`   | `74.25% 0.117 184.6`  |
| Cyan-teal end       | `--sa-lch-gradient-5-end`       | `80% 0.13 185`        |

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

| Role              | Token                  | Value                    |
| ----------------- | ---------------------- | ------------------------ |
| Page background   | `--sa-bg-page`         | `oklch(96.8% 0.018 101)` |
| Surface 1         | `--sa-bg-surface-1`    | `oklch(99.4% 0.006 98)`  |
| Surface 2         | `--sa-bg-surface-2`    | `oklch(96.2% 0.014 104)` |
| Surface 3         | `--sa-bg-surface-3`    | `oklch(91.8% 0.018 112)` |
| Primary text      | `--sa-text-primary`    | `oklch(40% 0.026 238)`   |

### 4.2.1 Heading Hierarchy

| Level | Token          | Color                  | Character  |
| ----- | -------------- | ---------------------- | ---------- |
| h1    | `--sa-text-h1` | `oklch(17% 0.03 238)`  | Ink        |
| h2    | `--sa-text-h2` | `oklch(42% 0.12 221)`  | Blue       |
| h3    | `--sa-text-h3` | `oklch(50% 0.13 186)`  | Teal       |
| h4    | `--sa-text-h4` | `oklch(44% 0.105 154)` | Green-teal |
| h5    | `--sa-text-h5` | `oklch(40% 0.055 105)` | Olive      |

_End of UX Design Language Document_
