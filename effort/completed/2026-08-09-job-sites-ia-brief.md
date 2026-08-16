# Job-Sites IA — Production Brief

**Date:** 2026-08-09
**Mode:** Foundation
**Milestone:** M1 Customer Onboarding
**Design source:** `effort/active/2026-08-09-responsive-foundation-handoff.md`
**Depends on:** nothing. This production needs no shell change.

Rebuild the onboarding job-sites stage as a bounded list with slide-to-detail,
recursive at site and note depth. Replaces the collection cursor on this surface.

## Why the current surface is wrong

Nine full-width fields in one flat stack, no grouping, no home for notes, and a
collection cursor whose navbar sits directly beneath the panel header — two
control rows twelve pixels apart that look like the same kind of thing. The
cursor also scrolls away with the form, so item navigation disappears exactly
when a long form needs it.

## The shape

Three depths, one idiom repeated at each.

```
depth 0  sites      list of site labels
depth 1  site       the site form, ending in a notes list
depth 2  note       note text, ending in attachments
depth 3  attachment attachment selection
```

**This is one design pattern applied recursively, not four screens.** List and
item, the same way the abstraction manager is index and subject at a larger
scale. Every level is the same thing; the data decides how many levels there
are.

At every depth: a **bounded fixed-height list inside a fieldset**, a **`New …`
action** above it aligned to the inline end, and an **inline delete** on the row
that owns the thing. Selecting a row or creating a new item **slides the detail
in from the inline end**; ascending slides it back out.

Build it once and apply it at each level. If it ends up written three times,
that is the signal it wanted to be a component.

Height is fixed at every level, deliberately. It is not better here — a site has
one collection and could grow — but it is better in the general case, and
consistency beats local rightness. A long list scrolls inside its own frame.

## Two axes, and no control serves both

**Sequence** is the wizard's steps. **Depth** is the drill-down stack inside one
step. They are different things and must never be conflated.

**`‹ Back` is the previous step in the sequence. Full stop.** It does not change
meaning at depth, it is not disabled at depth, and it never returns to a list.
Existing behaviour is unchanged and non-destructive: a user may go back a step,
edit, and come forward with work in progress intact.

**Return to list is a separate control on the depth axis.** It appears only below
depth 0 and moves exactly one level up, to the panel owning the list the current
object came from.

### The panel header is shell-owned and unreachable

`formTitle`, `Back`, the stage title, and `Next`/`Finish` are all rendered by
`Wizard`. `WizardStage` exposes `title` as a plain `string` and a stage's only
output surface is `render()`, which lands in the panel **body** — a sibling of
the header block, structurally below it.

**So the panel title stays the stage title at every depth.** It reads `Job sites`
whether you are on the list, a site, or a note. Naming the current object in the
title would require a reactive-title seam on `WizardStage`, which is a shell
change and out of scope.

An earlier draft of this brief required the title to hold the current object's
name while also forbidding shell changes. Those cannot both hold; the
requirement is struck. The object's identity belongs in the content, where the
stage actually controls it: at depth the detail opens with the object's name as
a heading, using the same rule that names it in the list.

Two designs have now implied something in that header. Any future one must
budget for a shell seam explicitly rather than discovering it mid-production.

### Return-to-list placement

The control sits **in the content, on an action row, aligned to the inline
start** — mirroring the `New …` action that aligns to the inline end. It is not
header chrome; the panel header is untouched by this production.

Label it with its destination, which is always the parent: `Sites` at depth 1,
the site's own name at depth 2.

**Its glyph must not be `arrow-left`** — that is `Back`, and two ascend controls
sharing a glyph is the exact collision this separation exists to prevent.
`corner-top-left` reads as up-and-out; `enter` is the conventional return arrow.
Either is plainly distinct at 16px.

**This placement is provisional.** It was chosen from imagination rather than
from use, and the CA reserved the right to revisit once it is real. The accepted
cost is that the control scrolls with the form instead of staying fixed.

A fixed alternative would need a second row in the panel's header block, which a
stage cannot reach today — `WizardStage` exposes no header content and the wizard
owns that header outright. Such a seam was built and then removed once this
placement was chosen; do not re-add it speculatively. If the scrolling control
proves wrong in the hand, that is the change to make, deliberately and on its own
gate.

### No ancestry line

An earlier design put an ancestry path in the header. It is **not** being built.

Every element of the path is already on screen: the workbench header carries the
wizard's title, the accessory rail carries all stage titles with the current one
accented and is rendered unconditionally, the content names the current object,
and the return control names its parent. An ancestry line would be a fourth
restatement of a path nothing has hidden.

This does not depend on how deep the stack goes. At any level the return control
names the parent and the content names the current object, which is what a
reader needs to know where they are. Depth is a property of the data, not a case
to reason about.

