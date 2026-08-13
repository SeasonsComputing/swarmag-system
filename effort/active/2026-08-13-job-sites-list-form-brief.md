# Job Sites — List/Edit Rebuild — Production Brief

**Date:** 2026-08-13
**Mode:** Foundation
**Milestone:** M1 Customer Onboarding
**Supersedes:** `effort/active/2026-08-09-job-sites-ia-brief.md` — structure and
placement. Its surviving requirements are restated here; where the two disagree,
this brief governs. In particular its "no shell change" scope no longer holds.
**Depends on:** nothing. No domain change, no API-namespace change.

Rebuild the onboarding job-sites stage on the **list/edit selective disclosure**
archetype, extracting the collection idiom into a shared shell component and
replacing the depth state machine now in the working tree.

## Why the current implementation is replaced, not repaired

The working tree carries an unstaged implementation of the 08-09 brief. It is
guard-clean, type-clean, and format-clean, and its defects are structural:

- Every keystroke rebuilds the sites array and the edited object, so the memo
  feeding `<Show keyed>` changes identity, the form is torn down and recreated,
  and the input loses focus mid-word.
- The site form reads `props.site.location[0]` once in the component body. That
  stale read only works because of the remount above — fixing either alone
  breaks the other.
- Nodes are addressed by index tuple (`siteIndex`, `noteIndex`,
  `attachmentIndex`). Deleting an earlier item leaves the address pointing at a
  different object, and the model gains a parameter per level, so it cannot nest.
- A four-arm `DepthState` union, eleven mutation closures at the root, and
  seven-to-ten-prop child signatures follow from that addressing.

Each repair converges on the same replacement, so it is done once.
**Harvest, do not rewrite from zero** — see *What survives*.

## The invariant this production must not violate

**Wizard/steps/panels is orthogonal to list/edit drill-down.** The shell provides
the surface; the archetype is a design employed on it. Neither the wizard nor the
abstraction manager may constrain the design of a panel's contents, and a panel's
contents may not depend on what is hosting them.

Concretely: nothing built here may learn that it is inside a wizard. The new
shell component must work unchanged inside a manager subject, a dialog, or a
page. `WizardStage.render: () => UiComponent` already imposes nothing — keep it
that way.

The 08-09 brief listed "depth state and wizard state interact" as a known risk.
That risk existed only because the stage held a navigation state machine the host
could disturb through a remount. With selection ephemeral and per-list, there is
nothing to disturb; the axes stop interacting by construction. Do not add a guard
against an interaction that can no longer occur.

The one imposition that remains: a stage cannot contribute panel-header content.
Known, parked, out of scope. Do not build a header seam.

**There is no "depth."** No level counter, no path, no address type, no
`data-*-depth` attribute, no central state machine. Nesting is expressed by
components containing components. If a level number appears anywhere in the
implementation, the design has been misread.

## API surface — `CollectionEditor`

A new shell component in `source/front/ux/shell/`. It exists so that every
bounded collection in the system shares one look and one behaviour; sites and
notes are its first two consumers.

> **Name is provisional** — `CollectionEditor` / `collection-editor.{tsx,css}`.
> The Chief Architect may rename it. Note the deliberate distance from the
> catalog control `UiCollectionCursor`, which is a different layer and a
> different idea, and which this production must not touch.

```
CollectionEditor<T>
  legend        string                                fieldset legend
  items         () => readonly T[]                    the collection
  label         (item: T, index: number) => string    row label rule
  emptyMessage  string                                shown when empty
  newLabel      string                                the add action's label
  onNew         () => void                            appends an item
  onRemove      (index: number) => void               removes at index
  renderEditor  (item: T, index: number) => UiComponent
```

**Selection is internal and ephemeral** — one
`createSignal<number | null>(null)` owned by the component. Not persisted, not
lifted, not exposed. A user who leaves the wizard step and returns re-selects the
item they were editing; that is the accepted behaviour and the reason this design
needs no navigation state.

On remove, clear selection outright — do not guess a neighbouring index. Because
selection is not an address into shared state, a stale index is not expressible.

Every collection needs four things regardless of item size: **add, select,
remove, and a label rule.** That is inherent to having a collection, not a cost
the archetype imposes. This component is those four things, paid once.

