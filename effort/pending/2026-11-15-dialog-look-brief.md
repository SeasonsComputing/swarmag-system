# Dialog Look — Brief

**Backlog, not dispatched.** Recorded 2026-11-15 from a CA + AI Architect exploration session, after
the CA reviewed the Workflow Builder mockup's dialogs (the Question library and a recast User
Manager, held on the CA's mockup canvas). A look-and-feel change to the workbench dialog. At its
foundation it is a `ux/ui` change: the dialog surface, the action button, the table head, and the
fieldset are design-language controls. Foundation mode; `ux/` is locked. Not part of M-7.

## Escalation: `ux/ui`, `ux/shell` (requested)

- `ux/ui/css/ui.css`, `themes.css`: the dialog surface, a primary action button, the table head, the
  fieldset as a section.
- `ux/ui/components/ui-action-button.tsx`: a `primary` variant, if taken (Open 3).
- `ux/shell/panel`, `ux/shell/workbench`: the split, the selected row, and the collapse rules that
  follow from them.

Panels keep working as they do: the same slots, the same Manager behavior, the same collapse.

## Current behavior

Verified against the code on 2026-11-15, with a read-only census by a delegate:

- **Dialog:** `[data-ui='dialog']` has the `--sa-bg-control` background, `--sa-shadow-card`, and
  `--sa-dialog-pad` (`ui.css`). The deep shadow and inset top highlight already exist.
- **Panes:** the panel container is a grid with `--sa-rhythm-gap` between Aside and Main
  (`panel-container.css`). Each pane is a raised `UiCard` (`PanelList`, `PanelForm`).
- **Headings:** three tiers. The container header's title ("User Manager") and Cancel; each pane's
  title ("Users" with New; "New User" with Save); fieldset legends.
- **Actions:** `UiActionButton` is a label, a divider, and a ringed icon. Variants are `default` and
  `danger`; there is no primary.
- **Collection:** a table whose head is the brand gradient (`--sa-table-bg-head`). Row identity is
  title, subtitle, annotation; status and actions are columns. No row is marked selected:
  `CollectionTable` is not told which Item is open.
- **Form:** bordered fieldsets with teal legends.
- **Collapse:** at `@container (max-width: 676px)` one pane shows, chosen by `data-shell-mode`
  (`manager.css`; the same literal in `wizard.css`). Below 480px the workbench dialog goes
  full-bleed with no pad.

## Target design

As the mockup draws it:

1. **One surface.** The dialog is the only raised surface: the popup tone (`--sa-bg-popup`), its
   existing shadow and highlight. The panes are regions of it, not cards; they keep the pane
   interior pad.
2. **The split.** The Aside is tinted and meets Main at a single 1px rule. No gap between panes.
   The tint reaches the dialog's edges.
3. **The header line.** One header per pane. The container's title reads as an eyebrow, small and
   uppercase, above the pane's title. Save shares Main's title line, as it does today.
4. **Actions.** A filled primary for the commit (Save, or a caller's action such as Add), a quiet outline for Cancel, an
   outlined tint for New.
5. **The Collection.** A quiet table head, not the gradient. The open Item's row is marked: tint and
   one outline.
6. **Form sections.** A fieldset reads as a section: a small uppercase teal legend, no box, a
   hairline between sections.

Both themes, from existing tokens.

## Collapse and spacing

The look changes; the behavior does not.

- **The rule** between panes exists only above the threshold; a single visible pane shows no edge.
- **The threshold** is re-solved for no gap (about 660px) in `manager.css` and `wizard.css`
  together, or left conservative. Either way the two stay equal.
- **Edge bleed** resets below 480px, where the dialog has no pad.
- **Spacing roles hold:** pad for the dialog and pane interiors, gap between sections, no gutter.
  `--sa-dialog-pad` also enters dialog sizing; it is used as it is, not replaced.

## Governing documents to amend

Amended first, since documentation leads code:

- **ux-design-language:** the dialog as one surface; fieldset as section; the primary action.
- **ux-components-guide:** `UiActionButton` (a primary variant, if taken), `UiFieldset`, `UiTable`
  head, the dialog.

## Production scope

To be drawn when the brief is chosen; the census below sets its reach.

- `ux/ui/css/ui.css`, `themes.css`; `ux/ui/components/ui-action-button.tsx` (Open 3).
- `ux/shell/panel/panel-container.css`, `panel-list.css`, `panel-form.css`.
- `ux/shell/workbench/manager.css`, `wizard.css`, `collection-table.tsx`, `manager.tsx`.
- `front/app-style-guide/`: the examples follow the controls.
- `tests/cases/…`: the selected-row marker.

**Reach.** A change at the `ux/ui` level reaches every consumer: the Wizard, the Lister and sheets,
CollectionPanel and the notes and attachments editors (fieldsets), the confirm and content dialogs,
and the style guide. Each target point is decided at the design-language level or scoped to the
Manager (Open 1).

## Acceptance

- The User Manager, in both themes, matches the mockup's points 1–6.
- Collapse below the threshold shows one pane, no stray rule, and the return as today; below 480px
  the dialog is full-bleed with nothing overflowing.
- The open Item's row is marked.
- The Wizard, the Lister, and the confirm dialog look as intended under whatever reach Open 1 sets.
- CA verifies on screen.

Run `deno task check`, `deno task fmt:check`, the permitted unit suite, `guard:css`, and
STYLE_AUDIT.

## Open

1. **Reach.** The design language for every dialog, panel, fieldset, and table head; or the Manager
   only, by scoped rules. The mockup is the Manager's.
2. **Cancel.** It stays in the container header, restyled as the quiet outline; or it joins Save on
   Main's title line, which also needs a Cancel in the Aside header for the collapsed list view,
   where Main is hidden. The first keeps collapse untouched.
3. **Primary action.** A `primary` variant on `UiActionButton`, additive; or scoped CSS over the
   default variant.
4. **Pane eyebrows.** Nothing supplies one per pane today; the container's title can become the
   eyebrow in place. Whether a per-pane eyebrow is wanted.
5. **Status on the row.** The mockup puts the Active badge on the row's second line. In the table it
   is its own column; moving it means each Manager's provider supplies it in the row identity.

## Records

- **A `ux/ui` change at its foundation.** The surface, the action, the table head, and the fieldset
  are design-language controls; the Manager is where the look was first seen, not where it belongs.
- **Most of it is styling.** The delegate's census found about four fifths reachable by CSS and
  tokens alone; the structural pieces are the selected-row marker, Cancel's placement, per-pane
  eyebrows, and status on the row.
- **The selected row is a real gap.** The open Item is not marked today, whatever the look.

## Design history

- The mockup's first dialog was the Question library opened to pick; the CA preferred it to the
  shipped Manager, and the User Manager was recast in it for comparison.

_End of Brief_
