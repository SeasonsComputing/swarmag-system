# Dashboard Presentation Field — Foundation Decision

**Date:** 2026-07-19
**Mode:** Foundation
**Status:** DECIDED — establishes the field-allocation direction; header
implementation is authorized by its task ledger.
**Related:** `documentation/architecture/architecture-front.md` §10.3,
`documentation/ux/ux-design-language.md`,
`documentation/project/2026-07-18-foundation-game-plan-design.md`

---

## 1. Decision

The Dashboard is a responsive presentation field, not a fixed header followed
by unrelated widget rows. The header is its densest, highest-priority region;
the body continues the same placement and presentation model at larger scale.

This direction makes dashboard composition durable as the widget catalog grows.
It establishes a thin field-allocation guarantee, not a catalog of widget
visualizations or numerical allocation metadata.

## 2. Design Direction

### D1 — The shell provides a presentation field

The shell owns spatial responsibility only:

- placement and ordered reading/focus order;
- allocated fields: their row context, available footprint, containment, and
  expansion;
- accessibility boundaries, including motion, focus visibility, contrast, and
  touch-target requirements; and
- responsive behavior that adds rows rather than requiring shell-level
  horizontal scrolling.

The shell does not define what a dashboard widget is visually.

### D2 — Widgets own data-driven presentation

A widget owns the presentation it derives from its data and the footprint the
shell allocates. A KPI may present as a full stat card, a compact summary, a
chyron, an animated indicator, a chart, or another visualization appropriate
to its data.

The shell must not encode a finite vocabulary of widget transformations. A
widget may adapt creatively within its field, subject to the shell's
accessibility and containment constraints.

A widget's intrinsic minimum, optimal, and maximum useful measures remain
implementation-local. They are not Dashboard schema, seed, registry, state, or
Widget SPI metadata. The shell provides the allocated field; the widget decides
how to use it meaningfully.

`compact` and `landscape` remain useful widget presentation shapes. They express
how a widget intends to present its data, such as a compact pie or machinery list,
or a landscape chart with a legend. Shape is not a shell width or height command:
the presentation field allocates space and the widget expresses its configured
shape within that allocation.

### D3 — Identity is the intentional exception

The dashboard logo and brand are shell identity, not ordinary dashboard
content. They remain legible, stable, and non-wrapping. They anchor the
highest-priority part of the presentation field rather than participating in
content-driven visual transformation.

The identity field is the leading header bookend: shell logo plus BrandWidget.

### D4 — Row rhythm is compositional, not a viewport metaphor

The header provides two paired allocated-field contexts:

- `normal/tall` — the primary inner row; and
- `wrapped/short` — a following inner row when the primary row cannot contain
  the next ordered field.

`normal|wrapped` names row context; `tall|short` names block allocation. This
header deliberately pairs normal with tall and wrapped with short. They are not
device modes or Widget SPI metadata. The current header derives short usable
inner height from one compact touch-target lane and tall usable inner height
from two such lanes. Shell chrome sits outside that allocation. The shell
provides the context; a widget adapts within it and never places itself.

As available inline space contracts, the field retains ordered placement and
adds wrapped/short rows rather than requiring shell-level horizontal scrolling.

### D5 — Motion communicates only when it remains optional

Widget motion is a presentation choice, not a required transport mechanism for
meaning. A dynamic visualization must retain a comprehensible static or
reduced-motion presentation, preserve keyboard focus behavior, and avoid
repeated unsolicited assistive-technology announcements.

### D6 — Allocated fields preserve header bookends

Every ordered header widget receives an allocated field: its available inline
and block footprint together with its row context. The field guarantees
containment, order, and context; it does not prescribe a widget's numerical
measures or visual transformation.

The terminal ActionWidget is the trailing header bookend. In `normal/tall`, it
occupies the terminal field. In `wrapped/short`, its allocated field is the
entire post-gutter inner row (`inline-size: 100%`); the ActionWidget owns how
its controls use that field. Ordered header widgets remain between the leading
identity and terminal action bookends.

## 3. Intended Boundary

```text
Dashboard presentation field
├─ Header presentation region
│  ├─ Leading identity field
│  │  └─ Shell logo + BrandWidget
│  ├─ Ordered allocated header fields
│  └─ Terminal ActionWidget field
│     └─ normal/tall or wrapped/short; full inner row when wrapped
└─ Dashboard body presentation region
   └─ Larger widget-row allocations using the same placement principles
```

The dashboard is responsible for the region and fields within. Widgets are responsible for meaning
and expression presented.

## 4. Constraints And Invariants

- Preserve visual and keyboard order together.
- Do not hide meaningful information merely because the available width
  contracts.
- Do not require horizontal scrolling at the shell presentation-field level.
- Do not shrink interactive hit targets below the design language's compact
  touch target.
- Respect reduced-motion preferences and preserve a non-motion equivalent for
  dynamic presentation.
- Keep the shell independent of concrete widget implementations. Widgets must
  not import the shell.
- Reuse existing design-language tokens and feature-layer ownership before
  proposing new foundation tokens or shared controls.
- Preserve the leading identity and terminal ActionWidget bookends.
- Give a wrapped ActionWidget its entire post-gutter inner field. The shell
  must not infer whether that field is normal/tall or wrapped/short from a
  viewport or inline-width threshold alone; the ActionWidget may adapt within
  its actual allocated field.

## 5. Remaining Foundation Questions

1. When a widget contains multiple measures, should it manage its own internal
   sequence or expose measures as separate widgets?
2. What manual visual, zoom, keyboard, and reduced-motion checks become the
   enduring verification standard for dashboard widgets?

## 6. Explicitly Out Of Scope

- Dashboard body presentation implementation and widget-catalog expansion.
- Numerical allocation metadata in a Widget SPI, registry, seed, state, or
  Dashboard schema.
- A prescribed KPI, chyron, chart, or animation design.
- New shared Ui controls.

_End of Design Document_