**Structure:** a single `UiFieldset`. The list body is the fieldset's own
content — **no interior frame.** Nested frames at differing radii are the defect
being corrected; frames in a column must be congruent. The fieldset is therefore
also the bounding and scrolling region, which means shell CSS descending into
`[data-ui='fieldset']` — permitted by design-language §2.3 for an owned
composition.

**Rows keep a button element and lose the button appearance.** The current
implementation renders each row as a visible ghost pushbutton, which is wrong.
Do not solve it by removing the button: the element is what makes the row
keyboard-reachable and announced as activatable. Strip the chrome instead —
full-width, text aligned to the start, no ring, no fill, no padding of its own —
so the row *is* the target and reads as a row.

Do not copy `abstraction-manager.tsx`'s clickable `UiTableRow`; it has no
focusable element and is a latent accessibility gap, not a pattern.

## API surface — onboarding state

**Only the sites collection changes shape.** `sites` becomes store-backed via
`createStore` from `@solid-js/store`, so a keystroke writes one leaf instead of
rebuilding the tree. This is what removes the remount, the focus loss, and the
stale-read coupling in one move.

**Expose intent methods, not raw setters,** for the sites tree: `addSite`,
`updateSite`, `removeSite`, `addNote`, `updateNote`, `removeNote`. Mutation
intent belongs in the state module; components call it. `state.sites()` must keep
working — `onboarding.tsx`'s commit path reads it.

The flat string signals (`name`, `line1`, `city`, and the rest) are **left
exactly as they are.** They do not cascade, and the contact and customer stages
consume them. Do not convert them. Their raw-setter shape is a known
inconsistency and is not in this scope.

Precedent for an app-local store: `source/front/app-ops/stores/jobs-store.ts`,
sanctioned by architecture-front §9.6. `guard:front-state` governs only
`SessionState.user` hydration and does not apply here.

## Levels

| Level | Label rule                         |
| ----- | ---------------------------------- |
| site  | `label`, or `Untitled site`        |
| note  | head of `content`, ellipsed by CSS |

A note row shows the head of its own content via `overflow: hidden`,
`text-overflow: ellipsis`, `white-space: nowrap`. **Do not truncate in
TypeScript** — a character count is a width guess baked into markup. A note with
empty content renders a muted placeholder rather than a blank row.

**Attachments are not built in this production.** The level is correct in
principle — a filename is a good label — but nothing on this surface can produce
a file. There is no upload in the API namespace and Storage is unwired, so
`New attachment` would be an action with nothing to do. That absence is what
drove the current implementation to hand-typed URL and content-type fields, which
is design invention and is removed here. Two levels demonstrate the nesting as
well as three. Add the level the day a file can get in.

## The site editor

Fieldset composition, as adjusted by the Chief Architect:

| Fieldset | Contents                                                                    |
| -------- | --------------------------------------------------------------------------- |
| identity | site label                                                                  |
| address  | line 1, unit/suite, then city / state / postal as one wrapping row, country |
| location | latitude, longitude, locate action, **acreage**                             |
| notes    | `CollectionEditor` over the site's notes                                    |

Three changes from what is in the tree:

- **Remove the object-name heading.** The current `<h3>` restating the site label
  is noise — the label is the form's first field, directly beneath it.
- **Acreage moves into Location.** It currently floats between the Location
  fieldset and the notes list with no group of its own.
- **Country stays**, inside Address after the city/state/postal row. It is absent
  from the 08-09 table, but the customer address stage captures one too and the
  table was incomplete.

`UiLayout variant='inline-wrap'` for the city/state/postal row — it wraps and
stacks itself, so no threshold is introduced.

A new note takes these defaults; `visibility` and `tags` are **not** exposed as
controls:

| Field         | Value                     |
| ------------- | ------------------------- |
| `content`     | `''`                      |
| `createdAt`   | `when()` from `@core/std` |
| `visibility`  | `'internal'`              |
| `tags`        | `[]`                      |
| `attachments` | `[]`                      |

## Appearance is not this production's decision

The Chief Architect is taking a dedicated look-and-feel pass after this lands.
**Where this brief does not specify appearance, use the plainest token-driven
treatment available and invent nothing.** Inventing visual design is outside an
AI Coding Engine's authority, and the implementation being replaced is what that
looks like when it goes wrong.

Explicitly reserved for that pass — implement plainly, do not optimise:

