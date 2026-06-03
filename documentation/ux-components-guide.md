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
import { UiButton, UiField, UiInput, UiSingleSelect } from '@ux/common/components/ui'
```

Most controls accept `children?: UiComponent`, where `UiComponent` is the
library alias for `JSX.Element`.

### 2.1 Consumer Boundaries

Controls deliberately own their semantic attributes and visual hooks. Consumer
code should not pass these props:

- `class`
- `classList`
- `style`
- `data-ui`
- `data-ui-variant`
- `data-ui-gap`
- `data-ui-align`
- `data-ui-overflow`
- `data-ui-state`

Where the source type extends native JSX attributes, ordinary native attributes
such as `id`, `name`, `type`, `aria-label`, `onClick`, or `children` may be
used unless the prop table says otherwise.

### 2.2 Component Referencing

UI controls use `name` as their public reference identity:

- Public UI control identity prop is `name`.
- Components derive DOM `id` internally from `name` when a rendered element needs a reference target.
- Optional `id` exists only as an escape hatch where the prop table explicitly supports it.
- Native `name` is forwarded only where it has actual form semantics; otherwise `name` is design-system identity input.
- `UiField.for` is valid only when the target is a real labelable rendered element.
- Use `UiField variant='caption'` for non-labelable controls such as `UiList`, `UiTable`, and Kobalte listbox roots.

When a labelable control is used inside `UiField`, pass the same value to
`UiField.for` and the control's `name`. Prefer `name` over `id` unless an
explicit escape hatch is required. When a non-labelable control needs a field
caption, omit `for` and set `variant='caption'`.

### 2.3 Component-First Rule

When this library provides a UI control for an HTML element or interaction
pattern, application code must use the corresponding UI control instead of the native element.
This is a design-system boundary, not a stylistic preference.

| Use                                  | Do Not Use                                              |
| ------------------------------------ | ------------------------------------------------------- |
| `UiButton`                           | `<button>`                                              |
| `UiInput`                            | `<input>`                                               |
| `UiTextArea`                         | `<textarea>`                                            |
| `UiSingleSelect`                     | `<select>`                                              |
| `UiCheckbox`                         | `<input type='checkbox'>`                               |
| `UiRadioGroup`, `UiRadioItem`        | `<input type='radio'>`                                  |
| `UiToggle`, `UiToggleGroup`          | ad hoc pressed button groups                            |
| `UiTabs`                             | ad hoc tab markup                                       |
| `UiAccordion`                        | ad hoc disclosure markup                                |
| `UiDialog`, `UiPopover`, `UiTooltip` | ad hoc overlay primitives                               |
| `UiProgress`                         | raw progress markup                                     |
| `UiBadge`, `UiAlert`, `UiAvatar`     | ad hoc status display markup                            |
| `UiCard`                             | ad hoc panel wrappers                                   |
| `UiList`, `UiListItem`               | `<ul>`, `<ol>`, `<li>`                                  |
| `UiTable`                            | `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<td>`, `<th>` |
| `UiFieldset`                         | `<fieldset>` + `<legend>`                               |
| `UiField`                            | `<div>` + `<label>` + {control}                         |
| `UiLayout`, `UiFormActions`          | ad hoc layout wrappers                                  |

This rule keeps typography roles, semantic attributes, theme behavior, spacing,
state rendering, and accessibility behavior aligned with the design language.

The architecture guard script `guard-bare-html` enforces the native-element
subset of this boundary for elements that have direct UI control replacements
currently `button`, `input`, `textarea`, `select`, `ul`, `ol`, `li`,
`table`, `thead`, `tbody`, `tfoot`, `tr`, `td`, and `th`.

Other component-first cases are consumer contract requirements even when they
are not yet mechanically enforced.

Native content elements such as headings and paragraphs remain appropriate where
the design language assigns them direct typographic roles and no UI control exists for the same purpose.

### 2.4 Controlled & Uncontrolled Props

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

### 2.5 Common State Props

Many controls accept these state props:

| Prop       | Type      | Description                                                   |
| ---------- | --------- | ------------------------------------------------------------- |
| `disabled` | `boolean` | Disables the control when supported.                          |
| `error`    | `boolean` | Marks the control as invalid or visually errored.             |
| `loading`  | `boolean` | Marks the control as busy; many interactive controls disable. |

State precedence is `loading`, then `error`, then `disabled`.

### 2.6 Option Shape

Select-like controls use `UiOption`:

```typescript
type UiOption = {
  value: string
  label?: string
}
```

When `label` is omitted, the visible label falls back to `value`.

### 2.7 Data Attributes

Every control emits declared `data-ui` attributes. Consumers may use these for
testing and diagnostics. App or feature code should not invent new styling
attributes or override the emitted attributes.

## 3. Interactive Controls

### 3.1 UiButton

Action trigger for commands, form actions, and lightweight navigation affordances.

**Use When**

Use `UiButton` for user-initiated actions. Use `variant='primary'` for the main
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
<UiButton variant='primary' type='submit'>Save</UiButton>
<UiButton variant='ghost' onClick={onCancel}>Cancel</UiButton>
<UiButton variant='danger' loading={isDeleting}>Delete</UiButton>
```

