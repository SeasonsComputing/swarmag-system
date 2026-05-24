![swarmAg Operations System](../swarmag-ops-logo.png)

# swarmAg Operations System — Component Guide

## 1. Overview

This document is the consumer reference for all shared UI primitives in `ux/common/components`. One entry per control: what it is, what variants and props matter, how it composes, and what `data-*` attributes it emits.

**Audience:** Feature developers consuming controls to build views, widgets, or forms.

**Authority:** Control contracts are defined by this document and `ux-components-internals.md`. Source implements those contracts.

**What this document is not:** It does not explain token values, CSS selectors, Kobalte binding details, or design rationale. See `ux-components-internals.md` for that.

All controls export from a single barrel:

```typescript
import { AppButton, AppCard, AppField, … } from '@ux/common/components/controls'
```

## 2. Interactive Controls

### 2.1 AppButton

Action trigger. The default (no variant) is ghost — transparent with brand border.

**Variants:** `primary` · `secondary` · `ghost` (default) · `danger`\
**Key props:** `variant`, `disabled`, `loading`, `type`, `onClick`, `children`\
**Composition:** standalone; use inside `AppFormActions` for form submission\
**Notes:** `loading` disables the button and sets cursor to wait; min-width `7rem`

| Attribute         | Values                                       |
| ----------------- | -------------------------------------------- |
| `data-ui`         | `button`                                     |
| `data-ui-variant` | `primary` · `secondary` · `ghost` · `danger` |
| `data-ui-state`   | `disabled` · `loading`                       |

### 2.1.1 Example

```tsx
<AppButton variant='primary' onClick={handleSave}>Save</AppButton>
<AppButton variant='ghost'>Cancel</AppButton>
<AppButton variant='danger' loading={isDeleting}>Delete</AppButton>
```

### 2.2 AppInput

Single-line text entry.

**Variants:** none\
**Key props:** `id`, `name`, `type`, `placeholder`, `value`, `disabled`, `error`, `loading`, `required`, `readOnly`, `onChange`\
**Composition:** use inside `AppField` with matching `for`/`id`

| Attribute       | Values                           |
| --------------- | -------------------------------- |
| `data-ui`       | `input`                          |
| `data-ui-state` | `disabled` · `error` · `loading` |

### 2.2.1 Example

```tsx
<AppField label='Field name' for='field-name'>
  <AppInput
    id='field-name'
    name='fieldName'
    placeholder='Enter value'
    value={value}
    onChange={setValue}
  />
</AppField>
```

### 2.3 AppTextarea

Multi-line text entry.

**Variants:** none\
**Key props:** `id`, `name`, `placeholder`, `value`, `disabled`, `error`, `rows`, `onChange`\
**Composition:** use inside `AppField` with matching `for`/`id`

| Attribute       | Values               |
| --------------- | -------------------- |
| `data-ui`       | `textarea`           |
| `data-ui-state` | `disabled` · `error` |

### 2.3.1 Example

```tsx
<AppField label='Notes' for='notes'>
  <AppTextarea id='notes' name='notes' rows={4} value={notes} onChange={setNotes} />
</AppField>
```

### 2.4 AppSingleSelect

Dropdown single-value picker. Options are `AppOption` objects (`{ value: string; label?: string }`).

**Variants:** none\
**Key props:** `options`, `value`, `defaultValue`, `placeholder`, `id`, `name`, `disabled`, `error`, `onChange`\
**Composition:** use inside `AppField` with matching `for`/`id`\
**Notes:** `onChange` receives the selected `string` value, not the `AppOption` object

| Attribute       | Values                                                                                                                         |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `data-ui`       | `single-select` (trigger) · `single-select-item` · `single-select-content` · `single-select-icon` · `single-select-icon-glyph` |
| `data-ui-state` | `disabled` · `error`                                                                                                           |

### 2.4.1 Example

```tsx
const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

<AppField label='Status' for='status'>
  <AppSingleSelect
    id='status'
    name='status'
    options={statusOptions}
    value={status}
    placeholder='Select status…'
    onChange={setStatus}
  />
</AppField>
```

### 2.5 AppMultiSelect

Inline multi-value picker. Renders as an always-visible listbox — not a dropdown.

