![swarmAg Operations System](../swarmag-ops-logo.png)

# swarmAg Operations System — Component Guide

## 1. Overview

This document is the consumer reference for all shared UI primitives in `ux/common`. One entry per control: what it is, what variants and props matter, and how it composes.

**Audience:** Feature developers and widget authors consuming controls to build views, widgets, or forms.

**Source of truth:** `source/ux/common/components/controls/`. This document is derived from source; where they conflict, source wins.

**What this document is not:** It does not explain token values, CSS selectors, Kobalte binding details, or design rationale. See `ux-components-internals.md` for that.

**One forward reference:** Higher-level form compositions (dialog wrappers, pickers, reorder lists) are planned for the `forms/` layer. Documentation will be linked here when available.

All controls export from a single barrel:

```typescript
import { AppButton, AppCard, AppField, … } from '@ux/common/components/controls'
```

## 2. Interactive Controls

### 2.1 AppButton

Action trigger. The default (no variant) is ghost — transparent with brand border.

**Variants:** `primary` · `secondary` · `ghost` (default) · `danger`  
**Key props:** `variant`, `disabled`, `loading`, `type`, `onClick`, `children`  
**Composition:** standalone; use inside `AppFormActions` for form submission  
**Notes:** `loading` disables the button and sets cursor to wait; min-width `7rem`

### 2.2 AppInput

Single-line text entry.

**Variants:** none  
**Key props:** `id`, `name`, `type`, `placeholder`, `value`, `disabled`, `error`, `loading`, `required`, `readOnly`, `onChange`  
**Composition:** use inside `AppField` with matching `for`/`id`

### 2.3 AppTextarea

Multi-line text entry.

**Variants:** none  
**Key props:** `id`, `name`, `placeholder`, `value`, `disabled`, `error`, `rows`, `onChange`  
**Composition:** use inside `AppField` with matching `for`/`id`

### 2.4 AppSingleSelect

Dropdown single-value picker. Options are `AppOption` objects (`{ value: string; label?: string }`).

**Variants:** none  
**Key props:** `options`, `value`, `defaultValue`, `placeholder`, `id`, `name`, `disabled`, `error`, `onChange`  
**Composition:** use inside `AppField` with matching `for`/`id`  
**Notes:** `onChange` receives the selected `string` value, not the `AppOption` object

### 2.5 AppMultiSelect

Inline multi-value picker. Renders as an always-visible listbox — not a dropdown.

**Variants:** none  
**Key props:** `options`, `value`, `defaultValue`, `disabled`, `error`, `onChange`  
**Composition:** use inside `AppField`  
**Notes:** `onChange` receives `string[]`

### 2.6 AppCheckbox

Checkbox with inline label.

**Variants:** none  
**Key props:** `checked`, `defaultChecked`, `disabled`, `error`, `name`, `required`, `value`, `onChange`, `children` (label text)  
**Composition:** standalone or inside `AppField`

### 2.7 AppRadioGroup / AppRadioItem

Radio button group. `AppRadioItem` is the child element.

**Key props (AppRadioGroup):** `value`, `defaultValue`, `disabled`, `error`, `onChange`  
**Key props (AppRadioItem):** `value`, `disabled`, `children` (label)  
**Composition:** `AppRadioGroup` wraps `AppRadioItem` children; use inside `AppField`

```tsx
<AppRadioGroup value={selected} onChange={setSelected}>
  <AppRadioItem value='a'>Option A</AppRadioItem>
  <AppRadioItem value='b'>Option B</AppRadioItem>
</AppRadioGroup>
```

### 2.8 AppToggle

Standalone pressed/unpressed toggle button.

**Variants:** none  
**Key props:** `pressed`, `defaultPressed`, `disabled`, `loading`, `onChange`, `children` (label)  
**Composition:** standalone; use inside `AppField variant='inline'` when a label is needed  
**Notes:** min-width `7rem` standalone; unset inside `AppToggleGroup`

### 2.9 AppToggleGroup / AppToggleItem

Single-select toggle group. `AppToggleItem` is the child element.

