![swarmAg Operations System](../swarmag-ops-logo.png)

# swarmAg Operations System — Component Guide

## 1. Overview

This document is the consumer guide for the shared SolidJS UI controls exported
from `@ux/common/components/ui`. It describes the public TypeScript API:
what each control is for, which props it accepts, how controlled and
uncontrolled state work, and how compound controls are composed.

The controls provide accessible interaction behavior and a consistent visual
language. Their implementation details, CSS selector rules, token architecture,
and internal primitive bindings are covered by `ux-components-internals.md`.

## 2. Using The Library

Import controls from the barrel:

```typescript
import { AppButton, AppField, AppInput, AppSingleSelect } from '@ux/common/components/ui'
```

Most controls accept `children?: AppComponent`, where `AppComponent` is the
library alias for `JSX.Element`.

### 2.1 Consumer Boundaries

Controls deliberately own their semantic attributes and visual hooks. Consumer
code should not pass these props:

- `class`
- `classList`
- `style`
- `data-ui`
- `data-ui-variant`
- `data-ui-state`

Where the source type extends native JSX attributes, ordinary native attributes
such as `id`, `name`, `type`, `aria-label`, `onClick`, or `children` may be
used unless the prop table says otherwise.

### 2.2 Component-First Rule

When this library provides an App control for an HTML element or interaction
pattern, application code must use the App control instead of the native element.
This is a design-system boundary, not a stylistic preference.

| Use                                          | Do Not Use                                              |
| -------------------------------------------- | ------------------------------------------------------- |
| `AppButton`                                  | `<button>`                                              |
| `AppInput`                                   | `<input>`                                               |
| `AppTextarea`                                | `<textarea>`                                            |
| `AppSingleSelect`                            | `<select>`                                              |
| `AppCheckbox`                                | `<input type='checkbox'>`                               |
| `AppRadioGroup`, `AppRadioItem`              | `<input type='radio'>`                                  |
| `AppToggle`, `AppToggleGroup`                | ad hoc pressed button groups                            |
| `AppTabs`                                    | ad hoc tab markup                                       |
| `AppAccordion`                               | ad hoc disclosure markup                                |
| `AppDialog`, `AppPopover`, `AppTooltip`      | ad hoc overlay primitives                               |
| `AppProgress`                                | raw progress markup                                     |
| `AppBadge`, `AppAlert`, `AppAvatar`          | ad hoc status display markup                            |
| `AppCard`                                    | ad hoc panel wrappers                                   |
| `AppList`, `AppListItem`                     | `<ul>`, `<ol>`, `<li>`                                  |
| `AppTable`                                   | `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<td>`, `<th>` |
| `AppFieldset`                                | `<fieldset>` + `<legend>`                               |
| `AppField`                                   | `<div>` + `<label>` + {control}                         |
| `AppFormGrid`, `AppLayout`, `AppFormActions` | ad hoc form layout wrappers                             |

This rule keeps typography roles, semantic attributes, theme behavior, spacing,
state rendering, and accessibility behavior aligned with the design language.

The architecture guard script `guard-bare-html` enforces the native-element
subset of this boundary for elements that have direct App control replacements
currently `button`, `input`, `textarea`, `select`, `ul`, `ol`, and `li`.

Other component-first cases are consumer contract requirements even when they
are not yet mechanically enforced.

Native content elements such as headings and paragraphs remain appropriate where
the design language assigns them direct typographic roles and no App control exists for the same purpose.

### 2.3 Controlled & Uncontrolled Props

Selection controls generally support both controlled and uncontrolled modes:

| Pattern        | Use                                                  |
| -------------- | ---------------------------------------------------- |
| `value`        | Controlled current value supplied by the parent.     |
| `defaultValue` | Initial value managed internally after first render. |
| `onChange`     | Callback fired with the next value.                  |

Boolean controls use the same pattern with `checked`, `defaultChecked`,
`pressed`, or `defaultPressed`.

Do not pass both controlled and uncontrolled props unless the component
explicitly supports that combination.

### 2.4 Common State Props

Many controls accept these state props:

| Prop       | Type      | Description                                                   |
| ---------- | --------- | ------------------------------------------------------------- |
| `disabled` | `boolean` | Disables the control when supported.                          |
| `error`    | `boolean` | Marks the control as invalid or visually errored.             |
| `loading`  | `boolean` | Marks the control as busy; many interactive controls disable. |

