# Dashboard Presentation Field — Design Notes

**Date:** 2026-07-19
**Mode:** Foundation
**Status:** DRAFT — captures Chief Architect / AI exploration; not implementation authorization.
**Related:** `documentation/architecture/architecture-front.md` §10.3,
`documentation/ux/ux-design-language.md`,
`documentation/project/2026-07-18-foundation-game-plan-design.md`

---

## 1. Framing

The Dashboard is a responsive presentation field, not a fixed header followed
by unrelated widget rows. The header is its densest, highest-priority region;
the body continues the same placement and presentation model at larger scale.

This direction exists to make dashboard composition durable as the widget
catalog grows. It must not prescribe a catalog of widget visualizations.

## 2. Design Direction

### D1 — The shell provides a presentation field

The shell owns spatial responsibility only:

- placement and ordered reading/focus order;
- row rhythm, available footprint, containment, and expansion;
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

### D3 — Identity is the intentional exception

The dashboard logo and brand are shell identity, not ordinary dashboard
content. They remain legible, stable, and non-wrapping. They anchor the
highest-priority part of the presentation field rather than participating in
content-driven visual transformation.

### D4 — Row rhythm is compositional, not a viewport metaphor

The header can provide short and tall allocations. Wide presentations may use
both heights without wrapping. As available space contracts, widgets may first
change their own presentation; when that is insufficient, the field adds short
rows while retaining ordered placement.

Literal dimensions are implementation details. The architectural concept is a
small set of meaningful presentation allocations, not a collection of device
breakpoints.

### D5 — Motion communicates only when it remains optional

Widget motion is a presentation choice, not a required transport mechanism for
meaning. A dynamic visualization must retain a comprehensible static or
reduced-motion presentation, preserve keyboard focus behavior, and avoid
repeated unsolicited assistive-technology announcements.

## 3. Intended Boundary

```text
Dashboard presentation field
├─ Shell identity anchor
│  └─ Logo + BrandWidget
├─ Header presentation region
│  └─ Short/tall widget allocations; grows by rows when needed
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

## 5. Open Design Questions

1. What is the smallest durable widget footprint contract: intrinsic sizing
   only, declared presentation allocations, or explicit metadata?
2. How should existing `compact` and `landscape` shape settings relate to
   header placement without conflating footprint and presentation capability?
3. Which header composition can express the field using the current dashboard
   structure without coupling the shell to concrete widget identities?
4. When a widget contains multiple measures, should it manage its own internal
   sequence or expose measures as separate widgets?
5. What manual visual, zoom, keyboard, and reduced-motion checks become the
   enduring verification standard for dashboard widgets?

## 6. Explicitly Out Of Scope

- Any Dashboard, widget, CSS, token, seed, or Widget SPI implementation.
- Amendments to `architecture-front.md` or UX governing documents.
- A final widget footprint, metadata, or placement contract.
- A prescribed KPI, chyron, chart, or animation design.
- New shared Ui controls.

_End of Design Document_