### 3.2 UiInput

Single-line text entry.

**Use When**

Use inside `UiField` when a form needs one line of typed input.

**Props**

Extends native input attributes, excluding styling and semantic hook props.

| Prop       | Type      | Default | Description                      |
| ---------- | --------- | ------- | -------------------------------- |
| `error`    | `boolean` | `false` | Marks the field invalid.         |
| `loading`  | `boolean` | `false` | Disables the field while busy.   |
| `disabled` | `boolean` | `false` | Disables the field.              |
| `id`       | `string`  | `name`  | Used by `UiField` label linkage. |
| `name`     | `string`  | unset   | Native form field name.          |

**Composition**

Pair with `UiField`; pass the same value to `UiField for` and `UiInput id`.

**Example**

```tsx
<UiField label='Service name' for='service-name'>
  <UiInput
    id='service-name'
    name='serviceName'
    value={serviceName()}
    onInput={event => setServiceName(event.currentTarget.value)}
  />
</UiField>
```

### 3.3 UiTextArea

Multi-line text entry.

**Use When**

Use for notes, descriptions, instructions, or other longer text fields.

**Props**

Extends native textarea attributes, excluding styling and semantic hook props.

| Prop       | Type      | Default | Description                      |
| ---------- | --------- | ------- | -------------------------------- |
| `error`    | `boolean` | `false` | Marks the field invalid.         |
| `loading`  | `boolean` | `false` | Disables the field while busy.   |
| `disabled` | `boolean` | `false` | Disables the field.              |
| `id`       | `string`  | `name`  | Used by `UiField` label linkage. |
| `name`     | `string`  | unset   | Native form field name.          |
| `rows`     | `number`  | `2`     | Visible text row count.          |

`rows` is interpreted by `UiTextArea` as the visual row count for the shared
control treatment. The underlying textarea still receives the native `rows`
attribute, but the component owns the rendered height.

**Example**

```tsx
<UiField label='Notes' for='notes'>
  <UiTextArea
    id='notes'
    name='notes'
    rows={4}
    value={notes()}
    onInput={event => setNotes(event.currentTarget.value)}
  />
</UiField>
```

### 3.4 UiSingleSelect

Dropdown single-value picker.

**Use When**

Use when the user must choose exactly one value from a known option list.

**Props**

| Prop           | Type                      | Required | Default | Description                   |
| -------------- | ------------------------- | -------- | ------- | ----------------------------- |
| `options`      | `ReadonlyArray<UiOption>` | yes      | —       | Available choices.            |
| `value`        | `string`                  | no       | unset   | Controlled selected value.    |
| `defaultValue` | `string`                  | no       | unset   | Initial uncontrolled value.   |
| `onChange`     | `(value: string) => void` | no       | unset   | Receives selected value.      |
| `placeholder`  | `string`                  | no       | unset   | Text shown before selection.  |
| `id`           | `string`                  | no       | `name`  | Trigger id for label linkage. |
| `name`         | `string`                  | no       | unset   | Native form field name.       |
| `disabled`     | `boolean`                 | no       | `false` | Emits disabled state.         |
| `error`        | `boolean`                 | no       | `false` | Emits error state.            |
| `loading`      | `boolean`                 | no       | `false` | Disables the control as busy. |

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

<UiField label='Status' for='status'>
  <UiSingleSelect
    id='status'
    name='status'
    options={statusOptions}
    value={status()}
    placeholder='Select status'
    onChange={setStatus}
  />
