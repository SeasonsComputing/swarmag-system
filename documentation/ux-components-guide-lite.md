![swarmAg Operations System](../swarmag-ops-logo.png)

# swarmAg Operations System - Component Guide Lite

## 1. Purpose

This document is a compact AI-ingestion companion to
`documentation/ux-components-guide.md`.

The full guide remains authoritative. Use this lite guide when an AI coding
session needs the shared UI component contract quickly and can consult the full
guide only when exact prop details, examples, or edge cases are needed.

## 2. Consumer Rules

### 2.1 Import Boundary

Import shared controls from the public barrel:

```typescript
import { UiButton, UiField, UiInput } from '@ux/common/components/ui'
```

Do not import implementation internals, Kobalte primitives, or Chart.js
directly from application code.

### 2.2 Component-First Rule

When a shared `Ui*` control exists for an HTML element or interaction pattern,
application code must use the shared control.

| Use                                  | Do not use                                              |
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
| `UiBadge`, `UiAlert`, `UiAvatar`     | ad hoc status displays                                  |
| `UiCard`                             | ad hoc panel wrappers                                   |
| `UiList`, `UiListItem`               | `<ul>`, `<ol>`, `<li>`                                  |
| `UiTable`                            | `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<td>`, `<th>` |
| `UiFieldset`                         | `<fieldset>` and `<legend>`                             |
| `UiField`                            | ad hoc label/control wrapper                            |
| `UiLayout`, `UiFormActions`          | ad hoc layout wrappers                                  |

Native headings, paragraphs, and other content elements remain valid when no
shared UI control owns that semantic role.

### 2.3 Styling Boundary

Consumer code must not pass visual hook props to shared controls:

- `class`
- `classList`
- `style`
- `data-ui`
- `data-ui-variant`
- `data-ui-gap`
- `data-ui-align`
- `data-ui-overflow`
- `data-ui-state`

Controls own their semantic attributes, data hooks, typography treatment,
spacing, state rendering, accessibility behavior, and theme behavior.

### 2.4 Public Reference Identity

Shared controls use `name` as public reference identity.

- Prefer `name` over `id`.
- Components derive DOM `id` internally from `name` when needed.
- Use `id` only where the full guide explicitly lists it as an escape hatch.
- For labelable controls inside `UiField`, pass matching `UiField.for` and
  control `name` or supported `id`.
- For non-labelable controls, use `UiField variant='caption'` and omit `for`.

### 2.5 State Conventions

Selection controls commonly support controlled and uncontrolled use:

| Pattern          | Meaning                            |
| ---------------- | ---------------------------------- |
| `value`          | Controlled current value           |
| `defaultValue`   | Initial uncontrolled value         |
| `onChange`       | Callback with next value           |
| `checked`        | Controlled boolean state           |
| `defaultChecked` | Initial uncontrolled boolean state |
| `pressed`        | Controlled toggle state            |
| `defaultPressed` | Initial uncontrolled toggle state  |

Do not pass controlled and uncontrolled props together unless the full guide
explicitly allows it.

Common state props:

| Prop       | Meaning                                |
| ---------- | -------------------------------------- |
| `loading`  | Busy state; often disables interaction |
| `error`    | Invalid or error state                 |
| `disabled` | Disabled state                         |

State precedence is `loading`, then `error`, then `disabled`.

### 2.6 Option Shape

Select-like controls use:

```typescript
type UiOption = {
  value: string
  label?: string
}
```

When `label` is omitted, visible text falls back to `value`.

## 3. Interactive Controls

### 3.1 UiButton

Use for user-triggered commands and form actions.

Key props: `variant`, `loading`, `error`, `disabled`, normal button props.
Variants: `primary`, `secondary`, `ghost`, `danger`.

Use `primary` for the main local action and `danger` for destructive actions.
`loading` disables the button.

### 3.2 UiInput

Use for single-line text entry inside `UiField`.

Key props: `name`, supported `id`, `value`, `onInput`, `loading`, `error`,
`disabled`.

### 3.3 UiTextArea

Use for notes, descriptions, instructions, and longer text fields.

Key props: `name`, supported `id`, `rows`, `value`, `onInput`, `loading`,
`error`, `disabled`.

`rows` controls the shared visual treatment and is also passed to the native
textarea.

### 3.4 UiSingleSelect

Use when the user chooses exactly one value from a known option list.

Key props: `options`, `value`, `defaultValue`, `onChange`, `placeholder`,
`name`, supported `id`, `loading`, `error`, `disabled`.

`onChange` receives the selected option value, not the option object.

### 3.5 UiMultiSelect

Use when several values may be selected and the option set should stay visible.

Key props: `options`, `value`, `defaultValue`, `onChange`, `name`, supported
`id`, `loading`, `error`, `disabled`.

Use `UiField variant='caption'` when captioning this composite control.

### 3.6 UiCheckbox

Use for one boolean choice with inline label content.

Key props: `checked`, `defaultChecked`, `onChange`, `name`, `value`,
`required`, `loading`, `error`, `disabled`.

`onChange` receives the next boolean state.

### 3.7 UiRadioGroup and UiRadioItem

Use for visible mutually exclusive choices.

Required composition:

```text
UiRadioGroup
└── UiRadioItem
```

Group key props: `value`, `defaultValue`, `onChange`, `name`, `required`,
`loading`, `error`, `disabled`.

Item key props: `value`, `disabled`, children.

### 3.8 UiToggle

Use for one immediate pressed/unpressed mode.

Key props: `pressed`, `defaultPressed`, `onChange`, `loading`, `error`,
`disabled`.

`onChange` receives the next boolean pressed state.

