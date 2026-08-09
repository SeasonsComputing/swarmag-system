# Responsive Foundation & Job-Sites IA — Session Handoff

**Date:** 2026-08-09
**Mode:** Foundation
**Milestone:** M1 Customer Onboarding
**Prior handoff:** `effort/active/2026-08-07-collection-cursor-handoff.md`

Shell responsive work committed in `5c09886`; probe added in `568f8d6` and since
unmounted. `deno task check` green at time of writing.

## What shipped

**Wizard and manager converged on one layout.** Both surfaces now declare the
same floors and the same collapse point, differing only in which way the weights
point:

```
manager   minmax(280px, 1.7fr)  minmax(--sa-size-min, 1.3fr)   @container 676
wizard    minmax(280px, 1.3fr)  minmax(--sa-size-min, 1.7fr)   @container 676
```

The manager's index floor was a device-ladder rung; the wizard's index was a
fixed track with no share at all. Both thresholds were literals that had never
been solved against the tracks they were protecting.

**Edit action removed from manager rows.** The row already carried the identical
handler — same function, same argument — so the button was a duplicate, not an
affordance. `user-manager.css` had a column width hardcoded to three buttons;
correcting it to two returned 42px to the identity column.

**`--sa-size-xx` added** for the 480 device width, which had been living as a
literal in six files.

## Findings that live nowhere else

### The size tokens carry two families

`wrap` and `min` are **observed** measures. `xs`, `xx`, `sm`, `md`, `lg` are
**Chrome DevTools emulator widths**. The suffix convention already separates
them — a role name versus a rung on a ladder — so this is not ambiguity.

Every defect found this session was a ladder value standing in a content-measure
position: a device width used as a container threshold, another used as a panel
floor. Because the convention is legible, this is **misuse of a clear rule and
therefore enforceable**, rather than a naming problem requiring redesign.

### Thresholds are derived, never chosen

A collapse point is `indexFloor + gap + subjectFloor`. Nothing else. A
`@container` condition cannot take `var()`, so the literal and the floors are
**one decision written twice** — and the second copy drifts silently.

Proof it drifts: `wizard.css` documented a two-column minimum of 690, a figure
that stopped being true at `c5ef4b3` when the stepflow track went from
content-sized to fixed. Nobody could tell, because nothing contradicted it. It
left every wizard overflowing by 76px on iPad portrait for weeks.

Both thresholds now carry their arithmetic beside them, so an edit that changes
a floor without re-solving contradicts a claim sitting next to it.

### Weights cannot move a collapse point

`minmax()` floors are hard minimums; `fr` distributes surplus only. This is what
allowed both surfaces to share floors and a threshold while pointing their
weights in opposite directions — and it means a proportion change never requires
re-solving a threshold. Change a floor and re-solve; change a weight and don't.

### A floor is a panel measure; an observed bound is a content measure

The subject floor was observed as a **content** minimum but is used as a **track**
width, and the panel consumes roughly 42px of interior before anything reaches
the form. Every surface using it is therefore short by that interior, by
construction.

This is invisible except at exactly the floor, which is why it took a 20px band
to surface: at iPad portrait the surplus hides it, and only just above the
collapse point does the subject sit on its floor and the collection cursor
overrun its parent by ~10px.

### Six responsive scopes, and only three containment contexts

The strategy has six levels — device, window, workbench, panel side-by-side,
panel collapse, and component. Only three containment contexts exist in the
whole front end, two of them dashboard-owned. Consequences:

- The panel container **borrows** the dialog's measurement, which works only
  because it fills the dialog's content box — a coincidence that changes below
  the full-bleed breakpoint.
- **The component level has no instrument at all.** A component inside a panel
  cannot ask how much room it has; a `@container` rule written there resolves to
  the dialog and over-reports by the whole index track.

Two rules govern where containment may go:

1. **An element whose inline size comes from its contents cannot be a container
   for those contents.** Panel roles pass this test; so does the collection
   cursor's own root, which is `width: 100%` and therefore self-containable with
   no shell change.
2. **A valid container tells you how much room exists, not whether the contents
   fit.** Those coincide only when the contents fill the box. The helm field
   measures leftover room because the widget shrink-wraps inside it — which is
   how a threshold there came to protect the wrong quantity.

