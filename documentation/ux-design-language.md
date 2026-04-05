![swarmAg Operations System](../swarmag-ops-logo.png)

# swarmAg Operations System — UX Design Language

# 1. Introduction

## 1.1 Scope and Authority

This document defines the normative design language, component contracts, and user interface patterns for the swarmAg ecosystem. It serves as the authoritative specification for all UX development across the Admin, Ops, and Customer applications. Adherence to these patterns is mandatory (MUST) to ensure cross-application consistency, operational safety in the field, and long-term maintainability of the SolidJS/Vanilla CSS stack.

**Prerequisites:**

- `architecture-ux.md`
- `architecture-core.md`
- `domain-model.md`

## 1.2 Strategic Intent

The swarmAg design language is built on three architectural pillars:

1. **Adaptive Consistency**: Shared UI primitives in `source/ux/common/` MUST function seamlessly across mobile-first field execution (Ops) and data-dense management interfaces (Admin).
2. **Safety-First Operations**: Field interfaces are governed by high-contrast, large-target constraints to support crews operating in high-risk environments.
3. **Zero-Drift Implementation**: UI state and component boundaries MUST be strictly mapped to the underlying domain model and API namespace defined in `architecture-core.md`.

## 1.3 Document Organization

This specification transitions from abstract design tokens to concrete implementation contracts:

- **Foundations (§2–4)**: Typography, color systems, and CSS token governance.
- **Layout & Shell (§5–7)**: Responsive frames, navigation, and application boundaries.
- **Component Catalog (§8–9)**: Functional specifications for widgets, forms, and views.
- **Field Execution (§10–11)**: Specialized constraints for the Ops crew workflow engine.

## 2. Design Motif

### 2.1 Unified Design Language

The swarmAg product family is governed by a single, unified design language. While application layouts diverge to meet specific operational contexts (e.g., data-dense Admin vs. high-contrast Ops), they share a common foundation of brand primitives, tokens, and component logic.