**Variants:** none\
**Key props:** `options`, `value`, `defaultValue`, `disabled`, `error`, `onChange`\
**Composition:** use inside `AppField`\
**Notes:** `onChange` receives `string[]`

| Attribute       | Values                               |
| --------------- | ------------------------------------ |
| `data-ui`       | `multi-select` · `multi-select-item` |
| `data-ui-state` | `disabled` · `error`                 |

### 2.5.1 Example

```tsx
const cropOptions = [
  { value: 'wheat', label: 'Wheat' },
  { value: 'corn', label: 'Corn' },
  { value: 'soy', label: 'Soy' },
]

<AppField label='Crops' for='crops'>
  <AppMultiSelect options={cropOptions} value={selected} onChange={setSelected} />
</AppField>
```

### 2.6 AppCheckbox

Checkbox with inline label.

**Variants:** none\
**Key props:** `checked`, `defaultChecked`, `disabled`, `error`, `name`, `required`, `value`, `onChange`, `children` (label text)\
**Composition:** standalone or inside `AppField`

| Attribute       | Values               |
| --------------- | -------------------- |
| `data-ui`       | `checkbox`           |
| `data-ui-state` | `disabled` · `error` |

### 2.6.1 Example

```tsx
<AppCheckbox checked={notify} onChange={setNotify}>
  Send notification on completion
</AppCheckbox>
```

### 2.7 AppRadioGroup / AppRadioItem

Radio button group. `AppRadioItem` is the child element.

**Key props (AppRadioGroup):** `value`, `defaultValue`, `disabled`, `error`, `onChange`\
**Key props (AppRadioItem):** `value`, `disabled`, `children` (label)\
**Composition:** `AppRadioGroup` wraps `AppRadioItem` children; use inside `AppField`

| Attribute       | Values                                                                        |
| --------------- | ----------------------------------------------------------------------------- |
| `data-ui`       | `radio-group` (group) · `radio-item` (item wrapper) · `radio` (input element) |
| `data-ui-state` | `disabled` · `error`                                                          |

### 2.7.1 Example

```tsx
<AppField label='Spray mode' for='spray-mode'>
  <AppRadioGroup value={mode} onChange={setMode}>
    <AppRadioItem value='auto'>Automatic</AppRadioItem>
    <AppRadioItem value='manual'>Manual</AppRadioItem>
    <AppRadioItem value='off'>Off</AppRadioItem>
  </AppRadioGroup>
</AppField>
```

### 2.8 AppToggle

Standalone pressed/unpressed toggle button.

**Variants:** none\
**Key props:** `pressed`, `defaultPressed`, `disabled`, `loading`, `onChange`, `children` (label)\
**Composition:** standalone; use inside `AppField variant='inline'` when a label is needed\
**Notes:** min-width `7rem` standalone; unset inside `AppToggleGroup`

| Attribute       | Values                 |
| --------------- | ---------------------- |
| `data-ui`       | `toggle`               |
| `data-ui-state` | `disabled` · `loading` |

### 2.8.1 Example

```tsx
<AppField label='Night mode' for='night-mode' variant='inline'>
  <AppToggle pressed={nightMode} onChange={setNightMode}>Enable</AppToggle>
</AppField>
```

### 2.9 AppToggleGroup / AppToggleItem

Single-select toggle group. `AppToggleItem` is the child element.

**Key props (AppToggleGroup):** `value`, `defaultValue`, `disabled`, `onChange`\
**Key props (AppToggleItem):** `value`, `disabled`, `children`\
**Composition:** `AppToggleGroup` wraps `AppToggleItem` children

| Attribute       | Values                                             |
| --------------- | -------------------------------------------------- |
| `data-ui`       | `toggle-group` (group) · `toggle-item` (each item) |
| `data-ui-state` | `disabled` (on group)                              |

### 2.9.1 Example

```tsx
<AppToggleGroup value={view} onChange={setView}>
  <AppToggleItem value='calendar'>Calendar</AppToggleItem>
  <AppToggleItem value='list'>List</AppToggleItem>
  <AppToggleItem value='map'>Map</AppToggleItem>
</AppToggleGroup>
```

### 2.10 AppTabs / AppTabList / AppTab / AppTabPanel

