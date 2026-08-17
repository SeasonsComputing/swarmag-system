<img src="../../swarmag-ops-logo.png" title="" alt="swarmAg Operations System" data-align="center">

# swarmAg Operations System — UX Design Archetypes

## 1. Overview

This document defines how an application assembles controls into a user interface. A production that needs a surface starts here, not from imagination: the archetypes below are the patterns this system already uses, and the supporting library is what already implements them.

Reinvention is the failure this document prevents. A surface built without reference to an archetype arrives with its own look, its own navigation, and its own answer to a question the system has already settled — what selecting a row means, or where Back goes — and every one of those is a thing the user must learn twice.

### 1.1 Document Organization

| Document                     | Scope                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------- |
| _This document_              | Composition: archetypes, their vocabulary, and the supporting library           |
| `ux-design-language.md`      | Design foundation, tokens, typography, geometry, layout, motion                 |
| `ux-components-guide.md`     | Consumer reference: what controls exist, how to use them                        |
| `ux-components-internals.md` | Implementation reference: CSS architecture, control contract, tokens, selectors |

**The components guide is a catalog and must not prescribe composition.** A catalog entry says which control to reach for. An archetype rule says how controls assemble into a surface. The test: if a design decision can falsify an entry in the catalog, that entry was an archetype rule in the wrong document, and it belongs here.

**Archetypes are grouped into families by what they present.** A **Collection** (§3) is a set of peers; the user selects one. A **Decomposition** (§4) is one subject presented in parts. Each family carries its own vocabulary, because the words that make a Collection precise say nothing useful about a Decomposition.

### 1.2 Two Layers

| Layer                       | Answers                            | Serves                        |
| --------------------------- | ---------------------------------- | ----------------------------- |
| **Archetypes** (§3, §4)     | What pattern is this surface?      | reasoning about a surface     |
| **Supporting library** (§6) | What does this repo already build? | making the common case common |

An archetype is a named pattern. The name is the point: a pattern nobody can say by name gets reinvented. The supporting library is the machinery that implements the common cases — managers, wizards, the drill-down host, the cursor, widgets — so feature work writes only what is genuinely particular to it.

**Feature design adheres to the Pareto Principle:** 80-20 or 90-10 rule of thumb. There are 2 dimensions to this principle: build the 20% of features that satisfy 80% of the target audience; and 80% of the implementation of those features is satisfied with 20% of the code.

Library design following this principle can be restated as:
**keep the common stuff common and the special stuff special.** Both are load-bearing, and each guards a different failure.

- **Common:** A surface built without reference to the library arrives with its own look, its own navigation, and its own answers to settled questions. That is a failure of user experience and of library usage at the same time.
- **Specialized:** A surface forced into a library construct it does not fit is the opposite failure, and the more expensive one — it contorts the construct for every later consumer. Reaching past the library is correct when the work is genuinely particular.

## 2. Archetype Concepts

What holds across every family. Family-specific vocabulary lives with its family.

### 2.1 Disclosure

| Term                     | Meaning                                                |
| ------------------------ | ------------------------------------------------------ |
| **Full disclosure**      | The whole and the part in focus are on screen together |
| **Selective disclosure** | The user meets one part at a time                      |

Disclosure is about how much a user can take in at once. It is the reason the concept spans families: a Sequence discloses selectively for the same reason an Index does — the subject is too large or too complex to meet all at once. One reveals the parts of a set; the other reveals the parts of a task.

**Disclosure is the axis that distinguishes archetypes within a family.** Full disclosure costs room and buys context; selective disclosure buys focus and costs orientation, which the archetype must then return some other way.

### 2.2 Visualization

**A presentation is never the pattern.** A List is one visualization of a Collection, exactly as a Map is: a collection of waypoints is as well served by a Map as by a List, and a Table, a List, a Map, and a cursor's position readout are all visualizations of the same Collection. A Decomposition's parts are likewise presented by a rail, a breadcrumb, or a numbered header without changing what it is.

**An archetype never names a visualization.** An archetype that says "list" has quietly excluded the map, and the surface that needs a map will be built from scratch — which is the reinvention this document exists to stop. Visualization varies independently of archetype and is chosen per surface.