| Property       | Specification                                  |
| :------------- | :--------------------------------------------- |
| **Audience**   | Leadership, Operations Staff, and Field Crews  |
| **Motif**      | Dark-mode, data-dense, precision-oriented      |
| **Background** | Near-black oklch foundations                   |
| **Typography** | Lexend (Headings) + Inter (UI/Body)            |
| **Accent**     | Strategic brand gradient (Green → Teal → Blue) |
| **Feel**       | Professional, rugged, and purposeful           |

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
oklch(var(--swa-p-green))         /* fully opaque */
oklch(var(--swa-p-green) / 0.5)   /* 50% alpha */
```

Semantic tokens resolve to full `oklch()` values. Components reference only
semantic tokens — never primitives, never raw values.

## 3. Typography

### 3.1 Font Stack

**`source/ux/common/assets/fonts`**

Fonts are **self-hosted woff2** assets.

| Font                       | File                            | Role                                                       |
| -------------------------- | ------------------------------- | ---------------------------------------------------------- |
| Lexend (variable, 100–900) | Lexend-VariableFont_wght.woff2  | Headings, navigation, buttons, logo                        |
| Inter (400, 600)           | inter-400.woff2 inter-600.woff2 | Form labels, inputs, table headers/cells, badges, metadata |
| Cascadia Mono              | CascadiaMono-Light.woff2        | IDs, coordinates, numeric data fields                      |

`body` inherits Lexend. `input`, `select`, `textarea`, `label`, `th`, `td`,
`button`, `[role="option"]`, `[role="menuitem"]` inherit Inter automatically
via the global base rule. No per-component font declarations needed for the
common case.

### 3.2 Fluid Type Scale

All font sizes use `clamp()` for fluid scaling. See `tokens.css` for the full
`--swa-font-*` scale.

## 4. Token Architecture

### 4.1 Token File

**`source/ux/common/assets/css/tokens.css`**

Single token file. Imported once at the app root. Never duplicated per-app.

### 4.2 Layer Structure

```
Primitive layer  (:root)              — bare L C H triplets, internal use only
Semantic layer   (:root, [data-theme="dark"])  — resolved oklch() values
Light theme      ([data-theme="light"])        — overrides only
```

### 4.3 Theme Switching

Set `data-theme="light"` on `<html>` for light mode. Dark is the default — no
attribute required. Theme switching is a single attribute swap, no JS class
toggling.

### 4.4 Prefix Convention

All tokens use `--swa-` prefix. Sub-namespaces:

| Prefix            | Scope                                     |
| ----------------- | ----------------------------------------- |
| `--swa-p-`        | Primitives (internal, not for components) |
| `--swa-color-`    | Semantic colors                           |
| `--swa-bg-`       | Background surfaces                       |
| `--swa-text-`     | Text colors                               |
| `--swa-border-`   | Borders                                   |
| `--swa-shadow-`   | Shadows / elevation                       |
| `--swa-gradient-` | Gradients                                 |
| `--swa-font-`     | Typography                                |
| `--swa-radius-`   | Border radius                             |
| `--swa-space-`    | Spacing scale                             |
| `--swa-dash-`     | Dashboard layout spacing                  |
| `--swa-form-`     | Form container spacing                    |
| `--swa-field-`    | Field group spacing                       |
| `--swa-wf-`       | Workflow execution (app-ops only)         |
| `--swa-touch-`    | Touch target sizing                       |

# 5. Layout & Viewport

## 5.1 Grid & Spacing System

All layouts MUST align to a 4px base unit. This ensures visual rhythm across data-dense tables in Admin and large-format touch targets in Ops.

| Token             | Value | Usage                             |
| :---------------- | :---- | :-------------------------------- |
| `var(--space-xs)` | 4px   | Internal component padding        |
| `var(--space-sm)` | 8px   | Button/Input grouping             |
| `var(--space-md)` | 16px  | Standard gutter / Section padding |
| `var(--space-lg)` | 24px  | Page margins (Mobile)             |
| `var(--space-xl)` | 32px  | Page margins (Desktop)            |

## 5.2 Viewport Constraints (Normative)

The design language supports three primary viewport classes. Components MUST adapt their density based on these constraints:

1. **Compact (Mobile/Handheld)**: Used primarily by App-Ops. Single-column focus. Minimum touch target of 44x44px.
2. **Medium (Tablet/Large Handheld)**: Hybrid density. Supports sidebar navigation and split-pane views.
3. **Wide (Desktop)**: Used by App-Admin. Maximum data density. Multi-column layouts and persistent navigation.

## 5.3 Layering & Z-Index

To maintain interface predictability, the following z-index scale MUST be used:

| Token       | Value | Usage                     |
|-------------|------:|---------------------------|
| `z-below`   |    -1 | Decorations               |
| `z-base`    |     0 | Content                   |
| `z-docked`  |    10 | Sticky headers/footers    |
| `z-overlay` |   100 | Modals, popovers, flyouts |
| `z-toast`   |  1000 | System notifications      |

## 6. Dashboard

### 6.1 Layout Model

```
Dashboard
  └─ HeaderRow (fixed height, KPI StatCards)
  └─ ScrollContainer (vertical scroll)
     └─ DashboardRow[] (horizontal swipe, no collapse)
        └─ Widget[] (square | landscape)