Tabbed content panel. Keyboard: arrow keys move focus, Enter/Space activates.

**Key props (AppTabs):** `value`, `defaultValue`, `activationMode` (`'manual'` default), `disabled`, `onChange`\
**Key props (AppTab):** `value`, `disabled`, `children`\
**Key props (AppTabPanel):** `value`, `children`\
**Composition:** `AppTabs` > `AppTabList` > `AppTab`; `AppTabPanel` siblings to `AppTabList`

| Attribute       | Values                                    |
| --------------- | ----------------------------------------- |
| `data-ui`       | `tabs` · `tab-list` · `tab` · `tab-panel` |
| `data-ui-state` | `disabled` (on `tabs`)                    |

### 2.10.1 Example

```tsx
<AppTabs value={tab} onChange={setTab}>
  <AppTabList>
    <AppTab value='details'>Details</AppTab>
    <AppTab value='history'>History</AppTab>
    <AppTab value='alerts'>Alerts</AppTab>
  </AppTabList>
  <AppTabPanel value='details'>…</AppTabPanel>
  <AppTabPanel value='history'>…</AppTabPanel>
  <AppTabPanel value='alerts'>…</AppTabPanel>
</AppTabs>
```

### 2.11 AppAccordion / AppAccordionItem / AppAccordionTrigger / AppAccordionContent

Collapsible content sections.

**Key props (AppAccordion):** `multiple`, `value`, `defaultValue`, `onValueChange`\
**Key props (AppAccordionItem):** `value` (required), `disabled`\
**Composition:** `AppAccordion` > `AppAccordionItem` > `AppAccordionTrigger` + `AppAccordionContent`

| Attribute       | Values                                                                     |
| --------------- | -------------------------------------------------------------------------- |
| `data-ui`       | `accordion` · `accordion-item` · `accordion-trigger` · `accordion-content` |
| `data-ui-state` | `disabled` (on `accordion-item`)                                           |

### 2.11.1 Example

```tsx
<AppAccordion multiple>
  <AppAccordionItem value='spray'>
    <AppAccordionTrigger>Spray Settings</AppAccordionTrigger>
    <AppAccordionContent>…</AppAccordionContent>
  </AppAccordionItem>
  <AppAccordionItem value='schedule'>
    <AppAccordionTrigger>Schedule</AppAccordionTrigger>
    <AppAccordionContent>…</AppAccordionContent>
  </AppAccordionItem>
</AppAccordion>
```

### 2.12 AppDialog

Modal base. Full-screen on mobile, centered card on tablet/desktop.

**Key props:** `open`, `onOpenChange`, `children`\
**Composition:** compose with `AppCard variant='workflow'` for the form surface

| Attribute | Values                      |
| --------- | --------------------------- |
| `data-ui` | `dialog` · `dialog-overlay` |

### 2.12.1 Example

```tsx
<AppDialog open={open} onOpenChange={setOpen}>
  <AppCard variant='workflow'>
    <h2>Edit Field</h2>
    <AppFormGrid>
      <AppField label='Name' for='name'>
        <AppInput id='name' value={name} onChange={setName} />
      </AppField>
    </AppFormGrid>
    <AppFormActions>
      <AppButton variant='ghost' onClick={() => setOpen(false)}>Cancel</AppButton>
      <AppButton variant='primary' type='submit'>Save</AppButton>
    </AppFormActions>
  </AppCard>
</AppDialog>
```

### 2.13 AppPopover

Floating content panel anchored to a trigger. Use for context menus and secondary actions.

**Key props:** `open`, `onOpenChange`, `children`\
**Composition:** trigger and content are children

| Attribute | Values    |
| --------- | --------- |
| `data-ui` | `popover` |

### 2.13.1 Example

```tsx
<AppPopover open={open} onOpenChange={setOpen}>
  <AppButton variant='ghost'>Options</AppButton>
  <AppLayout>
    <AppButton variant='ghost' onClick={handleEdit}>Edit</AppButton>
    <AppButton variant='danger' onClick={handleDelete}>Delete</AppButton>
  </AppLayout>
</AppPopover>
```

### 2.14 AppTooltip

Hover tooltip anchored to a trigger.