</UiField>
```

### 3.5 UiMultiSelect

Inline multi-value listbox.

**Use When**

Use when several values may be selected at the same time and the option set
should remain visible.

**Props**

| Prop           | Type                        | Required | Default | Description                  |
| -------------- | --------------------------- | -------- | ------- | ---------------------------- |
| `options`      | `ReadonlyArray<UiOption>`   | yes      | —       | Available choices.           |
| `value`        | `string[]`                  | no       | unset   | Controlled selected values.  |
| `defaultValue` | `string[]`                  | no       | unset   | Initial uncontrolled values. |
| `onChange`     | `(value: string[]) => void` | no       | unset   | Receives selected values.    |
| `name`         | `string`                    | no       | unset   | Reference identity.          |
| `id`           | `string`                    | no       | `name`  | Escape-hatch DOM target.     |
| `disabled`     | `boolean`                   | no       | `false` | Disables the control.        |
| `error`        | `boolean`                   | no       | `false` | Marks the control invalid.   |
| `loading`      | `boolean`                   | no       | `false` | Emits loading state.         |

**Example**

```tsx
<UiField label='Crops' variant='caption'>
  <UiMultiSelect
    options={cropOptions}
    value={selectedCrops()}
    onChange={setSelectedCrops}
  />
</UiField>
```

### 3.6 UiCheckbox

Checkbox with inline label text.

**Use When**

Use for a single boolean choice.

**Props**

| Prop             | Type                         | Required | Default | Description                   |
| ---------------- | ---------------------------- | -------- | ------- | ----------------------------- |
| `children`       | `UiComponent`                | no       | unset   | Label content.                |
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
<UiCheckbox checked={notify()} onChange={setNotify}>
  Send notification on completion
</UiCheckbox>
```

### 3.7 UiRadioGroup & UiRadioItem

Exclusive option group.

**Use When**

Use when all choices should be visible and only one choice may be selected.

**UiRadioGroup Props**

| Prop           | Type                     | Required | Default | Description                 |
| -------------- | ------------------------ | -------- | ------- | --------------------------- |
| `children`     | `UiComponent`            | no       | unset   | `UiRadioItem` children.     |
| `value`        | `Value`                  | no       | unset   | Controlled selected value.  |
| `defaultValue` | `Value`                  | no       | unset   | Initial uncontrolled value. |
| `onChange`     | `(value: Value) => void` | no       | unset   | Receives selected value.    |
| `name`         | `string`                 | no       | unset   | Native form group name.     |
| `required`     | `boolean`                | no       | `false` | Native required behavior.   |
| `disabled`     | `boolean`                | no       | `false` | Disables the group.         |
| `error`        | `boolean`                | no       | `false` | Marks the group invalid.    |
| `loading`      | `boolean`                | no       | `false` | Disables the group as busy. |

**UiRadioItem Props**

| Prop       | Type          | Required | Default | Description              |
| ---------- | ------------- | -------- | ------- | ------------------------ |
| `value`    | `Value`       | yes      | —       | Item value.              |
| `children` | `UiComponent` | no       | unset   | Item label content.      |
| `disabled` | `boolean`     | no       | `false` | Disables only this item. |

**Example**

```tsx
<UiField label='Spray mode' for='spray-mode'>
  <UiRadioGroup name='sprayMode' value={mode()} onChange={setMode}>
    <UiRadioItem value='auto'>Automatic</UiRadioItem>
    <UiRadioItem value='manual'>Manual</UiRadioItem>
    <UiRadioItem value='off'>Off</UiRadioItem>
  </UiRadioGroup>
</UiField>
```

### 3.8 UiToggle

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
<UiField label='Night mode' for='night-mode' variant='inline'>
  <UiToggle pressed={nightMode()} onChange={setNightMode}>
    Enable
  </UiToggle>