```

No row collapse on small viewports. Horizontal swipe per row. Vertical scroll
on the outer column.

### 6.2 Layout Definition

**`source/ux/app-{admin|ops|customer}`**

Layout is data-driven via `dashboard.jsonc`. Not hardcoded. May be overridden per user in future — for now a single default config per app.

```jsonc
{
  "rows": [
    {
      "type": "header",
      "widgets": [
        { "id": "swarmag", "type": "BrandWidget", "size": "landscape" }
      ]
    },
    {
      "type": "standard",
      "label": "at-a-glance",
      "widgets": [
        { "id": "upcoming-jobs", "type": "UpcomingJobsWidget", "size": "landscape" },
        { "id": "asset-status", "type": "AssetStatusWidget", "size": "square" }
      ]
    }
  ]
}
```

### 6.3 Widget Sizing

| Size        | Mobile behavior                                 | Desktop behavior       |
| ----------- | ----------------------------------------------- | ---------------------- |
| `landscape` | Full row width                                  | Full row width         |
| `square`    | Full row width, 2rem inline gap between squares | Fixed square dimension |

On mobile, landscape widgets fill the viewport width. Square widgets also fill the viewport width — horizontal swipe reveals adjacent squares.

### 6.4 Widget Taxonomy

Three distinct tiers:

| Tier               | Height                            | Purpose                               |
| ------------------ | --------------------------------- | ------------------------------------- |
| `StatCard`         | Fixed short (`--swa-stat-height`) | KPI metric, tap to drill              |
| `Widget` square    | Equal w/h                         | Self-contained domain or utility unit |
| `Widget` landscape | Full row width                    | Data-dense domain view                |

A widget is a self-contained dashboard unit that owns its own state and
rendering. It is not required to be domain-aware — a clock widget or upload
progress widget are valid widgets.

### 6.5 Dashboard Spacing Tokens

Five independent dials, all responsive across four breakpoints:

| Token              | Meaning                                     |
| ------------------ | ------------------------------------------- |
| `--swa-dash-gap`   | Between widgets, between rows               |
| `--swa-dash-pad`   | Outer edge margin, row to first/last widget |
| `--swa-widget-pad` | Inside a widget, border to content          |
| `--swa-stat-pad`   | Inside a StatCard, border to content        |
| `--swa-form-pad`   | Inside the modal form container             |
| `--swa-field-pad`  | Inside a field group within a form          |

Starting values (tune by eyeball):

| Token              | ≥1024px | ≥768px   | ≥425px  | ≥380px   |
| ------------------ | ------- | -------- | ------- | -------- |
| `--swa-dash-gap`   | 4rem    | 3rem     | 1.5rem  | 1rem     |
| `--swa-dash-pad`   | 4rem    | 2rem     | 1.5rem  | 1rem     |
| `--swa-widget-pad` | 1.5rem  | 1.25rem  | 1rem    | 0.875rem |
| `--swa-stat-pad`   | 1rem    | 0.875rem | 0.75rem | 0.625rem |
| `--swa-form-pad`   | 2.5rem  | 2rem     | 1.5rem  | 1rem     |
| `--swa-field-pad`  | 1rem    | 0.875rem | 0.75rem | 0.625rem |

## 7. Form Pattern

### 7.1 AppForm

Forms are modal-like — they consume all available real estate with a darkened
backdrop and a rounded card container. Implemented with Kobalte `Dialog`.

| Viewport         | Behavior                                                                   |
| ---------------- | -------------------------------------------------------------------------- |
| Mobile           | Full screen takeover                                                       |
| Tablet / Desktop | Centered card, max-width `--swa-form-max-width` (640px), darkened backdrop |

### 7.2 Form Container Tokens

| Token                  | Value                  |
| ---------------------- | ---------------------- |
| `--swa-form-max-width` | `640px`                |
| `--swa-bg-backdrop`    | `oklch(0% 0 0 / 0.60)` |
| `--swa-form-pad`       | Responsive — see §6.5  |
| `--swa-field-pad`      | Responsive — see §6.5  |

### 7.3 Form Card Treatment

- Rounded card: `--swa-radius-xl`
- Gradient stripe top border: `--swa-gradient-stripe`
- Surface: `--swa-bg-surface-1`
- Shadow: `--swa-shadow-xl`

## 8. Component Vocabulary

### 8.1 Source Directory Structure

```
source/
└── ux/
    ├── config/
    ├── common/
    │   ├── assets/              — Static assets used by applications
    │   │   ├── css/             — Style sheets & design tokens
    │   │   ├── fonts/           — Font typography
    │   │   └── icons/           — Icon library
    │   ├── views/               — UX projection types (domain → display shape)
    │   ├── lib/                 — reactive stores, utilities
    │   └── components/
    │       ├── shell/           — auth-guard, content
    │       ├── login/           — login screen
    │       ├── forms/           — form-panel (AppForm)
    │       ├── controls/        — Kobalte-based UI primitives
    │       ├── charts/          — PieChart, BarChart, LineChart, Sparkline
    │       ├── dashboard/       — dashboard layout foundation
    │       └── widgets/         — widget catalog
    ├── app-admin/
    │   └── workflow/            — canonical Workflow template CRUD
    ├── app-customer/
    └── app-ops/
        ├── job-assessment/      — guided onsite assessment UX
        ├── job-planning/        — guided job planning UX
        └── job-workflow/        — guided field execution UX
