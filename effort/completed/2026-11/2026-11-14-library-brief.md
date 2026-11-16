# Library — Brief

**Completed 2026-11-14.** Shipped in `217b724`. Closed at the CA's direction after on-screen
acceptance; see "Closure" at the end. Not on the roadmap: chosen directly at the CA's direction. Feature mode inside established architecture; no locked namespace changes. It builds
into the tree the Shell Namespaces brief established (`608a3a4`).
The documents are already amended (Governing documents).

## Purpose and dependencies

The Library is a place in Admin: one sheet that launches the catalog managers and browses the
Library's documents. Today the four catalog managers are items in the Helm's Administration menu,
and Library documents are reachable only through the Field Binder's Library picker. The Library
gives both one home, and the drill-down picker machinery becomes a suite-tier family that the
Library and the Field Binder share.

Dependencies:

- `effort/completed/2026-11-14-shell-namespaces-brief.md`: the `front/app/shell/` namespaces, in
  particular `retrieval/`, which this brief populates.
- Architecture-front §7.2.4 Document Storage and §10.1.2; UX design archetypes §6 (the Drill row);
  CONVENTIONS §4.4 (the names).

## Current behavior

Verified against the code on 2026-11-14:

- `FieldBinderPicker` (`front/app-admin/field-binder/field-binder-picker.tsx`) is a trigger
  button and a sheet dialog in one: `UiActionButton`, then `UiDialog size='sheet'` → `PanelSheet` →
  `PanelList` with a back-path header → `DrillDown` → one `PickerTable` per level. It exports
  `PickerLevel` (`column`, `detail?`, `empty`, `load`), `PickerRow`, `PickerRowBase` (`label`,
  `detail?`), `PickerBranch` (`open`), and `PickerLeaf` (`choose`). Choosing a leaf closes the
  dialog, then runs the leaf's `choose`. Its stylesheet styles `data-app='field-binder-drill-mark'`.
- `FieldBinderLibraryPicker` (`field-binder-library-picker.tsx`) declares three levels: topics
  (`LIBRARY_TOPICS`), a topic's records (`libraryRecords`: `listAll` over `api.Chemicals`,
  `api.Assets`, `api.Services`, labelled by `TOPIC_ITEMS` and sorted), and a record's documents
  (its notes' attachments, detail = kind). Choosing calls `onChoose(attachment.filename,
  report => api.Attachments.file(attachment, report), { topic, id })`.
- `FieldBinderChemicalPicker` (`field-binder-chemical-picker.tsx`) declares two levels: chemicals,
  then a chemical's SDS and label links. Choosing hands back a `ChemicalDocument`.
- `field-binder-step-detail.tsx` hosts both pickers in its Source toggle.
- Admin's Helm (`front/app-admin/dashboard-admin.json`) has toolbar items Users, Onboarding,
  `@theme`, `@tasks`, the Field Binder menu, and the Administration menu: About, Customers, Asset
  Types, Assets, Chemicals, Services, Logout.
- `front/app-admin/app.tsx` routes `/asset-types`, `/assets`, `/chemicals`, `/services` with
  `Routes.workbench`. Every overlay closes to `/` (`ShellOverlayRoute`, parking lot P-15).
- An attachment opens in a secondary window through
  `UiWindow.openResolved(async () => (await api.Attachments.link(attachment)).url, message)`, as
  `AttachmentList` does.
- `useShellNavigate()` (`@ux/shell/runtime/use-shell-navigate.ts`) returns `redirect(path)`.

## Target design

### The Drill family (`front/app/shell/retrieval/`)

```typescript
// drill-navigator.tsx — navigation over levels; no dialog
export type DrillLevel = {
  column: string
  detail?: string
  empty: string
  load: () => Promise<readonly DrillRow[]>
}
export type DrillRowBase = { label: string; detail?: string }
export type DrillBranch = DrillRowBase & { open: () => DrillLevel }
export type DrillLeaf = DrillRowBase & { choose: () => void }
export type DrillRow = DrillBranch | DrillLeaf

export type DrillNavigatorProps = {
  title: string
  root: DrillLevel
  onChoose?: () => void // runs when a leaf is chosen, before the leaf's own choose
}
export const DrillNavigator = (props: DrillNavigatorProps): UiComponent

