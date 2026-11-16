# Look and Feel Pass — Brief

**Completed 2026-11-15.** Shipped from `e912128` to `55d1d67` and closed at the CA's direction; see "Closure" at the end. Recorded 2026-11-15 from a CA + AI Architect session. After the tonal
workbench panes shipped (`effort/completed/2026-11/2026-11-15-dialog-look-brief.md`), the CA and AI
Architect reworked the suite's look in look-and-feel mode: hacked fast, committed as it settled.
This brief records what shipped, the rules it settled, and the clean-up that makes it right.
Foundation mode: `ux/ui` and `ux/shell` are locked; the CA directed each change.

## What shipped

No checks were run on any of these commits.

| Commit    | Change                                                                                                                                                                                |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `e912128` | `UiFieldset` unframed variant; `PanelSections`; step editors retrofitted; workbench tones                                                                                             |
| `585d2a3` | Docs: sections in the design language, archetypes, components guide, internals                                                                                                        |
| `cf0016a` | Every form puts its sections in `PanelSections`                                                                                                                                       |
| `e1b57ca` | Sections are the fieldset default (`variant='framed'` opts in); frameless action buttons; Helm commands are `UiActionButton`s; sheets dark tonal; Library toolbar pad; header divider |
| `63ef388` | Style guide: Typography and HTML sections spaced loosely                                                                                                                              |
| `22d5f62` | Status pills lead the row; `StatusBadge` names the status; selects fit their choices; `DrillDown` axis; header title holds its height                                                 |

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

The CA and the AI Architect did items 1–6 and 8 directly on 2026-11-15, ACE being unavailable;
item 7, the checks, cannot run in this session and is the CA's. Paths are
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
4. **`HelmButton` removed.** Done: `ux/widgets/helm-button.tsx` keeps only `HelmButtonGlyph` for
   popover triggers; `helm-button.css` keeps only the trigger rules. The browser test
   `tests/cases/bootstrap-lifecycle-test.ts` mounts its probe as a dense `UiActionButton`: busy and
   disabled are asserted through `data-ui-state` (the action button has no `aria-busy`), and the
   assertion that the toolbar holds no `UiActionButton` is gone. The test's toolbar still has no
   plain command, so the command path and its glow are not covered by it. Unrun.
5. **Redundant CSS.** Done: `front/app-admin/customers/customer-step-detail.css` keeps only the
   picker wrapper's `min-inline-size: 0`. Its layout rules are gone: the 16rem floor sits under the
   select's own `--sa-size-wrap` floor, `justify-items: stretch` no longer moves a fit-content
   select, and a fit-content layout already stays within its field. ACE verifies the Manager picker
   on screen with the checks (item 7).
6. **Comments.** Done: this pass's comments state the design as it is; the action-frame comment
   no longer defines itself against a ring.
7. **Checks (CA).** None of this pass's commits has been checked: run the set below, the browser
   test included (`-- --browser`), and fix in-scope failures.

8. **Late changes documented.** Done: ux-design-language §4.6 (a dialog's `--sa-dialog-bg` sits a
   step from its panes; working surfaces are opaque and backdrop blur belongs to thin chrome) and
   the `--sa-filter-blur` purpose; the Dialog token row in both catalogs; ux-components-guide
   `UiProgress` (the gradient spans the track and progress reveals it; the Sequence rail fills
   through the current Step). The site editor's sections and the Notes tabs follow existing rules
   and need no new text.

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

## Closure — 2026-11-15

The CA directed closure after reviewing the pass on screen throughout the session.

**Shipped.** The rules above, in code and in the governing documents, from `e912128` to `55d1d67`,
including the late changes of item 8.

**Verified.** `deno task check` (types, lint, every guard) and `deno task fmt:check` pass. The unit
suite, run with `--no-check`, passes 224 tests with 3 ignored — the count M-6's verification
recorded — and fails 3: `users-api-test.ts` and `session-coordinator-test.ts`, known since
2026-10-03 and waiting on stage configuration (B-34), and `library-levels-test.ts`, which since the
Library brief (`217b724`) exits early on missing configuration and has never run.

**Not done.**

- **STYLE_AUDIT** was not performed: `check` covers what the guards encode; the reading pass over
  the rest of CONVENTIONS (file headers' `PUBLIC` trees, ordering, naming, comment rules) was not
  made on this pass's files. That gap is backlog B-15's.
- **The browser test** `tests/cases/bootstrap-lifecycle-test.ts` has no recorded run, here or
  under the Helm Menus brief whose acceptance named it; the probe rewrite of item 4 is unverified.

**Settled on closing.**

- **`library-levels-test.ts`** becomes backlog B-51: a unit test that cannot run without stage
  configuration.
- **CONVENTIONS §17** and the **`dprint`** exclusion stay with the CA, as "Outside this brief"
  says.

_End of Brief_