```

### 8.2 `common/` Contract

Everything in `source/ux/common/` must be **adaptive** — usable across all
three apps and all viewport sizes. Mobile-only or desktop-only components do
not belong in `common/`.

### 8.3 Controls (Kobalte Primitives)

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

### 8.4 Form Controls

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

### 8.5 Chart Primitives

Chart library. (Candidates: D3, Chart.js, echarts.)

| Component   | Purpose                            |
| ----------- | ---------------------------------- |
| `PieChart`  | Composition at a point in time     |
| `BarChart`  | Frequency / volume over categories |
| `LineChart` | Trend over rolling time period     |
| `Sparkline` | Inline mini trend — StatCard use   |

### 8.6 Dashboard Components

| Component      | Location     | Purpose                                     |
| -------------- | ------------ | ------------------------------------------- |
| `Dashboard`    | `dashboard/` | Root layout, row renderer, scroll container |
| `DashboardRow` | `dashboard/` | Horizontal swipe row                        |
| `StatCard`     | `dashboard/` | KPI card primitive — fixed short height     |
| `Widget`       | `dashboard/` | Square/landscape widget shell               |

### 8.7 Widget Catalog

| Widget                    | Size      | Contents                              |
| ------------------------- | --------- | ------------------------------------- |
| `UpcomingJobsWidget`      | landscape | Job list, status badges               |
| `JobCalendarWidget`       | landscape | Calendar view of scheduled jobs       |
| `CustomersWidget`         | landscape | Customer table, action buttons        |
| `CrewWidget`              | square    | Active crew, availability             |
| `AssetStatusWidget`       | square    | Asset list, status indicators         |
| `ChemicalInventoryWidget` | landscape | Chemical table, signal word badges    |
| `ServicesWidget`          | square    | Service catalog summary               |
| `JobStatusWidget`         | square    | Pie chart — job status distribution   |
| `JobTrendWidget`          | landscape | Line chart — job throughput over time |
| `ChemicalUsageWidget`     | square    | Pie chart — usage by type             |
| `AssetUtilizationWidget`  | square    | Bar chart — utilization rate          |
| `WorkflowLibraryWidget`   | landscape | Workflow + task catalog               |
| `RecentActivityWidget`    | landscape | Append-only activity feed             |

### 8.8 StatCard Catalog

| StatCard                    | Metric                         | Drills to            |
| --------------------------- | ------------------------------ | -------------------- |
| `JobsActiveStatCard`        | Open/executing job count       | Upcoming Jobs widget |
| `JobsUpcomingStatCard`      | Planned jobs this week         | Job Calendar         |
| `AssetsMaintenanceStatCard` | Assets in maintenance/reserved | Asset Status widget  |
| `ChemicalAlertStatCard`     | Low stock / expiring chemicals | Chemical Inventory   |
| `CrewActiveStatCard`        | Active crew today              | Crew widget          |
| `RevenueStatCard`           | Rolling period revenue         | Job Trend widget     |

### 8.9 Management Forms (app-admin)

| Form                | Key complexity                                               |
| ------------------- | ------------------------------------------------------------ |
| `UserForm`          | Role multi-select, status                                    |
| `CustomerForm`      | Nested contacts editor, sites editor, location picker        |
| `QuestionForm`      | Type gates field visibility, options editor for select types |
| `TaskForm`          | Reorderable question list                                    |
| `WorkflowForm`      | Reorderable task list, version handling                      |
| `JobForm`           | Customer association, status lifecycle                       |
| `JobAssessmentForm` | Locations, risks, temporal fields                            |
| `JobPlanForm`       | Assignments, chemicals, assets, schedule                     |
| `AssetForm`         | Type association, status                                     |
| `ServiceForm`       | Required asset types, workflow candidate tags                |
| `ChemicalForm`      | Signal word severity, restricted use, SDS url                |

## 9. Views Catalog

UX projection types — shapes that exist because the domain model doesn't
surface cleanly to the UI as-is. No infrastructure imports, no SolidJS imports.
Pure types only.

| File                 | Types                                          | Purpose                                             |
| -------------------- | ---------------------------------------------- | --------------------------------------------------- |
| `views/job.ts`       | `JobSummary`, `JobDefinition`                  | Job display projections (exists)                    |
| `views/workflow.ts`  | `WorkflowView`                                 | Ordered tasks + questions resolved for renderer     |
| `views/dashboard.ts` | `DashboardConfig`, `DashboardRow`, `WidgetRef` | dashboard.jsonc schema types                        |
| `views/question.ts`  | `QuestionView`                                 | Discriminated union flattened for workflow renderer |

## 10. Job Workflow Execution (app-ops)

### 10.1 Design Reference

The workflow execution UX follows the **turn-by-turn navigation** mental model
(Google Maps / Apple Maps). The analogy:

| Maps                      | Workflow                    |
| ------------------------- | --------------------------- |
| Current maneuver          | Current question            |
| Street name / instruction | Question prompt             |
| Distance to next turn     | Questions remaining in task |
| Overall ETA               | Tasks remaining in workflow |
| Arrived                   | Task complete               |

### 10.2 Safety-First Design Constraints

The crew member is physically operating dangerous equipment while using this UI.
Design constraints:

- **One question per screen** — no scrolling mid-task
- **Large touch targets** — minimum `--swa-touch-target` (64px) for interactive elements
- **Maximum contrast** — answers must be unambiguous at a glance
- **Boolean = two full-width buttons** — YES (green) / NO (red), not a toggle
- **Single-select = large tappable option tiles** — not a dropdown
- **Multi-select = same, with checkmark state**
- **Number = large stepper or numeric keypad** — not a free text field
- **Text = last resort** — large input, minimal keyboard friction
- **Progress always visible** — current task, current question, total remaining
- **Forward momentum** — NEXT is the dominant action, BACK is available but not prominent
- **Camera-first attachment** — one tap to camera, returns directly to question

### 10.3 Answer Types

Exhaustively known from the domain `QuestionType`:

| Type            | UI Treatment                               |
| --------------- | ------------------------------------------ |
| `boolean`       | Two full-width buttons — YES/green, NO/red |
| `single-select` | Large tappable option tiles                |
| `multi-select`  | Same, with checkmark state                 |
| `number`        | Large stepper or numeric keypad            |
| `text`          | Large textarea, soft keyboard              |
| `internal`      | System-generated — no UI rendered          |

### 10.4 Attachment

Every question screen has an attachment zone below the answer, above navigation.
Camera is the dominant affordance. `requiresNote` on `SelectOption` gates NEXT
until an attachment or note is provided.

### 10.5 Screen Layout

```
┌─────────────────────────────────┐
│  Progress indicator             │
│  Task label                     │
│─────────────────────────────────│
│                                 │
│  Question prompt                │
│  Help text (if present)         │
│                                 │
│  Answer input                   │
│  (type-specific widget)         │
│                                 │
│─────────────────────────────────│
│  📎 Attach    [camera icon]     │
│                                 │
│  [BACK]           [NEXT →]      │
└─────────────────────────────────┘
```

### 10.6 Navigation Model

Question-by-question vs task-at-once: **TBD**. Leaning toward question-by-question
per the maps mental model.

### 10.7 Components

All in `source/ux/app-ops/job-workflow/`. Mobile-only — does not belong in
`common/`.

| Component                          | Purpose                                 |
| ---------------------------------- | --------------------------------------- |
| `job-workflow-runner.tsx`          | Top-level runner, state machine         |
| `job-workflow-progress.tsx`        | Route bar — tasks + questions remaining |
| `question-screen.tsx`              | Per-question renderer                   |
| `answers/boolean-answer.tsx`       | Full-width YES/NO buttons               |
| `answers/text-answer.tsx`          | Large text input                        |
| `answers/number-answer.tsx`        | Large stepper / keypad                  |
| `answers/single-select-answer.tsx` | Large tappable tiles                    |
| `answers/multi-select-answer.tsx`  | Tappable tiles with checkmark           |
| `answer-attachment.tsx`            | Camera-first attachment trigger         |
| `job-workflow-nav.tsx`             | BACK + NEXT, forward-biased             |
| `task-complete.tsx`                | Task arrival screen                     |
| `job-workflow-complete.tsx`        | Final arrival screen                    |

## 11. Job Assessment & Planning (app-ops)

### 11.1 Device Target

| Phase                       | App         | Primary Device  |
| --------------------------- | ----------- | --------------- |
| Initial assessment (remote) | `app-admin` | Desktop, Tablet |
| Onsite assessment           | `app-ops`   | Desktop, Tablet |
| Job planning                | `app-ops`   | Desktop, Tablet |
| Job execution               | `app-ops`   | Mobile          |

### 11.2 Specialized UX

Assessment and planning are purpose-built guided flows, not generic admin forms.
Both involve structured data capture in semi-field conditions.

Assessment involves: location capture, photos, risk notes, workflow selection,
workflow modification. Tablet is a practical requirement for the onsite phase.

### 11.3 Workflow Editing in Context

Assessment and planning may modify job-specific workflow clones. The editor
operates on a cloned `Workflow` record (not the canonical template) scoped to
the job context. The canonical `Workflow` editor lives in `app-admin/workflow/`.

Per `domain-model.md §2.5`:

- Assessment clones the basis workflow → `JobWorkflow.modifiedWorkflowId`
- Planning may further modify the assessment clone
- At execution start, the manifest is finalized and immutable

### 11.4 Source Directories

```
source/ux/app-ops/
  job-assessment/    — guided onsite assessment UX
  job-planning/      — guided job planning UX
  job-workflow/      — guided field execution UX

