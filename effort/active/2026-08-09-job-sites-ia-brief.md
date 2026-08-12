# Job-Sites IA — Production Brief

**Date:** 2026-08-09
**Mode:** Foundation
**Milestone:** M1 Customer Onboarding
**Design source:** `effort/active/2026-08-09-responsive-foundation-handoff.md`
**Depends on:** the `subheader` seam on `PanelFormProps` and `WizardStage` (in the
working tree, uncommitted at time of writing)

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
```

At every depth: a **bounded fixed-height list inside a fieldset**, a **`New …`
action** above it aligned to the inline end, and an **inline delete** on the row
that owns the thing. Selecting a row or creating a new item **slides the detail
in from the inline end**; ascending slides it back out.

Height is fixed at every level, deliberately. It is not better here — a site has
one collection and could grow — but it is better in the general case, and
consistency beats local rightness. A long list scrolls inside its own frame.

## Header

The panel header carries two rows.

**Row one** is the existing header. The title slot holds **the current object's
name**, not the stage name — `South pasture` at depth 1, `Access gate` at depth
2, the stage title only at depth 0. The leading control is **`Back`**.

**`Back` is a single unwind control.** At depth it returns to the list one level
up; at depth 0 it returns to the previous wizard stage. Existing stage behaviour
is unchanged and non-destructive: a user may go back a stage, edit, and come
forward with work in progress intact. Do not add a second ascend control, and do
not disable the stage controls at depth.

**Row two** is the **ancestry rail**, supplied through the new `subheader` slot.
It exists only below depth 0. It lists ancestors and never the current object, so
it holds at most two segments.

**The ancestry element is not interactive.** It is display only — no links, no
buttons, no hit areas, not focusable, no `nav` landmark, no keyboard traversal.
It answers _where am I_, and nothing more. Render it as text. It remains readable
to assistive technology; not focusable is not the same as hidden.

This constrains the ancestry element alone, not the header block. The block keeps
everything it does today, including hosting the feedback alert and whatever focus
behaviour validation drives. Order inside the block is header row, then ancestry,
then feedback — the alert stays closest to the form it concerns.

One way in, one way out: descend by selecting a row or creating an item, ascend
by `Back`. Cancel leaves the wizard entirely. There is no third path, and the
ancestry must not become one.

Call it ancestry, not breadcrumb. A breadcrumb is a navigation control and this
is not one; the leaf also sits in the title rather than at the end of the path.

**Ancestry presentation:** left-aligned, annotation typography
(`--sa-annotation-*` role tokens), compact. It is context, subordinate to the
title above it.

Because the header block is `flex: 0 0 auto` and the body is the scrolling
sibling, the rail stays fixed while the form scrolls under it. That is the point
of putting it there.

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
app-local stylesheet, `onboarding.tsx` where the stage is declared (to supply
`subheader`), and any new app-local components the stage needs.

**Out:** `source/front/ux/shell/**` beyond consuming the `subheader` prop —
the seam is already built and this production does not extend it.
`source/front/ux/ui/**`. `UiCollectionCursor`, which this surface no longer
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
- **Attachments at depth 2 are a set, not a sequence.** Render them as a chip or
  thumbnail row with add and remove — no cursor, no pagination, no third depth.

_End of Brief_
