# Shell Namespaces — Brief

**Active 2026-11-14. Draft, not dispatched.** Not on the roadmap: chosen directly at the CA's
direction, ahead of the Library, which builds into the tree this brief establishes. Foundation
mode: the suite tier's module layout and the documentation that describes it. A restructure with no
behavior change. The documents lead; production follows them.

## Escalation: locked documentation (approved)

Architecture-front describes the tree this brief replaces, and CONVENTIONS had no rule for the names
it gives. Both are locked. The AA amended them at the CA's direction, each in its own change, before
any source moves (Governing documents). Production changes code only.

## Purpose and dependencies

`front/app/shell/` is the suite tier's one leaf. It holds startup wiring, the notes editor, the
Field Binder reader, identity screens, and reference fields side by side, so a reader cannot tell
from the folder what owns what. This brief clusters it into five namespaces, each named for the one
job its files share, and renames the two components whose names hide what they are.

The Library brief (to be written) depends on this one: it adds the Drill family and
`LibraryLevels` to `retrieval/`.

## Current behavior

Verified against the code on 2026-11-14:

- `front/app/shell/` is a flat leaf of 23 files: 16 modules and 7 stylesheets.
- `guard-leaf.ts` (`source/devops/guards/`) rejects files in a folder that also holds folders,
  except the three application roots.
- Importers of `@front/app/shell/*`:
  - 18 modules in `front/app-admin/` (asset-types, assets, chemicals, customers, field-binder,
    onboarding, services, users) and `front/app-admin/app.tsx`
  - `front/app-ops/app.tsx` and `front/app-customer/app.tsx`
  - 6 modules inside `front/app/shell/` itself, by relative import
  - 6 test cases: `attachments-test.ts`, `customer-state-test.ts`, `document-drain-test.ts`,
    `session-coordinator-test.ts`, `session-state-test.ts`, `user-provider-test.ts`
- `AboutBox` (`about-box.tsx`) is the About dialog. `makeAppDashboardShell` in
  `ux/shell/runtime/shell-makers.tsx` receives it as a parameter named `AboutBox` and registers it
  with `Routes.dialog('/about', …)`.
- `FieldBinder` (`field-binder.tsx`) is the Field Binder reader, routed by
  `Routes.sheet('/field-binder', FieldBinder)` in `front/app-admin/app.tsx`. Its name is the same
  as the API class `FieldBinder` (`front/api/field-binder.ts`), reached as `api.FieldBinder`.
- Architecture-front §10.1.2 lists `app/components/` as a placeholder for swarmAg controls. No such
  folder exists.

## Target design

### Tree

```text
front/app/shell/
├── startup/
│   ├── root-services.ts
│   ├── session-coordinator.ts
│   ├── shell-makers.tsx
│   └── user-provider.ts
├── notes/
│   ├── attachment-list.tsx
│   ├── make-attachment-save.ts
│   ├── notes-editor.css
│   ├── notes-editor.tsx
│   ├── table-cells.css
│   └── table-cells.tsx
├── field-binder/
│   ├── field-binder-dialog.tsx
│   └── field-binder-helm.ts
├── display/
│   ├── about-dialog.css
│   ├── about-dialog.tsx
│   ├── brand-hero.css
│   ├── brand-hero.tsx
│   ├── login.css
│   ├── login.tsx
│   ├── status-badge.css
│   └── status-badge.tsx
└── retrieval/
    ├── url-field.css
    ├── url-field.tsx
    └── user-picker.tsx
```

### What each namespace owns

| Namespace       | Owns                                                                   |
| --------------- | ---------------------------------------------------------------------- |
| `startup/`      | What an application wires before its first screen. It renders nothing. |
| `notes/`        | The stock notes editor and everything only it uses.                    |
| `field-binder/` | The Field Binder's reader and its Helm bindings.                       |
| `display/`      | The screens and marks the shell itself presents.                       |
| `retrieval/`    | Getting to a reference: a document, a link, a User.                    |

### Renames

| From                                  | To                                                  |
| ------------------------------------- | --------------------------------------------------- |
| `about-box.tsx`, `about-box.css`      | `display/about-dialog.tsx`, `display/about-dialog.css` |
| `AboutBox`                            | `AboutDialog`                                       |
| `field-binder.tsx`                    | `field-binder/field-binder-dialog.tsx`              |
| `FieldBinder`, `FieldBinderProps`     | `FieldBinderDialog`, `FieldBinderDialogProps`       |

Every other file keeps its name and exports and moves to its namespace. Imports follow the
existing rules: a sibling in the same namespace by relative path, anything else through its
`@front/app/shell/{namespace}/{file}` alias path.

## Decisions

- **One job per namespace.** A namespace is named for what its files are for, never for what kind
  of file they are. A file goes where someone would look for it first.
- **Five namespaces.** Fewer than seven, so the folder reads at a glance.
- **`login` is in `display/`.** It is the first screen the shell shows. Its OTP exchange is how it
  works, not what it is. `startup/` holds only what the user never sees.
- **`brand-hero` is in `display/`.** `login` and `about-dialog` both show it; neither depends on
  the other.
