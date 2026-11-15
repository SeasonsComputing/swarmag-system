# Dialog Look — Brief

**Active, dispatched for ACE review 2026-11-15** (B-50); amended after that review. Recorded 2026-11-15 from a CA + AI Architect exploration
session, after the CA reviewed the Workflow Builder mockups (held on the CA's mockup canvas). The
workbench dialog's panes become tonal regions flush to the dialog; how panels work does not change.
Foundation mode: `ux/ui` and `ux/shell` are locked. The CA has ACE review it before deciding.

## Escalation: `ux/ui`, `ux/shell` (requested)

- `ux/ui`: `UiCard` gains a `tonal` elevation.
- `ux/shell/panel`, `ux/shell/workbench`: the panes use it; the workbench dialog's panes sit flush;
  the collapse rules follow.

## Current behavior

Verified against the code on 2026-11-15, with a read-only census by a delegate:

- `UiCardElevation` is `'none' | 'raised' | 'floating'` (`ux/ui/components/ui-card.tsx`), styled in
  `ui.css` by `data-ui-elevation`.
- `PanelList`, `PanelForm`, and `PanelStepflow` each render `<UiCard elevation='raised'>`: a
  translucent fill, a border, a radius, and a shadow, inside a dialog that has its own fill,
  border, radius, and shadow.
- The panel container is a grid with `--sa-rhythm-gap` between Aside and Main
  (`panel-container.css`); the dialog pads its content with `--sa-dialog-pad`.
- Collapse: at `@container (max-width: 676px)` one pane shows, chosen by `data-shell-mode`
  (`manager.css`; the same literal in `wizard.css`). Below 480px the workbench dialog is
  full-bleed with no pad.

## Target design

**Frame the window; divide its contents.** The dialog is the one framed surface. Inside it, the
panes are divided by tone, not framed.

- **A tonal card.** `UiCardElevation` gains `tonal`: a filled tone, no border, no shadow, no radius.
  The card owns its look.

  ```ts
  export type UiCardElevation = 'none' | 'raised' | 'floating' | 'tonal'
  ```

- _[Amended by the amendment "After ACE scoping", item 1: the opt-in is a prop.]_
  **Tonal panes.** In a workbench dialog, the panel kinds render `elevation='tonal'`. Each pane kind
  picks its tone: the Aside a step lighter than Main.
- _[Amended by the amendment "After ACE review", items 1 and 2: workbench dialogs only; clipping.]_
  **Flush placement.** In a workbench dialog, the panel container has no gap and the dialog does not
  pad the panes; the panes meet edge to edge and run to the dialog's edges, clipped by its radius.
  The dialog's header row keeps its own pad. Placement is the container's, not the card's.
- **Unchanged.** The dialog's title and Cancel, each pane's header and actions, the action buttons,
  the table, and the fieldsets. Panes keep their interior pad.

Both themes; the tones are tokens in `themes.css`.

## Collapse and spacing

- _[Amended by the amendment "After ACE review", item 3: exactly 660px.]_
  **The threshold** is re-solved for no gap in `manager.css` and `wizard.css` together, which stay
  equal.
- **Below 480px** the full-bleed dialog stays correct with the flush panes; nothing overflows.
- **One visible pane** reads correctly alone: its tone, no stray edge.
- **Spacing roles hold:** pad for pane interiors and the header row, no gutter.

## Governing documents to amend

Amended first, since documentation leads code:

- **ux-design-language:** tonal elevation; frame the window, divide its contents.
- **ux-components-guide:** `UiCard`'s `tonal` elevation.

## Production scope

Paths are under `source/`.

| Files                                                             | Work                                     |
| ----------------------------------------------------------------- | ---------------------------------------- |
| `ux/ui/components/ui-card.tsx`, `ux/ui/css/ui.css`, `themes.css`  | `tonal` elevation; tone tokens per theme |
| `ux/shell/panel/panel-list.*`, `panel-form.*`, `panel-stepflow.*` | tonal panes; each kind's tone            |
| `ux/shell/panel/panel-container.css`, `ux/shell/workbench/*.css`  | flush placement; collapse thresholds     |
| `front/app-style-guide/`                                          | the `tonal` card example                 |

Out of scope: how panels work; Cancel's placement; action-button variants; list rows; eyebrows;
the table head; fieldsets; the selected row (B-5); dialogs other than the workbench dialog.

_[Amended by the amendment "After ACE review", item 1: workbench dialogs only.]_
**Reach:** every Manager and Wizard. Lister sheets, if they share the panel kinds; to confirm when
scoped.

Escalate any change outside this scope.

## Acceptance

_[Amended by the amendment "After ACE review", items 1 and 2: sheets unchanged; clipping checks.]_

- A Manager and a Wizard, in both themes, show tonal panes flush to the dialog, the Aside a step
  lighter than Main.
- Collapse below the threshold shows one pane and the return as today; below 480px the dialog is
  full-bleed with nothing overflowing.
- Confirm and content dialogs are unchanged.
- CA verifies on screen in both themes, wide and collapsed.

Run `deno task check`, `deno task fmt:check`, the permitted unit suite, `guard:css`, and
STYLE_AUDIT.

## Records

- **Frames inside frames.** The shipped dialog frames every region; the eye reads the frames before
  the content. Framing once, at the window, keeps the CA's interaction and gives a contemporary
  surface.
- **Elevation, not a new axis.** Material 3's tonal elevation is elevation by tone; `UiCard`
  already has the axis, so `tonal` joins it additively.
- **Card look, container placement.** What a card looks like is the card's; that panes sit flush is
  the container's.

## Design history

- The first draft recast the whole dialog flat: one surface, a single rule between panes, Cancel
  beside Save, a filled primary action, list rows with badges, eyebrows, and fieldsets as sections.
  The CA preferred its look but parked it (P-16) because its reach was undecided and it was not
  near-term.
- A hybrid mockup then kept the CA's dialog and made only the panes tonal, without rounding or
  padding. The CA chose it as a simple tweak that keeps the interaction with a contemporary
  surface; P-16 was retired in favor of this backlog entry.
- A delegate's census of the flat draft found about four fifths reachable by CSS alone, and named
  the collapse traps this brief keeps.

## Amendment — 2026-11-15 — After ACE review

ACE's exploration review raised three points, each verified against the code. The CA settled the
first. This amendment supersedes the marked passages in Target design, Collapse and spacing,
Production scope, and Acceptance.

1. **Reach: workbench dialogs only.** Tonal panes and flush placement apply to the Manager and
   Wizard dialogs. `PanelList` is shared beyond them: Lister renders `CollectionTable → PanelList`
   in a sheet (`ux/shell/workbench/lister.tsx`), and retrieval's `DrillNavigator` renders
   `PanelList` (`front/app/shell/retrieval/drill-navigator.tsx`). Sheets and retrieval keep their
   presentation, so the panel kinds do not switch to `tonal` unconditionally; the workbench dialog
   decides. Acceptance adds: a Lister sheet and the retrieval dialog are unchanged.
2. **Clipping.** The workbench dialog is `overflow: visible` (`ui.css`); flush panes need its radius
   to clip them. Acceptance adds: focus rings at the panes' edges, each pane's scrolling, and
   floating controls (select menus, popovers) are intact under the clipping.
3. **Threshold: 660px.** With no gap the floor is the Aside's 280px plus Main's 380px. `manager.css`
   and `wizard.css` both use 660, and both are verified on either side of it.

## Amendment — 2026-11-15 — After ACE scoping

ACE's production scope follows this brief. Two points it implies are stated here, verified against
the code, so the scope's escalation boundaries read cleanly. This amendment supersedes the marked
passage in Target design and adds to Production scope.

1. **The opt-in is an additive prop.** The workbench context is a factory, not a provider
   (`ux/shell/workbench/workbench-context.ts`), so nothing reaches the panels implicitly. `PanelList`,
   `PanelForm`, and `PanelStepflow` gain an optional `elevation`, defaulting to `'raised'`;
   `CollectionTable` forwards it to `PanelList`. Manager and Wizard pass `'tonal'`; Lister and
   retrieval pass nothing and keep today's look. This shared API addition is in scope; it is not
   the "new shared abstraction" the scope's escalation boundary names.

   ```ts
   <PanelList elevation='tonal' …>          // default 'raised'
   <CollectionTable elevation='tonal' …>    // forwards to PanelList; Lister passes nothing
   ```

2. **Clipping targets the workbench size only.** `[data-ui='dialog'][data-ui-size='workbench']` is
   used only by the Managers and the Onboarding Wizard (`front/app-admin/app.tsx`), so it is the
   hook for flush placement and clipping. In `ui.css` the workbench and sheet sizes share one rule
   block, `overflow: visible` included; the clipping change splits it, so sheets are not clipped.

_End of Brief_