- Placement of the `New …` action relative to the fieldset and its legend
- Whether the collection is fixed-height and scrolling, or sized to content
- Any disclosure motion beyond the baseline below
- Radius, spacing, and density choices not dictated by a token's declared role

**Baseline motion:** reuse `--sa-transition-panel` /
`--sa-transition-panel-active`, both declared in `tokens.css`, and carry the
`prefers-reduced-motion` branch. Disclosure is per-`CollectionEditor`, not global
to the stage.

**Width invariance is a hard constraint, not an aesthetic.** Introduce no
threshold of any kind — no `@container` query, no `@media` query beyond
`prefers-reduced-motion`, no width literal, no collapse state. The layout is
identical at 320 and at 1024. The current stylesheet satisfies this; keep it
satisfied.

## What survives

Harvest from the working tree rather than reauthoring:

- **The stylesheet, minus the depth machinery.** Delete
  `[data-app='onboarding-stage-sites']`, `[data-app='onboarding-depth-panel']`,
  and both depth-cascade selector groups. The row grid, ellipsis rules, and
  placeholder colour carry over — into the new shell stylesheet where they now
  belong. The interior list frame goes.
- **The field composition inside the site form**, including the `inline-wrap` row
  and the `crosshair-2` locate button at its `hidden` label default.
- **`newSite`, `newNote`** — they match the defaults table exactly.
- **The helpers** — `optionalText`, `numberText`, `numberValue`.

## Scope

**In:**

- `source/front/ux/shell/collection-editor.tsx` and `collection-editor.css` (new)
- `source/front/app-admin/onboarding/onboarding-stage-sites.tsx`
- `source/front/app-admin/onboarding/onboarding-state.ts` — sites collection only
- `source/front/app-admin/onboarding/onboarding.css`

**Out:** `source/front/ux/ui/**` entirely. `UiCollectionCursor`, which is catalog
stock and must not be modified or deleted. Every other file in `ux/shell/` —
`PanelContainer`, `PanelList`, `PanelForm`, `Wizard`, `AbstractionManager` are
read-only references here. `documentation/**`. `onboarding-stage-contact.tsx` and
`onboarding-stage-customer.tsx`. The flat signals in `onboarding-state.ts`.

**All git operations — the Chief Architect commits.** Make no commits, no
branches, no stashes, no reverts, no `git checkout` of any file.

`onboarding.tsx` should need no change: the stage contract is unaltered and the
stage's whole output goes through its existing `render()`. If it does need one,
stop and report.

**A `TODO` JSDoc comment is a Chief Architect code-smell marker** flagging
something to revisit — not missing documentation. If you encounter one in scope,
do not fill it in and do not remove it. Report where you saw it.

## Checks

`deno task fmt && deno task check` to green. Style-guide conformance is a hard
gate. Additionally required, because guards cannot see these:

- **§8.2** — derive any option list from its exported const-enum tuple; never
  redeclare members locally. The current `ATTACHMENT_KIND_OPTIONS` violates this.
- **§6.3** — file-header boxes describe what each file now does.
- **§6.4** — section headers dividing the declaration categories.
- **§6.5** — JSDoc on exported functions. The current implementation documents
  none of its closures; `abstraction-manager.tsx` is the standard to match.
- **`guard:namespaces`** — the new file is shell, so it may consume `ux/ui`
  controls but must not import the widget catalog or any app package.

## Known risks

- **Two documentation reconciliations are outstanding and out of scope.**
  `ux-components-guide.md` §2.3 lists `UiCollectionCursor` against "ad hoc
  list-plus-capture-form" in the component-first table, which on a strict reading
  forbids this pattern; and §5.5 steers list labelling toward
  `UiField variant='caption'` rather than a fieldset. Both are being handled
  separately by the Chief Architect. Build to this brief, and do not edit the
  guide.
- **`<Show keyed>` is a remount, not a render.** Correct in
  `abstraction-manager.tsx:333` for an explicit epoch; wrong for live data. If
  you reach for it, justify it in a comment or do not use it.
- **`CollectionEditor` is written once and used twice.** If it ends up written
  twice, stop and report.

## Escalation

Stop and report rather than deciding, if the work appears to require: a `ux/ui`
change, a change to any shell file other than the new one, a domain or protocol
change, a components-guide change, a new abstraction not described here, or any
interaction or visual treatment not specified in this brief.

_End of Brief_