</UiField>
```

### 3.9 UiToggleGroup & UiToggleItem

Single-select segmented toggle group.

**Use When**

Use when a small set of mutually exclusive modes should appear as peer buttons.

**UiToggleGroup Props**

| Prop           | Type                     | Required | Default | Description                 |
| -------------- | ------------------------ | -------- | ------- | --------------------------- |
| `children`     | `UiComponent`            | no       | unset   | `UiToggleItem` children.    |
| `value`        | `Value`                  | no       | unset   | Controlled selected value.  |
| `defaultValue` | `Value`                  | no       | unset   | Initial uncontrolled value. |
| `onChange`     | `(value: Value) => void` | no       | unset   | Receives selected value.    |
| `disabled`     | `boolean`                | no       | `false` | Disables the group.         |
| `error`        | `boolean`                | no       | `false` | Emits error state.          |
| `loading`      | `boolean`                | no       | `false` | Disables the group as busy. |

**UiToggleItem Props**

| Prop       | Type          | Required | Default | Description              |
| ---------- | ------------- | -------- | ------- | ------------------------ |
| `value`    | `Value`       | yes      | —       | Item value.              |
| `children` | `UiComponent` | no       | unset   | Item label content.      |
| `disabled` | `boolean`     | no       | `false` | Disables only this item. |

**Example**

```tsx
<UiToggleGroup value={view()} onChange={setView}>
  <UiToggleItem value='calendar'>Calendar</UiToggleItem>
  <UiToggleItem value='list'>List</UiToggleItem>
  <UiToggleItem value='map'>Map</UiToggleItem>
</UiToggleGroup>
```

### 3.10 UiTabs

Tabbed content primitive.

**Use When**

Use when multiple panels share the same screen region and only one panel should
be visible at a time.

**Required Composition**

```text
UiTabs
├── UiTabList
│   └── UiTab
└── UiTabPanel
```

**UiTabs Props**

| Prop             | Type                      | Required | Default    | Description              |
| ---------------- | ------------------------- | -------- | ---------- | ------------------------ |
| `children`       | `UiComponent`             | no       | unset      | List and panel children. |
| `value`          | `Value`                   | no       | unset      | Controlled active tab.   |
| `defaultValue`   | `Value`                   | no       | unset      | Initial active tab.      |
| `activationMode` | `'automatic' \| 'manual'` | no       | `'manual'` | Activation mode.         |
| `onChange`       | `(value: Value) => void`  | no       | unset      | Receives active tab.     |
| `disabled`       | `boolean`                 | no       | `false`    | Disables the tabs root.  |
| `error`          | `boolean`                 | no       | `false`    | Emits error state.       |
| `loading`        | `boolean`                 | no       | `false`    | Emits loading state.     |

**Child Props**

| Component    | Required Props | Optional Props         |
| ------------ | -------------- | ---------------------- |
| `UiTabList`  | —              | `children`             |
| `UiTab`      | `value`        | `children`, `disabled` |
| `UiTabPanel` | `value`        | `children`             |

**Example**

```tsx
<UiTabs value={tab()} onChange={setTab}>
  <UiTabList>
    <UiTab value='details'>Details</UiTab>
    <UiTab value='history'>History</UiTab>
  </UiTabList>
  <UiTabPanel value='details'>Details content</UiTabPanel>
  <UiTabPanel value='history'>History content</UiTabPanel>
</UiTabs>
```

### 3.11 UiAccordion

Collapsible content sections.

**Use When**

Use to show and hide related sections while keeping section headings visible.

**Required Composition**

```text
UiAccordion
└── UiAccordionItem
    ├── UiAccordionTrigger
    └── UiAccordionContent
```

**UiAccordion Props**

| Prop            | Type                        | Required | Default | Description                 |
| --------------- | --------------------------- | -------- | ------- | --------------------------- |
| `children`      | `UiComponent`               | no       | unset   | Accordion item children.    |
| `multiple`      | `boolean`                   | no       | `false` | Allows multiple open items. |
| `value`         | `string[]`                  | no       | unset   | Controlled open items.      |
| `defaultValue`  | `string[]`                  | no       | unset   | Initially open items.       |
| `onValueChange` | `(value: string[]) => void` | no       | unset   | Receives open item values.  |
| `error`         | `boolean`                   | no       | `false` | Emits error state.          |
| `loading`       | `boolean`                   | no       | `false` | Emits loading state.        |

**Child Props**

| Component            | Required Props | Optional Props         |
| -------------------- | -------------- | ---------------------- |
| `UiAccordionItem`    | `value`        | `children`, `disabled` |
| `UiAccordionTrigger` | —              | `children`             |
| `UiAccordionContent` | —              | `children`             |

**Example**

```tsx
<UiAccordion multiple defaultValue={['spray']}>
  <UiAccordionItem value='spray'>
    <UiAccordionTrigger>Spray Settings</UiAccordionTrigger>
    <UiAccordionContent>Spray settings content</UiAccordionContent>
  </UiAccordionItem>