State precedence is `loading`, then `error`, then `disabled`.

### 2.5 Option Shape

Select-like controls use `AppOption`:

```typescript
type AppOption = {
  value: string
  label?: string
}
```

When `label` is omitted, the visible label falls back to `value`.

### 2.6 Data Attributes

Every control emits declared `data-ui` attributes. Consumers may use these for
testing and diagnostics. App or feature code should not invent new styling
attributes or override the emitted attributes.

## 3. Interactive Controls

### 3.1 AppButton

Action trigger for commands, form actions, and lightweight navigation affordances.

**Use When**

Use `AppButton` for user-initiated actions. Use `variant='primary'` for the main
action in a local context and `variant='danger'` for destructive actions.

**Props**

Extends native button attributes, excluding styling and semantic hook props.

| Prop       | Type                                              | Default | Description               |
| ---------- | ------------------------------------------------- | ------- | ------------------------- |
| `variant`  | `'primary' \| 'secondary' \| 'ghost' \| 'danger'` | unset   | Visual/action priority.   |
| `error`    | `boolean`                                         | `false` | Emits error state.        |
| `loading`  | `boolean`                                         | `false` | Emits loading state.      |
| `disabled` | `boolean`                                         | `false` | Native disabled behavior. |

`loading` disables the rendered button.

**Emitted Attributes**

`data-ui='button'`, `data-ui-variant`, `data-ui-state`.

**Example**

```tsx
<AppButton variant='primary' type='submit'>Save</AppButton>
<AppButton variant='ghost' onClick={onCancel}>Cancel</AppButton>
<AppButton variant='danger' loading={isDeleting}>Delete</AppButton>
```

### 3.2 AppInput

Single-line text entry.

**Use When**

Use inside `AppField` when a form needs one line of typed input.

**Props**

Extends native input attributes, excluding styling and semantic hook props.

| Prop       | Type      | Default | Description                       |
| ---------- | --------- | ------- | --------------------------------- |
| `error`    | `boolean` | `false` | Marks the field invalid.          |
| `loading`  | `boolean` | `false` | Disables the field while busy.    |
| `disabled` | `boolean` | `false` | Disables the field.               |
| `id`       | `string`  | `name`  | Used by `AppField` label linkage. |
| `name`     | `string`  | unset   | Native form field name.           |

**Composition**

Pair with `AppField`; pass the same value to `AppField for` and `AppInput id`.

**Example**

```tsx
<AppField label='Service name' for='service-name'>
  <AppInput
    id='service-name'
    name='serviceName'
    value={serviceName()}
    onInput={event => setServiceName(event.currentTarget.value)}
  />
</AppField>
```

### 3.3 AppTextarea

Multi-line text entry.

**Use When**

Use for notes, descriptions, instructions, or other longer text fields.

**Props**

Extends native textarea attributes, excluding styling and semantic hook props.

| Prop       | Type      | Default | Description                       |
| ---------- | --------- | ------- | --------------------------------- |
| `error`    | `boolean` | `false` | Marks the field invalid.          |
| `loading`  | `boolean` | `false` | Disables the field while busy.    |
| `disabled` | `boolean` | `false` | Disables the field.               |
| `id`       | `string`  | `name`  | Used by `AppField` label linkage. |
| `name`     | `string`  | unset   | Native form field name.           |

**Example**

```tsx
<AppField label='Notes' for='notes'>
  <AppTextarea
    id='notes'
    name='notes'
    rows={4}
    value={notes()}
    onInput={event => setNotes(event.currentTarget.value)}
  />
</AppField>
```

### 3.4 AppSingleSelect

Dropdown single-value picker.

**Use When**

Use when the user must choose exactly one value from a known option list.

**Props**

| Prop           | Type                       | Required | Default | Description                   |
| -------------- | -------------------------- | -------- | ------- | ----------------------------- |
| `options`      | `ReadonlyArray<AppOption>` | yes      | —       | Available choices.            |
| `value`        | `string`                   | no       | unset   | Controlled selected value.    |
| `defaultValue` | `string`                   | no       | unset   | Initial uncontrolled value.   |
| `onChange`     | `(value: string) => void`  | no       | unset   | Receives selected value.      |
| `placeholder`  | `string`                   | no       | unset   | Text shown before selection.  |
| `id`           | `string`                   | no       | `name`  | Trigger id for label linkage. |
| `name`         | `string`                   | no       | unset   | Native form field name.       |
| `disabled`     | `boolean`                  | no       | `false` | Emits disabled state.         |
| `error`        | `boolean`                  | no       | `false` | Emits error state.            |
| `loading`      | `boolean`                  | no       | `false` | Disables the control as busy. |

