<img src="../swarmag-ops-logo.png" title="" alt="swarmAg Operations System" data-align="center">

# swarmAg Operations System — UX Design Language

## 1. Overview

This document defines the branded look and feel for the swarmAg ecosystem. It covers the design foundation, token catalog, typography, geometry, layout, motion, and theme mechanism shared by all applications.

**Document Organization:**

| Document                     | Scope                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------- |
| _This document_              | Design foundation, tokens, typography, geometry, layout, motion                 |
| `ux-components-guide.md`     | Consumer reference: what controls exist, how to use them                        |
| `ux-components-internals.md` | Implementation reference: CSS architecture, control contract, tokens, selectors |

## 2. Design Foundation

The swarmAg product family is governed by a single, layered, multi-theme, unified design language. All applications share this foundation including look and feel, shell, component catalog, conventions, and guards.

### 2.1 Design Characteristics

| Characteristic  | Specification                                                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Audience**    | Leadership, Operations Staff, Field Crews                                                                                                  |
| **Feel**        | Professional, rugged, and purposeful                                                                                                       |
| **Decorations** | Gradient accent common to all themes, applied to interactive elements, button fills, card stripes, and surfaces — values defined per theme |

### 2.2 Namespaces

The design language definition is organized into namespaces. Each namespace is composed primarily of style tokens, component selectors, or CSS attributes. Namespaces themselves are defined using CSS selectors that scope CSS custom properties (variables).

| Namespace                 | Members                                                          |
| ------------------------- | ---------------------------------------------------------------- |
| `:root`                   | Foundation tokens and default role tokens                        |
| `[data-theme]`            | Shared theme and component-token specializations                 |
| `[data-theme='{theme}']`  | Namespace per theme instance with theme-specific specializations |
| `[data-ui='{component}']` | Component namespace for reusable Ui controls and control parts   |
| `[data-ui='{feature}']`   | Namespace for feature-specific tokens                            |

### 2.3 Layers

Namespaces of the design language are organized into layers with each layer codified as a CSS file named for the layer. Each layer owns one category of design responsibility, declares or consumes only those tokens allowed for that layer, and is encapsulated within its namespace. A layer may consume tokens from earlier layers, and shall not redefine upstream ownership or introduce selector kinds outside its namespace.

| Layer            | Namespace                                | File            | Members                                                         |
| ---------------- | ---------------------------------------- | --------------- | --------------------------------------------------------------- |
| **PROVIDERS**    |                                          |                 |                                                                 |
| Foundation Layer | `:root`                                  | `tokens.css`    | Typography, geometry, motion, and rhythm tokens (**immutable**) |
| Role Layer       | `:root`                                  | `roles.css`     | Required role tokens with default values                        |
| Theme Layer      | `data-theme`,<br/>`data-theme='{theme}'` | `themes.css`    | Per-theme role overrides and component-specified tokens         |
| **CONSUMERS**    |                                          |                 |                                                                 |
| Base Layer       | `html`                                   | `base.css`      | Browser reset, fonts, page base, semantic HTML                  |
| Component Layer  | `data-ui='{component}'`                  | `ui.css`        | Reusable component selectors and declared component parts       |
| Feature Layer    | `data-ui='{feature}'`                    | `{feature}.css` | Application feature styling and layout                          |

CSS files live in `source/ux/common/components/css/`. A shared CSS barrel,
`source/ux/common/components/css/css.tsx`, imports them in prescribed dependency order during application bootstrap.

**Layer Boundaries**

- Token provider files are `tokens.css`, `roles.css`, and `themes.css`. They may contain only CSS
  custom-property declarations inside their namespace containers. They do not contain element
  or component selectors.

- `tokens.css` declarations are immutable foundation tokens. They are stable values and may not
  be redeclared by roles, themes, components, shell CSS, or app CSS.
- `roles.css` defines the required role-token contract for applications conforming to the
  design language. Role tokens have defaults so a conforming application has a complete style
  vocabulary before a named theme specializes it.
- `themes.css` provides named theme overrides for role tokens and owns component-specified
  tokens consumed by `ui.css`.
