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

- _[Amended by the amendment "Tonal is a variant", item 1: a variant with a tone, not an elevation.]_
  **A tonal card.** `UiCardElevation` gains `tonal`: a filled tone, no border, no shadow, no radius.
  The card owns its look.

  ```ts
  export type UiCardElevation = 'none' | 'raised' | 'floating' | 'tonal'
  ```

- _[Amended by the amendment "After ACE scoping", item 1: the opt-in is a prop.]_
  **Tonal panes.** In a workbench dialog, the panel kinds render `elevation='tonal'`. Each pane kind
  picks its tone: the Aside a step lighter than Main.
- _[Amended by the amendment "After ACE review", items 1 and 2: workbench dialogs only; clipping.]_
  _[Amended by the amendment "After screen review": the dialog pads the panes; they stay attached.]_
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

_[Amended by the amendment "Tonal is a variant", item 3: what each document says.]_
_[Amended by the amendment "Documentation amended", items 1–2: amended; the catalog remains.]_

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
2. _[Superseded by the amendment "After screen review": no clipping is needed.]_
   **Clipping.** The workbench dialog is `overflow: visible` (`ui.css`); flush panes need its radius
   to clip them. Acceptance adds: focus rings at the panes' edges, each pane's scrolling, and
   floating controls (select menus, popovers) are intact under the clipping.
3. **Threshold: 660px.** With no gap the floor is the Aside's 280px plus Main's 380px. `manager.css`
   and `wizard.css` both use 660, and both are verified on either side of it.

## Amendment — 2026-11-15 — After ACE scoping

ACE's production scope follows this brief. Two points it implies are stated here, verified against
the code, so the scope's escalation boundaries read cleanly. This amendment supersedes the marked
passage in Target design and adds to Production scope.

1. _[Amended by the amendment "Tonal is a variant", item 2: `variant` and `tone`, not `elevation`.]_
   **The opt-in is an additive prop.** The workbench context is a factory, not a provider
   (`ux/shell/workbench/workbench-context.ts`), so nothing reaches the panels implicitly. `PanelList`,
   `PanelForm`, and `PanelStepflow` gain an optional `elevation`, defaulting to `'raised'`;
   `CollectionTable` forwards it to `PanelList`. Manager and Wizard pass `'tonal'`; Lister and
   retrieval pass nothing and keep today's look. This shared API addition is in scope; it is not
   the "new shared abstraction" the scope's escalation boundary names.

   ```ts
   <PanelList elevation='tonal' …>          // default 'raised'
   <CollectionTable elevation='tonal' …>    // forwards to PanelList; Lister passes nothing
   ```

2. _[Superseded by the amendment "After screen review": no clipping is needed.]_
   **Clipping targets the workbench size only.** `[data-ui='dialog'][data-ui-size='workbench']` is
   used only by the Managers and the Onboarding Wizard (`front/app-admin/app.tsx`), so it is the
   hook for flush placement and clipping. In `ui.css` the workbench and sheet sizes share one rule
   block, `overflow: visible` included; the clipping change splits it, so sheets are not clipped.

## Amendment — 2026-11-15 — Tonal is a variant

_[Amended by the amendment "Tone in the variant": `variant='tonal-light' | 'tonal-dark'`, no `tone` prop.]_

The CA's direction. It supersedes the marked passages in Target design, Governing documents to
amend, and the "After ACE scoping" amendment's item 1. Existing card and panel defaults are
unchanged.

1. **`UiCard` gains a variant with a tone.** Tonal is a kind of card, not a kind of elevation:
   `variant='tonal'` with `tone='light' | 'dark'`. Tone applies only to the tonal variant; elevation
   applies only to the existing cards. `UiCardElevation` is unchanged. The props enforce this as
   alternatives, as `UiBadge`'s props require `color` exactly when `variant='color'`.

   ```ts
   <UiCard elevation='raised'>…</UiCard>             // existing cards, as today
   <UiCard variant='tonal' tone='light'>…</UiCard>   // Aside
   <UiCard variant='tonal' tone='dark'>…</UiCard>    // Main
   ```

2. **Panel opt-in and forwarding.** `PanelList`, `PanelForm`, and `PanelStepflow` gain the optional
   `variant` and `tone`, passed to their `UiCard`; without them a panel is `elevation='raised'` as
   today. `CollectionTable` forwards both to `PanelList`. Manager and Wizard pass `variant='tonal'`
   with `tone='light'` for the Aside and `tone='dark'` for Main. Lister and retrieval pass nothing.
3. **Governing documents.**
   - **ux-design-language:** defines the tonal variant; its two tones, light and dark, each owned
     by the theme; and its treatment: borderless, shadowless, square-cornered. It keeps the
     principle "frame the window; divide its contents."
   - **ux-components-guide:** documents `UiCard`'s `variant` and `tone` props. Tone applies only to
     tonal; elevation applies to the existing cards. Examples show both tonal tones.