**Behavior**

`onChange` receives the option `value`, not the full option object.

**Emitted Attributes**

`single-select`, `single-select-item`, `single-select-content`,
`single-select-icon`, and `single-select-icon-glyph`.

**Example**

```tsx
const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' }
]

<AppField label='Status' for='status'>
  <AppSingleSelect
    id='status'
    name='status'
    options={statusOptions}
    value={status()}
    placeholder='Select status'
    onChange={setStatus}
  />
</AppField>
```

### 3.5 AppMultiSelect

Inline multi-value listbox.

**Use When**

Use when several values may be selected at the same time and the option set
should remain visible.

**Props**

| Prop           | Type                        | Required | Default | Description                  |
| -------------- | --------------------------- | -------- | ------- | ---------------------------- |
| `options`      | `ReadonlyArray<AppOption>`  | yes      | —       | Available choices.           |
| `value`        | `string[]`                  | no       | unset   | Controlled selected values.  |
| `defaultValue` | `string[]`                  | no       | unset   | Initial uncontrolled values. |
| `onChange`     | `(value: string[]) => void` | no       | unset   | Receives selected values.    |
| `disabled`     | `boolean`                   | no       | `false` | Disables the control.        |
| `error`        | `boolean`                   | no       | `false` | Marks the control invalid.   |
| `loading`      | `boolean`                   | no       | `false` | Emits loading state.         |

**Example**

```tsx
<AppField label='Crops' for='crops'>
  <AppMultiSelect
    options={cropOptions}
    value={selectedCrops()}
    onChange={setSelectedCrops}
  />
</AppField>
```

### 3.6 AppCheckbox

Checkbox with inline label text.

**Use When**

Use for a single boolean choice.

**Props**

| Prop             | Type                         | Required | Default | Description                   |
| ---------------- | ---------------------------- | -------- | ------- | ----------------------------- |
| `children`       | `AppComponent`               | no       | unset   | Label content.                |
| `checked`        | `boolean`                    | no       | unset   | Controlled checked state.     |
| `defaultChecked` | `boolean`                    | no       | unset   | Initial checked state.        |
| `onChange`       | `(checked: boolean) => void` | no       | unset   | Receives next checked state.  |
| `name`           | `string`                     | no       | unset   | Native form field name.       |
| `value`          | `string`                     | no       | unset   | Native form value.            |
| `required`       | `boolean`                    | no       | `false` | Native required behavior.     |
| `disabled`       | `boolean`                    | no       | `false` | Disables the control.         |
| `error`          | `boolean`                    | no       | `false` | Marks the control invalid.    |
| `loading`        | `boolean`                    | no       | `false` | Disables the control as busy. |

**Example**

```tsx
<AppCheckbox checked={notify()} onChange={setNotify}>
  Send notification on completion
</AppCheckbox>
```

### 3.7 AppRadioGroup & AppRadioItem

Exclusive option group.

**Use When**

Use when all choices should be visible and only one choice may be selected.

**AppRadioGroup Props**

| Prop           | Type                     | Required | Default | Description                 |
| -------------- | ------------------------ | -------- | ------- | --------------------------- |
| `children`     | `AppComponent`           | no       | unset   | `AppRadioItem` children.    |
| `value`        | `Value`                  | no       | unset   | Controlled selected value.  |
| `defaultValue` | `Value`                  | no       | unset   | Initial uncontrolled value. |
| `onChange`     | `(value: Value) => void` | no       | unset   | Receives selected value.    |
| `name`         | `string`                 | no       | unset   | Native form group name.     |
| `required`     | `boolean`                | no       | `false` | Native required behavior.   |
| `disabled`     | `boolean`                | no       | `false` | Disables the group.         |
| `error`        | `boolean`                | no       | `false` | Marks the group invalid.    |
| `loading`      | `boolean`                | no       | `false` | Disables the group as busy. |

