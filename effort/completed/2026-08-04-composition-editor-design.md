# Composition Editor — Design

**Date:** 2026-08-04
**Mode:** Foundation
**Author:** Chief Architect (design); AI Architect (capture, analysis, open questions)
**Ledger:** `effort/active/2026-07-20-wizard-onboarding-tasks.md`
**Consumers:** M1 Group B stage 3 (job sites), M1 Group C (Notes-lite)

Settled in conversation on 2026-08-04. This document is the record of that
conversation; the production brief is a separate artifact derived from it.

## 1. Why this exists

`Note` is already a universal domain composition — `notes: CompositionMany<Note>`
appears at twelve declared mount points across `user`, `customer` (×2 — the
account and each site), `asset`, `service`, `chemical`, `job` (×3) and `workflow`
(×3). Three are needed now: **User, Customer, Site.**

Every other thing a form captures is a scalar: one field, one value. These are
**0..n record collections**, and a collection editor needs states a scalar field
never has — the collection as it stands, the record under construction, and the
empty case.

Stage 3 of the onboarding wizard is what happens without a shared answer. Its
four surviving defects are all symptoms of a record editor flattened into a form:

- the added-sites list renders above the capture form, so every successful add
  pushes the work surface further from the user
- three nested legends: "Added Sites" beside "Add Job Site" wrapping "Address"
- a four-row textarea buried mid-form between acreage and the add button
- `clearSite` hand-resets eleven signals

The eleven signals are the tell. They exist because the record being built lives
in a scratch pen beside the collection it will eventually join. The design below
deletes the pen: **the record under edit is `items[cursor]`.**

## 2. Form of the control

A rounded frame — a **fieldset specialization** — with the title alone on the
rule, and one row of chrome inside it:

```
┌─ Job sites ─────────────────────────────────────────────┐
│  (<) ● ○ ● ●  (>)                Delete │ ⊖   New │ ⊕    │
│                                                          │
│  Site label   [                                    ]     │
│  …the record's own form…                                 │
└──────────────────────────────────────────────────────────┘
```

**Placement.** `ux/shell/`. Not `ux/ui/` — that catalog stays closed and is the
Seasons extraction seam.

**Generic over `T[]` plus a cursor. Deliberately not typed to `Composition*`.**
Cursor-over-array needs nothing from the composition types, and staying generic
lets it serve any bounded collection.

### 2.1 Elements

| Element      | Behavior                                         |
| ------------ | ------------------------------------------------ |
| Title        | On the rule, alone                               |
| `(<)` `(>)`  | Clickable. Cursor moves ±1                       |
| `● ○ ● ●`    | Read-only position. Carries count _and_ position |
| `Delete │ ⊖` | Removes the record at the cursor                 |
| `New │ ⊕`    | Appends, cursor lands on the new record          |

Action buttons render `Text │ (X)` — label, then the bar, then the icon. That is
the design-language default; the bar belongs to `UiActionButton` and sits between
icon and label, not between buttons. The label is droppable by attribute, which
is also the responsive answer: at `app-ops` portrait widths the control owns that
threshold itself rather than making each consumer pass a flag.

### 2.2 Why the dots are read-only, permanently

Neither notes nor job sites are ordered. Position carries no domain meaning, so
"jump to note 3" is not a real intent — note 3 is only where that note happens to
sit today. This is a stronger reason than the wizard rail's, where read-only is a
presentation decision; here it follows from the model.

**Corollary that binds beyond this control:** nothing may treat array index as
identity — not commit, not the API, not the UI. Where ordering _does_ matter, the
CA's preference is an explicit **`sequence` attribute on the object**, never
vector position. Ordering is data, not an artifact of serialization.

### 2.3 The ~8 ceiling is structural

The dots carry the count, so past roughly eight they stop being countable at a
glance. The control enforces its own limit rather than a doc asking politely.

### 2.4 No nesting

Nested fieldsets are prohibited — CA, 2026-08-04. A collection inside a
collection opens a **window above the current form**, never an inner frame. This
belongs in `ux-design-language.md` as a general rule, not as a note on this
control.

## 3. Interaction model

**Not** clear-form → fill → add-record. The model is the abstraction manager's:
`+ new`, `- delete`, and the host saves at the end. You do not commit a record to
navigate away from it.

**New appends** rather than inserting after the cursor. Least astonishment, and
the collections are unordered anyway, so creation order is as good as any.

**Compositions have no identity until the root commits.** A note on a site on an
uncommitted prospect has no id, no row and no API — it is an in-memory object
graph until the host writes the aggregate. The editor therefore can never own
"save"; value-in / value-out is not a simplification but the only available shape.

## 4. Open

1. **Empty state at `[]`.** Frame with title and `New` only, or no frame until the
   first record? Notes sit at zero most of the time, so this is the common case.
2. **Blank records at save.** `New` appends an empty record immediately, so a
   blank can exist when the host commits. Proposal: commit prunes empties and the
   gate tests _substance_. Forced by the fact that dirtiness fires the instant
   `New` is pressed, which makes it useless as a gate.
3. **Fieldset redundancy.** See `documentation/project/project-backlog.md` — a
   panel containing exactly one fieldset whose legend repeats the panel title.
   Bears on this control directly, since its frame _is_ a fieldset. Affects M1
   Group B stages 1 and 2 as well as the stage-3 rework.

## 5. Analysis recorded so that it is not re-derived

**It is a deck with a cursor, not a stack.** The card-stack metaphor is right
visually and wrong as a data model: a stack is LIFO, but Delete removes at the
cursor, which LIFO cannot express. Implement as array-plus-index.

**Array length cannot carry dirty-state.** New-then-Delete restores the length
with different content; editing a field changes no length at all. A different
length is a sufficient positive test and never a necessary one. Dirty requires a
baseline snapshot compared structurally — cheap and legitimate here because these
are pure value objects with no identity and no methods, at n ≤ 8.

**How the wizard handles intermediate state today: it doesn't.** `wizard.tsx`
holds `stepIndex`, `committing` and `error`. There is no baseline and no dirty
concept anywhere. Back re-enters live because signals simply persist, and
`commit` fires on every Next — the mechanism behind the duplicate-customer bug.

**Facet versus topic** (raised, liked, explicitly _not_ a call to action). Does a
composition have existence independent of its parent's record? `Attachment` does
— `url` points at bytes in a bucket, so creating one has a side effect the
parent's save does not own. `Note`, `Location` and `Contact` do not. A facet
slides within a window; a topic gets its own. CA's read is that an attachment is
"probably" a topic in its own right. Depth 3 is Phase 4 and blocks nothing here.

_End of Design_
