# Attachment Look and Feel — Brief

**Active, 2026-11-10; for the AI Coding Engine's review.** Backlog B-43. The look of the notes
editor's two tables, its tabs, its file picker, and its dialogs, settled by the CA. Foundation
mode: it adds `UiText.size` and `CollectionPanel.renderLabel` to
`ux/`, locked since 2026-10-21, and the CA authorized that crossing in conversation on 2026-11-10
(EFFORT §8).

## What triggered it

Acceptance of the attachments brief (`effort/completed/2026-11-09-attachments-brief.md`) found the
attachment list unfinished. The picker is the browser's own "Choose Files" control, each row's icon
follows its name inside a ringed button, and a size reads as raw bytes ("38508 bytes"). The notes
table marks a note with attachments by a 📎 typed into its label, so the emoji also appears in its
breadcrumb and its "Delete …" name.

## Decisions

1. **One look for both tables.** The notes table looks like the attachments table: a leading icon
   and the text, wrapping, with these colors.

   | Row state             | Text                  | Icon                 |
   | --------------------- | --------------------- | -------------------- |
   | Rest                  | `--sa-text-secondary` | `--sa-text-primary`  |
   | Hover, keyboard focus | `--sa-text-primary`   | `--sa-color-primary` |

2. **`LabelCell`** in `front/app/shell/table-cells.tsx`, with its CSS beside it, is that look: cell
   content, not a cell, so it serves the attachments table's own cells and `CollectionPanel`'s. Its
   colors follow the interactive row it sits in, not a feature attribute. It stays in
   `front/app/shell/` until a table outside the notes editor wants it.

   ```tsx
   export type LabelCellProps = { text: string; icon?: string; iconLabel?: string }
   export const LabelCell = (props: LabelCellProps): UiComponent
   ```

3. **The icon draws as `StatusBadge`'s does** (`front/app/shell/status-badge.tsx`): an element
   carrying `data-ui-icon`, which `icons.css` binds to `--sa-icon`, masked in `currentColor` by
   `LabelCell`'s own CSS, so its row sets its color. No `url()` path reaches into `ux/ui/icons/`. A
   labelled icon is `role='img'` with that name; an unlabelled one is hidden from assistive
   technology.

4. **`CollectionPanel.renderLabel`**, optional, renders an Item's visible cell. `label` still names
   the Item in breadcrumbs and actions, and a panel without `renderLabel` is unchanged.

   ```tsx
   renderLabel?: (item: T, index: number) => UiComponent
   ```

5. **Icons.** A note with attachments shows `link-2`, labelled "Has attachments"; the 📎 leaves its
   label. An attachment shows its kind: `photo` `image`, `map` `globe`, `document` `file-text`, and
   `video` `file` until video arrives, in a table keyed by `AttachmentKind` so a new kind does not
   compile without an icon. `link-2` replaces the paperclip the 10-29 design settled for the notes
   list (`effort/completed/2026-10-29-attachments-brief.md`): the catalog has none, and none is
   added.

6. _[Revised by the amendment "After production review", item 2.]_ **`UiText.size(bytes)`** joins `UiText` beside `relativeTime`: a byte count the way a person
   reads it, in the largest unit that keeps it at one or more, steps of 1,000, one decimal under 10
   and whole numbers above. The units are its own (`KB`, `MB`, `GB`), not `Intl`'s; the number is
   formatted for the locale.

   | Size          | Text   |
   | ------------- | ------ |
   | < 1,000 bytes | < 1 KB |
   | < 1 MB        | 38 KB  |
   | < 10 MB       | 2.4 MB |
   | < 1 GB        | 156 MB |
   | ≥ 1 GB        | 1.2 GB |

7. **Tabs** spread across the bar: `UiTabList layout='between'`.
8. _[Revised by the amendment "After production review", item 1.]_ **The Attachments tab** holds the attachments table in a fieldset. Above it, left-aligned, an
   **Add Attachment (+)** action expands the file picker beneath it on click; the picker is not
   shown until then.
9. **Row activation is guarded:** while files are attaching, activating a row does nothing, as the
   open button it replaces was disabled then.
