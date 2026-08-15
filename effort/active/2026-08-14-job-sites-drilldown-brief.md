# Job Sites — Drill-Down Correction — Production Brief

**Date:** 2026-08-14
**Mode:** Foundation
**Milestone:** M1 Customer Onboarding
**Corrects:** `effort/active/2026-08-13-job-sites-list-form-brief.md`
**Intention source:** `effort/active/2026-08-09-job-sites-ia-brief.md` — its depth
sketch states the intended behaviour correctly and governs where anything is
unclear.

The 08-13 production built the right structure and the wrong interface. This
brief restores the interaction it lost and repairs the defects it introduced.

## What went wrong, so it is not repeated

The 08-13 brief named the archetype "list/edit selective disclosure" in its title
and never said what that requires. It wrote _"selecting one discloses its
editor"_ — which appending below the list also satisfies — and then filed
disclosure motion, bounded height, and create-then-open under _"Appearance is not
this production's decision."_ Interaction was deferred as though it were styling,
so it was not built. Its harvest instruction also deleted the CSS that
implemented the panel swap, because that instruction named selectors rather than
the behaviour they produced.

**The rule this brief operates under: interaction is specified here, always.
Only look — colour, spacing, duration, easing, density — is deferred.**

## The principle, as testable behaviour

**Selecting a row replaces the panel it lives in.**

- While an item's panel is open, the list it came from is **not on screen**. Not
  scrolled past, not below, not collapsed. Gone.
- Ascending restores the panel that was replaced.
- This holds identically at every level. A note's panel replaces the _site's_
  panel — the site's fields are not visible while a note is open.

Any implementation where the list and an item's editor are simultaneously visible
has failed this brief, regardless of how it looks.

**A list is a list at every level.** Same frame, same New action, same row
treatment, same delete behaviour, whether it holds sites or notes. Depth changes
nothing about a list's appearance or behaviour. A user who learns one has learned
all of them, including the ones not yet built — that transfer is the reason the
component is shared, and it outranks local visual harmony inside any one panel.

**There is no "depth."** No level counter, no path, no address type, no
`data-*-depth` attribute. The host holds the current panel and a way back; how
deep that goes is a property of the data.

## Two axes — unchanged from 08-09

**Sequence** is the wizard's steps. **Depth** is the drill-down inside one step.
`‹ Back` is the previous step, always, and never changes meaning at depth. The
return control is a separate control on the depth axis and **must not use
`arrow-left`** — two ascend controls sharing a glyph is the collision this
separation exists to prevent. `corner-top-left` is the established choice.

Nothing built here may learn it is inside a wizard.

## The surface

At rest, depth 0:

```
┌─ Sites ──────────────────────────────── ⊕ New site ─┐
│  Site                                       Actions  │
│  ──────────────────────────────────────────────────  │
│   South pasture                                  🗑  │
│   North forty                                    🗑  │
│   Untitled site                                  🗑  │   fixed height,
│                                                      │   body scrolls
└──────────────────────────────────────────────────────┘
```

The legend is the frame's title and **New stays on the frame**, mirroring
`AbstractionManager`, which puts its title and its New action in the panel header
and reserves the table header for columns. Do not move New into the table header:
that collapses two levels into one and leaves a frame-level action sharing a
column with row-level ones.

Selecting `South pasture` **replaces** that panel:

```
┌──────────────────────────────────────────────────────┐
│  ⌐ Sites                                             │
│                                                      │
│  ┌─ Identity ─────────────────────────────────────┐  │
│  │  Site Label  [ South pasture               ]   │  │
│  └────────────────────────────────────────────────┘  │
│  ┌─ Address ──────────────────────────────────────┐  │
│  ┌─ Location ─────────────────────────────────────┐  │
│  ┌─ Notes ─────────────────────── ⊕ New note ────┐   │
│  │   Gate code is 4417                       🗑  │   │
│  └───────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

Selecting a note replaces that panel in turn:

```
┌──────────────────────────────────────────────────────┐
│  ⌐ South pasture                                     │
│                                                      │
│   Note                                               │
│  ┌────────────────────────────────────────────────┐  │
│  │ Gate code is 4417. Call ahead — dogs.          │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

