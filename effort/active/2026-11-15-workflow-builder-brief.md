# Workflow Template Builder — Brief

**Active, not dispatched.** Drafted 2026-11-15 from a CA + AI Architect exploration session. The
M-7 feature. Feature mode, in `front/app-admin/workflows/`. Depends on the Workflow Domain brief
(`effort/completed/2026-11/2026-11-15-workflow-domain-brief.md`) and the Dashboard Feature brief
(`effort/completed/2026-11/2026-11-15-dashboard-feature-brief.md`). Facets ride along
(`2026-10-06-facets-workflow-seeding-brief.md`). The spec is the mockup canvas
[Workflow Builder Mockup](https://claude.ai/artifact/UWyqKXwh5xZ35esEA4ao6G): the MainAttached
board for the Builder, the TaskLibraryCurrent and QuestionLibraryCurrent boards for the libraries.

## The model

**A Workflow is a stack of Tasks. A Task is a stack of Questions.**

- **The Builder arranges; the Managers author and acquire.** The Builder changes links only. Every
  record's content is edited in its own Manager, the one place that record is edited.
- **Edit always edits the thing.** Tasks and Questions are shared by reference; editing one changes
  it everywhere it is used.
- **Clone is how creative work happens.** Clone creates a new item. It lives in the Managers; Job
  Assessment and Job Plan specialize a Workflow the same way.
- **Delete follows the standard soft-delete rules.** A stack shows a deleted reference as deleted.

## Target design

### Entry and exit

The Workflow Template Builder is the first Builder Work Page (`ux-design-archetypes.md` §5.3): it
authors templates; the Job Builder (M-8) specializes them for a job. The design across both is
`effort/discovery/2026-11-20-workflows-jobs-brief.md`.

- **Workflows** is a command on the Admin Helm toolbar. It navigates to the Builder's own
  authenticated route stack, `makeAuthenticatedShell` holding `Routes.page('/workflows', …)`,
  outside the dashboard shell.
- The Builder opens on the Workflow of this user's last Builder session on this device, or on a
  new Workflow when there is none or it has been deleted. The last session is remembered locally,
  per device.

### The frame

The Builder composes its own `ShellFrame`. The header spans the frame; the stack and the info panel
sit side by side beneath it.

- **Brand:** the Workflow's name and its version (`v4.2`), through the Brand's `title` and
  `subtitle`.
- **Helm:** New Workflow (`+`), Exit.
  - **New Workflow** starts a Workflow at `1.0` and opens it.
  - **Exit** navigates to `/`.
- The header stays fixed; the stack scrolls; the footer follows the stack in flow.

### The stack

A vertical stack of cards, indented with guide lines, as the mockup draws it.

- The **Workflow card** is the root. It is always expanded.
- Each **Task card** shows its position, label, and Question count, with controls to add a
  Question, move up, move down, and remove. It is expanded only while it or one of its Questions
  is selected; it has no expand control.
- Each **Question row** shows its type as a `UiBadge` in a named color and its prompt, with controls
  to move up, move down, and remove.
- The **selected** Workflow or Task card is a `UiCard` with `decoration='gradient'` and
  `elevation='raised'`, drawn slightly zoomed. A connector to the parent sits outside the zoomed
  card.
- **Add Task** and **Add Question** open the Task or Question library. They are the libraries'
  only entry.
- **Remove** takes the item out of this stack. It deletes nothing.
- A deleted reference shows a "Deleted" `UiBadge` in a named color: a record status, not a state
  variant.
- The stack controls are custom, not `UiActionButton`.

### The info panel

The info panel is attached to the frame at the header's layer, on the right, in the light tonal
surface (`--sa-card-tonal-light-bg`). It is read-only: it shows the selected card and launches that
record's Manager to edit it.

- **Workflow:** name, description, facets, notes, version. Launches the Workflow Manager.
- **Task:** label, description, notes. Launches the Task Manager.
- **Question:** prompt, type, help text, required; for select types, the options and each option's
  `requiresNote`. Launches the Question Manager.
- Notes show read-only; they are edited in the Manager's Detail, where `NotesEditor` has its drill
  host.

### The Managers

The Workflow, Task, and Question Managers live in `workflows/` and are reached only from the
Builder. Each is hosted locally in a `sheet`-sized frameless dialog with a `label`.

- **Workflow Manager:** the Workflow's metadata (name, description, facets, notes), Clone, and
  choosing which Workflow the Builder opens. It never edits the stack.
- **Task and Question Managers:** the record's content and Clone. As the libraries, they are
  opened with `pick` labelled **Add**, collapsed, with Add and Cancel in the header: Add puts the
  chosen item in the stack at the chosen place; New creates one and adds it.
- A stack holds an item at most once (each junction's key is the pair). The library says so rather
  than failing.

### Saving

- **Content:** each Manager saves its record with the existing Draft and field state, and asks
  before leaving a changed Draft.
- **Structure:** add, move, and remove are single link changes and take effect at once. There is
  nothing to hold.

### Versions

- The domain stores `version` as a nonempty string; `major.minor` is the Builder's reading of it,
  a label for people. A new Workflow, and a clone, start at `1.0`.
- **Minor:** raised whenever anything in the open Workflow's tree is saved from the Builder: the
  Workflow, one of its Tasks or Questions through a Manager, or a stack.
- **Major:** the Builder does not raise it.
- Editing a shared Task raises only the open Workflow's version. Accepted: an Answer's
  `questionId` names the exact Question; the version does not need to.

### The Builder's API

The UI uses an API for building Workflows, composed over `api` in `workflows/`. `api` gives it CRUD
and junction access to Workflows, Tasks, and Questions; the Builder's API gives it stacks, clone,
and the version rule.

```ts
const workflow = await Workflows.stack(workflowId) // a stack of Tasks
const preflight = await Tasks.stack(taskId) // a stack of Questions

workflow.items()
workflow.add(task, at?)
workflow.move(task, to)
workflow.remove(task)
```

## Governing documents to amend

Amended first, since documentation leads code:

- **architecture-front:** the normative tree's `workflow-builder/` is `workflows/`.
- **ux-design-archetypes:** the Builder, if it is recorded as an archetype.

## Production scope

Paths are under `source/`.

| Files                                  | Work                                                 |
| -------------------------------------- | ---------------------------------------------------- |
| `front/app-admin/workflows/*`          | the Builder: API, stack, cards, info panel, Managers |
| `front/app-admin/app.tsx`              | the feature route                                    |
| `front/app-admin/dashboard-admin.json` | the Workflows toolbar command                        |
| `tests/cases/…`                        | the Builder's API: stacks, clone, versions           |

Out of scope:

- the Runner, including the Builder's Runner command (M-9)
- the Job Builder (M-8)
- seeding (M-8)

Escalate any change outside this scope.

## Acceptance

- Workflows opens the Builder on this device's last session, or on a new Workflow.
- New Workflow starts a Workflow at `1.0`.
- The Workflow card is expanded; a Task card is expanded only while it or one of its Questions is
  selected; the selected card is decorated, raised, and zoomed.
- Tasks and Questions are added from their libraries, moved, and removed; each change persists at
  once.
- The info panel shows the selected item read-only and launches its Manager; the Manager edits,
  clones, and saves, and asks before leaving a changed Draft.
- The Workflow Manager edits metadata and chooses the open Workflow; it never edits the stack.
- Saving raises the minor.
- A deleted Task or Question shows as deleted.
- The Builder's `ShellFrame` shows its brand and toolbar; the header stays fixed and the footer
  follows the body. This accepts `ShellFrame` and the Builder's route stack from the Dashboard
  Feature brief.
- Exit navigates to `/`.
- CA verifies on screen in Admin.

Run `deno task check`, `deno task fmt:check`, the permitted unit suite, and STYLE_AUDIT.

## Open

1. **Mapping the rest of the mockup.** The elements not yet named here are mapped onto shipped
   controls and tokens before dispatch.
2. **Search in the libraries:** whether a Manager's list is enough.
3. **Lessons flowing back.** Whether a job's specialization can be promoted into the template, or
   the administrator re-authors it by hand (stories §2.9 item 4).

## Records

- **The Builder arranges; the Managers author and acquire.** Each record keeps one editor, and an
  edit made in its Manager reads as what it is: a change to a shared record.
- **Edit edits the thing; Clone is the creative move.** Shared items stay shared; a variant is
  always a new thing.
- **Managers, not Listers, for the libraries.** The library selects or creates; a Manager opened
  with a return value does both.
- **The last session is the user's, on this device.** Shared data cannot say what one user was
  working on.
- **A clone is a new record with its own id.** Identity is the version: an Answer's `questionId`
  names the exact Question the crew saw, so a change of meaning made by cloning keeps history
  coherent and variants comparable.
- **The version is a label.** The minor follows every change a crew would see; M-9 records the
  version a job ran.
- **The Builder's API is the feature's.** It lives with the feature and uses `api`; `api` keeps the
  CRUD and junction clients.

## Design history

- The Builder first took over the dashboard frame. The frame was extracted as `ShellFrame` instead,
  and the Builder composes its own on its own route stack (Dashboard Feature brief).
- The CA's prototype `workflow_builder_workbench.html` was the first spec; the mockup canvas
  replaced it.
- Index-Detail recursion was proposed for the stack and rejected; the stack uses selective
  disclosure.
- Facets on Task and Question were proposed and dropped; the domain carries facets on Workflow only.
- A Runner command in the Builder was planned and moved to M-9 with the Runner itself, a full page.
- The Builder's API was first placed in `front/api`. It belongs to the feature.
- `version` was weighed as an author's label and as a plain counter before `major.minor`.
- Lineage fields on a clone were considered and cut; a job's clone already carries its basis.
- The info panel first edited the selected item with a per-item Draft and Save, which needed a drill
  host for `NotesEditor`. It became read-only; the Managers edit.
- The Helm first carried Open, Clone, and Save. Open and Clone moved to the Managers; Save went
  with the info panel's editing.
- Task cards first expanded by a chevron, one open card and remembered open cards were Open or
  backlogged. Selection drives expansion instead.
- The libraries were weighed as Listers. A Lister selects only; the library also creates.
- The info panel first floated; it is attached at the header's layer, as the prototype drew it.
- Release was planned to raise the major version. A released state was weighed; released and
  answered can be derived from job data if needed, so Release is not built.

_End of Brief_