**Key props:** `content`, `children` (trigger element)\
**Composition:** wraps its trigger as a child

| Attribute | Values    |
| --------- | --------- |
| `data-ui` | `tooltip` |

### 2.14.1 Example

```tsx
<AppTooltip content='Last synced 2 minutes ago'>
  <AppBadge variant='info'>Synced</AppBadge>
</AppTooltip>
```

### 2.15 AppProgress

Linear progress bar.

**Variants:** none\
**Key props:** `value`, `min`, `max`\
**Composition:** standalone

| Attribute | Values                                          |
| --------- | ----------------------------------------------- |
| `data-ui` | `progress` · `progress-track` · `progress-fill` |

### 2.15.1 Example

```tsx
<AppProgress value={uploaded} min={0} max={totalFiles} />
```

## 3. Display Controls

### 3.1 AppBadge

Status pill. Default (no variant) is ghost — transparent with border.

**Variants:** `success` · `warning` · `danger` · `info`\
**Key props:** `variant`, `children`\
**Composition:** inline; place inside table cells, card headers, or list items

| Attribute         | Values                                    |
| ----------------- | ----------------------------------------- |
| `data-ui`         | `badge`                                   |
| `data-ui-variant` | `success` · `warning` · `danger` · `info` |

### 3.1.1 Example

```tsx
<AppBadge variant='success'>Active</AppBadge>
<AppBadge variant='warning'>Pending</AppBadge>
<AppBadge variant='danger'>Fault</AppBadge>
<AppBadge>Unknown</AppBadge>
```

### 3.2 AppAlert

Inline feedback message with left-border accent.

**Variants:** `success` · `warning` · `danger` · `info`\
**Key props:** `variant`, `children`\
**Composition:** standalone block; do not nest inside `AppCard`

| Attribute         | Values                                    |
| ----------------- | ----------------------------------------- |
| `data-ui`         | `alert`                                   |
| `data-ui-variant` | `success` · `warning` · `danger` · `info` |

### 3.2.1 Example

```tsx
<AppAlert variant='warning'>
  Wind speed exceeds recommended spray threshold. Review conditions before proceeding.
</AppAlert>
```

### 3.3 AppAvatar

User avatar. Renders initials when no image is available.

**Variants:** none\
**Key props:** `children` (initials or image)\
**Composition:** standalone; use in nav headers, list rows, and comment threads

| Attribute | Values   |
| --------- | -------- |
| `data-ui` | `avatar` |

### 3.3.1 Example

```tsx
<AppAvatar>TK</AppAvatar>
```

### 3.4 AppCard

Framed content surface. The default (no variant) is the panel look.

**Variants:** `widget` · `workflow` (no prop = panel)\
**Key props:** `variant`, `children`\
**Composition:** panels are interior surfaces; widgets go in dashboard grids; workflow wraps forms inside `AppDialog`

| Attribute         | Values                |
| ----------------- | --------------------- |
| `data-ui`         | `card`                |
| `data-ui-variant` | `widget` · `workflow` |

### 3.4.1 Example

```tsx
<AppCard>
  <p>Panel content</p>
</AppCard>

<AppCard variant='widget'>
  <h3>Fleet Status</h3>
  <p>4 of 6 drones active</p>
</AppCard>
```

### 3.5 AppSeparator

Horizontal or vertical rule.

**Variants:** none\
**Key props:** `orientation` (`'horizontal'` default)\
**Composition:** standalone

| Attribute | Values      |
| --------- | ----------- |
| `data-ui` | `separator` |

### 3.5.1 Example

```tsx
<AppSeparator />
<AppSeparator orientation='vertical' />
```

### 3.6 AppSpinner

Indeterminate loading indicator.

**Variants:** none\
**Key props:** none beyond children\
**Composition:** standalone; center inside loading containers

| Attribute | Values    |
| --------- | --------- |
| `data-ui` | `spinner` |

### 3.6.1 Example

```tsx
<AppSpinner />
```

### 3.7 AppSkeleton

Loading placeholder shimmer. Size it to match the content it replaces.

**Variants:** none\
**Key props:** `children` (or size via container)\
**Composition:** replace content elements 1:1 during load

