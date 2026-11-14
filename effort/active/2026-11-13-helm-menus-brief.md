# Helm Menus — Brief

**Active; reviewed by ACE 2026-11-13; amended once (After ACE review, at the end). Captured
2026-11-13.** Foundation mode: the Helm's configuration
contract and widget in locked `ux/widgets`, and the three applications' dashboard configuration.
The CA settled the design and approved the `ux/widgets` change (Escalation). Records hold the
reasons.

## Escalation: `ux/widgets` (approved)

The Helm's contract, widget, styles, and tests are reshaped. `ux/ui` controls are unchanged:
`UiPopover` and `UiActionButton` are used as they are.

## Current behavior

Verified against the code on 2026-11-13:

- `settings.actions` (`ux/widgets/helm-widget-contract.ts`) is one flat list of commands and
  menus. A command carries `labelMode` (`hidden`, `visible`, `visible-no-icon`). A menu has a
  label, an icon, and one level of command and status items.
- `make-helm-widget.tsx` partitions that list by presentation: menus, hidden-label commands, and
  `@tasks` render inline; every other command renders in an overflow popover.
- `@tasks` renders as a popover holding `BackgroundTaskList`, disabled while no report exists, and
  always drawn with the `update` glyph. A menu may also hold `@tasks`, which swaps that menu's
  popover to the task list; no configuration does this.
- Admin configures About, Users, Customers, Onboarding, Asset Types, Assets, Chemicals, Services,
  Theme, Tasks, a Field Binder menu (Manager, Field Binder, Synchronize, status), and Logout. Ops
  and Customer configure About, Theme, and Logout.

## Target design

### Contract

```ts
export type HelmToolbar = { items: readonly HelmToolbarItem[] }
export type HelmToolbarItem = HelmCommand | HelmMenu

export type HelmCommand = { command: string; label: string; icon: string }
export type HelmMenu = { label: string; icon: string; items: readonly HelmMenuItem[] }
export type HelmMenuItem = HelmCommand | HelmStatus | HelmSeparator

export type HelmStatus = { status: string }
export type HelmSeparator = { separator: true }
```

- `settings.toolbar` replaces `settings.actions`. Its validator replaces `readHelmActions`, with
  the same binding checks.
- `labelMode` is removed. The container decides presentation.
- A menu holds commands, status lines, and separators. Menus do not nest.
- `@tasks` is valid only in the toolbar. `@theme` and `@tasks` stay reserved.

### Rendering

- **Toolbar:** its items, inline and in order. A command renders as its icon; its label is its
  accessible name and tooltip. A menu renders as its icon, a trigger.
- **Menu:** a popover. Its `label` is plain text at the top of the popover, then its items in
  order. A command renders with icon and label. A separator renders as a horizontal rule. No
  rule follows the title unless the configuration places one.
- **Tasks:** the `@tasks` toolbar item is a menu whose items are the current `BackgroundTasks`
  reports, titled "Tasks", drawn with `update`, and disabled while no report exists.
- There is no overflow. The toolbar is always inline; narrow headers stack (dashboard
  `@container dashboard-header`).
- The in-menu task view is removed.

### Configuration

Admin:

```jsonc
"toolbar": {
  "items": [
    { "command": "/users", "label": "Users", "icon": "person" },
    { "command": "/onboarding", "label": "Onboarding", "icon": "id-card" },
    { "command": "@theme", "label": "Theme", "icon": "moon" },
    { "command": "@tasks", "label": "Tasks", "icon": "update" },
    { "label": "Field Binder", "icon": "backpack", "items": [
        { "command": "/field-binder-manager", "label": "Manage", "icon": "gear" },
        { "command": "/field-binder", "label": "Open", "icon": "backpack" },
        { "command": "@sync-field-binder", "label": "Synchronize", "icon": "update" },
        { "status": "field-binder" }
    ]},
    { "label": "Administration", "icon": "hamburger-menu", "items": [
        { "command": "/about", "label": "About", "icon": "info-circled" },
        { "separator": true },
        { "command": "/customers", "label": "Customers", "icon": "id-card" },
        { "command": "/asset-types", "label": "Asset Types", "icon": "gear" },
        { "command": "/assets", "label": "Assets", "icon": "gear" },
        { "command": "/chemicals", "label": "Chemicals", "icon": "exclamation-triangle" },
        { "command": "/services", "label": "Services", "icon": "gear" },
        { "separator": true },
        { "command": "/logout", "label": "Logout", "icon": "exit" }
    ]}
  ]
}
```

