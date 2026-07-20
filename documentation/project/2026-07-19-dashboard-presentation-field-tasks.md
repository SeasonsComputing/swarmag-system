# Dashboard Presentation Field — Header Task List

**Date:** 2026-07-19
**Mode:** Foundation
**Status:** PLANNED — awaiting Chief Architect ratification of the header
identity composition and group-by-group production authorization.
**Source design:** `documentation/project/2026-07-19-dashboard-presentation-field-design.md`,
`documentation/architecture/architecture-front.md` (§10.3)

The Dashboard header is the highest-priority presentation region. It presents
shell identity and an ordered field of widgets with responsive flow. The header
does not require horizontal scrolling. This list constructs that region only;
body presentation regions follow as a separately authorized scope.

## Phase 0 — Foundation Decision Gate

- [ ] **D1 — Identity composition:** ratify how the shell identity anchor
      combines the shell-owned logo and product/application brand while the
      shell remains independent of concrete widget implementations and widgets
      remain independent of the shell. The resulting composition preserves the
      Widget SPI direction and the app-owned registry/seed composition root.
- [ ] **D2 — Header allocation behavior:** ratify the short/tall allocation
      behavior used by the header field without adding a dashboard schema or
      Widget SPI allocation contract.
- [ ] Group-by-group production go orders received.

## Group A — Header Presentation Field (Foundation)

- [ ] `source/front/ux/shell/dashboard.tsx` — render the shell identity anchor
      and ordered header presentation region as semantic dashboard structure.
      DOM order, keyboard order, and visual order remain aligned.
- [ ] `source/front/ux/shell/dashboard.css` — compose the header as a
      responsive field using the design-language rhythm, touch-target, focus,
      and motion contracts. The field flows into additional rows as available
      inline space contracts; it has no shell-level horizontal scrolling.
- [ ] Header containment preserves meaningful content and visible focus.
      Widgets receive their available footprint without a shell-imposed fixed
      compact or landscape width or height.
- [ ] The header remains the densest, highest-priority Dashboard region; the
      shell identity anchor remains legible and non-wrapping.

## Group B — Header Widget Presentation (Foundation)

- [ ] `source/front/ux/widgets/brand-widget.tsx` and
      `source/front/ux/widgets/brand-widget.css` — express product and
      application identity within the ratified header composition.
- [ ] `source/front/ux/widgets/action-widget.tsx` and
      `source/front/ux/widgets/action-widget.css` — express ordered route
      actions within the allocated field while preserving meaningful labels,
      compact touch targets, visible focus, and wrap-safe content.
- [ ] `compact` and `landscape` remain widget presentation shapes. Each widget
      owns how its configured shape expresses meaning within its footprint;
      neither shape encodes shell geometry.
- [ ] No widget imports the shell; no shell file imports a concrete widget.

## Group C — Verification And Close

- [ ] `deno task fmt`, `deno task check`, and applicable dashboard tests pass.
- [ ] Manual visual checks at narrow and wide application widths, including
      browser zoom and long product, application, and action labels.
- [ ] Keyboard check confirms ordered Tab traversal and visible focus across
      identity and header widgets.
- [ ] Reduced-motion check confirms the header and its widgets retain a
      comprehensible static presentation.
- [ ] Header has no shell-level horizontal scroll and does not hide meaningful
      information when it flows.
- [ ] Chief Architect visual review; ledger records files, checks, and commit.

## Explicitly Out Of Scope

- `source/front/ux/stores/dashboard-state.ts`
- `source/front/ux/views/dashboard-views.ts`
- `source/front/ux/widgets/widget.tsx` and the Widget SPI contract
- `source/front/app-{admin|ops|customer}/dashboard-*.json`
- Dashboard body presentation regions and widget catalog implementation
- Design-language tokens, shared Ui controls, guards, persistence, and tests
  beyond checks required to verify the authorized header work
- A dashboard allocation schema, metadata contract, or final footprint API

---

_End of Task List_