**Key props (AppToggleGroup):** `value`, `defaultValue`, `disabled`, `onChange`  
**Key props (AppToggleItem):** `value`, `disabled`, `children`  
**Composition:** `AppToggleGroup` wraps `AppToggleItem` children

```tsx
<AppToggleGroup value={view} onChange={setView}>
  <AppToggleItem value='calendar'>Calendar</AppToggleItem>
  <AppToggleItem value='list'>List</AppToggleItem>
</AppToggleGroup>
```

### 2.10 AppTabs / AppTabList / AppTab / AppTabPanel

Tabbed content panel. Keyboard: arrow keys move focus, Enter/Space activates.

**Key props (AppTabs):** `value`, `defaultValue`, `activationMode` (`'manual'` default), `disabled`, `onChange`  
**Key props (AppTab):** `value`, `disabled`, `children`  
**Key props (AppTabPanel):** `value`, `children`  
**Composition:** `AppTabs` > `AppTabList` > `AppTab`; `AppTabPanel` siblings to `AppTabList`

```tsx
<AppTabs value={tab} onChange={setTab}>
  <AppTabList>
    <AppTab value='details'>Details</AppTab>
    <AppTab value='history'>History</AppTab>
  </AppTabList>
  <AppTabPanel value='details'>…</AppTabPanel>
  <AppTabPanel value='history'>…</AppTabPanel>
</AppTabs>
```

### 2.11 AppAccordion / AppAccordionItem / AppAccordionTrigger / AppAccordionContent

Collapsible content sections.

**Key props (AppAccordion):** `multiple`, `value`, `defaultValue`, `onValueChange`  
**Key props (AppAccordionItem):** `value` (required), `disabled`  
**Composition:** `AppAccordion` > `AppAccordionItem` > `AppAccordionTrigger` + `AppAccordionContent`

```tsx
<AppAccordion>
  <AppAccordionItem value='section-1'>
    <AppAccordionTrigger>Section 1</AppAccordionTrigger>
    <AppAccordionContent>Content here</AppAccordionContent>
  </AppAccordionItem>
</AppAccordion>
```

### 2.12 AppDialog

Modal base. Full-screen on mobile, centered card on tablet/desktop.

**Key props:** `open`, `onOpenChange`, `children`  
**Composition:** compose with `AppCard variant='workflow'` for the form surface

### 2.13 AppPopover

Floating content panel anchored to a trigger. Use for context menus and secondary actions.

**Key props:** `open`, `onOpenChange`, `children`  
**Composition:** trigger and content are children

### 2.14 AppTooltip

Hover tooltip anchored to a trigger.

**Key props:** `content`, `children` (trigger element)  
**Composition:** wraps its trigger as a child

### 2.15 AppProgress

Linear progress bar.

**Variants:** none  
**Key props:** `value`, `min`, `max`  
**Composition:** standalone

## 3. Display Controls

### 3.1 AppBadge

Status pill. Default (no variant) is ghost — transparent with border.

**Variants:** `success` · `warning` · `danger` · `info`  
**Key props:** `variant`, `children`  
**Composition:** inline; place inside table cells, card headers, or list items

### 3.2 AppAlert

Inline feedback message with left-border accent.

**Variants:** `success` · `warning` · `danger` · `info`  
**Key props:** `variant`, `children`  
**Composition:** standalone block; do not nest inside `AppCard`

### 3.3 AppAvatar

User avatar. Renders initials when no image is available.

**Variants:** none  
**Key props:** `children` (initials or image)  
**Composition:** standalone; use in nav headers, list rows, and comment threads

### 3.4 AppCard

Framed content surface. The default (no variant) is the panel look.

**Variants:** `widget` · `workflow` (no prop = panel)  
**Key props:** `variant`, `children`  
**Composition:** panels are interior surfaces; widgets go in dashboard grids; workflow wraps forms inside `AppDialog`

### 3.5 AppSeparator

Horizontal or vertical rule.

**Variants:** none  
**Key props:** `orientation` (`'horizontal'` default)  
**Composition:** standalone

### 3.6 AppSpinner

Indeterminate loading indicator.

**Variants:** none  
**Key props:** none beyond children  
**Composition:** standalone; center inside loading containers

### 3.7 AppSkeleton