| Attribute | Values     |
| --------- | ---------- |
| `data-ui` | `skeleton` |

### 3.7.1 Example

```tsx
<Show
  when={data()}
  fallback={
    <AppSkeleton>
      <div style='height: 2rem' />
    </AppSkeleton>
  }
>
  <h2>{data().title}</h2>
</Show>
```

## 4. Layout Controls

### 4.1 AppLayout

Unified layout primitive. Covers both block (vertical) and inline (horizontal) arrangements through
variant, with optional gap density for tighter compositions.

**Variants:** default/`block` · `block-fit` · `inline` · `inline-fill`\
**Gap:** default · `tight` · `none`\
**Key props:** `variant`, `gap`, `children`\
**Composition:** general-purpose layout container for block and inline child arrangement

| Variant       | Behaviour                                              |
| ------------- | ------------------------------------------------------ |
| _(default)_   | Full-width vertical grid                               |
| `block-fit`   | Content-fit vertical grid, items start-aligned         |
| `inline`      | Content-fit horizontal flex, wraps                     |
| `inline-fill` | Full-width horizontal flex, children equally stretched |

| Gap       | Behaviour                       |
| --------- | ------------------------------- |
| _(unset)_ | Standard layout gap             |
| `tight`   | Small layout gap for close text |
| `none`    | No gap                          |

| Attribute         | Values                                 |
| ----------------- | -------------------------------------- |
| `data-ui`         | `layout`                               |
| `data-ui-variant` | `block-fit` · `inline` · `inline-fill` |
| `data-ui-gap`     | `tight` · `none`                       |

### 4.1.1 Example

```tsx
<AppLayout>
  <AppField label='Name' for='name'>
    <AppInput id='name' value={name} onChange={setName} />
  </AppField>
  <AppField label='Status' for='status'>
    <AppSingleSelect id='status' options={statusOptions} value={status} onChange={setStatus} />
  </AppField>
</AppLayout>

<AppLayout variant='inline'>
  <AppBadge variant='success'>Active</AppBadge>
  <AppBadge variant='info'>Synced</AppBadge>
</AppLayout>

<AppLayout variant='inline-fill'>
  <AppButton variant='ghost'>Cancel</AppButton>
  <AppButton variant='primary'>Save</AppButton>
</AppLayout>

<AppLayout gap='tight'>
  <h1>swarmAg Style Guide</h1>
  <p>Living visual validation for tokens, states, themes, and controls.</p>
</AppLayout>
```

### 4.2 AppList / AppListItem

Semantic list with visual variants.

**Variants (AppList):** default (clean, unstyled) · `bullet` · `numbered`\
**Key props (AppList):** `variant`, `children`\
**Key props (AppListItem):** `children`\
**Composition:** `AppList` wraps `AppListItem` children

| Attribute         | Values                |
| ----------------- | --------------------- |
| `data-ui`         | `list` · `list-item`  |
| `data-ui-variant` | `bullet` · `numbered` |

### 4.2.1 Example

```tsx
<AppList variant='bullet'>
  <AppListItem>Pre-flight checklist complete</AppListItem>
  <AppListItem>Wind within operating limits</AppListItem>
  <AppListItem>Battery charged above 80%</AppListItem>
</AppList>
```

### 4.3 AppTable / AppTableHeader / AppTableBody / AppTableRow / AppTableCell

Semantic table family. `AppTableCell` renders as `<th>` inside `AppTableHeader`, `<td>` elsewhere — no prop needed.

**Key props (AppTableRow):** `section` (boolean) — renders an accent group-header row\
**Composition:** `AppTable` > `AppTableHeader` + `AppTableBody` > `AppTableRow` > `AppTableCell`

| Attribute         | Values                                                             |
| ----------------- | ------------------------------------------------------------------ |
| `data-ui`         | `table` · `table-head` · `table-body` · `table-row` · `table-cell` |
| `data-ui-variant` | `section` (on `table-row` when `section={true}`)                   |

### 4.3.1 Example

