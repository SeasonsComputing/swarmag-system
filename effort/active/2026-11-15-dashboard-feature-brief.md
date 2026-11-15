# Dashboard Feature — Brief

**Active, not dispatched.** Drafted 2026-11-15 from a CA + AI Architect exploration session. The
second M-7 enabler: what the Workflow Builder (`2026-11-15-workflow-builder-brief.md`) needs from
the shell. Foundation mode: `ux/shell` and `ux/widgets` are locked namespaces. Independent of the
Workflow Domain brief; the two can run side by side.

## Escalation: `ux/shell`, `ux/widgets` (requested)

- `ux/shell/runtime` and `ux/shell/dashboard`: a feature route that takes over the dashboard frame.
- `ux/widgets`: the Brand and Helm widgets show what the feature gives them.
- `ux/shell/workbench/manager.tsx`: Manager returns the Item picked.

## Current behavior

Verified against the code on 2026-11-15:

- `makeDashboardShell` renders `<Dashboard/>` and the route `<Outlet/>` inside `<main>`. Routes are
  `page`, `workbench`, `sheet`, `dialog`, `redirect`, `transition`, and `index`; workbenches,
  sheets, and dialogs overlay the dashboard.
- The dashboard header holds an identity widget (the Brand), field widgets, and a terminal widget
  (the Helm), from each application's dashboard JSON. The body is its rows. The footer follows the
  body.
- A Helm command is a route path (`/users`) or a reserved command (`@theme`, `@tasks`).
- `ManagerProps` is `onCancel` and `provider`. A Manager manages; it returns nothing.

## Target design

### A feature takes over the dashboard

Some features are the place a person works, not an overlay on it. The Workflow Builder is the
first; Job Assessment and Job Plan will open it on a clone, and other features may follow. This is
a general shell capability, not one feature's special case.

While a feature is open:

- **Brand:** shows the feature's image, title, and a status line in place of the application's.
  The Builder shows the Workflow's name, its version, and whether it has unsaved changes.
- **Helm:** shows the feature's commands in place of the application's toolbar. One of them exits.
- **Body:** the feature, in place of the dashboard rows.
- **Header:** stays fixed. The page scrolls, and the footer follows the feature in flow.
- **Exit** returns the dashboard to its own Brand, Helm, and rows.

The frame stays branded and familiar: the same header, the same widgets, showing the feature.

Proposed shape, to be settled in review:

```ts
// The application registers the feature as a route.
Routes.feature('/workflows', WorkflowBuilder)

// The feature states what the frame shows while it is open.
const frame = useDashboardFrame()
frame.brand(() => ({ image, title: workflow.name, status: `v${workflow.version}` }))
frame.toolbar([
  { label: 'Open', icon: 'folder', run: openWorkflow },
  { label: 'Exit', icon: 'exit', run: exit }
])
```

A feature's toolbar item runs a function the feature owns, beside the path and reserved commands
the application's toolbar already has. Leaving the route gives the frame back.

### Manager returns the Item picked

A Manager opened to choose an Item returns it.

- `ManagerProps` gains an optional `pick`. Without it, a Manager behaves as today.
- With it, the selected Item offers the caller's action. Taking it returns the Item and closes the
  Manager.
- New works as it does today; saving a new Item returns it.
- **The verb is the caller's.** Manager knows only that it returns an Item; the caller names what
  that does to its work. The Builder says "Add". "Pick" never appears on screen.

```ts
<Manager provider={QuestionProvider} onCancel={close} pick={{ label: 'Add', onPick: addQuestion }} />
```

The caller hosts the Manager as it hosts any workbench.

## Governing documents to amend

Amended first, since documentation leads code:

- **architecture-front:** the feature route and the frame it takes over.
- **ux-design-archetypes / ux-components-guide:** Manager's pick, where Manager is described.

## Production scope

Paths are under `source/`.

| Files                                                                 | Work                                 |
| --------------------------------------------------------------------- | ------------------------------------ |
| `ux/shell/runtime/shell.ts`, `shell-compiler.tsx`, `shell-makers.tsx` | the feature route                    |
| `ux/shell/dashboard/*`                                                | the frame a feature takes over       |
| `ux/widgets/*` (Brand, Helm)                                          | show the feature's brand and toolbar |
| `ux/shell/workbench/manager.tsx`, its contract                        | `pick`                               |
| `tests/cases/…`                                                       | takeover and exit; Manager pick      |

Out of scope:

- the Workflow Builder itself
- remembering a feature's state between visits
- `ux/ui` controls

Escalate any change outside this scope.

## Acceptance

- Opening a feature route shows its brand, toolbar, and body; the header stays fixed and the
  footer follows the body.
- Exit restores the application's Brand, Helm, and rows.
- A Manager given `pick` shows the caller's label and returns the Item, including one just
  created; without it, it behaves as today.
- CA verifies on screen in Admin.

Run `deno task check`, `deno task fmt:check`, the permitted unit suite, and STYLE_AUDIT.

## Open

1. **The name.** "Feature" is a working name for a route that takes over the dashboard frame.
2. **The shape.** The proposal above is a starting point; the contract is settled in review.

## Records

- **General, not the Builder's.** The Builder is the first feature to take over the frame, not the
  last. Assessment and Plan will open it too.
- **The frame stays.** Taking over the header's content keeps the application branded and familiar;
  a separate page would lose it.
- **Returning a value is obvious.** A Manager opened to choose returns the choice; it is additive.
- **The caller names the action.** What a returned Item does is the caller's to say: Add in the
  Builder, something else elsewhere.

## Design history

- A workbench dialog over the dashboard was rejected: the Builder is where the person works, not an
  overlay.
- The Task and Question pickers were first framed as a drill-picker dialog. They are Managers,
  which already list and create; they gain a return value.
- The action was first labelled "Pick" in the mockups. The CA rejected the verb: it names the
  mechanism, not what happens to the person's work. The caller supplies the label.

_End of Brief_