Empty replaces the rows, never the action:

```
┌─ Sites ──────────────────────────────── ⊕ New site ─┐
│   No job sites yet. Use New site to add one.         │
└──────────────────────────────────────────────────────┘
```

## `DrillContract` — the interface _(new: `ux/shell/drill-contract.ts`)_

```
DrillContract = {
  open: (panel: UiComponent, title: string) => void
}
```

One method. `title` names the panel being opened; the host retains it to label
the return control when something opens on top of it.

No `ascend` — the host renders the return control itself, because it is the only
thing that knows what it replaced. Do not add one speculatively.

**Handed down as an explicit prop, never a Solid context.** The dashboard was
shoehorned into a context and the context was removed; props are the standing
preference and match STYLE-GUIDE §7.6 and `AbstractionManager`, which passes
`renderForm` its context object as an argument.

## `DrillDown` — the host _(new: `ux/shell/drill-down.{tsx,css}`)_

Owns the surface on which panels appear.

```
DrillDownProps
  rootTitle  string                              title of the root panel
  root       (drill: DrillContract) => UiComponent   the root panel's content
```

- Holds the **current panel and a return closure**. `open` captures the outgoing
  panel and its title in the new closure. No array, no index, no level counter.
- Renders the **return control** above the current panel, at the inline start,
  labelled with the parent panel's title, glyph `corner-top-left`. Absent on the
  root panel.
- Renders the **directional slide**: descend enters from the inline end, ascend
  exits back toward it. **Direction is behaviour, not decoration** — it is what
  tells the user which way they travelled, and it is why this design needs no
  ancestry line. Animating both directions identically is worse than no motion,
  because it misinforms.
- Honours `prefers-reduced-motion`.

**On harvesting the old slide:** `f6bf19f` contains a working panel swap, but it
is welded to four hardcoded panel names via a ten-selector
`[data-app-depth]` × `[data-app-panel]` cascade. **Take the treatment, discard
the mechanism** — the grid overlay, the `translateX` distance, the opacity pair,
`--sa-transition-panel` / `--sa-transition-panel-active`, and the reduced-motion
branch. Roughly six declarations. Do not attempt to reuse the selectors.

## `CollectionPanel` — the list _(exists; reworked)_

```
CollectionPanel<T>
  legend         string                                  frame legend
  itemColumn     string                                  header for the label column
  items          () => readonly T[]                      the collection
  label          (item: T, i: number) => string          row label rule
  emptyMessage   string                                  shown when empty
  newLabel       string                                  the New action's label
  onNew          () => void                              appends one item
  onRemove       (i: number) => void                     removes at index
  confirmRemove  (item: T, i: number) => { title: string; message: string }
  renderItem     (item: T, i: number) => UiComponent     the item's panel content
  drill          DrillContract                           handed in by the owner
```

**It holds no state.** No selection signal. It renders a frame, rows, a New
action, and an empty state, and calls out.

```
row activate  →  drill.open(renderItem(item, i), label(item, i))
New activate  →  onNew(); drill.open(renderItem(last), label(last))
```

`onNew` is synchronous, so the appended item is at `items().length - 1`
immediately. **Creating an item opens it** — that is one behaviour, not two, and
its absence was a regression from the 08-09 build.

`renderEditor` is renamed `renderItem`: its result is now a panel, and the old
name is what let the previous build render it in place.

**Delete is a row action gated by confirmation**, mirroring
`AbstractionManager.requestAction`/`confirmAction`: the trash control calls
`event.stopPropagation()` so the row's own activation does not fire, then opens a
`UiDialog size='content'` carrying the consumer's `confirmRemove` copy. A
destructive control inside an activation target is a mis-click hazard; the
confirmation absorbs it. Confirmation is not optional and not conditional on the
item looking empty — a list behaves the same way every time.