10. **The Rename and Remove dialogs lay out their content in `UiLayout`,** as `workbench-discard`
    does and the components guide's `UiDialog` example shows. Today their heading, field, and
    actions sit directly in `UiDialog` with no spacing between them. Rename's Save is
    `variant='primary'`, the main action (components guide, `UiButton`); today it has no variant
    and reads as a second Cancel. Rename is a form, so it takes `size='panel'`, the guide's size
    for form panels; `content` is for confirmations, and Remove keeps it.

## Production scope

The AI Architect writes the documentation first; the AI Coding Engine writes the code.

| Where                                                  | Change                                                                                 |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| `documentation/ux/ux-components-guide.md`              | `UiText.size`                                                                          |
| `documentation/architecture/architecture-front.md`     | _[Revised by the amendment "Documentation placement".]_ §2, §10.1.2: `table-cells.tsx` |
| `source/ux/ui/components/ui-helpers.ts`                | `UiText.size`                                                                          |
| `source/ux/shell/panel/collection-panel.tsx`           | `renderLabel`                                                                          |
| `source/front/app/shell/table-cells.tsx`, `.css` (new) | `LabelCell`                                                                            |
| `source/front/app/shell/notes-editor.tsx`, `.css`      | Tabs, `renderLabel`, no emoji                                                          |
| `source/front/app/shell/attachment-list.tsx`           | `LabelCell`, `UiText.size`, the fieldset and Add Attachment, the dialogs               |
| `source/tests/`                                        | _[Revised by the amendment "After production review", item 3.]_ `UiText.size`          |

**Unchanged:** `PanelRowIdentity`, `UiActionButton`, `UiTableRow`, `StatusBadge`, every other
table and `CollectionPanel` consumer, the icon catalog and `ui.css`, storage and saves, `domain/`,
`core/`, `back/`.

## Checks

`deno task check`, `deno task fmt:check`, `deno task test` (the two stage-environment tests
excluded); `STYLE_AUDIT`. The CA accepts in Admin: both tables at rest, hovered, and focused; long
names wrapping; a note with and without attachments; Add Attachment opening the picker; sizes;
rename and remove not opening the row; the Rename and Remove dialogs; both themes.

## Amendment — 2026-11-10 — Documentation placement

1. **The look is not architecture.** Its colors and glyphs live in this brief and the code's
   headers. Architecture-front records only that `table-cells.tsx` joins the `shell/` trees of §2
   and §10.1.2. The `NotesEditor` paragraph, which sat in §10.1.5 (workbench steps), moves to
   §10.1.2 beside the tier that holds it, and its sentence on the Customer Billing step moves to
   the Customer steps bullet. Both moves were made with the AI Architect's documentation changes.

## Amendment — 2026-11-10 — After production review

1. **The icon leads:** the action reads **(+) Add Attachment**, its icon on the left, as
   `CollectionPanel`'s New action does.
2. **Sizes drop `.0` and snap near a whole number.** The unit and its decimals are decided on the
   rounded value, so a size just under a step reads as the next unit: 999,999 bytes is `1 MB`.
   Under 10, a size keeps up to one decimal, but a fraction under .1 or over .9 rounds to the whole
   number, and a whole number shows no `.0`: `1 MB`, `1.5 MB`, and `2 MB` for 1.95 MB.
3. **No component-rendering tests.** A test that rendered `LabelCell` and `CollectionPanel` through
   a Vite server inside Deno failed under the test task's permissions and was a new harness, which
   this brief does not authorize. It was removed; `LabelCell`'s labelling and `renderLabel`'s
   default are covered by the CA's acceptance. A test that patched `Number.prototype` was removed
   too; the remaining size test checks locale formatting through `toLocaleString`.

## Design history

- **2026-11-10, no `UiIcon`.** A `UiIcon` control in `ux/ui` was considered, on the belief that
  `front/` could not draw a catalog glyph without `url()` paths into `ux/ui/icons/`. Four elements
  already draw one through `data-ui-icon` and `var(--sa-icon)`, `StatusBadge` among them in
  `front/app/shell/`, so `LabelCell` follows it. Four hand-rolled copies may one day justify a
  catalog control; that is a question of its own.
- **2026-11-10, no `PanelRowLabel`.** A label component in `ux/shell/panel/` was considered: a
  second row treatment beside `PanelRowIdentity`, used by the notes editor alone. It is
  `LabelCell` in `front/app/shell/` instead, until another table wants it.