- `base.css`, `ui.css`, feature CSS consume tokens; they do not introduce foundation,
  role, or theme token systems.
- `ui.css` must not reference `--sa-lch-*` tokens directly. Component selectors consume role or
  component-specified tokens.

## 3. Token Catalog

### 3.1 Token Design

All design-language custom properties use the `--sa-` prefix. Token names describe ownership
and design purpose; they do not encode implementation selectors or application-specific
context.

| Token class                | Naming convention                                         | Owner        | Notes                                                                     |
| -------------------------- | --------------------------------------------------------- | ------------ | ------------------------------------------------------------------------- |
| Foundation tokens          | `--sa-{primitive-family}-{attribute}-{specialization}`    | `tokens.css` | Immutable primitive values such as font, spacing, radius, motion          |
| Layout rhythm tokens       | `--sa-gutter`,<br/> `--sa-pad`,<br/> `--sa-gap`           | `tokens.css` | Responsive aliases over the immutable spacing scale                       |
| Role tokens                | `--sa-{role-family}-{attribute}-{specialization}`         | `roles.css`  | Semantic visual roles such as background, text, border, state, shadow     |
| LCH tuple tokens           | `--sa-lch-{name}`                                         | `roles.css`  | Bare `L C H` triplets used for `oklch()` composition                      |
| Theme specializations      | Existing role-token names                                 | `themes.css` | Per-theme overrides of the role-token contract                            |
| Component-specified tokens | `--sa-{component}-{variant}-{attribute}-{specialization}` | `themes.css` | Component implementation tokens cataloged in `ux-components-internals.md` |

Rules:

- Foundation token names are reserved to `tokens.css` and may not be redeclared downstream.
- LCH tuple tokens store tuples only; role tokens realize tuples into usable color values including opacity.
- Component-specified tokens are implementation contracts for `ui.css`; they are cataloged
  in `ux-component-internals.md`.

### 3.2 Foundation Tokens

Foundation tokens live in `tokens.css`. Foundation tokens are immutable and shall not be overridden.

| Family        | Tokens                                                       | Intent                             |
| ------------- | ------------------------------------------------------------ | ---------------------------------- |
| Font family   | `--sa-font-content-*`, `--sa-font-app-*`, `--sa-font-info-*` | Self-hosted font stacks by role    |
| Font weight   | `--sa-font-weight-*`                                         | Weight scale                       |
| Font size     | `--sa-font-size-*`, `--sa-base-size`                         | Size scale and root size           |
| Line height   | `--sa-line-leading-normal`                                   | Content line height                |
| Radius        | `--sa-radius-*`                                              | Corner scale                       |
| Spacing       | `--sa-space-*`                                               | 4px grid                           |
| Layout rhythm | `--sa-gutter`, `--sa-pad`, `--sa-gap`                        | Responsive layout rhythm           |
| Viewport      | `--sa-size-*`                                                | Viewport and wrap sizes            |
| Touch target  | `--sa-touch-target`, `--sa-touch-target-sm`                  | Field-safe and compact target size |
| Z-index       | `--sa-z-*`                                                   | Elevation ordering                 |
| Effects       | `--sa-blur`, `--sa-filter-mono`                              | Filter values                      |
| Motion        | `--sa-motion-*`, `--sa-transition-*`                         | Motion duration and transition     |

### 3.3 Role Tokens

Role tokens live in `roles.css`.

| Family          | Tokens                                                                                                                     | Intent                                 |
| --------------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| LCH tuples      | `--sa-lch-*`                                                                                                               | Theme color tuples for composition     |
| Brand color     | `--sa-color-primary`, <br/>`--sa-color-secondary`,<br/> `--sa-color-accent`                                                | Brand and accent roles                 |
| Background      | `--sa-bg-*`                                                                                                                | Page, surface, overlay, and state fill |
| Text            | `--sa-text-*`                                                                                                              | Primary, secondary, heading, label     |
| Border          | `--sa-border-*`                                                                                                            | Semantic border treatments             |
| Shadow          | `--sa-shadow-*`                                                                                                            | Semantic elevation and glow            |
| Gradient        | `--sa-gradient-*`                                                                                                          | Brand, button, card, and stripe fills  |
| State           | `--sa-state-*`                                                                                                             | Success, warning, danger, info states  |
| Role typography | `--sa-heading-*`,<br/> `--sa-body-*`,<br/> `--sa-label-*`,<br/> `--sa-ui-*`,<br/> `--sa-annotation-*` ,<br/> `--sa-data-*` | Role typography consumed by selectors  |
| Base elements   | `--sa-focus-ring`, <br/>`--sa-blockquote-border`,<br/> `--sa-radial-*`                                                     | Global focus, quote, and page depth    |

