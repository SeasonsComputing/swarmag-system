# UiTableRow Activation & UiText Helpers — Production Brief

**Date:** 2026-08-14
**Mode:** Foundation
**Milestone:** M1 Customer Onboarding
**Runs before:** `effort/active/2026-08-14-job-sites-drilldown-brief.md`, which
consumes both changes. Do not begin that brief until this one is green.

Two catalog changes. `UiTableRow` gains a keyboard-operable activation concept,
and the consumer-facing text conversions scattered across app code are collected
into a `UiText` container.

## Part 1 — `UiTableRow onActivate`

### The gap

`UiTableRow` renders a bare `<tr>` and forwards native attributes.
`AbstractionManager` therefore activates a row with `onClick`, which works with a
mouse and not at all with a keyboard — the row is not focusable and has no key
handler. Every table row in the system that opens something is currently
mouse-only.

### The contract

```
onActivate?: () => void
```

When supplied, the row becomes interactive:

- `tabIndex={0}`
- emits `data-ui-interactive` (presence only, no value) so CSS can hook it
- activates on click, and on **Enter** and **Space**
- when absent, none of the above — a read-only table stays untabbable

### Do not change `role`

`UiTableRowProps` omits `role` from its allowed props, which reads as an
invitation for the control to set one. **It must not.**

`<tr role="button">` stops being a row to assistive technology: the user is told
"button" and loses row and column context. The formally correct alternative is
the full ARIA grid pattern — `role='grid'`, `gridcell`, roving `tabindex`,
arrow-key navigation — which would change the semantics of every `UiTable` in the
system and create keyboard expectations we would then owe.

**The decision is a focusable `<tr>` with no role change.** It is not a named
pattern; it misrepresents nothing, which the alternatives do not manage. This was
weighed and settled — do not substitute either alternative.

### Two implementation traps

**Space must `preventDefault()`.** Otherwise activating a row also scrolls the
page.

**The key handler must ignore events originating in descendants.** Rows carry
action buttons. Those already call `event.stopPropagation()` on click, but a
keydown handler on the row will otherwise see Enter pressed on the delete button
and both delete the row and open it. Guard on the event target being the row
itself.

### The hover bug, fixed in the same pass

`[data-ui='table-row']:hover` currently applies to every row, so a read-only
table advertises interactivity it does not have. This is an observed defect, not
a theoretical one. Scope the hover treatment to `[data-ui-interactive]`.

Add a `:focus-visible` treatment for interactive rows using `--sa-focus-ring`,
matching the existing idiom in `ui.css` — `[data-ui='button']`,
`[data-ui='action-button']`, and the input family all carry it.

### Adopt it in `AbstractionManager`

Replace `onClick` with `onActivate` on the row at `abstraction-manager.tsx:275`.
Its action buttons keep their `stopPropagation()`. Nothing else in the manager
changes; do not take the opportunity to alter its layout, its confirmation flow,
or its panel modes.

## Part 2 — `UiText`

### What moves

Three converters at the bottom of `onboarding-stage-sites.tsx` —
`optionalText`, `numberText`, `numberValue` — are generally useful and belong in
the catalog. `labelFromKebabCase`, already in `ui-helpers.ts`, joins them.

### The container

A const-as-class, matching the shape of `Routes` in `ux/shell/shell.ts`: named
arrow functions declared above, collected by shorthand into a documented object
literal.

```ts
UiText.optional(value: string): string | undefined   // blank → undefined
UiText.number(value: string): number | undefined     // text → number
UiText.label(value: string): string                  // kebab-case → display text
UiText.from(value: number | undefined): string       // number → text
```

`from` names the one member producing text rather than consuming it — the same
sense as `Array.from`, which produces the container's type from something else.

No barrel change is required: `ui.ts:19` is `export * from './ui-helpers.ts'`, so
`UiText` is reachable at `@front/ux/ui` on export.

`labelFromKebabCase` is **removed** as a loose export; its eight call sites move
to `UiText.label`.

### Required JSDoc — a hazard the promotion creates