**Frame:** a single `UiFieldset`. No interior frame. The legend interrupts the
border at the inline start and the New action interrupts it at the inline end —
the same device at both ends of one edge. Shell CSS descending into
`[data-ui='fieldset']` is permitted here as an owned composition
(design-language §2.3).

**Fixed height, always.** The frame is the same height empty or full, and the
body scrolls within it. This is positional constancy, not styling: a control that
moves between visits forces the user to re-find it. Derive the height from a
whole number of rows off `--sa-touch-target-sm`; six rows is the inherited value
and the count is the Chief Architect's to tune.

**Rows are a `UiTable`, not hand-rolled markup.** The current implementation
builds each row from a de-chromed `UiButton` inside a two-column CSS grid.
Delete all of it. The table family already carries this exact treatment —
`[data-ui='table-row'][data-ui-interactive]:hover`, an end-aligned action cell
rule (`[data-ui='table-cell'][data-ui-align='end']:has([data-ui='action-button'])`),
and buttons inside cells — and it is what `AbstractionManager` uses, so sites,
notes, and the manager end up on one row idiom.

```
UiTable
├── UiTableHeader → UiTableCell {itemColumn}, UiTableCell align='end' 'Actions'
└── UiTableBody   → UiTableRow onActivate={…}
                    ├── UiTableCell  the label
                    └── UiTableCell align='end'  the delete action
```

**Row activation is `UiTableRow onActivate`**, shipped in the preceding brief. It
makes the row focusable, activates on click, Enter, and Space, guards against
key events from its own descendants, and emits `data-ui-interactive` for the
hover and focus treatments. **Do not add a button, a `tabIndex`, a `role`, or a
key handler of your own** — the control owns all of it, and the no-role decision
there was weighed and settled.

**Write no row CSS.** Hover, focus ring, and action-cell alignment come from
`ui.css`. `collection-panel.css` styles the frame and nothing about rows.

> `data-ui-interactive` is **not** in `guard-css`'s `ALLOWED_DATA_ATTRIBUTES`, so
> a shell stylesheet selecting it fails `guard:css`. You will not need to — the
> treatment already lives in `ui.css`. If you believe you do, stop and report;
> that list is a guard rule and changing it is the Chief Architect's call.

**Also remove:** the hardcoded `'Empty item'` fallback (the label rule is the
consumer's), the `data-shell-selected` attribute (no row is on screen while its
panel is open, so there is no selected state), the inert transition on
`collection-panel-editor`, and the unbounded `overflow: auto`.

## Wiring

```tsx
<DrillDown
  rootTitle='Sites'
  root={drill => (
    <CollectionPanel
      legend='Sites'
      items={state.sites}
      label={siteName}
      emptyMessage='No job sites yet. Use New site to add one.'
      newLabel='New site'
      onNew={() => state.addSite(newSite())}
      onRemove={state.removeSite}
      confirmRemove={site => ({
        title: `Delete ${siteName(site)}?`,
        message: 'This job site will be removed from the customer.'
      })}
      renderItem={(site, i) => <SiteEditor state={state} site={site} index={i} drill={drill} />}
      drill={drill}
    />
  )}
/>
```

`SiteEditor` passes the same `drill` to its notes `CollectionPanel`. One prop,
one boundary crossed, nothing hidden at the call site.

## `onboarding-stage-sites.tsx` — repairs