### The workbench has four layouts, not three

`dialog-workbench → 2 panel → 1 panel → full-bleed`, and the two transitions are
different kinds of decision:

- **2-panel → 1-panel** is a _fit_ question. Content-driven, asked against the
  container, derived from track sums.
- **1-panel → full-bleed** is a _device-class_ question. On a handheld a
  workbench should own the screen regardless of what the content needs. Asked
  against the viewport with a device width, and correct in both kind and number.

Same file, opposite verdicts. The framing is what separates them.

### Width-invariance beats adaptation

**The session's most portable finding.** Every threshold audited today was
wrong: one stale for weeks, two sitting below their own track sums, two more in
a file the CA has disowned. Not one was correct.

A layout that needs no threshold cannot have that class of defect. So:

> If the narrow form is acceptable at width, use the narrow form at every width.

Adaptation is a cost paid in maintained numbers, and it must justify itself
against a single invariant layout. This retires most of the collection cursor's
queued responsive work before it is built: collapse states are width-variant
behaviour, each needing a threshold that can drift. If the collapsed navbar is
acceptable at width, it should simply _be_ the navbar.

### Measuring on device

`innerWidth: 0` is the signature of a **failed browser takeover**, not a property
of the preview pane. A prior session generalised one broken tool session into a
standing rule to distrust pane measurements; that rule is wrong and cost a
detour before it was retired.

The working method is a team activity: the agent names the exact values wanted —
property, selector, viewport — and the CA captures them on real hardware. Two
predictions were falsified this way that arithmetic alone had got wrong, and one
inferred figure was corrected by 14px.

`panel-probe.tsx` and its stylesheet remain in the tree, unmounted. Remount to
re-measure; delete when the responsive work closes.

## Job-sites information architecture

Settled by design conversation, **not yet built**.

**The feed idiom is rejected.** Chasing data down a virtual scroll is what a
content-oriented stack produces when it ignores four decades of UI design.
Bounded panes instead.

**List + slide, recursive at every depth.** A fixed-height fieldset list, a
`New …` action that slides the detail in, an inline delete per row. The same
idiom at sites, at notes, and at attachments — learned once, applied everywhere.
The motion already exists as the abstraction manager's `translateX` swap.

This **deletes** the collection cursor from the surface rather than fixing it —
no second navbar, no pips competing with stage arrows, nothing to frame or make
sticky. Miller columns is the same IA with a desktop expression; picking this
does not foreclose it.

**Containment is real and must show.** Attachments belong to a note, notes belong
to a site, sites belong to the customer. A `Note | Files` tab pair asserts that
attachments belong to the _site_ and flattens exactly the relationship that
matters.

**Header: leaf as title, ancestry as a secondary rail.** The current object holds
the title position, so its meaning is stable as you descend; ancestors sit on
their own row, which exists only below the top level. The row never contains the
leaf, so it holds at most two segments and owns full panel width — which is what
makes it width-invariant, and why it is the display at every size.

It is not a standard breadcrumb and should not be named one.

## Open

- **Collection cursor's future.** The API-surface work — compound component,
  root as pure state provider, nav and body placed by the consumer — was designed
  and authorised, then overtaken. If job sites drops the cursor, its only real
  consumer is gone and the queued work should be re-priced before it is built.
- **Stage controls at depth** — what `‹ Previous` means with a note editor open.
  Likely a non-problem, since sites and notes are compositions of the customer
  under construction and leaving discards nothing, but the wizard's state model
  should be confirmed rather than assumed.
- **Ancestry rail alignment** — left, as sketched, or centred under the title.
- **The manager's index floor** has no observation behind it. It errs generous,
  which collapses early rather than overflowing, and the file says so.
- **Panel-role containment** remains unbuilt. Not needed for the cursor, which
  can contain itself, but the level-6 gap is real for anything that cannot.

## Standing protocol

Independent CA go per production; the CA concludes topic conversation with a
scope or production directive. Delegates are read-only on git. Final behavioural
verification is the CA's authenticated browser. **Claude never commits.**

Checks are `deno task fmt && deno task check`.

_End of Handoff_
