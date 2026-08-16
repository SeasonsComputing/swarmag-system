<img src="../../swarmag-ops-logo.png" title="" alt="swarmAg Operations System" data-align="center">

# swarmAg Operations System — UX Design Archetypes

## 1. Overview

This document defines how an application assembles controls into a user interface. A
production that needs a surface starts here, not from imagination: the archetypes below
are the patterns this system already uses, and the standard solutions are what already
implements them.

Reinvention is the failure this document prevents. A surface built without reference to
an archetype arrives with its own look, its own navigation, and its own idea of what
selecting a row means — and every one of those is a thing the user must learn twice.

### 1.1 Two Layers

| Layer                       | Answers                          | Prevents reinventing |
| --------------------------- | -------------------------------- | -------------------- |
| **Archetypes** (§3)         | What pattern is this surface?    | the concept          |
| **Standard solutions** (§6) | What does this repo already use? | the implementation   |

An archetype is a named pattern. The name is the point: a pattern nobody can say by name
gets reinvented. A standard solution is the concrete answer to a recurring task in this
repository, and it cites the archetype it realizes.

### 1.2 Document Organization

| Document                     | Scope                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------- |
| _This document_              | Composition: archetypes, their vocabulary, and this repo's standard solutions   |
| `ux-design-language.md`      | Design foundation, tokens, typography, geometry, layout, motion                 |
| `ux-components-guide.md`     | Consumer reference: what controls exist, how to use them                        |
| `ux-components-internals.md` | Implementation reference: CSS architecture, control contract, tokens, selectors |

**The components guide is a catalog and must not prescribe composition.** A catalog entry
says which control to reach for. An archetype rule says how controls assemble into a
surface. The test: if a design decision can falsify an entry in the catalog, that row was an
archetype rule in the wrong document, and it belongs here.

## 2. Vocabulary

This vocabulary is normative. Use these words in briefs, in code, and in review.

### 2.1 Nouns

| Term           | Meaning                                                 |
| -------------- | ------------------------------------------------------- |
| **Collection** | The abstract set of things being presented              |
| **Item**       | One member of a Collection                              |
| **Selection**  | The Item currently chosen                               |
| **Detail**     | The fuller representation of the selected Item          |
| **List**       | One visual presentation of a Collection, usually linear |

### 2.2 Verbs

| Term           | Meaning                                                                   |
| -------------- | ------------------------------------------------------------------------- |
| **Select**     | Establish the current Item within a Collection                            |
| **Drill-down** | Transition from the Collection context into the selected Item's Detail    |
| **Drill-back** | Return from a Detail to the immediately prior Collection context          |
| **Activate**   | The higher-level intent, where the provider decides what activation means |

The grammar of a collection surface:

```
Collection → Select(Item) → Drill-down → Detail → Drill-back
```

**Activate is the intent, not the outcome.** A control that offers activation does not
decide what activation means — the consumer does, and it may mean drill-down, execute,
expand, or preview. `UiTableRow` is built this way: it exposes `onActivate` and handles
click, Enter, and Space, while the surface decides what happens.

### 2.3 List Is A Visualization

**A List is one visualization of a Collection, exactly as a Map is.** A collection of
waypoints is as well served by a Map as by a List; a Table, a List, a Map, and a cursor's
position readout are all visualizations of the same Collection.

**An archetype never names a visualization.** An archetype that says "list" has quietly
excluded the map, and the surface that needs a map will be built from scratch — which is
the reinvention this document exists to stop. Visualization varies independently of
archetype and is chosen per surface.

### 2.4 Disclosure

| Term                     | Meaning                                                 |
| ------------------------ | ------------------------------------------------------- |
| **Full disclosure**      | The Collection remains on screen while a Detail is open |
| **Selective disclosure** | The Detail replaces the Collection                      |

Disclosure is a property each archetype declares. It is **not** the axis that
distinguishes archetypes: one archetype's disclosure is responsive, changing with the
container, and a property that changes with viewport width cannot name a pattern.

**Selection follows disclosure, and nothing else.** Under full disclosure the Selection
persists on screen and the surface owes the user a visible indication of it. Under
selective disclosure the Selection is momentary — no Item is on screen while its Detail is
open — so there is no selected state to draw, and none may be plumbed.

## 3. Archetypes

Each archetype is distinguished by **the act that reaches the Detail**.

| Archetype             | Act                  | Collection while Detail is open | Selection                  | Depth     |
| --------------------- | -------------------- | ------------------------------- | -------------------------- | --------- |
| **Collection-Detail** | Select → Drill-down  | replaced                        | momentary — not a state    | recursive |
| **Index-Detail**      | Select               | beside it, above the threshold  | persistent — must be drawn | one level |
| **Collection-Cursor** | Traverse — no Select | a position readout              | a position, always defined | none      |

