# Dialog Look — Brief

**Active, not dispatched** (B-50). Selected 2026-11-15 for ACE review. Recorded 2026-11-15 from a CA + AI Architect exploration
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

- **Tonal panes.** In a workbench dialog, the panel kinds render `elevation='tonal'`. Each pane kind
  picks its tone: the Aside a step lighter than Main.
- **Flush placement.** In a workbench dialog, the panel container has no gap and the dialog does not
  pad the panes; the panes meet edge to edge and run to the dialog's edges, clipped by its radius.
  The dialog's header row keeps its own pad. Placement is the container's, not the card's.
- **Unchanged.** The dialog's title and Cancel, each pane's header and actions, the action buttons,
  the table, and the fieldsets. Panes keep their interior pad.

Both themes; the tones are tokens in `themes.css`.

## Collapse and spacing

- **The threshold** is re-solved for no gap in `manager.css` and `wizard.css` together, which stay
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

**Reach:** every Manager and Wizard. Lister sheets, if they share the panel kinds; to confirm when
scoped.

Escalate any change outside this scope.

## Acceptance

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

_End of Brief_