| # | Repair                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| - | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1 | Mount `DrillDown` as the stage root; thread `drill` to the notes collection.                                                                                                                                                                                                                                                                                                                                                                     |
| 2 | `siteLocation` becomes `demandOne(site.location)` from `@core/std`. Drop `?? {}` — it defends against an empty array `CompositionOne` forbids (§3.3, §7.3).                                                                                                                                                                                                                                                                                      |
| 3 | `onboarding-coords-group` declares three grid columns and now holds four children, so acreage wraps to a second row under latitude. Fix the template.                                                                                                                                                                                                                                                                                            |
| 4 | Latitude, longitude, and acreage cannot accept a decimal point: the `UiText.number`/`UiText.from` round-trip strips a trailing `.` on every keystroke, so `40.7` is untypeable. **Do not change `UiText`** — the converters are correct and their JSDoc already states this. Commit numeric fields on `change` rather than `onInput` so intermediate text survives. If that proves insufficient, stop and report rather than inventing a parser. |
| 5 | `noteName` returns `''` for empty content; the empty-note label belongs here, not in shell.                                                                                                                                                                                                                                                                                                                                                      |

## Not deferred

Everything above is required by this brief, including the panel swap, its
direction, the fixed frame height, create-then-open, and the confirmation on
delete. **None of it is a look-and-feel question.**

## Deferred to the Chief Architect's pass

Colour, spacing, density, radius, transition duration, easing, slide distance,
and the row count of the frame. All are token-level and tune without touching
component structure.

## Checks

`deno task fmt && deno task check` to green. Style-guide conformance is a hard
gate. `guard:namespaces` — shell may consume `ux/ui` but must not import the
widget catalog or any app package.

Additionally, because guards cannot see these: §6.3 file headers current; §6.4
section labels naming **subject matter, not visibility** — `PUBLIC`/`PRIVATE`
body sections are a defect; §6.5 JSDoc on exports; §8.1 no local redeclaration of
a `@core/std` or domain type, in any form, for any reason.

## Behavioural verification — required, and reported

Every failure of the previous production passed every automated check. Run these
by hand and report each result:

1. Type two characters into **Site Label** — focus is retained, no remount.
2. Open a site — the sites list is **not on screen**.
3. Open a note — the site's fields are **not on screen**.
4. Ascend from the note — the site panel returns, sliding the opposite way.
5. Click **New site** — the new site's panel opens immediately.
6. Add rows past the frame's height — the frame does not grow; the body scrolls.
7. Type `40.7` into **Latitude** — the decimal point survives.
8. Tab through the rows — the focused row is visibly indicated.
9. Press **Enter** on a focused row — its panel opens, the same as a click.
10. Press **Space** on a focused row — its panel opens and the page does not scroll.
11. Tab to a row's delete and press **Enter** — the confirmation appears and the
    row's panel does **not** open.
12. Click a row's delete — a confirmation appears and the row does not activate.

## Scope

**In:** `source/front/ux/shell/drill-contract.ts` (new),
`source/front/ux/shell/drill-down.{tsx,css}` (new),
`source/front/ux/shell/collection-panel.{tsx,css}` (**renamed** from
`collection-editor.{tsx,css}`; rename the files, the component, and the
`data-shell` values together — leave no `collection-editor` anywhere),
`source/front/app-admin/onboarding/onboarding-stage-sites.tsx`,
`source/front/app-admin/onboarding/onboarding.css`.

**Out:** `source/front/ux/ui/**` entirely, including any new `UiButton` variant.
Every other file in `ux/shell/`. `UiCollectionCursor`, which is catalog stock and
must not be modified or deleted. `documentation/**`. `onboarding-state.ts`, which
is correct as it stands. The other onboarding stages. Attachments, which have no
acquisition path on this surface. **All git operations — the Chief Architect
commits.** No commits, branches, stashes, reverts, or `git restore` of any file,
including files a formatter touches outside your scope: report those, do not
revert them.

`onboarding.tsx` must not change. If it appears to need to, stop and report.

## Escalation

Stop and report rather than deciding, if the work appears to require a `ux/ui`
change, a change to any shell file other than the two named, a domain or protocol
change, a documentation change, or any interaction not specified here. A
`TODO` comment is a Chief Architect marker: report it, do not fill it or remove
it. Inventing an interaction is outside an AI Coding Engine's authority — the
production this brief corrects is what that costs.

_End of Brief_
