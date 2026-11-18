# Dashboard Feature — Brief

**Active, reviewed by ACE 2026-11-16; amended after that review.** Drafted 2026-11-15 from a CA + AI Architect exploration session. The
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

_[Superseded by the amendment "After ACE review", item 1: `ShellFrame` is extracted and composed, not taken over.]_

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

_[Amended by the amendment "After ACE review", item 3: Add returns the persisted Item.]_

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

## Amendment — 2026-11-16 — After ACE review

ACE's exploration review found the brief consistent with the shell and Manager, with two
corrections, and blocked on three contract decisions. The CA settled the frame by extraction
instead of takeover. This amendment supersedes "A feature takes over the dashboard" and amends
"Manager returns the Item picked".

1. **The frame is extracted and composed, not taken over.** The application's chrome becomes
   `ShellFrame` in `ux/shell/runtime/shell-frame.tsx`, beside the shell's routes and makers: the
   header (Brand, fields, Helm; fixed) and the body with the footer following it in flow. It frames
   the authenticated application's pages; an anonymous page such as Login renders without it.
   The dashboard's API surface is unchanged: `Dashboard` is implemented in terms of `ShellFrame`,
   composing it around its rows. The Workflow Builder composes its own instance, parameterized,
   around its stack. Nothing registers at runtime, so there is no `useDashboardFrame` and no
   route-owned frame state to clear.

   ```tsx
   <ShellFrame header={…} footer={Footer}>{rows}</ShellFrame>                  // inside Dashboard
   <ShellFrame header={{ brand, toolbar }} footer={Footer}>…</ShellFrame>      // the Builder
   ```

2. **The Builder is its own route stack.** A top-level authenticated route outside the dashboard
   shell renders the Builder's frame; it does not overlay the dashboard. Its pickers are hosted
   locally; routed overlays are unchanged. Exit navigates to `/`. The shell gains an
   authenticated page route for this; its name and maker are the production's to propose.
3. **Manager returns the persisted Item.** The caller's action (`pick`, labelled by the caller)
   returns the persisted Item. A changed draft gets the existing discard confirmation first;
   saving stays an explicit Save. A new Item is returned immediately after it is created. The
   Manager calls `onPick(item)`, then closes; if `onPick` throws, it stays open and shows the error
   as feedback.
4. **Corrections.** The Brand is `front/app/widgets/brand-widget.tsx`, outside the listed scope; it
   takes its image, title, and status as properties as well as reading shell identity. The Helm's
   existing command bindings (reactive disabled predicates, status) carry the Builder's toolbar.
5. **Split.** Manager `pick` is small and standalone: it ships first, verified through a style-guide
   example. The frame extraction and the Builder's route are verified by the Builder's first
   slice, their only consumer.

## Amendment — 2026-11-16 — After ACE scoping

ACE's production scope, as authorized by the CA, with one change.

1. **The frame is `ShellFrame`** (`ux/shell/runtime/shell-frame.tsx`). `ShellPage` already names the
   page route in `shell.ts`'s route family (`ShellIndex`, `ShellRedirect`, `ShellTransition`,
   `ShellPage`, `ShellOverlay`); the component takes its own name rather than an import alias. A
   `ShellPage` route renders a page; an authenticated page frames its content in a `ShellFrame`.
2. **The authenticated route stack is `makeAuthenticatedShell(routes)`:** an authenticated shell
   holding an outlet, registered beside the dashboard shell, using the existing `Routes.page`.
3. **Two slices.** Manager `pick` first (archetypes and components guide where applicable,
   `manager.tsx`, `manager-contract.ts`, a style-guide example, tests); then `ShellFrame`
   (architecture-front and archetypes first, `shell-frame.tsx` and its styles, dashboard
   rendering, shell makers and route contracts as needed, a parameterized Brand that keeps its
   identity and logo defaults, Helm presentation only as needed). `onPick` is awaited before the
   Manager closes; a synchronous throw or rejection is reported and the Manager stays open.
   `ShellFrame` is accepted through the Builder's first slice.

## Amendment — 2026-11-16 — Pick is collapsed

The CA's decision on reviewing slice 1. Amends "Manager returns the Item picked".

1. **A Manager given `pick` is collapsed at any width.** Choosing an Item to return is
   Index-Detail: the list, then the chosen Item's Detail. The layout is declared, not inferred
   from the dialog's width: `PanelContainer` takes an optional `layout: 'collapsed'`, rendered as
   `data-shell-layout`, and `manager.css` applies its narrow-container rules under that attribute
   as well as under the container query. Without `pick`, the Manager's layout follows its width
   as before.

_End of Brief_
