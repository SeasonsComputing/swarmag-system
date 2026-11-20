# Workflow Builder — Brief

**Active, not dispatched.** Drafted 2026-11-15 from a CA + AI Architect exploration session. The
M-7 feature. Feature mode, in `front/app-admin/workflows/`. Depends on the Workflow Domain brief
(`effort/completed/2026-11/2026-11-15-workflow-domain-brief.md`) and the Dashboard Feature brief
(`effort/completed/2026-11/2026-11-15-dashboard-feature-brief.md`). Facets ride along
(`2026-10-06-facets-workflow-seeding-brief.md`). The spec is the mockup canvas
[Workflow Builder Mockup](https://claude.ai/artifact/UWyqKXwh5xZ35esEA4ao6G): the Main board for
the Builder, the TaskLibraryCurrent and QuestionLibraryCurrent boards for the libraries. Its
elements are mapped onto the design language before dispatch (Open).

## The model

**A Workflow is a stack of Tasks. A Task is a stack of Questions.**

- **Edit always edits the thing.** Tasks and Questions are shared by reference; editing one changes
  it everywhere it is used.
- **Clone is how creative work happens.** Clone creates a new item and repoints this stack's link
  to it. It works at every level; Job Assessment and Job Plan specialize a Workflow the same way.
- **Delete follows the standard soft-delete rules.** A stack shows a deleted reference as deleted.

## Target design

### Entry and exit

The Builder is the first view in the system that is not an archetype: a novel composition, and the
application's full-screen view.

- **Workflows** is a command on the Admin Helm toolbar. It navigates to the Builder's own
  authenticated route stack, `makeAuthenticatedShell` holding `Routes.page('/workflows', …)`,
  outside the dashboard shell.
- The Builder opens on the last Workflow opened, or on New when there is none.
- Admin is one entry point. Assessment and Plan will open the Builder on a clone (M-8); nothing here
  ties it to Admin alone.

### The frame

The Builder composes its own `ShellFrame` around the stack and inspector.

- **Brand:** the Workflow's name, its version (`v4.2`), and whether it has unsaved changes, through
  the Brand's `title` and `subtitle`.
- **Helm:** Open, New, Clone, Save, Release, Exit.
  - **Open** shows a Lister sheet of Workflows; picking one opens it.
  - **New** starts a Workflow at `1.0`.
  - **Clone** creates a copy of the Workflow with its Task links, at `1.0`, and opens it.
  - **Save** saves the item in the inspector.
  - **Release** raises the major version (`4.3` → `5.0`).
  - **Exit** navigates to `/`.
- The header stays fixed; the page scrolls; the footer follows the stack in flow.

### The body

Two regions side by side: the stack, and a fixed inspector on the right.

**The stack** is a vertical stack of cards, indented with guide lines, as the prototype draws it.

- The **Workflow card** is the root. It opens expanded.
- Each **Task card** shows its position, label, and Question count, with controls to add a
  Question, move up, move down, clone, and remove. It opens collapsed; expanding it shows its
  Questions.
- Each **Question row** shows its type as a `UiBadge` in a named color and its prompt, with controls
  to move up, move down, clone, and remove.
- **Add Task** and **Add Question** open the Task or Question library. They are the libraries'
  only entry; the libraries live in `workflows/`, not as Admin namespaces.
- **Remove** takes the item out of this stack. It deletes nothing.
- A deleted reference shows a "Deleted" `UiBadge` in a named color: a record status, not a state
  variant.
- The stack controls are custom, not `UiActionButton`.

**The inspector** edits the selected card: the Workflow, a Task, or a Question.

- **Workflow:** name, description, facets from the curated catalog (`useFacets`), notes. The
  version shows here and is not edited by hand.
- **Task:** label, description, notes.
- **Question:** prompt, type, help text, required; for select types, the options and each option's
  `requiresNote`.
- The inspector is custom; its fields are Ui controls, in a `UiLayout` block stack.

### The libraries

- The **Task library** and **Question library** are hosted locally in a `sheet`-sized frameless
  dialog with a `label`. As Managers, they are opened with `pick` labelled **Add**, collapsed,
  with Add and Cancel in the header. Add puts the item in the stack at the chosen place; New
  creates one and adds it. Manager or Lister is Open.
- A stack holds an item at most once (each junction's key is the pair). The library says so rather
  than failing.

### Saving

- **Content:** the inspector edits one item at a time with the existing Draft and field state. Save
  saves that item. The header's unsaved marker reflects that item.
- **Leaving unsaved edits:** selecting another card, Open, New, or Exit asks first, as a Manager
  does when it leaves a changed Draft.
- **Structure:** add, move, remove, and clone are single link changes and take effect at once.
  There is nothing to hold.

### Versions

- A version is `major.minor`. A new Workflow, and a clone, start at `1.0`.
- **Minor:** the Builder raises it whenever it saves anything in the open Workflow's tree: the
  Workflow, one of its Tasks or Questions, or a stack.
- **Major:** Release raises it and resets the minor.
- Editing a shared Task raises only the open Workflow's version. Accepted: if tracing trips on it,
  revisit.

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
workflow.clone(task) // create + repoint
```

## Governing documents to amend

Amended first, since documentation leads code:

- **architecture-front:** the normative tree's `workflow-builder/` is `workflows/`.
- **ux-design-archetypes:** the Builder, if it is recorded as an archetype.

## Production scope

Paths are under `source/`.

| Files                                  | Work                                           |
| -------------------------------------- | ---------------------------------------------- |
| `front/app-admin/workflows/*`          | the Builder: API, stack, cards, inspector      |
| `front/app-admin/app.tsx`              | the feature route; Task and Question libraries |
| `front/app-admin/dashboard-admin.json` | the Workflows toolbar command                  |
| `tests/cases/…`                        | the Builder's API: stacks, clone, versions     |

Out of scope:

- the Runner, including the Builder's Runner command (M-9)
- remembering which cards are open (backlog)
- opening the Builder from Assessment or Plan (M-8)
- seeding (M-8)

Escalate any change outside this scope.

## Acceptance

- Workflows opens the Builder on the last Workflow opened, or New.
- The Workflow card opens expanded and its Tasks collapsed.
- Tasks and Questions are added from their libraries, moved, cloned, and removed; each change
  persists at once.
- The inspector edits and saves the selected item, and asks before leaving unsaved edits.
- Saving raises the minor; Release raises the major.
- Clone repoints only this stack's link; the original is unchanged.
- A deleted Task or Question shows as deleted.
- The Builder's `ShellFrame` shows its brand and toolbar; the header stays fixed and the footer
  follows the body. This accepts `ShellFrame` and the Builder's route stack from the Dashboard
  Feature brief.
- Exit navigates to `/`.
- CA verifies on screen in Admin.

Run `deno task check`, `deno task fmt:check`, the permitted unit suite, and STYLE_AUDIT.

## Open

1. **Mapping the mockup to the design language.** The mockup's elements are mapped onto shipped
   controls and tokens before dispatch. Settled so far: a Question's type and "Deleted" are
   named-color badges.
2. **Lister or Manager for the libraries.** A Lister lists and activates; the inspector already
   edits the item. A Manager adds Detail and New.
3. **Search in the libraries:** whether a list is enough.
4. **One open card:** whether expanding one Task card collapses the others.
5. **Release:** whether it asks the author anything.

## Records

- **Edit edits the thing; Clone is the creative move.** Shared items stay shared; a variant is
  always a new thing.
- **Per-item save.** Saving the whole tree at once would need a multi-item save; per-item save
  is the pattern every Manager already uses.
- **The version traces on-the-job issues.** The minor follows every change a crew would see; the
  major is the author's deliberate release. M-9 records the version a job ran.
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

_End of Brief_