### The header block is otherwise untouched

This production changes nothing about the header's existing behaviour, including
its feedback alert and whatever focus handling validation drives.

## The site form

Currently nine full-width fields in one stack. Group them into fieldsets:

| Fieldset | Contents                                                           |
| -------- | ------------------------------------------------------------------ |
| identity | site label                                                         |
| address  | line 1, unit/suite, then city / state / postal as one wrapping row |
| location | latitude, longitude, locate action                                 |
| —        | acreage                                                            |
| notes    | bounded list + `New note`                                          |

Use `UiLayout variant='inline-wrap'` for the city/state/postal row — it is a
responsive row grid with column wrapping and stacks itself when narrow, so no
threshold is introduced.

**`Use my location` becomes an icon action button.** `UiActionButton`,
`icon='crosshair-2'`, label retained as the accessible name with `labelMode`
left at its `hidden` default. A labelled secondary button is the wrong register
beside two compact coordinate fields. `crosshair-2` specifically: it carries no
bounding circle, and the button already draws a ring — a `-circled` glyph inside
a ring reads as two concentric borders.

## Notes and attachments

**A `Note` has no name.** Its shape is `{ attachments, createdAt, content,
visibility, tags }` — there is no label or title field. Earlier sketches showed
notes named `Access gate`; that was invented and there is no data behind it.

**A note row shows the head of its own content, ellipsed by CSS.** Render the
full `content` in a single-line element with `overflow: hidden`, `text-overflow:
ellipsis`, `white-space: nowrap`. Do **not** truncate in TypeScript — a
character count is a width guess baked into the markup, which is the same defect
as a threshold and fails the width-invariance constraint below. The same string
names the note at depth 2.

A note whose content is still empty renders a muted placeholder rather than a
blank row.

**A new note must satisfy the domain type.** `createdAt` is a required `When`;
`visibility` is a required `NoteVisibility`; `tags` and `attachments` are
required compositions. Defaults:

| Field         | Value                     |
| ------------- | ------------------------- |
| `content`     | `''`                      |
| `createdAt`   | `when()` from `@core/std` |
| `visibility`  | `'internal'`              |
| `tags`        | `[]`                      |
| `attachments` | `[]`                      |

**Neither `visibility` nor `tags` is exposed as a control** in this production.
The note form is content plus attachments. `'internal'` is the conservative
default for an onboarding note — it is a decision, not a derivation, and the CA
may flip it.

## Width invariance — a hard constraint

**Introduce no threshold of any kind.** No `@container` query, no `@media` query,
no width literal, no collapse state. The layout is identical at 320 and at 1024.

This is not a preference. Every threshold audited in the source session was
wrong — one stale for weeks, two below their own track sums, two more in a
disowned file. A layout with no threshold cannot acquire that defect. If a
narrow form is acceptable at width, it is the form at every width.

## Motion

Reuse the existing slide. `abstraction-manager.css` performs a `translateX` swap
between panel roles with `--sa-transition-panel` and honours
`prefers-reduced-motion`. Match that treatment rather than inventing one, and
carry the reduced-motion branch.

## Scope

**In:** `source/front/app-admin/onboarding/onboarding-stage-sites.tsx`, its
app-local stylesheet, and any new app-local components the stage needs. The
stage's whole output goes through its existing `render()`, so `onboarding.tsx`
should need no change — if it does, that is a signal to stop and report.

**Out:** `source/front/ux/shell/**` entirely — this production needs no shell
change and must not introduce one. `source/front/ux/ui/**`. `UiCollectionCursor`,
which this surface no longer
uses and which must not be modified or deleted. The abstraction manager. The
panel floors and thresholds settled in the source session. `panel-probe.*`.

**Build app-local first.** The list-plus-slide pattern is the abstraction
manager's behaviour at smaller scale and will likely generalise, but the
move-down rule is _settled_, not merely _shared_ — and it is not settled until it
has been used once. Generalising is a later decision with its own gate.

## Checks

`deno task fmt && deno task check` to green. Style-guide conformance is a hard
gate. No git operations — the Chief Architect commits.

## Known risks

- **Depth state and wizard state interact.** Stage advance while the user is at
  depth is not specified here. Confirm against the wizard's state model rather
  than assuming; escalate if it needs a shell change, because that would exceed
  this scope.
- **A long list is the one soft edge.** Bounded scroll inside a fieldset is the
  intended answer and is not a feed, but ten sites is the case to look at.
- **Attachments are the same pattern again.** A note's attachments are a list,
  and selecting one descends to it exactly as selecting a site or a note does.
  Nothing about that level is special.

_End of Brief_