</UiAccordion>
```

### 3.12 UiDialog

Modal content primitive with overlay.

**Use When**

Use for focused tasks that interrupt the current page, such as edit forms or
confirmation flows.

**Props**

| Prop             | Type                      | Required | Default       | Description               |
| ---------------- | ------------------------- | -------- | ------------- | ------------------------- |
| `trigger`        | `UiComponent`             | no       | unset         | Trigger button content.   |
| `triggerVariant` | `UiButtonVariant`         | no       | `'secondary'` | Trigger button variant.   |
| `children`       | `UiComponent`             | no       | unset         | Dialog content.           |
| `open`           | `boolean`                 | no       | unset         | Controlled open state.    |
| `defaultOpen`    | `boolean`                 | no       | unset         | Initial open state.       |
| `onOpenChange`   | `(open: boolean) => void` | no       | unset         | Receives open state.      |
| `disabled`       | `boolean`                 | no       | `false`       | Disables the trigger.     |
| `error`          | `boolean`                 | no       | `false`       | Emits error state.        |
| `loading`        | `boolean`                 | no       | `false`       | Disables trigger as busy. |

**Example**

```tsx
<UiDialog
  trigger='Edit'
  open={open()}
  onOpenChange={setOpen}
>
  <UiCard variant='workflow'>
    <h2>Edit Field</h2>
    <UiLayout variant='inline-wrap'>
      <UiField label='Name' for='name'>
        <UiInput id='name' value={name()} onInput={onNameInput} />
      </UiField>
    </UiLayout>
  </UiCard>
</UiDialog>
```

### 3.13 UiPopover

Floating panel anchored to a trigger button.

**Use When**

Use for compact secondary actions, filters, or controls that do not require a
modal interruption.

**Props**

Same open-state and trigger props as `UiDialog`.

**Example**

```tsx
<UiPopover trigger='Options' triggerVariant='ghost'>
  <UiLayout>
    <UiButton variant='ghost' onClick={handleEdit}>Edit</UiButton>
    <UiButton variant='danger' onClick={handleDelete}>Delete</UiButton>
  </UiLayout>
</UiPopover>
```

### 3.14 UiTooltip

Advisory content anchored to a trigger button.

**Use When**

Use for short helper text that clarifies an adjacent action or status.

**Props**

Same open-state and trigger props as `UiDialog`.

**Example**

```tsx
<UiTooltip trigger='Sync status' triggerVariant='ghost'>
  Last synced 2 minutes ago
</UiTooltip>
```

### 3.15 UiProgress

Linear progress indicator.

**Use When**

Use to show progress through a determinate operation such as upload, sync, or
batch completion.

**Props**

| Prop       | Type          | Required | Default | Description                |
| ---------- | ------------- | -------- | ------- | -------------------------- |
| `label`    | `string`      | no       | unset   | Accessible label.          |
| `value`    | `number`      | no       | unset   | Current progress value.    |
| `minValue` | `number`      | no       | unset   | Minimum progress value.    |
| `maxValue` | `number`      | no       | unset   | Maximum progress value.    |
| `children` | `UiComponent` | no       | unset   | Optional adjacent content. |
| `disabled` | `boolean`     | no       | `false` | Emits disabled state.      |
| `error`    | `boolean`     | no       | `false` | Emits error state.         |
| `loading`  | `boolean`     | no       | `false` | Emits loading state.       |

**Example**

```tsx
<UiProgress
  label='Upload progress'
  value={uploaded()}
  minValue={0}
  maxValue={totalFiles()}
/>
```

## 4. Display Controls

### 4.1 UiBadge

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
<UiBadge variant='success'>Active</UiBadge>
<UiBadge variant='warning'>Pending</UiBadge>
```

### 4.2 UiAlert

Inline feedback message.

**Props**

Extends native `div` attributes, excluding styling and semantic hook props.

| Prop       | Type                                           | Default | Description           |
| ---------- | ---------------------------------------------- | ------- | --------------------- |
| `variant`  | `'success' \| 'warning' \| 'danger' \| 'info'` | unset   | Feedback tone.        |
| `disabled` | `boolean`                                      | `false` | Emits disabled state. |
| `error`    | `boolean`                                      | `false` | Emits error state.    |
| `loading`  | `boolean`                                      | `false` | Emits loading state.  |