### 2.3 Composition

**A surface may compose more than one archetype**, and composing them is where feature design does its creative work. What a surface keys that composition on is a design decision, not a property of the archetypes: `AbstractionManager` keys on viewport, and nothing requires that. Another surface might key on role, on data volume, or on task mode.

Consequently an archetype names a surface's behaviour _in a mode_, not a permanent classification of a screen.

## 3. Collection Archetypes

A Collection is a set of peers. The user establishes one as current and works with it.

### 3.1 Vocabulary

This vocabulary is normative. Use these words in briefs, in code, and in review.

| Term           | Kind | Meaning                                                                   |
| -------------- | ---- | ------------------------------------------------------------------------- |
| **Collection** | noun | The abstract set of things being presented                                |
| **Item**       | noun | One member of a Collection                                                |
| **Selection**  | noun | The Item currently chosen                                                 |
| **Detail**     | noun | The fuller representation of the selected Item                            |
| **List**       | noun | One visual presentation of a Collection, usually linear                   |
| **Select**     | verb | Establish the current Item within a Collection                            |
| **Drill-down** | verb | Transition from the Collection context into the selected Item's Detail    |
| **Drill-back** | verb | Return from a Detail to the immediately prior Collection context          |
| **Activate**   | verb | The higher-level intent, where the provider decides what activation means |

The grammar of a collection surface:

```
Collection → Select(Item) → Drill-down → Detail → Drill-back
```

**Activate is the intent, not the outcome.** A control that offers activation does not decide what activation means — the consumer does, and it may mean drill-down, execute, expand, or preview. `UiTableRow` is built this way: it exposes `onActivate` and handles click, Enter, and Space, while the surface decides what happens.

**Selection follows disclosure, and nothing else.** Under full disclosure the Selection persists on screen and the surface owes the user a visible indication of it. Under selective disclosure the Selection is momentary — no Item is on screen while its Detail is open — so there is no selected state to draw, and none may be plumbed.

| Archetype             | Disclosure | Act                  | Selection                  | Depth     |
| --------------------- | ---------- | -------------------- | -------------------------- | --------- |
| **Collection-Detail** | full       | Select               | persistent — must be drawn | one level |
| **Index-Detail**      | selective  | Select → Drill-down  | momentary — not a state    | recursive |
| **Collection-Cursor** | selective  | Traverse — no Select | a position, always defined | none      |

### 3.2 Collection-Detail

**Purpose.** Work through a Collection while keeping it in view. Use it when the set matters as much as the record — administration, review, and any task where the user moves between Items rather than into one.

**Disclosure.** Full. The Collection and the Detail are on screen together, which is what distinguishes this archetype from Index-Detail and what makes it cost horizontal room.

**Selection.** Persistent while both are on screen, and therefore **must be drawn**. A user editing the fourth record with the whole Collection visible and nothing marking which Item is open has lost their place. This is the one archetype that owes a selected treatment, and the reason the others do not.

**Depth.** One level. A Collection nested inside the Detail is an Index-Detail, not more of this.

**Composed with Index-Detail.** Full disclosure needs room it does not always have. `AbstractionManager` is Collection-Detail above its container threshold and Index-Detail below it, swapping the two panels rather than shrinking them. That is a composition decision belonging to the surface — the threshold is the manager's discriminant, not a rule about either archetype.

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

below the threshold — becomes Index-Detail