// drill-dialog.tsx — a trigger and a sheet around a DrillNavigator
export type DrillDialogProps = {
  label: string
  title: string
  disabled: boolean
  name: string
  error: boolean
  root: DrillLevel
}
export const DrillDialog = (props: DrillDialogProps): UiComponent
```

- `DrillNavigator` is the old picker's `PanelList`, back-path header, `DrillDown`, and level table,
  unchanged in behavior. Its drill mark is `<UiIcon name='chevron-right' data-app='drill-mark' />`
  (components guide §4.8); `drill-navigator.css` only colors it, with `--sa-text-secondary`. No
  mask rule is written.
- `DrillDialog` is the old picker's trigger and sheet. It passes its own close as `onChoose`, so
  choosing a leaf closes the dialog, then runs the leaf, as today.
- The types are the old `Picker*` types renamed; their shapes do not change.

### `LibraryLevels` (`front/app/shell/retrieval/library-levels.ts`)

```typescript
export const LibraryLevels = {
  root: (onDocument: (attachment: Attachment, record: { topic: LibraryTopic; id: Id }) => void): DrillLevel
}
```

- It is the old Library picker's three levels: topics, a topic's records, a record's documents,
  with the same columns, labels, ordering, and empty text. `TOPIC_ITEMS`, the record loading, and
  the per-level builders are module-private.
- The leaf's meaning is the caller's: `onDocument` receives the attachment and its record.

### `LibraryDialog` (`front/app-admin/library/library-dialog.tsx`)

```typescript
export type LibraryDialogProps = { onCancel: () => void }
export const LibraryDialog = (props: LibraryDialogProps): UiComponent

<PanelSheet title='Library' onCancel={props.onCancel}>
  {/* launcher row: Asset Types · Assets · Chemicals · Services */}
  <DrillNavigator title='Documents' root={LibraryLevels.root(open)} />