### 3.1 Collection-Detail

**Purpose.** Present a Collection and open one Item's Detail, at any depth, without the
Detail competing with the Collection for the screen. Use it when Items nest — a customer
has sites, a site has notes, a note has attachments — and the nesting has no fixed bottom.

**Disclosure.** Selective, always.

**Selection.** Momentary. Selecting and drilling down are one act.

**Depth.** Recursive, and there is no depth counter. The host holds the current panel and
a way back; how deep that goes is a property of the data, not a case to reason about.

**Sketch**

```
┌─ Sites ──────────────────────────────── ⊕ New site ─┐
│  Site                                       Actions │
│  ─────────────────────────────────────────────────  │
│   South pasture                                  🗑 │
│   North forty                                    🗑 │
└─────────────────────────────────────────────────────┘

        Select "South pasture"  ↓  the panel is replaced

┌─────────────────────────────────────────────────────┐
│  ⌐ Sites                                            │
│  ┌─ Identity ────────────────────────────────────┐  │
│  │  Site Label  [ South pasture              ]   │  │
│  └───────────────────────────────────────────────┘  │
│  ┌─ Notes ──────────────────────── ⊕ New note ──┐   │
│  │   Gate code is 4417                       🗑 │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

**Rules**

- Selecting an Item replaces the panel it lives in. The Collection is not scrolled past,
  not below, not collapsed — it is gone.
- Drill-back restores the panel that was replaced.
- This holds identically at every depth. A note's Detail replaces the _site's_ panel.
- Creating an Item opens it. That is one behaviour, not two.
- The drill-back control must not share a glyph with the Sequence archetype's Back (§3.4).

**Sample**

```tsx
<DrillDown
  rootTitle='Sites'
  root={drill => (
    <CollectionPanel
      legend='Sites'
      items={state.sites}
      label={siteName}
      onNew={() => state.addSite(newSite())}
      renderItem={(site, i) => <SiteEditor site={site} index={i} drill={drill} />}
      drill={drill}
    />
  )}
/>
```

### 3.2 Index-Detail

**Purpose.** Work through a Collection while keeping it in view. Use it when the set
matters as much as the record — administration, review, and any task where the user moves
between Items rather than into one.

**Disclosure.** Responsive. Full above the surface's container threshold; collapses to
selective below it, where the two panels swap.

**Selection.** Persistent while both panels show, and therefore **must be drawn**. A user
editing the fourth record with the whole Collection on screen and nothing marking which
Item is open has lost their place. This is the one archetype that owes a selected
treatment, and the reason the other two do not.

**Depth.** One level. An Index-Detail surface does not nest; a nested Collection inside
its Detail is a Collection-Detail.

**Sketch**

```
above the threshold — full disclosure

┌─ Users ──────────────┬─ Ada Lovelace ────────────────┐
│ ▸ Ada Lovelace       │  Display name [ Ada Lovelace ]│
│   Grace Hopper       │  Email        [ ada@…       ] │
│   Alan Turing        │  Role         [ admin      ▾] │
└──────────────────────┴───────────────────────────────┘
   index                 the Detail
   ▸ is the Selection, and it is visible

below the threshold — collapses to selective disclosure

┌─ Users ─────────────┐         ┌─ Ada Lovelace ──────┐
│   Ada Lovelace      │    ⇄    │  Display name [ … ] │
│   Grace Hopper      │         │  Email        [ … ] │
└─────────────────────┘         └─────────────────────┘
```

**Implementation seam.** The panels carry `data-shell-panel='index'` and
`data-shell-panel='subject'`. `subject` is the generic panel role — the panel holding the
thing being worked on — and the Sequence archetype uses the same role for a Step. In
Index-Detail, the subject panel carries the Detail.

**Sample**

```tsx
<AbstractionManager provider={usersProvider} onCancel={backToDashboard} />
```

The composition lives in the provider contract, not at the call site. Supplying a provider
is how a new abstraction joins this archetype.

### 3.3 Collection-Cursor

**Purpose.** Traverse a Collection one Item at a time where choosing is not the point.
Use it for capture and review in sequence, where the user works through every Item rather
than picking one.

**Disclosure.** Not applicable. There is no Collection presentation to retain or replace —
a position readout stands for the Collection, and the Detail is always on screen.

**Selection.** A position, always defined. There is no Select act, no Drill-down, and no
Drill-back: the grammar of §2.2 does not apply to this archetype.

**Sketch**

```
┌─ Job sites ─────────────────────────────────────────┐
│  ● ○ ○ ○      1 of 4          ⊕ New      🗑 Delete  │
│  ─────────────────────────────────────────────────  │
│   Site Label   [ South pasture                  ]   │
│   Address      [ 1180 County Road 12            ]   │
└─────────────────────────────────────────────────────┘
    ▲ the readout is this Collection's visualization