source/ux/app-admin/
  workflow/          — canonical Workflow template CRUD (admin only)
```

## 12. Pending Decisions

| Decision                      | Status   | Notes                                   |
| ----------------------------- | -------- | --------------------------------------- |
| Chart library                 | Open     | Candidates: D3, Chart.js, echarts       |
| Workflow screen navigation    | Open     | Q-by-Q vs task-at-once; leaning Q-by-Q  |
| '⋮' trigger contents          | Open     | Per-app, per-context — not yet designed |
| Form card width on tablet     | Open     | Fixed max-width vs content-tracking     |
| Onsite assessment in app-ops  | Agreed   | Tablet primary                          |
| Fourth app                    | Rejected | Three apps, no exceptions               |
| dashboard.jsonc load strategy | Open     | Import vs fetch()                       |

## 13. Proposed Changes to Existing Documents

Changes required in existing foundation documents to reflect decisions made
in this document. Do not apply until this document is reviewed and merged.

### 13.1 `architecture-ux.md`

- **§2 UX Applications table** — update `app-ops` scope description from
  "Field execution" to "Field execution, onsite assessment, job planning"
- **§2 UX Applications table** — update `app-ops` Primary Users from
  "Operations crews" to "Operations crews, Sales (assessment), Crew Leads (planning)"
- **§5 Application-Specific Notes** — add device targets per module:
  `app-ops` targets tablet for assessment/planning, phone for execution
- **§6.1 Application Shell Structure** — add `job-assessment/`,
  `job-planning/`, `job-workflow/` to app-ops directory tree
- **Add new section** — Design Token System, referencing `tokens.css`
- **Add new section** — Component Vocabulary, referencing §8 of this document
- **Add new section** — Dashboard Architecture, referencing §6 of this document
- **Add new section** — `common/` contract (adaptive by design)

### 13.2 `architecture-core.md`

- **§4.1 Components table** — update `Ops PWA` description to reflect
  expanded scope: assessment, planning, and execution
- **§2 Core Platforms** — confirm Kobalte in SolidJS platform entry
  (already present, verify version token in `deno.jsonc`)

### 13.3 `genesis-ux-scaffold.md`

- **§2.2.1 Files** — add `common/components/controls/`,
  `common/components/charts/`, `common/components/dashboard/`,
  `common/components/widgets/` to the scaffold file inventory
- **§2.2.1 Files** — add `common/views/workflow.ts`,
  `common/views/dashboard.ts`, `common/views/question.ts`
- **§2.3 Phase II** — update app-ops shell to include
  `job-assessment/`, `job-planning/`, `job-workflow/` stubs

### 13.4 New Documents Required

| Document                        | Purpose                                                                                        |
| ------------------------------- | ---------------------------------------------------------------------------------------------- |
| `architecture-ux-components.md` | Full component spec — anatomy, props, token usage per Kobalte primitive                        |
| `architecture-ux-dashboard.md`  | Dashboard config schema, row/widget rendering contract, `dashboard.jsonc` format               |
| `architecture-ux-workflow.md`   | Job workflow execution engine spec — state machine, question rendering, attachment, navigation |

_End of UX Design Language Document_