**AppRadioItem Props**

| Prop       | Type           | Required | Default | Description              |
| ---------- | -------------- | -------- | ------- | ------------------------ |
| `value`    | `Value`        | yes      | —       | Item value.              |
| `children` | `AppComponent` | no       | unset   | Item label content.      |
| `disabled` | `boolean`      | no       | `false` | Disables only this item. |

**Example**

```tsx
<AppField label='Spray mode' for='spray-mode'>
  <AppRadioGroup name='sprayMode' value={mode()} onChange={setMode}>
    <AppRadioItem value='auto'>Automatic</AppRadioItem>
    <AppRadioItem value='manual'>Manual</AppRadioItem>
    <AppRadioItem value='off'>Off</AppRadioItem>
  </AppRadioGroup>
</AppField>
```

### 3.8 AppToggle

Standalone pressed/unpressed button.

**Use When**

Use for one immediate boolean mode, especially when the control itself is the
visible action.

**Props**

Extends native button attributes, excluding styling and semantic hook props.

| Prop             | Type                         | Default | Description                   |
| ---------------- | ---------------------------- | ------- | ----------------------------- |
| `pressed`        | `boolean`                    | unset   | Controlled pressed state.     |
| `defaultPressed` | `boolean`                    | unset   | Initial uncontrolled state.   |
| `onChange`       | `(pressed: boolean) => void` | unset   | Receives next pressed state.  |
| `disabled`       | `boolean`                    | `false` | Disables the control.         |
| `error`          | `boolean`                    | `false` | Emits error state.            |
| `loading`        | `boolean`                    | `false` | Disables the control as busy. |

**Example**

```tsx
<AppField label='Night mode' for='night-mode' variant='inline'>
  <AppToggle pressed={nightMode()} onChange={setNightMode}>
    Enable
  </AppToggle>
</AppField>
```

### 3.9 AppToggleGroup & AppToggleItem

Single-select segmented toggle group.

**Use When**

Use when a small set of mutually exclusive modes should appear as peer buttons.

**AppToggleGroup Props**

| Prop           | Type                     | Required | Default | Description                 |
| -------------- | ------------------------ | -------- | ------- | --------------------------- |
| `children`     | `AppComponent`           | no       | unset   | `AppToggleItem` children.   |
| `value`        | `Value`                  | no       | unset   | Controlled selected value.  |
| `defaultValue` | `Value`                  | no       | unset   | Initial uncontrolled value. |
| `onChange`     | `(value: Value) => void` | no       | unset   | Receives selected value.    |
| `disabled`     | `boolean`                | no       | `false` | Disables the group.         |
| `error`        | `boolean`                | no       | `false` | Emits error state.          |
| `loading`      | `boolean`                | no       | `false` | Disables the group as busy. |

**AppToggleItem Props**

| Prop       | Type           | Required | Default | Description              |
| ---------- | -------------- | -------- | ------- | ------------------------ |
| `value`    | `Value`        | yes      | —       | Item value.              |
| `children` | `AppComponent` | no       | unset   | Item label content.      |
| `disabled` | `boolean`      | no       | `false` | Disables only this item. |

**Example**

```tsx
<AppToggleGroup value={view()} onChange={setView}>
  <AppToggleItem value='calendar'>Calendar</AppToggleItem>
  <AppToggleItem value='list'>List</AppToggleItem>
  <AppToggleItem value='map'>Map</AppToggleItem>
</AppToggleGroup>
```

### 3.10 AppTabs

Tabbed content primitive.

**Use When**

Use when multiple panels share the same screen region and only one panel should
be visible at a time.

**Required Composition**

```text
AppTabs
├── AppTabList
│   └── AppTab
└── AppTabPanel
```

**AppTabs Props**

| Prop             | Type                      | Required | Default    | Description              |
| ---------------- | ------------------------- | -------- | ---------- | ------------------------ |
| `children`       | `AppComponent`            | no       | unset      | List and panel children. |
| `value`          | `Value`                   | no       | unset      | Controlled active tab.   |
| `defaultValue`   | `Value`                   | no       | unset      | Initial active tab.      |
| `activationMode` | `'automatic' \| 'manual'` | no       | `'manual'` | Activation mode.         |
| `onChange`       | `(value: Value) => void`  | no       | unset      | Receives active tab.     |
| `disabled`       | `boolean`                 | no       | `false`    | Disables the tabs root.  |
| `error`          | `boolean`                 | no       | `false`    | Emits error state.       |
| `loading`        | `boolean`                 | no       | `false`    | Emits loading state.     |