`from` and `number` are a round-trip pair, and the round trip cannot represent
in-progress input: write on every `input` event and read back through `from`, and
`40.` becomes `40` before the user types the `7`. Latitude becomes untypeable.

The converters are correct and must not change. The rule belongs on both members:
**not safe for a controlled round-trip on every input event; commit numeric
fields on `change`.** Someone reaching for these needs to meet that where they
find it.

### What stays loose, and why

`controlState` (22 call sites) and `uiOptionLabel` (5) are used **exclusively
inside `ux/ui/components/`**. They are control-internal plumbing that happens to
be exported so sibling controls can share it, and they never cross the barrel.
`labelFromKebabCase` moves because all eight of its call sites are in
`app-admin/`.

The line is **control-internal plumbing stays loose; consumer-facing conversions
go in the container.** Do not fold `controlState` or `uiOptionLabel` into `UiText`
or into any other container. The file will be part container and part loose
functions; that is deliberate.

## Documentation

The `UiTableRow` contract change is a public API change, and CONSTITUTION §8 puts
documentation ahead of code:

- `ux-components-guide.md` — the `UiTableRow` props row (currently
  `variant?: 'section'` plus row attrs) gains `onActivate`, with a note that an
  interactive row is focusable and activates on Enter and Space. Update the
  composition example if it helps.
- `ux-components-guide-lite.md` — the corresponding `UiTableRow` line.
- `ux-components-internals.md` — register `table-row` / `data-ui-interactive` in
  the emitted-attribute tables, alongside the existing
  `table-row` / `data-ui-variant` entry.

Helpers are not documented anywhere in `documentation/`. **Keep that precedent** —
do not invent guide entries for `UiText`.

## Checks

`deno task fmt && deno task check` to green. Style-guide conformance is a hard
gate, including §6.3 current file headers, §6.4 section labels naming subject
matter rather than visibility, and §6.5 JSDoc on exports.

## Behavioural verification — required, and reported individually

1. Tab into a manager list — a row takes focus and the focus ring is visible.
2. Press **Enter** on a focused row — the editor opens.
3. Press **Space** on a focused row — the editor opens and the page does not
   scroll.
4. Tab to a row's delete action and press **Enter** — the confirmation appears
   and the editor does **not** open.
5. Click a row — the editor opens, unchanged from today.
6. Hover a row in a table with no `onActivate` — **no** hover treatment.
7. A user's role renders as `Field Crew`, not `field-crew`, everywhere
   `UiText.label` replaced `labelFromKebabCase`.

## Scope

**In:** `ux/ui/components/ui-table.tsx`, `ux/ui/css/ui.css`,
`ux/ui/components/ui-helpers.ts`, `ux/shell/abstraction-manager.tsx`,
`app-admin/users/user-manager.tsx`, `app-admin/users/user-manager-editor.tsx`,
`app-admin/onboarding/onboarding-stage-customer.tsx`,
`app-admin/onboarding/onboarding-stage-contact.tsx`,
`app-admin/onboarding/onboarding-stage-sites.tsx`,
`documentation/ux/ux-components-guide.md`,
`documentation/ux/ux-components-guide-lite.md`,
`documentation/ux/ux-components-internals.md`.

The five app and shell files are **mechanical call-site updates only** — an
import swap and a rename. Do not restructure them.

**Out:** `ux/shell/collection-editor.{tsx,css}`, which consumes both changes in
the following brief. Every other control in `ux/ui`. Every other file in
`ux/shell`. `UiCollectionCursor`. **All git operations — the Chief Architect
commits.** No commits, branches, stashes, reverts, or `git restore` of any file,
including files a formatter touches outside your scope: report those, do not
revert them.

## Escalation

Stop and report rather than deciding, if the work appears to require a role or
ARIA change beyond the one specified, a change to any control other than
`UiTableRow`, a change to `controlState` or `uiOptionLabel`, a domain change, or
any behaviour not described here. A `TODO` comment is a Chief Architect marker:
report it, do not fill it or remove it.

_End of Brief_