Loading placeholder shimmer. Size it to match the content it replaces.

**Variants:** none  
**Key props:** `children` (or size via container)  
**Composition:** replace content elements 1:1 during load

## 4. Layout Controls

### 4.1 AppRow

Horizontal flex container. Sizes to content by default.

**Variants:** `fill` (full-width flex)  
**Key props:** `variant`, `children`  
**Composition:** wraps any set of inline or inline-flex children; `variant='fill'` stretches to container

### 4.2 AppStack

Vertical grid container. Fills container width by default.

**Variants:** `inline` (content-fit width, items start-aligned)  
**Key props:** `variant`, `children`  
**Composition:** general-purpose vertical layout

### 4.3 AppList / AppListItem

Semantic list with visual variants.

**Variants (AppList):** default (clean, unstyled) · `bullet` · `numbered`  
**Key props (AppList):** `variant`, `children`  
**Key props (AppListItem):** `children`  
**Composition:** `AppList` wraps `AppListItem` children

### 4.4 AppTable / AppTableHeader / AppTableBody / AppTableRow / AppTableCell

Semantic table family. `AppTableCell` renders as `<th>` inside `AppTableHeader`, `<td>` elsewhere — no prop needed.

**Key props (AppTableRow):** `section` (boolean) — renders an accent group-header row  
**Composition:** `AppTable` > `AppTableHeader` + `AppTableBody` > `AppTableRow` > `AppTableCell`

```tsx
<AppTable>
  <AppTableHeader>
    <AppTableCell>Name</AppTableCell>
    <AppTableCell>Status</AppTableCell>
  </AppTableHeader>
  <AppTableBody>
    <AppTableRow>
      <AppTableCell>Field A</AppTableCell>
      <AppTableCell><AppBadge variant='success'>Active</AppBadge></AppTableCell>
    </AppTableRow>
  </AppTableBody>
</AppTable>
```

## 5. Form Layout

Form layout primitives are controls — imported from the same barrel as all other controls.

### 5.1 AppField

Label + control wrapper. Always uses explicit `for`/`id` association.

**Variants:** `inline` (content-fit; use when a toggle or control should sit inline with siblings)  
**Key props:** `label` (required), `for` (required), `variant`, `children`  
**Notes:** label and control are always siblings — the label never wraps a control

### 5.2 AppFieldset

Semantic group boundary with a legend. Use when a form has logically distinct sections.

**Key props:** `legend` (required), `children`  
**Notes:** always place `AppFormGrid` inside a `<div>` inside the fieldset — never apply grid directly to `<fieldset>`

### 5.3 AppFormGrid

Responsive auto-fit column layout. The layout host for `AppField` children.

**Key props:** `children`

### 5.4 AppFormActions

Right-aligned action row. Always at the tail of the form, outside any fieldsets.

**Key props:** `children` (action `AppButton` elements)

### 5.5 Composition example

```tsx
<AppFieldset legend='Spray window'>
  <AppFormGrid>
    <AppField label='Start time' for='start'>
      <AppInput id='start' type='time' />
    </AppField>
    <AppField label='End time' for='end'>
      <AppInput id='end' type='time' />
    </AppField>
  </AppFormGrid>
</AppFieldset>

<AppFormActions>
  <AppButton variant='ghost'>Cancel</AppButton>
  <AppButton variant='primary' type='submit'>Save</AppButton>
</AppFormActions>
```

*Higher-level form compositions (dialog wrappers, pickers, reorder lists) are planned for the `forms/` layer — documentation to follow.*

## 6. Charts

Charts are standardized through `AppChart`. Chart.js is the internal engine and must not be consumed directly by views or widgets.

**Location:** `source/ux/common/components/charts`

| Component   | Purpose                             |
|-------------|-------------------------------------|
| `AppChart`  | Token-aware chart primitive wrapper |
| `PieChart`  | Composition at a point in time      |
| `BarChart`  | Frequency / volume over categories  |
| `LineChart` | Trend over rolling time period      |
| `Sparkline` | Inline mini trend                   |

`ChartWidget` composes `AppChart` — widget authors use `ChartWidget`, not `AppChart` directly.

_End of Component Guide Document_
