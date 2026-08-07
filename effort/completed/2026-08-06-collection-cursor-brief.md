# UiCollectionCursor — Production Brief

**Date:** 2026-08-06
**Mode:** Foundation
**Author:** Chief Architect (decisions); AI Architect (capture, brief)
**Milestone:** M1 Customer Onboarding — Phase 2
**Design:** `effort/completed/2026-08-04-composition-editor-design.md` — retired
as superseded. It is history, not a target: this brief overrides it on the frame,
the ceiling, the placement and the name. Do not build from it.

Settled in conversation on 2026-08-05 and 2026-08-06. Design is closed — there
are no open decisions in this document. Escalate rather than invent.

## 1. Why this exists

`Note` is a universal domain composition mounted at twelve declared points across
`user`, `customer` (account and each site), `asset`, `service`, `chemical`, `job`
and `workflow`. `CustomerSite` is another. These are **0..n collections**, and a
collection needs states a scalar field never has: the collection as it stands,
the item under the cursor, and the empty case.

Onboarding stage 3 is what happens without a shared answer. Its four surviving
defects are all symptoms of a collection flattened into a form:

- the added-sites list renders above the capture form, so every successful add
  pushes the work surface further down
- three nested legends — "Added Sites" beside "Add Job Site" wrapping "Address"
- a four-row textarea buried mid-form between acreage and the add button
- `clearSite` hand-resets eleven signals

The eleven signals are the tell. They exist because the item being built lives in
a scratch pen beside the collection it will join. This control deletes the pen:
**the item under edit is `items[cursor]`.**

## 2. What it is

**A cursor.** Not an editor — it edits nothing; the host's form does. In every
context a programmer knows, a cursor is position, movement, and insert/delete at
that position. That is exactly the four operations: `<` and `>` move it, New
inserts at it, Delete removes at it. The pips are the cursor rendered.

The vocabulary is already in the system: `ListOptions = { limit?, cursor? }` in
`@core/api/api-contract.ts` calls position-in-a-sequence a cursor.

**It owns the cursor and nothing else.** The host owns the collection. The
control never mutates in place; it emits the next array.

**Do not name any part of it `Record`, `Editor`, `Nav`, `Navbar` or `Chrome`.**
Record means a persisted row and these have no id and no row until the aggregate
commits. Editor is false. `Navbar` pulls toward `<nav>`, an ARIA landmark this
system deliberately does not have (`architecture-front.md` §9.1.3). `Chrome` is
commentary vocabulary here, never a symbol.

## 3. Placement and naming

|         |                                                                        |
| ------- | ---------------------------------------------------------------------- |
| Symbol  | `UiCollectionCursor`                                                   |
| File    | `source/front/ux/ui/components/ui-collection-cursor.tsx`               |
| Barrel  | exported from `ui.ts`, consumed as `@front/ux/ui`                      |
| Dataset | `data-ui='collection-cursor'`                                          |
| Styles  | `source/front/ux/ui/css/ui.css` — the component layer owns `[data-ui]` |

It is a `ui` control because it knows no domain type, is generic over `T[]`, and
composes other `ui` controls. It is not `shell`: nothing in shell composes it —
shell hands its bodies to hosts, and this gets composed inside those bodies.

**Composes** `UiFormActions` with `justify='split'` for the row, and `UiDialog`
for delete confirmation. A `ui` control composing `ui` controls is the existing
pattern.

## 4. API surface

```ts
/** Chrome over a bounded collection: cursor, position, and lifecycle. */
export type UiCollectionCursorProps<T> = {
  /** The collection. Owned by the host; never mutated in place. */
  items: T[]
  /** Receives the next collection after New or Delete. */
  onItemsChange: (items: T[]) => void
  /** Produces a blank item for New. */
  newItem: () => T
  /** Renders the item at the cursor. */
  children: (item: T, index: number) => UiComponent
  /** Shown when the collection is empty. */
  empty: { icon: string; message: string }
  /** Host-supplied copy for the delete confirmation. */
  confirmDelete: (item: T) => { title: string; message: string }
}
```

Six members. No flags, no modes, no `onNew`/`onDelete` — the control emits the
next value rather than asking permission. That is the value-in / value-out shape
the design committed to, and it is the only one available: compositions have no
identity until the root commits, so the control can never own "save."

### 4.1 `children` is re-invoked on cursor change, never on items change

**This is a correctness constraint, not a performance note.** The host's fields
write back through `onItemsChange`, so typing produces a new `items` array on
every keystroke. If the body re-renders on `items` identity, the form subtree is
rebuilt per character and the caret is lost mid-word — the surface becomes
unusable for text entry.

Key the body on the cursor. The host's fields read through to `items[cursor]`
reactively, so a keystroke updates a value without rebuilding the form that
produced it.

## 5. Layout

Row above, body below. **No frame.** The original design proposed a fieldset
specialization; that is superseded. A frame would reintroduce the nested-fieldset
problem the moment a collection appears inside an item.

```text
(<)  ○ ● ○ ○  (>)                            Delete │ ⊖    New │ ⊕
────────────────────────────────────────────────────────────────────
 …the host's form for items[cursor]…
```