```

**Sample**

```tsx
<UiCollectionCursor
  items={sites()}
  onItemsChange={setSites}
  newItem={newSite}
  empty={{ icon: 'home', message: 'No job sites yet. Click New to add one.' }}
  confirmDelete={site => ({ title: `Delete ${site.label}?`, message: '…' })}
  renderItem={site => <SiteForm site={site} />}
/>
```

### 3.4 Sequence

**Purpose.** Decompose one complex form into a series of steps a user can hold in mind.
Use it when the work is a single act too large to present at once — not when the user is
choosing among things, which is a Collection.

**Sequence is not Depth.** They are different axes and must never be conflated. Back is
the previous _step_, always: it does not change meaning inside a Detail, is not disabled
there, and never returns to a Collection. A Collection-Detail nested inside a step carries
its own drill-back control on the depth axis.

**Two ascend controls must not share a glyph.** Back owns `arrow-left`. A drill-back
control uses `corner-top-left`, which reads as up-and-out and is plainly distinct at a
compact icon size. This separation is the whole reason the two axes stay legible.

**Sketch**

```
┌─ Customer Onboarding ───────────────────────────────┐
│  ‹ Back                                     Next ›  │
│  ┌──────────────────┬────────────────────────────┐  │
│  │ Contact details  │                            │  │
│  │ Customer address │  the current step's form   │  │
│  │ Job sites      ◂ │                            │  │
│  └──────────────────┴────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
     stepflow           the Step, in the subject panel
```

**Sample**

```tsx
<Wizard contract={onboardingContract} onFinish={toDashboard} onCancel={toDashboard} />
```

### 3.5 Composition

**Purpose.** A surface the user assembles from a catalog of interchangeable parts. Use it
where the right content differs per user or per role and no fixed layout serves everyone.

Widgets are shared across all applications; an application package supplies only its
dashboard configuration. A widget is written once and placed by configuration, never
copied into an application to be adjusted there.

**Sample**

```jsonc
// app-admin/dashboard-admin.json — the application supplies configuration, not layout
{
  "settings": {},
  "header": {
    "widgets": [
      { "type": "BrandWidget", "settings": { "shape": "landscape" } }
    ]
  },
  "rows": []
}
```

## 4. Collection Invariants

These hold for every Collection archetype, at every depth, in every application.

- **A Collection behaves identically at every depth, whatever visualization presents it.**
  Depth changes nothing about its appearance or behaviour. A user who has learned one
  Collection has learned all of them, including the ones not yet built. That transfer is
  why the component is shared, and it outranks local visual harmony inside any one panel.
- **An archetype never names a visualization.** See §2.3.
- **Selection is drawable only under full disclosure.** See §2.4. A selected state plumbed
  into a selective-disclosure surface is dead markup by construction.
- **A destructive row action inside an activation target requires confirmation.** The row
  activates on click, so a delete control inside it is a mis-click hazard and the
  confirmation absorbs it. This is not conditional on the Item looking empty.
- **Frame height is fixed, and the body scrolls within it.** A frame that grows with its
  contents moves the controls beneath it, and a control that moves between visits forces
  the user to re-find it.

## 5. Composition Rules

Rules that govern how a surface is assembled, independent of archetype.

- **Form actions sit at the top of a form, never trailing it.** Controls belong where the
  eye already is. A user who has finished a form is looking at the field they just
  completed, not hunting the bottom of a scroll region for the commit.

## 6. Standard Solutions

What this repository already uses for a recurring task. Reach for the row before designing
a surface; if no row fits, that is the escalation, not a licence to invent.

| Task                                     | Use                             | Realizes          |
| ---------------------------------------- | ------------------------------- | ----------------- |
| Edit one record from a set of records    | `AbstractionManager`            | Index-Detail      |
| Present a nested Collection at any depth | `DrillDown` + `CollectionPanel` | Collection-Detail |
| Capture or review Items one at a time    | `UiCollectionCursor`            | Collection-Cursor |
| Decompose a complex form into steps      | `Wizard` + `WizardStage`        | Sequence          |
| A user-configurable surface              | dashboard + widget catalog      | Composition       |

**Adding a row is a Foundation decision.** A new standard solution means this repository
has a second way to do something it already did, and that requires the Chief Architect's
judgment about whether the existing one should have been extended instead.

_End of UX Design Archetypes Document_
