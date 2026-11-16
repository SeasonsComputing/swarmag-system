# Look and Feel Pass — Brief

**Active, not dispatched.** Recorded 2026-11-15 from a CA + AI Architect session. After the tonal
workbench panes shipped (`effort/completed/2026-11-15-dialog-look-brief.md`), the CA and AI
Architect reworked the suite's look in look-and-feel mode: hacked fast, committed as it settled.
This brief records what shipped, the rules it settled, and the clean-up that makes it right.
Foundation mode: `ux/ui` and `ux/shell` are locked; the CA directed each change.

## What shipped

No checks were run on any of these commits.

| Commit    | Change                                                                                  |
| --------- | --------------------------------------------------------------------------------------- |
| `e912128` | `UiFieldset` unframed variant; `PanelSections`; step editors retrofitted; workbench tones |
| `585d2a3` | Docs: sections in the design language, archetypes, components guide, internals          |
| `cf0016a` | Every form puts its sections in `PanelSections`                                          |
| `e1b57ca` | Sections are the fieldset default (`variant='framed'` opts in); frameless action buttons; Helm commands are `UiActionButton`s; sheets dark tonal; Library toolbar pad; header divider |
| `63ef388` | Style guide: Typography and HTML sections spaced loosely                                 |
| `22d5f62` | Status pills lead the row; `StatusBadge` names the status; selects fit their choices; `DrillDown` axis; header title holds its height |

## Settled rules

1. **Frame the window; divide its contents.** A window is framed; inside it, regions divide by
   tone and sections by a rule. A frame marks a separate thing, not a group.
2. **Sections are the default.** A `UiFieldset` is a section: no box, a small uppercase legend.
   `variant='framed'` is for a group inside a section. Every form's sections sit in
   `PanelSections`, which draws the rule between them.
3. **An action is a glyph, a bar, and a label.** `UiActionButton` draws no ring; the bar sits
   midway between glyph and label; the glyph rests in the label's color and turns primary under
   the pointer. **A control set among data wears a ring,** declared by its caller as
   `decoration='ring'`: a table's row actions, and a button beside an input (UrlField's Open,
   a Site's GPS).
4. **The pill leads the row.** A row's status pill sits left of its title in `PanelRowIdentity`,
   and names the status in words; status columns are gone.
5. **A select fits its choices,** at least `--sa-size-wrap` wide and never wider than its field.
6. **Explicit and obvious.** Behavior is declared where a component is used, never inferred from
   where it sits: `DrillDown` takes `axis='block' | 'inline'` and its motion follows. Form drills
   are block; list drills (`DrillNavigator`) are inline, and load before they open.
7. **A header title holds its height,** so a Back command shifts it right, never down.

## Clean-up scope

The CA and the AI Architect do this work directly; ACE is not available for it. Paths are under
`source/`.

1. **Documentation leads the code it now trails:**
   - ux-components-guide: `UiActionButton` (the glyph, bar, and label; `decoration='ring'`),
     `UiSingleSelect` (fits its choices), and the shell's `PanelRowIdentity` `pill` and `DrillDown`
     `axis`, wherever the shell's components are described.
   - ux-design-language §4.6: the action rule and the ring for controls among data.
   - ux-components-internals: anything the catalog lists for the action-button frame and select.
2. **The action-button ring is declared.** Done: `UiActionButton` takes `decoration='ring'`
   (`data-ui-decoration`, already on `guard-css`'s list); the table-cell context rule is gone; the
   Manager's row actions, `CollectionPanel`'s Delete, the attachment list's Rename and Remove,
   UrlField's Open, and the Sites GPS button declare it. The frame part stays in the markup as the
   touch box.
3. **`HelmButton`** (`ux/widgets/helm-button.tsx`) is unused since Helm commands became
   `UiActionButton`s; remove it and its CSS rules that only it consumed. `HelmButtonGlyph` stays
   for popover triggers.
4. **Sheets:** `Lister` hard-codes `variant='tonal-dark'`; `DrillNavigator` takes a `variant`. Make
   the sheet's tone one stated choice, documented with §4.6.
5. **Redundant CSS:** `front/app-admin/customers/customer-step-detail.css`'s
   `customer-account-manager` width rules, now that selects fit their choices.
6. **Comments** carry design reasons, not session notes; sweep today's CSS for any that do not.

Out of scope: new looks; the overlay-trigger brief (B-6), which is what lets the Helm's menu
triggers become `UiActionButton`s too.

## Acceptance

- Every rule above is in the governing documents, and the code matches them.
- `HelmButton` and the redundant CSS are gone; no consumer changes appearance.
- CA verifies on screen in both themes, wide and collapsed.

Run `deno task check`, `deno task fmt:check`, the permitted unit suite, `guard:css`, and
STYLE_AUDIT.

## Outside this brief

CA decisions on governance and DevOps, not in ACE's scope:

1. **CONVENTIONS:** a `PanelSections` entry beside `DrillDown` and `CollectionPanel`.
2. **`dprint`:** exclude `effort/completed/`; formatting keeps adding a line the
   completed-immutable guard refuses.

_End of Brief_