┌─ Users ─────────────┐         ┌─ Ada Lovelace ──────┐
│   Ada Lovelace      │    ⇄    │  Display name [ … ] │
│   Grace Hopper      │         │  Email        [ … ] │
└─────────────────────┘         └─────────────────────┘
```

**Implementation seam.** The panels carry `data-shell-panel='index'` and `data-shell-panel='subject'`. `subject` is the generic panel role — the panel holding the thing being worked on — and the Sequence archetype uses the same role for a Step. Here the subject panel carries the Detail.

**Known uses.** The Users manager in Admin, above its container threshold.

### 3.3 Index-Detail

**Purpose.** Present a Collection and open one Item's Detail, at any depth, without the Detail competing with the Collection for the screen. Use it when Items nest — a customer has sites, a site has notes, a note has attachments — and the nesting has no fixed bottom.

**Disclosure.** Selective, always.

**Selection.** Momentary. Selecting and drilling down are one act.

**Depth.** Recursive, and there is no depth counter. The host holds the current panel and a way back; how deep that goes is a property of the data, not a case to reason about.

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

- Selecting an Item replaces the panel it lives in. The Collection is not scrolled past, not below, not collapsed — it is gone.
- Drill-back restores the panel that was replaced.
- This holds identically at every depth. A note's Detail replaces the _site's_ panel.
- Creating an Item opens it. That is one behaviour, not two.
- The drill-back control must not share a glyph with the Sequence archetype's Back (§4.1).
- An Index-Detail surface nests freely. A Collection nested inside a Detail is another Index-Detail, and the Index it replaces is the panel it was opened from.

**Known uses.** The onboarding job-sites stage — sites, and notes within a site. The Users manager in Admin, below its container threshold.

### 3.4 Collection-Cursor

**Purpose.** Traverse a Collection one Item at a time where choosing is not the point. Use it for capture and review in sequence, where the user works through every Item rather than picking one.

**Disclosure.** Selective. The user meets one Item at a time; the Collection is compressed to a position readout rather than presented, so it is never met alongside the Detail.

**Selection.** A position, always defined. There is no Select act, no Drill-down, and no Drill-back: the grammar of §3.1 does not apply to this archetype.

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

**Known uses.** None currently. `UiCollectionCursor` is catalog stock; the onboarding job-sites stage used it before adopting Index-Detail, which is why the archetype is documented rather than deduced.

### 3.5 Collection Invariants

These hold for every Collection archetype, at every depth, in every application.

- **A Collection behaves identically at every depth, whatever visualization presents it.** Depth changes nothing about its appearance or behaviour. A user who has learned one Collection has learned all of them, including the ones not yet built. That transfer is why the component is shared, and it outranks local visual harmony inside any one panel.
- **An archetype never names a visualization.** See §2.2.
- **Selection is drawable only under full disclosure.** See §2.1. A selected state plumbed into a selective-disclosure surface is dead markup by construction.
- **A destructive row action inside an activation target requires confirmation.** The row activates on click, so a delete control inside it is a mis-click hazard and the confirmation absorbs it. This is not conditional on the Item looking empty.
- **Frame height is fixed, and the body scrolls within it.** A frame that grows with its contents moves the controls beneath it, and a control that moves between visits forces the user to re-find it.

## 4. Decomposition Archetypes

A Decomposition is one subject presented in Parts. The Parts are not peers to choose among — they are facets of a single whole, and the archetype decides whether the user meets them together or one at a time. That is the question to ask first when a surface could plausibly be a Collection instead.

### 4.1 Vocabulary

| Term              | Kind | Meaning                                                       |
| ----------------- | ---- | ------------------------------------------------------------- |
| **Decomposition** | noun | One subject too large to meet at once, presented in Parts     |
| **Part**          | noun | One piece of a Decomposition                                  |
| **Step**          | noun | A Part met in order — a Sequence's Part                       |
| **Interchange**   | noun | The property that any conforming Part may occupy any position |
| **Sequence axis** | axis | Movement between Steps — Back and Next                        |
| **Depth axis**    | axis | Movement into a Detail — drill-down and drill-back            |

**Sequence is not Depth.** They are different axes and must never be conflated. Back is the previous _step_, always: it does not change meaning inside a Detail, is not disabled there, and never returns to a Collection. An Index-Detail nested inside a Step carries its own drill-back control on the depth axis.

**Two ascend controls must not share a glyph.** Back owns `arrow-left`. A drill-back control uses `corner-top-left`, which reads as up-and-out and is plainly distinct at a compact icon size. This separation is the whole reason the two axes stay legible.

**Interchange is what divides this family.** A Sequence's Parts are bespoke — authored for this subject, in this order, and not substitutable. A Chassis-Part's Parts are catalog stock conforming to a common fitting, so any of them may occupy any position. Ask which kind of Part a surface has before asking anything else about it.

| Archetype        | Disclosure | Parts are                       | Positioned by |
| ---------------- | ---------- | ------------------------------- | ------------- |
| **Chassis-Part** | full       | interchangeable catalog stock   | configuration |
| **Sequence**     | selective  | bespoke, authored for the whole | the designer  |

### 4.2 Sequence

**Purpose.** Decompose one complex subject into a series of steps a user can hold in mind. Use it when the work is a single act too large to present at once — not when the user is choosing among things, which is a Collection.

**Disclosure.** Selective, and the clearest case of it: the user meets one Step at a time because the subject is too complex to meet whole. The same principle as Index-Detail, applied to the complexity of one subject rather than the cardinality of a set.

**Orientation.** Selective disclosure costs orientation, so a Sequence must return it: the rail names every Step and marks the current one, and it is rendered unconditionally. That is the compensation, not decoration.

**Sketch**

```
┌─ Customer Onboarding ───────────────────────────────┐
│  ‹ Back                                     Next ›  │
│  ┌──────────────────┬────────────────────────────┐  │
│  │ Contact details  │                            │  │
│  │ Customer address │  the current Step's form   │  │
│  │ Job sites      ◂ │                            │  │
│  └──────────────────┴────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
     stepflow           the Step, in the subject panel