Component-specified tokens also live in `themes.css`, but their catalog is maintained in
`ux-components-internals.md` because they are implementation contracts for `ui.css`.

### 3.4 Color Space

Theme color tuples use **oklch** and are prefixed with `--sa-lch-`. Values are bare
`L C H` triplets enabling alpha composition at point of use:

```css
oklch(var(--sa-lch-brand-end))         /* fully opaque */
oklch(var(--sa-lch-brand-end) / 0.5)   /* 50% alpha */
```

Role tokens resolve to full `oklch()` values. Components reference role or
component-specified tokens — never LCH tuple tokens, never raw visual values.

### 3.5 Theme Switching

Set `data-theme` on `<html>`. All application HTML entry points set the theme
explicitly.

| Theme | Attribute            |
| ----- | -------------------- |
| Dark  | `data-theme="dark"`  |
| Light | `data-theme="light"` |

Theme switching is a single attribute swap — no JS class toggling.

Theme value specializations live in `themes.css` under `[data-theme]` namespaces. The
design-language contract defines required role tokens and namespace structure; concrete theme
values are implementation data in CSS.

## 4. Typography

**`source/ux/common/components/fonts`** — Fonts are self-hosted woff2 assets.

### 4.1 Font Families

| Token(s)                                                                        | Font                       | Role                                                   |
| ------------------------------------------------------------------------------- | -------------------------- | ------------------------------------------------------ |
| `--sa-font-content-heading`,<br/> `--sa-font-content-body`                      | Comfortaa                  | Content — headings and body paragraphs.                |
| `--sa-font-app-label`,<br/> `--sa-font-app-ui`,<br/> `--sa-font-app-annotation` | Lexend (variable, 100–900) | App — labels, buttons, inputs, selects, nav, captions. |
| `--sa-font-info-data`                                                           | Mono (Cascadia Mono Light) | Info — IDs, coordinates, numeric fields (weight 300).  |

### 4.2 Token Architecture

Typography tokens are organized into three categories: **Content**, **App**, and **Info**.

| Category | Role Token Prefix                                       | Default Value                                                                 | Intent                         |
| :------- | :------------------------------------------------------ | :---------------------------------------------------------------------------- | :----------------------------- |
| Content  | `--sa-heading-`, <br/>`--sa-body-`                      | `--sa-font-content-*`                                                         | Long-form reading and headings |
| App      | `--sa-label-`,<br/> `--sa-ui-`,<br/> `--sa-annotation-` | `--sa-font-app-label`,<br/>`--sa-font-app-ui`,<br/>`--sa-font-app-annotation` | Interface chrome and controls  |
| Info     | `--sa-data-`                                            | `--sa-font-info-*`                                                            | Technical data and code        |

### 4.3 Type Scale

Font sizes are responsive role tokens. `roles.css` uses `clamp()` for headings and
responsive overrides for body text. `tokens.css` owns only the immutable size scale and
`--sa-base-size`.

- **Fluid Headings:** H1–H3 use fluid scaling via `clamp()`.
- **Breakpoint Logic:**
  - **< 425px:** `--sa-body-font-size` and `--sa-heading-font-size-h4` drop to `sm` (0.875rem).
  - **< 380px:** The root `--sa-base-size` drops to `sm`, scaling the entire UI down.

| Role    | Token(s)                         | Treatment                                   |
| :------ | :------------------------------- | :------------------------------------------ |
| Heading | `--sa-heading-font-size-h1`–`h5` | Fluid (clamp) scale                         |
| Body    | `--sa-body-font-size`            | Responsive base (16px desktop, 14px mobile) |
| UI      | `--sa-ui-font-size`, `-compact`  | Fixed scale for interface density           |

