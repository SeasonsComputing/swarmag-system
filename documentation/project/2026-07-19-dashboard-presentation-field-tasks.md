# Dashboard Presentation Field — Header Task List

**Date:** 2026-07-19
**Mode:** Foundation
**Status:** IN PROGRESS — Foundation decisions ratified and Groups A–B
authorized by the Chief Architect.
**Source design:** `documentation/project/2026-07-19-dashboard-presentation-field-design.md`,
`documentation/architecture/architecture-front.md` (§10.3)

The Dashboard header is the highest-priority presentation region. It presents
shell identity and an ordered field of widgets with responsive flow. The header
does not require horizontal scrolling. This list constructs that region only;
body presentation regions follow as a separately authorized scope.

## Phase 0 — Foundation Decision Gate

- [x] **D1 — Header bookends:** the leading identity field combines the
      shell-owned logo and BrandWidget; the terminal ActionWidget is the
      trailing bookend. Composition and order retain the Widget SPI direction:
      the shell imports neither concrete widget.
- [x] **D2 — Header allocation behavior:** the field provides paired
      `normal/tall` and `wrapped/short` allocated-field contexts without
      declared allocation metadata. Widget sizing remains implementation-local;
      a wrapped ActionWidget receives the entire post-gutter inner row. No
      Dashboard schema, seed, state, registry, or Widget SPI allocation metadata
      is added.
- [x] Groups A–B production authorization received.

## Group A — Header Presentation Field (Foundation)

- [x] `source/front/ux/shell/dashboard.tsx` — render the shell identity anchor
      and ordered allocated header fields as semantic dashboard structure. DOM
      order, keyboard order, and visual order remain aligned.
- [x] `source/front/ux/shell/dashboard.css` — compose the header as a
      responsive field using the design-language rhythm, touch-target, focus,
      and motion contracts. It provides `normal/tall` primary and
      `wrapped/short` following fields, with no shell-level horizontal
      scrolling. Short provides one compact touch-target lane of usable inner
      height; tall provides two, excluding shell chrome.
- [x] Header containment preserves meaningful content and visible focus.
      Widgets receive their available fields without a shell-imposed fixed
      compact or landscape width or height.
- [x] The header remains the densest, highest-priority Dashboard region; the
      identity and ActionWidget remain leading and terminal bookends.

## Group B — Header Widget Presentation (Foundation)

- [x] `source/front/ux/widgets/brand-widget.tsx` and
      `source/front/ux/widgets/brand-widget.css` — express product and
      application identity within the ratified header composition.
- [x] `source/front/ux/widgets/action-widget.tsx` and
      `source/front/ux/widgets/action-widget.css` — express ordered route
      actions within their allocated field while preserving meaningful labels,
      compact touch targets, visible focus, and wrap-safe content. Actions are
      compact and trailing in `normal/tall`; they own the full inner field in
      `wrapped/short`.
- [x] `compact` and `landscape` remain widget presentation shapes. Each widget
      owns how its configured shape expresses meaning within its footprint;
      neither shape encodes shell geometry.
- [x] No widget imports the shell; no shell file imports a concrete widget.

## Group C — Verification And Close

- [x] `deno task fmt`, `deno task check`, and applicable dashboard tests pass.
- [x] Manual visual checks at narrow and wide application widths, including
      browser zoom and long product, application, and action labels.
- [?] At every normal/tall fit boundary, Actions remains an intact trailing
  group; immediately below it, the entire ActionWidget receives a
  wrapped/short, full-width inner field. Neither state distributes Actions
  through a partial remainder or leaves gratuitous negative space.
- [?] Keyboard check confirms ordered Tab traversal and visible focus across
  identity and header widgets.
- [?] Reduced-motion check confirms the header and its widgets retain a
  comprehensible static presentation.
- [x] Header has no shell-level horizontal scroll and does not hide meaningful
      information when it flows.
- [x] Chief Architect visual review; ledger records files, checks, and commit.

## Explicitly Out Of Scope

- `source/front/ux/stores/dashboard-state.ts`
- `source/front/ux/views/dashboard-views.ts`
- `source/front/ux/widgets/widget.tsx` and the Widget SPI contract
- `source/front/app-{admin|ops|customer}/dashboard-*.json`
- Dashboard body presentation regions and widget catalog implementation
- Design-language tokens, shared Ui controls, guards, persistence, and tests
  beyond checks required to verify the authorized header work
- A numerical dashboard allocation schema, metadata contract, or final
  footprint API

---

_End of Task List_