**Child Props**

| Component     | Required Props | Optional Props         |
| ------------- | -------------- | ---------------------- |
| `AppTabList`  | —              | `children`             |
| `AppTab`      | `value`        | `children`, `disabled` |
| `AppTabPanel` | `value`        | `children`             |

**Example**

```tsx
<AppTabs value={tab()} onChange={setTab}>
  <AppTabList>
    <AppTab value='details'>Details</AppTab>
    <AppTab value='history'>History</AppTab>
  </AppTabList>
  <AppTabPanel value='details'>Details content</AppTabPanel>
  <AppTabPanel value='history'>History content</AppTabPanel>
</AppTabs>
```

### 3.11 AppAccordion

Collapsible content sections.

**Use When**

Use to show and hide related sections while keeping section headings visible.

**Required Composition**

```text
AppAccordion
└── AppAccordionItem
    ├── AppAccordionTrigger
    └── AppAccordionContent
```

**AppAccordion Props**

| Prop            | Type                        | Required | Default | Description                 |
| --------------- | --------------------------- | -------- | ------- | --------------------------- |
| `children`      | `AppComponent`              | no       | unset   | Accordion item children.    |
| `multiple`      | `boolean`                   | no       | `false` | Allows multiple open items. |
| `value`         | `string[]`                  | no       | unset   | Controlled open items.      |
| `defaultValue`  | `string[]`                  | no       | unset   | Initially open items.       |
| `onValueChange` | `(value: string[]) => void` | no       | unset   | Receives open item values.  |
| `error`         | `boolean`                   | no       | `false` | Emits error state.          |
| `loading`       | `boolean`                   | no       | `false` | Emits loading state.        |

**Child Props**

| Component             | Required Props | Optional Props         |
| --------------------- | -------------- | ---------------------- |
| `AppAccordionItem`    | `value`        | `children`, `disabled` |
| `AppAccordionTrigger` | —              | `children`             |
| `AppAccordionContent` | —              | `children`             |

**Example**

```tsx
<AppAccordion multiple defaultValue={['spray']}>
  <AppAccordionItem value='spray'>
    <AppAccordionTrigger>Spray Settings</AppAccordionTrigger>
    <AppAccordionContent>Spray settings content</AppAccordionContent>
  </AppAccordionItem>
</AppAccordion>
```

### 3.12 AppDialog

Modal content primitive with overlay.

**Use When**

Use for focused tasks that interrupt the current page, such as edit forms or
confirmation flows.

**Props**

| Prop             | Type                      | Required | Default       | Description               |
| ---------------- | ------------------------- | -------- | ------------- | ------------------------- |
| `trigger`        | `AppComponent`            | no       | unset         | Trigger button content.   |
| `triggerVariant` | `AppButtonVariant`        | no       | `'secondary'` | Trigger button variant.   |
| `children`       | `AppComponent`            | no       | unset         | Dialog content.           |
| `open`           | `boolean`                 | no       | unset         | Controlled open state.    |
| `defaultOpen`    | `boolean`                 | no       | unset         | Initial open state.       |
| `onOpenChange`   | `(open: boolean) => void` | no       | unset         | Receives open state.      |
| `disabled`       | `boolean`                 | no       | `false`       | Disables the trigger.     |
| `error`          | `boolean`                 | no       | `false`       | Emits error state.        |
| `loading`        | `boolean`                 | no       | `false`       | Disables trigger as busy. |

**Example**

```tsx
<AppDialog
  trigger='Edit'
  open={open()}
  onOpenChange={setOpen}
>
  <AppCard variant='workflow'>
    <h2>Edit Field</h2>
    <AppFormGrid>
      <AppField label='Name' for='name'>
        <AppInput id='name' value={name()} onInput={onNameInput} />
      </AppField>
    </AppFormGrid>
  </AppCard>
</AppDialog>
```

### 3.13 AppPopover

Floating panel anchored to a trigger button.

**Use When**

Use for compact secondary actions, filters, or controls that do not require a
modal interruption.

**Props**

Same open-state and trigger props as `AppDialog`.

**Example**