### 3.9 UiToggleGroup and UiToggleItem

Use for a small mutually exclusive mode set shown as peer buttons.

Required composition:

```text
UiToggleGroup
└── UiToggleItem
```

Group key props: `value`, `defaultValue`, `onChange`, `loading`, `error`,
`disabled`.

Item key props: `value`, `disabled`, children.

### 3.10 UiTabs

Use when multiple panels share one screen region and only one panel is visible.

Required composition:

```text
UiTabs
├── UiTabList
│   └── UiTab
└── UiTabPanel
```

Tabs key props: `value`, `defaultValue`, `activationMode`, `onChange`,
`loading`, `error`, `disabled`.

`UiTabList` supports `layout='between'`. Overflow keeps native horizontal
scroll behavior.

### 3.11 UiAccordion

Use for collapsible content sections.

Required composition:

```text
UiAccordion
└── UiAccordionItem
    ├── UiAccordionTrigger
    └── UiAccordionContent
```

Key props: `multiple`, `value`, `defaultValue`, `onValueChange`, `loading`,
`error`.

### 3.12 UiDialog

Use for focused modal tasks such as edit forms or confirmations.

Key props: `trigger`, `triggerVariant`, `open`, `defaultOpen`,
`onOpenChange`, `loading`, `error`, `disabled`.

Dialog content should compose shared controls and use `UiFormActions` for
form-level actions.

### 3.13 UiPopover

Use for compact anchored secondary actions or filters that do not require a
modal interruption.

Open-state and trigger props match `UiDialog`.

### 3.14 UiTooltip

Use for short helper text clarifying an adjacent action or status.

Open-state and trigger props match `UiDialog`.

### 3.15 UiProgress

Use for determinate progress such as upload, sync, or batch completion.

Key props: `label`, `value`, `minValue`, `maxValue`, children, `loading`,
`error`, `disabled`.

## 4. Display Controls

### 4.1 UiBadge

Use for compact status pills.

Key props: `variant`, `loading`, `error`, `disabled`.
Variants: `success`, `warning`, `danger`, `info`.

### 4.2 UiAlert

Use for inline feedback messages.

Key props: `variant`, `loading`, `error`, `disabled`.
Variants: `success`, `warning`, `danger`, `info`.

Renders with `role='alert'`.

### 4.3 UiAvatar

Use for initials or compact identity markers.

Key props: children, `loading`, `error`, `disabled`.

### 4.4 UiCard

Use for framed content surfaces.

Key prop: `variant`.
Variants: `widget`, `workflow`, or unset standard panel surface.

Use `variant='widget'` for dashboard widget content and `variant='workflow'`
for spacious form or workflow surfaces.

### 4.5 UiSeparator

Use for horizontal or vertical rules.

Key props: orientation, `loading`, `error`, `disabled`.

### 4.6 UiSpinner

Use for indeterminate loading indicators.

Renders with `role='status'`.

### 4.7 UiSkeleton

Use for loading placeholders while content is unavailable.

## 5. Layout And Form Controls

### 5.1 UiLayout

Use for shared block and inline child arrangement.

Key props: `variant`, `gap`, children.

Variants:

| Variant       | Use                                           |
| ------------- | --------------------------------------------- |
| unset         | Full-width vertical stack                     |
| `block-fit`   | Vertical stack fitted to content width        |
| `inline`      | Horizontal wrapping layout                    |
| `inline-fill` | Horizontal layout with children sharing width |
| `inline-wrap` | Responsive row-oriented grid with wrapping    |

Gap values: `loose`, `tight`, `none`.

### 5.2 UiList and UiListItem

Use for semantic item lists.

`UiList` variants: `bullet`, `numbered`, or unset.

`variant='numbered'` renders an ordered list. Other variants render an
unordered list.

### 5.3 UiTable

Use for semantic tables. Use `overflow='scroll'` for wide tables that should
scroll horizontally.

Required composition:

```text
UiTable
├── UiTableHeader
│   └── UiTableCell
└── UiTableBody
    └── UiTableRow
        └── UiTableCell
```

Key props:

- `UiTable`: `name`, `overflow`
- `UiTableRow`: `variant='section'`
- `UiTableCell`: `align='start' | 'center' | 'end'`

### 5.4 UiFooter

Use for branded footer with a centered caller-supplied logo.

Key props: `logo`, `alt`.

### 5.5 UiField

Use for one labeled form control. The label and control are siblings.

Key props: `label`, `for`, `variant`, children.

Default and `variant='inline'` render a real label and require `for` to target
a labelable control. Use `variant='caption'` for composite or non-labelable
controls such as `UiList`, `UiTable`, and listbox roots.

### 5.6 UiFieldset

Use for a named semantic group of related form fields.

Key props: `legend`, children.

### 5.7 UiFormActions

Use at the end of forms or dialogs for submit and dismissal buttons.

Key prop: children.

## 6. Charts

The chart directory is reserved at `source/ux/common/components/charts`, but
the current public component library does not export chart controls.

Application code must not import Chart.js directly. Use shared chart controls
only after they are exposed through the shared chart barrel.

Known chart categories:

| Variant      | Purpose                         |
| ------------ | ------------------------------- |
| `pie`        | Composition at a point in time  |
| `bar`        | Frequency or volume by category |
| `line`       | Trend over time                 |
| `spark-line` | Inline mini trend               |

## 7. Escalation Notes

Creating or changing component APIs, visual primitives, design-system data
attributes, styling hooks, guard rules, or shared design-language behavior is
outside this lite guide's scope. Escalate those changes to the Chief Architect
and consult the full governing documents.

_End of Component Guide Lite Document_