</PanelSheet>
```

- _[Amended by the amendment "At scope review", item 1: the row is a `cluster-wrap` layout.]_
  **Launchers.** One row of `UiActionButton`s with visible labels, at the top of the content, in
  the order Asset Types, Assets, Chemicals, Services, with the icons `layers`, `cube`, `opacity`,
  and `target`, chosen by the CA. Each calls `redirect` from `useShellNavigate()` with its
  manager's route.
- **Documents.** Activating a document opens it in a secondary window through
  `UiWindow.openResolved` and `api.Attachments.link`, with the message
  "Allow a secondary window to open this document." The sheet stays open.
- **Known limit.** Closing a manager opened from the Library returns to the dashboard, not to the
  Library (P-15). This brief does not change it.

### Field Binder dialogs (`front/app-admin/field-binder/`)

| From                                   | To                                     |
| -------------------------------------- | -------------------------------------- |
| `field-binder-picker.tsx`, `.css`      | removed; now the Drill family          |
| `field-binder-library-picker.tsx`      | `field-binder-library-dialog.tsx`      |
| `FieldBinderLibraryPicker`, its props  | `FieldBinderLibraryDialog`, its props  |
| `field-binder-chemical-picker.tsx`     | `field-binder-chemical-dialog.tsx`     |
| `FieldBinderChemicalPicker`, its props | `FieldBinderChemicalDialog`, its props |

- `FieldBinderLibraryDialog` renders `DrillDialog` over `LibraryLevels.root(...)`, whose
  `onDocument` calls `onChoose(attachment.filename, report => api.Attachments.file(attachment,
  report), record)`. Its props and labels do not change.
- `FieldBinderChemicalDialog` keeps its own two levels, now typed `DrillLevel`, over
  `DrillDialog`. Its props, `ChemicalDocument`, and labels do not change.
- `field-binder-step-detail.tsx` changes only its imports and element names.

### Routes and Helm (`front/app-admin/`)

- `app.tsx` adds `Routes.sheet('/library', LibraryDialog)`.
- `dashboard-admin.json` adds a toolbar command after Onboarding:
  `{ "command": "/library", "label": "Library", "icon": "archive" }`. The Administration menu
  drops Asset Types, Assets, Chemicals, and Services; About, Customers, and Logout stay.

## Decisions

- **The Library is a place, not a picker.** It launches the catalog managers and browses their
  documents; the Binder's chooser is a second consumer of the same levels.
- **The navigator is the shared piece, not the dialog.** The Library route is already a sheet;
  reusing the old picker whole would open a dialog inside a dialog. So the old picker splits into
  `DrillNavigator` (navigation) and `DrillDialog` (trigger and sheet).
- **Suite tier.** The Drill family and `LibraryLevels` live in `front/app/shell/retrieval/`. Both
  Admin features depend up a tier and neither depends on the other; Library documents are what Ops
  crews will read too.
- **`LibraryLevels` is a container.** It owns the topic, record, and document declarations; `root`
  is its one member, and a second (a single topic's levels, say) can join without changing call
  sites.
- **One prop varies.** What activating a document means is the caller's (UX design archetypes
  §3.1); everything else is inside `LibraryLevels`.
- **Names** follow CONVENTIONS §4.4: `Drill*` is a family built with; `LibraryDialog`,
  `FieldBinderLibraryDialog`, and `FieldBinderChemicalDialog` are finished kinds. "Picker" keeps
  one meaning: an inline reference select (`UserPicker`, `AssetTypePicker`).
- **The return to the dashboard is accepted for now** and stays parked as P-15.

## Governing documents

Amended by the AA before production:

- CONVENTIONS 1.20 §4.4 (`6283347`).
- Architecture-front §2, §7.2.4, §10.1.2, §10.1.5, and §11.6 (`3924ebd`, `7a67acc`).
- UX design archetypes §4.3 Known uses and §6, the Drill row (`7a67acc`).
- `project-backlog.md` B-48 (`7a67acc`).

## Production scope

Paths are under `source/`.

| Files                                                           | Work                                       |
| --------------------------------------------------------------- | ------------------------------------------ |
| `front/app/shell/retrieval/drill-navigator.tsx`, `.css`         | New, from `field-binder-picker`            |
| `front/app/shell/retrieval/drill-dialog.tsx`                    | New, from `field-binder-picker`            |
| `front/app/shell/retrieval/library-levels.ts`                   | New, from `field-binder-library-picker`    |
| `front/app-admin/library/library-dialog.tsx`                    | New                                        |
| `front/app-admin/field-binder/field-binder-library-dialog.tsx`  | Renamed and thinned                        |
| `front/app-admin/field-binder/field-binder-chemical-dialog.tsx` | Renamed; builds on `DrillDialog`           |
| `front/app-admin/field-binder/field-binder-picker.tsx`, `.css`  | Removed                                    |
| `front/app-admin/field-binder/field-binder-step-detail.tsx`     | Imports and element names                  |
| `front/app-admin/app.tsx`                                       | `/library` route                           |
| `front/app-admin/dashboard-admin.json`                          | Library command; Administration menu items |
| `tests/cases/library-levels-test.ts`                            | New: `LibraryLevels` unit test             |

Out of scope:

- `ux/`, including the shell's overlay grammar (P-15).
- Browsing a docstore namespace directly. When a use arrives, it is a sibling of `LibraryLevels`
  in `retrieval/` over the same Drill family.
- Ops or Customer access to the Library.
- Any change to the managers themselves.

Escalate any change outside this scope.

## Acceptance

- The Admin Helm shows Library after Onboarding; the Administration menu lists About, Customers,
  and Logout.
- Library opens a sheet titled Library: four labelled launchers, then Documents.
- Each launcher opens its manager; closing the manager returns to the dashboard.
- Documents walks Topic → a topic's records → a record's documents; Back returns a level;
  activating a document opens it in a secondary window, and the sheet stays open.
- The Field Binder Manager's Library and Chemicals sources behave as before: same labels, same
  levels, choosing closes the dialog and fills the step.
- No `Picker*` drill type, `FieldBinderPicker`, or `field-binder-drill-mark` remains, and no CSS
  outside `UiIcon` writes `mask: var(--sa-icon)`.
- The CA verifies on screen.

- `library-levels-test.ts` passes, with the topic, record, and document APIs stubbed as
  `session-coordinator-test.ts` stubs API members. It pins `LibraryLevels`' behavior:
  1. the root level lists `LIBRARY_TOPICS`, and a topic's level is titled `Asset`, `Chemical`, or
     `Service`;
  2. a topic's records are sorted by label;
  3. a record's documents are its notes' attachments, flattened, with the attachment kind as the
     detail;
  4. choosing a document calls `onDocument` with the attachment and `{ topic, id }`.

Run `deno task check`, `deno task fmt:check`, the permitted unit suite, and STYLE_AUDIT.

## Records

- **Found while asking for one way to open a Library document.** The picker was the only path to
  Library documents, and it lived inside the Field Binder. Making it central turned the Library
  into a place.
- **Dialogs say so.** Every component the user meets as a dialog now has `Dialog` in its name,
  which ended "Picker" meaning two things.

## Design history

- `LibraryBrowser` took a `root` of levels so it could browse a docstore namespace too
  (`namespaceLevels(store, namespace)`). Dropped: one prop varies, and namespace browsing waits for
  a consumer.
- `DrillPicker` was proposed for the shared machinery; "Picker" already named the inline selects,
  and the machinery is also a dialog, so it split into `DrillNavigator` and `DrillDialog`.
- `Stacks`, `Holocron`, `Mentat`, and `Radiant` were weighed for the navigator; the plain family
  name won.
- The Library levels were first placed in `app-admin/library/`, with the Binder importing them from
  a sibling feature; moving them up a tier removed that dependency.
- The generic machinery was first kept in `app-admin/`; it moved to the suite tier as one picker
  idiom with Admin as its first user.

## Amendment — 2026-11-14 — At scope review

1. **The launcher row is `<UiLayout variant='cluster-wrap'>`.** The brief named the buttons but not
   their container. `cluster-wrap` is the components guide's wrapping compact action group: the
   four launchers sit in one row and wrap on a narrow device. Each launcher sets `align='start'`,
   so its icon leads its label. `LibraryDialog` writes no CSS for the row.
2. **A failed document open is shown in the sheet.** As `AttachmentList` does around
   `UiWindow.openResolved`, `LibraryDialog` catches a window or link failure and shows it in a
   danger `UiAlert`; the sheet stays open.
3. **`LibraryLevels` imports `UiText` from `ui-helpers.ts`,** not the `@ux/ui` barrel, so the
   module and its unit test carry no JSX. If `guard:imports` rejects the path, fix it in scope.

## Closure — 2026-11-14

The CA directed closure after reviewing the Library on screen.

**Shipped** (`217b724`). The Drill family and `LibraryLevels` in `front/app/shell/retrieval/`, with
the drill mark drawn by `UiIcon`; `LibraryDialog` at `/library`, opened from the Helm, with the four
catalog launchers above Documents; `FieldBinderLibraryDialog` and `FieldBinderChemicalDialog` on
`DrillDialog`; the Administration menu without the catalog managers; `library-levels-test.ts`. The
amendment "At scope review" shipped as written, and `guard:imports` accepted the direct
`ui-helpers.ts` import.

**Departures, settled by the CA during production.**

- **The launchers are dense,** as interior actions are. Inside a screen, action buttons are dense;
  an action that belongs to a field, or a screen's primary actions with nothing above them, stay
  standard.
- **Asset Types stays in the Library.** The CA briefly moved it to the Administration menu because
  it rarely changes, then returned it: placement follows ownership, and Asset Types belongs to the
  catalog with the others.
- **Rode along in the same commit:** the attachment row actions and the Tasks Dismiss became dense;
  every `UiActionButton` lists its spreads, then its attributes sorted, then its callbacks; a typo
  in a `ux/ui/components/ui-helpers.ts` comment was corrected.

**Settled on closing.**

- **The shell's overlay grammar** stays parking lot P-15.
- **Browsing a docstore namespace directly** is dropped. A consumer that needs it starts its own
  brief; the design is a sibling of `LibraryLevels` over the same Drill family.
- **Ops and Customer access to the Library** is dropped until a user story asks for it.

_End of Library Brief_