- **`attachment-list` and `table-cells` are in `notes/`.** `NotesEditor` is their only owner;
  `LabelCell` is the notes editor's row label.
- **`url-field` and `user-picker` are in `retrieval/`.** One holds a link to a document and opens
  it; the other selects a User.
- **The application roots stay as they are.** Their loose files are where the build and host
  require them.
- **Not taken:** a `helper/` namespace (it names no job); `controls/`, `fields/`, and `session/`
  (each split or merged in design; see Design history); siblings of `shell/` in `app/` instead of
  sub-namespaces.

## Governing documents

Amended by the AA before production, each in its own change:

1. **CONVENTIONS 1.20** (`6283347`):
   - New §4.4 Subject and kind, family and role. A finished thing is named subject, then kind, and
     a component the user meets as a dialog has `Dialog` as its kind. A piece built with is named
     family, then role, and a family has siblings. Folder layout is the leaf guard's.
   - §16.1 names the branded route components "a login, an About dialog, a footer".
   - §17.7's example is a generic `DocumentsDialog`; it no longer cites application code.
2. **Architecture-front** (`3924ebd`):
   - §2 Directory Structure and §10.1.2: `shell/` is the five namespaces, `components/` is gone,
     and §10.1.2 names what each namespace holds, including the Library's retrieval pieces.
   - §7.2.4 Document Storage: Library and Chemicals each open a `DrillDialog`.
   - §9.1, §9.2, §9.3.1, §9.3.2, §10.1.2, and §10.1.5: paths into `startup/`, `display/`, `notes/`,
     and `retrieval/`; `AboutDialog`.
3. **README** §2.4.5 UX Toolkit: the `session-coordinator.ts` path.
4. **`project-backlog.md`** B-9: the `login.tsx` path.

5. **`effort/pending/2026-10-10-access-model-brief.md`**, decision 13: Starting Job Work is a
   namespace of its own in `front/app/shell/`.

Not amended:

- `effort/completed/**`: paths are frozen at closure (EFFORT §2, The Effort Namespace).
- `project-roadmap.md` M-4 · Notes Editor, a closed milestone: its "lands in `front/app/shell/`"
  is history.
- `effort/genesis/**`: genesis is off limits.
- The Field Binder picker references (architecture-front §7.2.4 Document Storage,
  `project-backlog.md`) belong to the Library brief, which renames the pickers.

The census covered every live Markdown file on 2026-11-14 and found no other references.

## Production scope

Paths are under `source/`.

| Files                                                         | Work                                    |
| ------------------------------------------------------------- | --------------------------------------- |
| `front/app/shell/**`                                          | Move into the five namespaces; renames  |
| `front/app-admin/**` (18 modules and `app.tsx`)               | Import paths; `FieldBinderDialog` route |
| `front/app-ops/app.tsx`, `front/app-customer/app.tsx`         | Import paths                            |
| `tests/cases/` (the 6 cases named under Current behavior)     | Import paths                            |

Out of scope:

- `ux/`: the `AboutBox` parameter name in `ux/shell/runtime/shell-makers.tsx` and the `ux/`
  components that render dialogs. Renaming them is a separate Foundation decision.
- Any change to behavior, exports other than the two renames, or styles.
- The Drill family, `LibraryLevels`, and the Library, which belong to the Library brief.
- The `onValue` / `onChange` difference between `UrlField` and `UserPicker`.

Escalate any change outside this scope.

## Acceptance

- `front/app/shell/` holds only the five namespaces; `guard-leaf.ts` passes.
- No file outside the tree above remains in `front/app/shell/`.
- `AboutBox` and the component `FieldBinder` no longer exist; `api.FieldBinder` is unchanged.
- Each application starts, signs in, opens About, and Admin opens the Field Binder reader and a
  notes editor. The CA verifies on screen.

Run `deno task check`, `deno task fmt:check`, the permitted unit suite, and STYLE_AUDIT.

## Records

- **Found while designing the Library.** The Library's retrieval pieces needed a home in the suite
  tier, and the only leaf there held everything. Placing them forced the question of what the
  folder's files share.
- **A name collision, removed.** The reader component and the API class were both `FieldBinder`.
  Giving the component its kind ends that.
- **The census shaped the tree.** Each placement followed the file's consumers and the API it
  presents: `AttachmentList` and `LabelCell` have one owner; `UrlField` and `UserPicker` share a
  controlled-value shape; `BrandHero` takes no props.

## Design history

- `controls/` held `url-field`, `status-badge`, `user-picker`, and `brand-hero`. They share no API,
  so it split into `fields/` and `display/`.
- `fields/` dissolved: `user-picker` and `url-field` moved to `retrieval/`.
- `helper/` held `attachment-list` and `table-cells` briefly; both moved to `notes/`.
- `about/` was a stand-alone namespace for the About dialog; it joined `display/`.
- `foundation/` became `startup/`, which says when its files run and does not share a word with
  Foundation Mode.
- `session/` (`login`, `session-coordinator`, `user-provider`) was considered and not taken.

_End of Shell Namespaces Brief_