`UiAlert` renders with `role='alert'`.

**Example**

```tsx
<UiAlert variant='warning'>
  Wind speed exceeds the recommended spray threshold.
</UiAlert>
```

### 4.3 UiAvatar

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
<UiAvatar>TK</UiAvatar>
```

### 4.4 UiCard

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
<UiCard variant='widget'>
  <h3>Fleet Status</h3>
  <p>4 of 6 drones active</p>
</UiCard>
```

### 4.5 UiSeparator

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
<UiSeparator />
<UiSeparator orientation='vertical' />
```

### 4.6 UiSpinner

Indeterminate loading indicator.

**Props**

Extends native `div` attributes, excluding styling and semantic hook props.

| Prop       | Type      | Default | Description           |
| ---------- | --------- | ------- | --------------------- |
| `disabled` | `boolean` | `false` | Emits disabled state. |
| `error`    | `boolean` | `false` | Emits error state.    |
| `loading`  | `boolean` | `false` | Emits loading state.  |

`UiSpinner` renders with `role='status'`.

**Example**

```tsx
<UiSpinner aria-label='Loading jobs' />
```

### 4.7 UiSkeleton

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
<Show when={job()} fallback={<UiSkeleton aria-label='Loading job' />}>
  <h2>{job().title}</h2>
</Show>
```

## 5. Layout & Form Controls

### 5.1 UiLayout

General layout container for block and inline child arrangement.

**Props**

Extends native `div` attributes, excluding styling and semantic hook props.

| Prop       | Type                                                        | Default | Description       |
| ---------- | ----------------------------------------------------------- | ------- | ----------------- |
| `variant`  | `'block-fit' \| 'inline' \| 'inline-fill' \| 'inline-wrap'` | unset   | Layout direction. |
| `gap`      | `'loose' \| 'tight' \| 'none'`                              | unset   | Gap density.      |
| `children` | `UiComponent`                                               | unset   | Layout children.  |

**Variants**

| Variant       | Use                                                |
| ------------- | -------------------------------------------------- |
| unset         | Full-width vertical stack.                         |
| `block-fit`   | Vertical stack that fits its content width.        |
| `inline`      | Horizontal wrapping layout.                        |
| `inline-fill` | Horizontal layout where children share the width.  |
| `inline-wrap` | Responsive row-oriented grid with column wrapping. |

**Example**

```tsx
<UiLayout variant='inline'>
  <UiBadge variant='success'>Active</UiBadge>
  <UiBadge variant='info'>Synced</UiBadge>
</UiLayout>
```

### 5.2 UiList & UiListItem

Semantic list of items.

**UiList Props**

Extends native list attributes, excluding styling and semantic hook props.

| Prop      | Type                     | Default | Description         |
| --------- | ------------------------ | ------- | ------------------- |
| `name`    | `string`                 | unset   | Reference identity. |
| `variant` | `'bullet' \| 'numbered'` | unset   | List treatment.     |

`name` derives the rendered list `id` when no explicit `id` is provided.
`variant='numbered'` renders an `<ol>`. All other variants render a `<ul>`.

**UiListItem Props**

Extends native `li` attributes, excluding styling and semantic hook props.

**Example**

```tsx
<UiField label='Pre-flight status' variant='caption'>
  <UiList variant='bullet'>
    <UiListItem>Pre-flight checklist complete</UiListItem>
    <UiListItem>Wind within operating limits</UiListItem>
  </UiList>
</UiField>
```

### 5.3 UiTable

Semantic table wrappers. Horizontal overflow is opt-in through `UiTable`.

**Required Composition**

```text
UiTable
├── UiTableHeader
│   └── UiTableCell
└── UiTableBody
    └── UiTableRow
        └── UiTableCell
```

**Props**

| Component       | Props                                                      | Notes                                          |
| --------------- | ---------------------------------------------------------- | ---------------------------------------------- |
| `UiTable`       | native table attrs, `name?: string`, `overflow?: Overflow` | Renders `<table>` or overflow wrapper + table. |
| `UiTableHeader` | `children: UiComponent`                                    | Wraps children in header row.                  |
| `UiTableBody`   | native table-section attrs                                 | Renders `<tbody>`.                             |
| `UiTableRow`    | `variant?: 'section'` plus row attrs                       | Section rows span all columns.                 |
| `UiTableCell`   | `align?: 'start' \| 'center' \| 'end'`                     | Renders `<th>` in headers.                     |