```tsx
<AppPopover trigger='Options' triggerVariant='ghost'>
  <AppLayout>
    <AppButton variant='ghost' onClick={handleEdit}>Edit</AppButton>
    <AppButton variant='danger' onClick={handleDelete}>Delete</AppButton>
  </AppLayout>
</AppPopover>
```

### 3.14 AppTooltip

Advisory content anchored to a trigger button.

**Use When**

Use for short helper text that clarifies an adjacent action or status.

**Props**

Same open-state and trigger props as `AppDialog`.

**Example**

```tsx
<AppTooltip trigger='Sync status' triggerVariant='ghost'>
  Last synced 2 minutes ago
</AppTooltip>
```

### 3.15 AppProgress

Linear progress indicator.

**Use When**

Use to show progress through a determinate operation such as upload, sync, or
batch completion.

**Props**

| Prop       | Type           | Required | Default | Description                |
| ---------- | -------------- | -------- | ------- | -------------------------- |
| `label`    | `string`       | no       | unset   | Accessible label.          |
| `value`    | `number`       | no       | unset   | Current progress value.    |
| `minValue` | `number`       | no       | unset   | Minimum progress value.    |
| `maxValue` | `number`       | no       | unset   | Maximum progress value.    |
| `children` | `AppComponent` | no       | unset   | Optional adjacent content. |
| `disabled` | `boolean`      | no       | `false` | Emits disabled state.      |
| `error`    | `boolean`      | no       | `false` | Emits error state.         |
| `loading`  | `boolean`      | no       | `false` | Emits loading state.       |

**Example**

```tsx
<AppProgress
  label='Upload progress'
  value={uploaded()}
  minValue={0}
  maxValue={totalFiles()}
/>
```

## 4. Display Controls

### 4.1 AppBadge

Inline status pill.

**Props**

Extends native `span` attributes, excluding styling and semantic hook props.

| Prop       | Type                                           | Default | Description           |
| ---------- | ---------------------------------------------- | ------- | --------------------- |
| `variant`  | `'success' \| 'warning' \| 'danger' \| 'info'` | unset   | Status tone.          |
| `disabled` | `boolean`                                      | `false` | Emits disabled state. |
| `error`    | `boolean`                                      | `false` | Emits error state.    |
| `loading`  | `boolean`                                      | `false` | Emits loading state.  |

**Example**

```tsx
<AppBadge variant='success'>Active</AppBadge>
<AppBadge variant='warning'>Pending</AppBadge>
```

### 4.2 AppAlert

Inline feedback message.

**Props**

Extends native `div` attributes, excluding styling and semantic hook props.

| Prop       | Type                                           | Default | Description           |
| ---------- | ---------------------------------------------- | ------- | --------------------- |
| `variant`  | `'success' \| 'warning' \| 'danger' \| 'info'` | unset   | Feedback tone.        |
| `disabled` | `boolean`                                      | `false` | Emits disabled state. |
| `error`    | `boolean`                                      | `false` | Emits error state.    |
| `loading`  | `boolean`                                      | `false` | Emits loading state.  |

`AppAlert` renders with `role='alert'`.

**Example**

```tsx
<AppAlert variant='warning'>
  Wind speed exceeds the recommended spray threshold.
</AppAlert>
```

### 4.3 AppAvatar

Avatar marker for initials or compact identity content.

**Props**

Extends native `span` attributes, excluding styling and semantic hook props.

| Prop       | Type      | Default | Description           |
| ---------- | --------- | ------- | --------------------- |
| `disabled` | `boolean` | `false` | Emits disabled state. |
| `error`    | `boolean` | `false` | Emits error state.    |
| `loading`  | `boolean` | `false` | Emits loading state.  |

**Example**

```tsx
<AppAvatar>TK</AppAvatar>
```

### 4.4 AppCard

Framed content surface.

**Props**

Extends native `div` attributes, excluding styling and semantic hook props.

| Prop      | Type                     | Default | Description                 |
| --------- | ------------------------ | ------- | --------------------------- |
| `variant` | `'widget' \| 'workflow'` | unset   | Specialized card treatment. |

**Variants**

| Variant    | Use                                |
| ---------- | ---------------------------------- |
| unset      | Standard panel surface.            |
| `widget`   | Dashboard widget surface.          |
| `workflow` | Spacious form or workflow surface. |