```

**Known uses.** The customer onboarding wizard in Admin.

### 4.3 Chassis-Part

**Purpose.** Present one subject's facets together, drawn from a catalog and arranged per context. Use it when the right content differs by application, role, or user, and no single fixed layout serves all of them.

**Disclosure.** Full. Every Part is on screen together and the user scans rather than travels, so this archetype spends room to buy breadth.

**Interchange.** The Chassis defines a fitting; every Part conforms to it; any Part may occupy any position. A Part is written once and placed by configuration, never copied into a context to be adjusted there — copying it is the failure this archetype exists to prevent, because the copy stops receiving the fitting's improvements.

**What the Chassis owns.** Position, ordering, and which Parts appear. A Part owns its own content and nothing about where it sits. When a Part starts caring where it is, either the fitting is wrong or the surface is not a Chassis-Part.

**Sketch**

```
┌─ Admin ─────────────────────────────────────────────┐
│  ┌─ Brand ────────┐ ┌─ Helm ─────────────────────┐  │
│  │  swarmAg       │ │  Users  Onboarding  Logout │  │
│  └────────────────┘ └────────────────────────────┘  │
│  ┌─ Jobs today ───┐ ┌─ Fleet ──────┐ ┌─ Alerts ──┐  │
│  │       12       │ │  4 of 6 up   │ │  2 open   │  │
│  └────────────────┘ └──────────────┘ └───────────┘  │
└─────────────────────────────────────────────────────┘
   every Part conforms to the same fitting;
   which Parts appear, and where, is configuration
```

**Known uses.** The Admin, Customer, and Ops dashboards, composed from the shared widget catalog. Each application supplies only its dashboard JSON — the catalog is the kit, the dashboard is the chassis.

## 5. Composition Rules

Rules that govern how a surface is assembled, independent of archetype.

- **Form actions sit at the top of a form, never trailing it.** Controls belong where the eye already is. A user who has finished a form is looking at the field they just completed, not hunting the bottom of a scroll region for the commit.

## 6. Supporting Library

The machinery this repository already builds for the common cases. Reach for the row before designing a surface. Where no row fits, the work is the special case the Pareto split exists to protect — say so and escalate rather than bending a row to cover it.

| Task                                     | Use                             | Realizes                         |
| ---------------------------------------- | ------------------------------- | -------------------------------- |
| Edit one record from a set of records    | `AbstractionManager`            | Collection-Detail ⇄ Index-Detail |
| Present a nested Collection at any depth | `DrillDown` + `CollectionPanel` | Index-Detail                     |
| Capture or review Items one at a time    | `UiCollectionCursor`            | Collection-Cursor                |
| Decompose a complex subject into steps   | `Wizard` + `WizardStage`        | Sequence                         |
| A per-application configurable surface   | dashboard + widget catalog      | Chassis-Part                     |

**Adding a row is a Foundation decision.** A new entry means this repository has a second way to do something it already did, and that requires the Chief Architect's judgment about whether the existing one should have been extended instead.

_End of UX Design Archetypes Document_