## Amendment — 2026-11-15 — Documentation amended

_[Amended by the amendment "Tone in the variant": `variant='tonal-light' | 'tonal-dark'`, no `tone` prop.]_

The AI Architect amended the governing documents at the CA's direction, ahead of production, since
documentation leads code. They are no longer in ACE's production scope.

1. **ux-design-language §4.6 Surfaces** (new): "Frame the window; divide its contents"; the framed
   card and the tonal region; the tonal variant's two theme-owned tones, as `--sa-card-*` tokens;
   the Aside light and Main dark. §4.5's Card row adds tonal tones.
2. **ux-components-guide §4.4 UiCard:** the `variant` and `tone` props; tone only with tonal,
   elevation only with framed cards, enforced by the props; a Variant table, a Tone table, and an
   example of both tones.
3. **Remains in production:** `ux-components-internals.md` catalogs component-specified tokens; its
   Card row and the tonal tone tokens are named there when ACE creates them in `themes.css`.

## Amendment — 2026-11-15 — After screen review

The CA reviewed the production on screen beside the Library sheet: flush panes made the workbench
dialog too different from every other dialog. This amendment supersedes the marked passage in
Target design and the clipping items of the "After ACE review" and "After ACE scoping" amendments.

1. **The dialog pads the panes.** The workbench dialog keeps its `--sa-dialog-pad` on every side,
   as other dialogs do; the panes no longer run to its edges.
2. **The panes stay attached.** The panel container keeps no gap; the Aside's light tone meets
   Main's dark tone directly. Tonal cards stay square-cornered. _[Amended by the amendment
   "Rounded pair": the pair's outside corners are rounded.]_
3. **No clipping.** _[Amended by the amendment "Rounded pair": each pane clips to its own corners.]_ With the pad restored the panes do not reach the dialog's radius, so the
   workbench dialog's overflow and its rule block shared with sheets are unchanged.
4. **Unchanged:** reach (workbench dialogs only), the `variant` and `tone` props, the 660px
   threshold, and the full-bleed dialog below 480px.

## Amendment — 2026-11-15 — Rounded pair

The CA's direction to ACE with the padding change, recorded here. It amends items 2 and 3 of the
"After screen review" amendment.

1. **The attached pair rounds its outside corners** with the card radius: the Aside's start corners
   and Main's end corners. The seam between the panes stays square, and the tonal cards themselves
   stay square-cornered; the panes clip them. Collapsed to one pane, or a single-step Wizard, the
   visible pane rounds all four corners.
2. **Each pane clips to its own corners** (`overflow: hidden` on Aside and Main in a workbench). The
   dialog's overflow is unchanged. Acceptance adds: focus rings at the panes' edges are intact.

## Amendment — 2026-11-15 — After AA review

The AI Architect reviewed ACE's production under the strict scrutiny `ux/` carries. Two fixes,
each within the approved scope.

1. **Workbench rules live with the workbenches.** The attached-pair rules (gap, corners, clipping,
   the single-pane and collapsed cases) name `[data-shell='manager']` and `[data-shell='wizard']`,
   so they belong in `manager.css` and `wizard.css`, beside each workbench's 660px threshold, not
   in `panel-container.css`: a panel does not know its consumers. Each file then holds its own
   collapsed-corner rule under its own threshold, and no third `660` literal exists.
2. **Only the columns lose their gap.** `column-gap: 0` replaces `gap: 0`, so the row gap between
   the dialog's header and the panes stays. The header and accessory padding added to restore that
   spacing, including the below-480px rule, are removed.
## Amendment — 2026-11-15 — Tone in the variant

The CA's direction to ACE during production, recorded here. It supersedes the "Tonal is a variant"
amendment and the props described in the "Documentation amended" amendment.

1. **The tone is the variant's value.** `UiCard`'s `variant` is `'tonal-light' | 'tonal-dark'`; there
   is no `tone` prop. A tonal variant and `elevation` are alternatives the props enforce; without
   `variant` a card is framed, as before. The card emits its variant as `data-ui-variant`, within
   `guard-css`'s attribute set.

   ```ts
   <UiCard elevation='raised'>…</UiCard>     // framed, as today
   <UiCard variant='tonal-light'>…</UiCard>  // Aside
   <UiCard variant='tonal-dark'>…</UiCard>   // Main
   ```

2. **Panels pass `variant` only.** `PanelList`, `PanelForm`, and `PanelStepflow` take `UiCard`'s
   optional `variant`, raised without it; `CollectionTable` forwards it. Manager and Wizard pass
   `tonal-light` for the Aside and `tonal-dark` for Main.
3. **Documentation follows.** ux-design-language §4.6, ux-components-guide §4.4, and
   ux-components-internals name the two variant values; the Tone table is gone.

_End of Brief_