Action buttons render `Text │ (X)` — label, then bar, then icon. The bar belongs
to `UiActionButton` and sits between its own label and glyph; it is never a
separator between two buttons. Use `labelMode='visible'`; the label is droppable
by attribute, which is also the responsive answer at `app-ops` portrait widths.

Icon names come from the catalog in `icons.css` — 334 entries, name matches the
SVG filename. **Verify each name against the catalog; do not invent one.**

## 6. Behaviour

### 6.1 The five states

| State       | Behaviour                                                         |
| ----------- | ----------------------------------------------------------------- |
| initial     | Render `items`. At 0 → empty body. At ≥1 → item at cursor 0       |
| new         | Append `newItem()`, cursor to the new last, focus its first field |
| delete      | Confirm, then remove at cursor                                    |
| post-new    | Focus the first field of the appended item                        |
| post-delete | `cursor = min(cursor, len - 1)`; at len 0 → empty body            |

New **appends** rather than inserting after the cursor. The collections are
unordered, so creation order is as good as any, and appending is least
astonishing.

**Focus after New is implemented locally.** `focusFirstField` in
`ux/shell/use-abstraction-form-keyboard.ts` looks like the utility to reach for
and is not: `ui` sits **below** `shell`, so importing it is an upward dependency
and a `guard:namespaces` violation. It also carries panel-collapse motion timing
and dialog focus-reclaim logic that exist for reasons which do not apply inside a
form body. Query the body's first input or textarea and focus it after render.

### 6.2 Chrome degradation

| Count | Nav      | Delete   | New  | Readout  |
| ----- | -------- | -------- | ---- | -------- |
| 0     | disabled | disabled | live | none     |
| 1     | disabled | live     | live | one pip  |
| 2–8   | live     | live     | live | pips     |
| > 8   | live     | live     | live | `N of M` |

Delete at size 1 removes the item and returns to the empty body — it does not
blank the item in place.

### 6.3 Readout

Pips up to eight, then `N of M` in the same slot. **Hollow pip is the current
position.** The readout is read-only and permanently so: neither notes nor job
sites are ordered, so position carries no domain meaning and "jump to item 3" is
not a real intent.

**There is no ceiling on the collection.** An earlier design capped it at ~8
because pips stop being countable past that. That was a constraint on the
readout, not on the domain — a ranch with fourteen sites and a customer with
thirty notes are both ordinary. Only the readout degrades.

### 6.4 Empty body

Catalog glyph, message, and the live New button, which the copy may refer to
because New is on screen.

```text
 (<)  (>)                                     Delete │ ⊖    New │ ⊕
 ────────────────────────────────────────────────────────────────────

                            ( icon )
                      No job sites yet.
                    Click New to add one.
```

### 6.5 Delete confirmation

A `UiDialog`, copy supplied by the host through `confirmDelete`. The control is
generic over `T` and cannot compose "Delete North Pasture?" itself.

This confirmation exists because there is no undo: no baseline or dirty concept
exists anywhere in `source/front` today. It is a deliberate stand-in and will be
revisited when that primitive lands.

`AbstractionManager` has its own confirmation dialog. **Leave them separate.** Do
not extract a shared one.

## 7. Explicitly not this control's job

- **Validation.** It cannot inspect `T`. If a host needs per-item validity, the
  host owns it.
- **Blank detection or pruning.** Same reason. A host that must reject empty
  items prunes at commit.
- **Save.** Value in, value out.
- **Identity from position.** Nothing may treat array index as identity — not
  the UI, not commit, not the API. Where ordering matters, it is an explicit
  `sequence` attribute on the object, never vector position.
- **Nesting policy.** A collection inside an item is allowed here precisely
  because there is no frame. Two cursors on screen means the nav controls must
  read unambiguously as belonging to one of them; that is a layout concern for
  the host, not a mode on this control.

## 8. Second deliverable — rehost onboarding stage 3

After the control passes checks, rebuild
`source/front/app-admin/onboarding/onboarding-stage-sites.tsx` on it.

- `items` is `state.sites()`, `onItemsChange` is `state.setSites`
- `newItem` returns a blank `CustomerSite`
- `children` renders the site form — label, address, coordinates, acreage
- delete the eleven per-field scratch signals and `clearSite` from
  `onboarding-state.ts`; the item under edit is `items[cursor]`
- delete the added-sites summary list and `SiteSummary` — the cursor replaces it
- the nested `Address` and `Coordinates` fieldsets go; no nested fieldsets
- the note textarea comes out of this stage entirely. Notes are a separate
  component in a later phase and do not belong mid-form here

This rehost is what proves the control generic. If it forces a change to the API
in §4, **stop and escalate** — that is a design change, not an implementation
detail.

## 9. Checks

```bash
deno task fmt && deno task check
```

`check` chains `check:guards` (thirteen guards), `check:types` and `check:lint`.
`STYLE-GUIDE.md` is a hard gate — violations are correctness failures.

Guards that will bite this work specifically: `guard:css` (no raw literals, no
class names, `data-ui` selectors only in `ui.css`), `guard:bare-html` (raw
elements carry a namespace attribute), `guard:namespaces` (layer boundaries).

**No automated UI coverage exists.** Behavioural verification is the Chief
Architect's authenticated browser, not a delegate's. Report checks green and
behaviour unverified.

**Delegates are read-only on git.** No commits, no branches, no reverts.

_End of Brief_