`name` derives the rendered table target `id` when no explicit `id` is provided.
`Overflow` is `'scroll' | 'hidden'`. Omit `overflow` for a plain semantic table.
Use `overflow='scroll'` for wide tables that should scroll horizontally.

**Example**

```tsx
<UiField label='Drone batteries' variant='caption'>
  <UiTable>
    <UiTableHeader>
      <UiTableCell>Drone</UiTableCell>
      <UiTableCell align='end'>Battery</UiTableCell>
    </UiTableHeader>
    <UiTableBody>
      <UiTableRow variant='section'>
        <UiTableCell>Zone A</UiTableCell>
      </UiTableRow>
      <UiTableRow>
        <UiTableCell>SA-01</UiTableCell>
        <UiTableCell align='end'>92%</UiTableCell>
      </UiTableRow>
    </UiTableBody>
  </UiTable>
</UiField>
```

### 5.4 UiFooter

Branded footer with a centered caller-supplied logo.

**Props**

| Prop   | Type     | Required | Default | Description                    |
| ------ | -------- | -------- | ------- | ------------------------------ |
| `logo` | `string` | yes      | —       | Logo image URL.                |
| `alt`  | `string` | no       | `''`    | Accessible alt text for image. |

**Example**

```tsx
<UiFooter logo={logoUrl} alt='swarmAg' />
```

### 5.5 UiField

Label and control wrapper.

**Use When**

Use for one labeled form control. The label and control are siblings; the label
does not wrap the control.

**Props**

| Prop       | Type                    | Required   | Default | Description                      |
| ---------- | ----------------------- | ---------- | ------- | -------------------------------- |
| `label`    | `string`                | yes        | —       | Label or caption text.           |
| `for`      | `string`                | label mode | —       | Associated labelable control id. |
| `variant`  | `'inline' \| 'caption'` | no         | unset   | Inline label or caption mode.    |
| `children` | `UiComponent`           | yes        | —       | The associated control.          |

Default and `variant='inline'` render a `<label for>`, so `for` must target a
labelable rendered element. `variant='caption'` renders a `<figcaption>` and is
for non-labelable controls such as lists, tables, and composite listboxes.

**Example**

```tsx
<UiField label='Start time' for='start'>
  <UiInput id='start' type='time' value={start()} onInput={onStartInput} />
</UiField>
```

### 5.6 UiFieldset

Semantic group boundary with legend.

**Use When**

Use when a form has a named group of related fields.

**Props**

| Prop       | Type          | Required | Default | Description     |
| ---------- | ------------- | -------- | ------- | --------------- |
| `legend`   | `string`      | yes      | —       | Group name.     |
| `children` | `UiComponent` | yes      | —       | Group contents. |

**Example**

```tsx
<UiFieldset legend='Spray window'>
  <UiLayout variant='inline-wrap'>
    <UiField label='Start time' for='start'>
      <UiInput id='start' type='time' />
    </UiField>
    <UiField label='End time' for='end'>
      <UiInput id='end' type='time' />
    </UiField>
  </UiLayout>
</UiFieldset>
```

### 5.7 UiFormActions

Right-aligned action row.

**Use When**

Use at the end of a form or dialog surface for submit and dismissal buttons.

**Props**

| Prop       | Type          | Required | Default | Description     |
| ---------- | ------------- | -------- | ------- | --------------- |
| `children` | `UiComponent` | yes      | —       | Action buttons. |

**Example**

```tsx
<UiFormActions>
  <UiButton variant='ghost' onClick={onCancel}>Cancel</UiButton>
  <UiButton variant='primary' type='submit'>Save</UiButton>
</UiFormActions>
```

## 6. Charts

The chart directory is reserved at `source/ux/common/components/charts`, but the
current component library does not export public chart controls. Consumers should
not import Chart.js directly; use chart controls only after they are exposed through
the shared chart barrel.

| Variant      | Purpose                          |
| ------------ | -------------------------------- |
| `pie`        | Composition at a point in time.  |
| `bar`        | Frequency or volume by category. |
| `line`       | Trend over a time period.        |
| `spark-line` | Inline mini trend.               |

_End of Component Guide Document_