```tsx
<AppTable>
  <AppTableHeader>
    <AppTableRow>
      <AppTableCell>Drone</AppTableCell>
      <AppTableCell>Status</AppTableCell>
      <AppTableCell>Battery</AppTableCell>
    </AppTableRow>
  </AppTableHeader>
  <AppTableBody>
    <AppTableRow section>
      <AppTableCell>Zone A</AppTableCell>
    </AppTableRow>
    <AppTableRow>
      <AppTableCell>SA-01</AppTableCell>
      <AppTableCell>
        <AppBadge variant='success'>Active</AppBadge>
      </AppTableCell>
      <AppTableCell>92%</AppTableCell>
    </AppTableRow>
  </AppTableBody>
</AppTable>
```

### 4.4 AppFooter

Footer control with centered caller-supplied logo and mobile safe-area support.

**Key props:** `logo`, `alt`\
**Composition:** use at an app or harness boundary where a branded footer is needed

| Attribute | Values                   |
| --------- | ------------------------ |
| `data-ui` | `footer` · `footer-logo` |

### 4.4.1 Example

```tsx
<AppFooter logo={logo} alt='swarmAg' />
```

## 5. Form Layout

Form layout primitives are controls — imported from the same barrel as all other controls.

### 5.1 AppField

Label + control wrapper. Always uses explicit `for`/`id` association.

**Variants:** `inline` (content-fit; use when a toggle or control should sit inline with siblings)\
**Key props:** `label` (required), `for` (required), `variant`, `children`\
**Notes:** label and control are always siblings — the label never wraps a control

| Attribute         | Values   |
| ----------------- | -------- |
| `data-ui`         | `field`  |
| `data-ui-variant` | `inline` |

### 5.1.1 Example

```tsx
<AppField label='Start time' for='start'>
  <AppInput id='start' type='time' value={start} onChange={setStart} />
</AppField>

<AppField label='Active' for='active' variant='inline'>
  <AppToggle pressed={active} onChange={setActive}>Enable</AppToggle>
</AppField>
```

### 5.2 AppFieldset

Semantic group boundary with a legend. Use when a form has logically distinct sections.

**Key props:** `legend` (required), `children`\
**Notes:** always place `AppFormGrid` inside a `<div>` inside the fieldset — never apply grid directly to `<fieldset>`

| Attribute | Values     |
| --------- | ---------- |
| `data-ui` | `fieldset` |

### 5.2.1 Example

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
```

### 5.3 AppFormGrid

Responsive auto-fit column layout. The layout host for `AppField` children.

**Key props:** `children`

| Attribute | Values      |
| --------- | ----------- |
| `data-ui` | `form-grid` |

### 5.3.1 Example

```tsx
<AppFormGrid>
  <AppField label='Name' for='name'>
    <AppInput id='name' value={name} onChange={setName} />
  </AppField>
  <AppField label='Code' for='code'>
    <AppInput id='code' value={code} onChange={setCode} />
  </AppField>
</AppFormGrid>
```

### 5.4 AppFormActions

Right-aligned action row. Always at the tail of the form, outside any fieldsets.

**Key props:** `children` (action `AppButton` elements)

| Attribute | Values         |
| --------- | -------------- |
| `data-ui` | `form-actions` |

### 5.4.1 Example

```tsx
<AppFormActions>
  <AppButton variant='ghost' onClick={onCancel}>Cancel</AppButton>
  <AppButton variant='primary' type='submit'>Save</AppButton>
</AppFormActions>
```

### 5.5 Composition example

Full form pattern — fieldset, grid, field, and actions working together.

```tsx
<AppFieldset legend='Spray window'>
  <div>
    <AppFormGrid>
      <AppField label='Start time' for='start'>
        <AppInput id='start' type='time' />
      </AppField>
      <AppField label='End time' for='end'>
        <AppInput id='end' type='time' />
      </AppField>
    </AppFormGrid>
  </div>
</AppFieldset>

<AppFormActions>
  <AppButton variant='ghost'>Cancel</AppButton>
  <AppButton variant='primary' type='submit'>Save</AppButton>
</AppFormActions>
```

## 6. Charts

Charts are standardized through `AppChart`.

| Variant      | Purpose                            |
| ------------ | ---------------------------------- |
| `pie`        | Composition at a point in time     |
| `bar`        | Frequency / volume over categories |
| `line`       | Trend over rolling time period     |
| `spark-line` | Inline mini trend                  |

_End of Component Guide Document_