**Example**

```tsx
<AppCard variant='widget'>
  <h3>Fleet Status</h3>
  <p>4 of 6 drones active</p>
</AppCard>
```

### 4.5 AppSeparator

Horizontal or vertical rule.

**Props**

Extends native element attributes accepted by the underlying separator
primitive, excluding styling and semantic hook props.

| Prop       | Type      | Default | Description           |
| ---------- | --------- | ------- | --------------------- |
| `disabled` | `boolean` | `false` | Emits disabled state. |
| `error`    | `boolean` | `false` | Emits error state.    |
| `loading`  | `boolean` | `false` | Emits loading state.  |

**Example**

```tsx
<AppSeparator />
<AppSeparator orientation='vertical' />
```

### 4.6 AppSpinner

Indeterminate loading indicator.

**Props**

Extends native `div` attributes, excluding styling and semantic hook props.

| Prop       | Type      | Default | Description           |
| ---------- | --------- | ------- | --------------------- |
| `disabled` | `boolean` | `false` | Emits disabled state. |
| `error`    | `boolean` | `false` | Emits error state.    |
| `loading`  | `boolean` | `false` | Emits loading state.  |

`AppSpinner` renders with `role='status'`.

**Example**

```tsx
<AppSpinner aria-label='Loading jobs' />
```

### 4.7 AppSkeleton

Loading placeholder shimmer.

**Props**

Extends native `div` attributes, excluding styling and semantic hook props.

| Prop       | Type      | Default | Description           |
| ---------- | --------- | ------- | --------------------- |
| `disabled` | `boolean` | `false` | Emits disabled state. |
| `error`    | `boolean` | `false` | Emits error state.    |
| `loading`  | `boolean` | `false` | Emits loading state.  |

**Example**

```tsx
<Show when={job()} fallback={<AppSkeleton aria-label='Loading job' />}>
  <h2>{job().title}</h2>
</Show>
```

## 5. Layout & Form Controls

### 5.1 AppLayout

General layout container for block and inline child arrangement.

**Props**

Extends native `div` attributes, excluding styling and semantic hook props.

| Prop       | Type                                       | Default | Description       |
| ---------- | ------------------------------------------ | ------- | ----------------- |
| `variant`  | `'block-fit' \| 'inline' \| 'inline-fill'` | unset   | Layout direction. |
| `gap`      | `'loose' \| 'tight' \| 'none'`             | unset   | Gap density.      |
| `children` | `AppComponent`                             | unset   | Layout children.  |

**Variants**

| Variant       | Use                                               |
| ------------- | ------------------------------------------------- |
| unset         | Full-width vertical stack.                        |
| `block-fit`   | Vertical stack that fits its content width.       |
| `inline`      | Horizontal wrapping layout.                       |
| `inline-fill` | Horizontal layout where children share the width. |

**Example**

```tsx
<AppLayout variant='inline'>
  <AppBadge variant='success'>Active</AppBadge>
  <AppBadge variant='info'>Synced</AppBadge>
</AppLayout>
```

### 5.2 AppList & AppListItem

Semantic list of items.

**AppList Props**

Extends native list attributes, excluding styling and semantic hook props.

| Prop      | Type                     | Default | Description            |
| --------- | ------------------------ | ------- | ---------------------- |
| `variant` | `'bullet' \| 'numbered'` | unset   | List visual treatment. |

`variant='numbered'` renders an `<ol>`. All other variants render a `<ul>`.

**AppListItem Props**

Extends native `li` attributes, excluding styling and semantic hook props.

**Example**

```tsx
<AppList variant='bullet'>
  <AppListItem>Pre-flight checklist complete</AppListItem>
  <AppListItem>Wind within operating limits</AppListItem>
</AppList>
```

### 5.3 AppTable

Semantic table wrappers.

**Required Composition**

```text
AppTable
├── AppTableHeader
│   └── AppTableCell
└── AppTableBody
    └── AppTableRow
        └── AppTableCell
```

**Props**

| Component        | Props                                  | Notes                          |
| ---------------- | -------------------------------------- | ------------------------------ |
| `AppTable`       | native table attrs                     | Renders `<table>`.             |
| `AppTableHeader` | `children: AppComponent`               | Wraps children in header row.  |
| `AppTableBody`   | native table-section attrs             | Renders `<tbody>`.             |
| `AppTableRow`    | `variant?: 'section'` plus row attrs   | Section rows span all columns. |
| `AppTableCell`   | `align?: 'start' \| 'center' \| 'end'` | Renders `<th>` in headers.     |

