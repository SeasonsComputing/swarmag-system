# Look and Feel Pass — Brief

**Active; items 1–3 and 5 done, items 4 and 6–8 ready for ACE.** Recorded 2026-11-15 from a CA + AI Architect session. After the tonal
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

The CA and the AI Architect did items 1–3 and 5 directly on 2026-11-15; items 4, 6, and 7 are
ACE's. Paths are
under `source/`.

1. **Documentation.** Done:
   - ux-components-guide §3.16 `UiActionButton`: glyph, bar, and label; `decoration='ring'` for an
     action among data; the touch box; the examples. §3.4 `UiSingleSelect`: fits its choices.
   - ux-design-language §4.6: actions are bare and wear a ring among data, declared by the caller;
     a sheet's single region is the dark tonal card.
   - ux-components-internals: `data-ui-decoration='ring'` on `action-button`; its intent line.
2. **The action-button ring is declared.** Done: `UiActionButton` takes `decoration='ring'`
   (`data-ui-decoration`, already on `guard-css`'s list); the table-cell context rule is gone; the
   Manager's row actions, `CollectionPanel`'s Delete, the attachment list's Rename and Remove,
   UrlField's Open, and the Sites GPS button declare it. The frame part stays in the markup as the
   touch box.
3. **Sheets.** Done: the design language states a sheet's single region is the dark tonal card;
   `Lister` (always a sheet) and the Library's `DrillNavigator` follow it.
4. **For ACE: remove `HelmButton`** (`ux/widgets/helm-button.tsx`) and the `helm-button.css` rules
   only it consumed; `HelmButtonGlyph` and its trigger rules stay for popover triggers. The browser
   test `tests/cases/bootstrap-lifecycle-test.ts` still mounts `HelmButton` as a probe (loading,
   `aria-busy`, ref forwarding, `aria-describedby`, click count, a centered glyph in a frameless
   target) and asserts the toolbar holds no `UiActionButton` — a decision this pass reversed.
   Rewrite the probe around a dense `UiActionButton`, drop that assertion, and add a plain command
   to the test toolbar so the command path, with its hover glow (`helm-widget.css`), is covered.
   Run the browser test (`-- --browser`).
5. **Redundant CSS.** Done: `front/app-admin/customers/customer-step-detail.css` keeps only the
   picker wrapper's `min-inline-size: 0`. Its layout rules are gone: the 16rem floor sits under the
   select's own `--sa-size-wrap` floor, `justify-items: stretch` no longer moves a fit-content
   select, and a fit-content layout already stays within its field. ACE verifies the Manager picker
   on screen with the checks (item 7).
6. **For ACE: comments** carry design reasons, not session notes; sweep this pass's CSS and TSX.
7. **For ACE: checks.** None of this pass's commits has been checked; run the set below and fix
   in-scope failures.

8. **For ACE: document the late changes** (`ae843cb`…`337f4a3`): cards and dialogs no longer
   blur (`backdrop-filter` was the long-standing interaction lag; header, footer, and select
   dropdown keep it); dialogs take `--sa-dialog-bg` per theme, a step from the panes they hold;
   the light theme's table and form sit on the popup surface; the site editor's sections are in
   `PanelSections`; Notes tabs hold their content without fieldsets; light `--sa-text-dim` is
   60%; the sequence rail reveals a full-rail gradient by clip, as `UiProgress` does. ux-design-language §4.6 and
   the internals token catalog (`--sa-dialog-bg`).

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

1. **CONVENTIONS §17,** which documents the shell's panel components: a `PanelSections` entry;
   `PanelRowIdentity`'s `pill` (§17.2); `DrillDown`'s `axis` (§17.5); and the header title holding
   its height when a Back command appears.
2. **`dprint`:** exclude `effort/completed/`; formatting keeps adding a line the
   completed-immutable guard refuses.

_End of Brief_