Ops and Customer: the toolbar holds Theme, then a hamburger menu titled "Operations" and
"Customer" respectively, holding About, a separator, and Logout.

Each item keeps its existing icon. No icon is added.

## Governing documents to amend

_[Amended by the amendment "After ACE review", item 2: ACE amends it first.]_
- **architecture-front §7.2.4, Document Storage:** the Binder's Helm entries are Manage, Open,
  and Synchronize, with the status line.

## Production scope

_[Amended by the amendment "After ACE review", item 1: the task list joins the scope.]_
Paths are under `source/`.

| Files                                                                         | Work                                                   |
| ----------------------------------------------------------------------------- | ------------------------------------------------------ |
| `ux/widgets/helm-widget-contract.ts`                                          | Toolbar, menu, separator types; toolbar validator      |
| `ux/widgets/make-helm-widget.tsx`                                             | Toolbar, menu popovers with titles, Tasks as a menu    |
| `ux/widgets/helm-widget.css`                                                  | Menu title and separator                               |
| `front/app-admin/dashboard-admin.json`, `app-ops/…`, `app-customer/…`         | `settings.toolbar` per the configuration above         |
| `tests/cases/helm-widget-test.ts`, `bootstrap-lifecycle-test.ts`              | Toolbar, menus, separators, titles, Tasks              |

Out of scope:

- `ux/ui` controls and the `BackgroundTasks` contract
- new icons
- nested menus and overflow
- the Field Binder's commands and status bindings, which are unchanged

Escalate any change outside this scope.

## Acceptance

- Each application's Helm renders its configured toolbar, inline and in order.
- A menu opens a popover with its label at the top, then its items, with separators as rules.
- Admin's Field Binder menu shows Manage, Open, Synchronize, and its status line.
- Admin's Administration menu is always present, with rules after About and before Logout.
- Tasks opens a popover titled "Tasks" listing the current reports, and is disabled while none
  exist.
- A configuration with `labelMode`, `@tasks` inside a menu, or a nested menu fails validation.
- CA verifies on screen in each application.

_[Amended by the amendment "After ACE review", item 3: the browser test runs too.]_
Run `deno task check`, `deno task fmt:check`, the permitted unit suite, and STYLE_AUDIT.

## Records

- **Containers, not inference.** Placement was a side effect of `labelMode`, sorting one list into
  two places. Writing each item in its container states where it appears, and the container
  decides how it looks.
- **The toolbar contains the menus.** Field Binder and Administration are toolbar items, so order
  is layout.
- **No overflow.** With the main menu always present, nothing needs to collapse; the header's
  stacked layout already serves narrow widths.
- **Tasks is a menu of reports.** It is a popover of items like any menu; its items are live.
- **Titles live in configuration.** Each application names its main menu in its dashboard JSON
  rather than deriving it from its application name.

## Amendment — 2026-11-13 — After ACE review

ACE's review raised three points. Each follows from the target design; this amendment states
them. It supersedes the marked passages in Governing documents to amend, Production scope, and
Acceptance.

1. **The task list is the Tasks menu's items.** `ux/widgets/background-task-list.tsx` (and its
   CSS, where a rule serves only what goes) joins the production scope. It keeps rendering each
   report: label, progress, error, and Dismiss. It loses its own "Tasks" heading, because the
   menu's configured label is the title, and both explanatory paragraphs, because a menu holds
   only items. The `BackgroundTasks` contract is unchanged.
2. **ACE amends architecture-front §7.2.4 first.** The amendment is in ACE's production scope and
   comes before the code, since documentation leads code.
3. **The browser test changes with the Helm.** `bootstrap-lifecycle-test.ts` drops its overflow
   and in-menu task assertions and covers the toolbar, menus, and Tasks. Its browser run
   (`-- --browser`) is part of acceptance and runs with the other checks.

_End of Brief_