### 4.4 Typography Role Map

| Role       | Element(s) / Component                                                                       | Family token                  | Size token                  | Weight token                  |
| :--------- | :------------------------------------------------------------------------------------------- | :---------------------------- | :-------------------------- | :---------------------------- |
| Heading    | `h1`–`h6`,<br/> `UiFieldset`,<br/>`Legend`                                                   | `--sa-heading-font-family`    | `--sa-heading-font-size-*`  | `--sa-heading-font-weight`    |
| Body       | `p`,<br/> `blockquote`,<br/> `UiList`                                                        | `--sa-body-font-family`       | `--sa-body-font-size`       | `--sa-body-font-weight`       |
| Label      | `label`,<br/> `UiButton`,<br/> `UiCheckbox`,<br/> `UiTable`                                  | `--sa-label-font-family`      | `--sa-label-font-size`      | `--sa-label-font-weight`      |
| Annotation | `figcaption`, <br/>`legend`,<br/>`UiTableHeader`,<br/> `UiSingleSelect`,<br/>`UiMiltiSelect` | `--sa-annotation-font-family` | `--sa-annotation-font-size` | `--sa-annotation-font-weight` |
| UI Control | `input`, <br/>`textarea`,<br/> `UiSingleSelect`                                              | `--sa-ui-font-family`         | `--sa-ui-font-size`         | `--sa-body-font-weight`       |
| Compact UI | `UiTab`, <br/>`UiBadge`,<br/> `UiAlert`,<br/> `UiAccordion`                                  | `--sa-ui-font-family`         | `--sa-ui-font-size-compact` | `--sa-ui-font-weight`         |
| Data       | `code`,<br/> `pre`,<br/> `kbd`,<br/> `samp`                                                  | `--sa-data-font-family`       | inherited                   | `--sa-data-font-weight`       |

### 4.5 Visual Semantics

- **Heading Colors:** H1 uses primary text; H2–H5 are tied to brand gradient colors (`--sa-text-h2`–`h5`) for content flow.
- **Labels:** Carry `color: var(--sa-text-label)` (resolves to muted) to remain subordinate to data.
- **Legends:** Standard `legend` uses primary text; however, `UiFieldset` legends are elevated to `var(--sa-text-h3)` for clearer section grouping.
- **Data Highlights:** Mono elements (`code`, `kbd`, etc.) use `color: var(--sa-color-accent)` to pop from body text.
- **Interactive Weights:** Most text uses weight `300` (thin); however, interactive elements use `500` (medium), primary buttons use `600` (semibold), and checkmarks use `800` (extrabold).
- **Blockquotes:** Styled in `base.css` with a left border (`--sa-blockquote-border`), italic style, and `--sa-text-secondary` color.

## 5. Geometry, Layout, And Motion

### 5.1 Spacing Scale

All layouts must align to a 4px base unit. This ensures visual rhythm across data-dense tables in Admin and large-format touch targets in Ops.

| Token            |    Value | Intent                        |
| ---------------- | -------: | ----------------------------- |
| `--sa-space-xs`  |  0.25rem | 4px base unit                 |
| `--sa-space-xx`  | 0.375rem | In-between compact adjustment |
| `--sa-space-sm`  |   0.5rem | Compact grouping              |
| `--sa-space-md`  |     1rem | Standard grouping             |
| `--sa-space-lg`  |   1.5rem | Page and surface padding      |
| `--sa-space-xl`  |     2rem | Large layout rhythm           |
| `--sa-space-2xl` |   2.5rem | Large surface rhythm          |
| `--sa-space-3xl` |     3rem | Desktop layout rhythm         |
| `--sa-space-4xl` |     5rem | Wide desktop layout rhythm    |

### 5.2 Layout Rhythm

Layout rhythm tokens are responsive aliases over the spacing scale.