**Example**

```tsx
<AppTable>
  <AppTableHeader>
    <AppTableCell>Drone</AppTableCell>
    <AppTableCell align='end'>Battery</AppTableCell>
  </AppTableHeader>
  <AppTableBody>
    <AppTableRow variant='section'>
      <AppTableCell>Zone A</AppTableCell>
    </AppTableRow>
    <AppTableRow>
      <AppTableCell>SA-01</AppTableCell>
      <AppTableCell align='end'>92%</AppTableCell>
    </AppTableRow>
  </AppTableBody>
</AppTable>
```

### 5.4 AppFooter

Branded footer with a centered caller-supplied logo.

**Props**

| Prop   | Type     | Required | Default | Description                    |
| ------ | -------- | -------- | ------- | ------------------------------ |
| `logo` | `string` | yes      | —       | Logo image URL.                |
| `alt`  | `string` | no       | `''`    | Accessible alt text for image. |

**Example**

```tsx
<AppFooter logo={logoUrl} alt='swarmAg' />
```

### 5.5 AppField

Label and control wrapper.

**Use When**

Use for one labeled form control. The label and control are siblings; the label
does not wrap the control.

**Props**

| Prop       | Type           | Required | Default | Description                      |
| ---------- | -------------- | -------- | ------- | -------------------------------- |
| `label`    | `string`       | yes      | —       | Label text.                      |
| `for`      | `string`       | yes      | —       | Associated control id.           |
| `variant`  | `'inline'`     | no       | unset   | Places label and control inline. |
| `children` | `AppComponent` | yes      | —       | The associated control.          |

**Example**

```tsx
<AppField label='Start time' for='start'>
  <AppInput id='start' type='time' value={start()} onInput={onStartInput} />
</AppField>
```

### 5.6 AppFieldset

Semantic group boundary with legend.

**Use When**

Use when a form has a named group of related fields.

**Props**

| Prop       | Type           | Required | Default | Description     |
| ---------- | -------------- | -------- | ------- | --------------- |
| `legend`   | `string`       | yes      | —       | Group name.     |
| `children` | `AppComponent` | yes      | —       | Group contents. |

**Example**

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

### 5.7 AppFormGrid

Responsive field grid.

Use `AppFormGrid` for groups of `AppField` children that should automatically
flow into responsive form columns. It uses a field-oriented minimum column width,
so fields wrap onto new rows as available width changes.

Use `AppLayout` for general child arrangement, button rows, badges, compact
inline groups, and non-form layouts. `AppLayout` can stack or wrap children, but
it does not apply the form-specific auto-fit column behavior.

**Props**

| Prop       | Type           | Required | Default | Description     |
| ---------- | -------------- | -------- | ------- | --------------- |
| `children` | `AppComponent` | yes      | —       | Field children. |

**Example**

```tsx
<AppFormGrid>
  <AppField label='Name' for='name'>
    <AppInput id='name' value={name()} onInput={onNameInput} />
  </AppField>
</AppFormGrid>
```

### 5.8 AppFormActions

Right-aligned action row.

**Use When**

Use at the end of a form or dialog surface for submit and dismissal buttons.

**Props**

| Prop       | Type           | Required | Default | Description     |
| ---------- | -------------- | -------- | ------- | --------------- |
| `children` | `AppComponent` | yes      | —       | Action buttons. |

**Example**

```tsx
<AppFormActions>
  <AppButton variant='ghost' onClick={onCancel}>Cancel</AppButton>
  <AppButton variant='primary' type='submit'>Save</AppButton>
</AppFormActions>
```

## 6. Charts

The chart directory is reserved at `source/ux/common/components/charts`, but the
current component library does not export public chart controls. Consumers should
not import Chart.js directly; use App chart controls only after they are exposed
through the shared chart barrel.

| Variant      | Purpose                          |
| ------------ | -------------------------------- |
| `pie`        | Composition at a point in time.  |
| `bar`        | Frequency or volume by category. |
| `line`       | Trend over a time period.        |
| `spark-line` | Inline mini trend.               |

_End of Component Guide Document_