| Token         | Default desktop                 | ≤1440px                         | ≤1024px                         | ≤768px                          | ≤425px                          | ≤380px                          |
| ------------- | ------------------------------- | ------------------------------- | ------------------------------- | ------------------------------- | ------------------------------- | ------------------------------- |
| `--sa-gutter` | `--sa-space-4xl`                | `--sa-space-3xl`                | `--sa-space-3xl`                | `--sa-space-xl + --sa-space-xx` | `--sa-space-lg`                 | `--sa-space-lg - --sa-space-xs` |
| `--sa-pad`    | `--sa-space-lg`                 | `--sa-space-md + --sa-space-xx` | `--sa-space-md + --sa-space-xs` | `--sa-space-md`                 | `--sa-space-sm + --sa-space-xx` | `--sa-space-sm + --sa-space-xs` |
| `--sa-gap`    | `--sa-space-md + --sa-space-xx` | `--sa-space-md + --sa-space-xs` | `--sa-space-md`                 | `--sa-space-sm + --sa-space-xs` | `--sa-space-sm + --sa-space-xs` | `--sa-space-sm + --sa-space-xs` |

### 5.3 Radius Scale

| Token              |    Value | Intent                   |
| ------------------ | -------: | ------------------------ |
| `--sa-radius-sm`   | 0.375rem | Compact control corners  |
| `--sa-radius-md`   | 0.555rem | Standard control corners |
| `--sa-radius-lg`   |  0.75rem | Large surface corners    |
| `--sa-radius-xl`   | 1.555rem | Pill-like large corners  |
| `--sa-radius-full` |   9999px | Fully rounded shape      |

### 5.4 Viewport Tokens

| Token            |  Value | Intent                    |
| ---------------- | -----: | ------------------------- |
| `--sa-size-wrap` |  270px | Minimum wrap reference    |
| `--sa-size-min`  |  320px | Minimum application width |
| `--sa-size-xs`   |  425px | Small/mobile breakpoint   |
| `--sa-size-sm`   |  768px | Tablet breakpoint         |
| `--sa-size-md`   | 1024px | Desktop breakpoint        |
| `--sa-size-lg`   | 1152px | Wide layout breakpoint    |

### 5.5 Touch Targets

| Token                  | Value | Intent                        |
| ---------------------- | ----: | ----------------------------- |
| `--sa-touch-target`    |  64px | Field-safe large touch target |
| `--sa-touch-target-sm` |  44px | Compact minimum touch target  |

### 5.6 Z-Index Scale

| Token            | Value | Intent                    |
| ---------------- | ----: | ------------------------- |
| `--sa-z-below`   |    -1 | Background decorations    |
| `--sa-z-base`    |     0 | Normal content            |
| `--sa-z-raised`  |     1 | Locally raised content    |
| `--sa-z-docked`  |    10 | Sticky headers/footers    |
| `--sa-z-popover` |    20 | Menus, lists, popovers    |
| `--sa-z-overlay` |   100 | Modals, overlays, flyouts |
| `--sa-z-toast`   |  1000 | System notifications      |

### 5.7 Effects

| Token              | Value                     | Intent                         |
| ------------------ | ------------------------- | ------------------------------ |
| `--sa-blur`        | `blur(25px)`              | Shared backdrop blur treatment |
| `--sa-filter-mono` | `brightness(0) invert(1)` | Monochrome asset filter        |

### 5.8 Motion And Transitions

| Token                    | Value                                        | Intent                      |
| ------------------------ | -------------------------------------------- | --------------------------- |
| `--sa-motion-page-fade`  | 200ms                                        | Page fade duration          |
| `--sa-motion-spinner`    | 0.8s                                         | Spinner cycle duration      |
| `--sa-motion-skeleton`   | 1.4s                                         | Skeleton shimmer duration   |
| `--sa-transition-fast`   | `all 0.15s ease`                             | Fast interaction transition |
| `--sa-transition-base`   | `all 0.3s ease`                              | Standard transition         |
| `--sa-transition-slow`   | `all 0.6s ease-out`                          | Slow entrance/exit motion   |
| `--sa-transition-spring` | `all 0.4s cubic-bezier(0.4, 0, 0.2, 1)`      | Spring-like transition      |
| `--sa-transition-page`   | `opacity var(--sa-motion-page-fade) ease-in` | Page opacity transition     |

_End of UX Design Language Document_
