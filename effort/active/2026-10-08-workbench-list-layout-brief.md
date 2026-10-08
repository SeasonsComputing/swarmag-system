# Workbench List Layout — Brief

**Active, not yet dispatched.** Written 2026-10-08 from a CA + AI Architect exploration session,
after the CA's stage walkthrough of the tags → facets production found cosmetic defects in the
workbench. Chosen for immediate production, so it starts in `effort/active/`. Reviewed by the AI Coding
Engine on 2026-10-08; the amendment at the end resolves that review and marks the items it
changes. It awaits the production gate. It also settles the workbench Aside/Main proportion the CA
had asked to revisit after the 2026-10-04 walkthrough.

## What triggered it

The CA's walkthrough on 2026-10-07, at widths above the workbench collapse point (viewport 759 and
up):

1. **Drill-down action column staggers.** In the Sites step's Notes table, when a note's text wraps,
   the Delete cell's bottom border sits under the button, not at the row's bottom.
2. **Customer Manager list hides its actions.** The aside list is wider than the aside, so its
   right half, Status and Actions, needs horizontal scrolling. Everything fits only from about 893
   viewport. Scrolling is `UiTable`'s correct fallback; the defect is that in this context the user
   must scroll to find the row actions.
3. **Selected-row state in the device emulator.** Out of scope: the control-state backlog entry
   ("The shared control layer does not assign one stable meaning…") covers it. A likely cause, for
   that entry: under touch emulation the tapped row keeps `:hover`, which `ui.css` applies without
   a `(hover: hover)` guard.

The CA had also observed that User Manager's list table fits at every width while Customer
Manager's does not, and proposed sharing User Manager's table rules.

## What the repository holds

**The action-cell rule.** `ux/ui/css/ui.css` gives an end-aligned cell holding an action button
`display: flex`. A flex box in a table row is not a table cell: it does not stretch to the row's
height, so its border stops under the button.

- **2026-06-23, `67607e6`:** the flex rule is added, to lay out the manager's action buttons.
- **2026-07-14, `090f0fa`:** User Manager meets the defect and overrides it locally back to
  `display: table-cell`. The fix never reaches `ux/ui`.
- **2026-08-14:** the job-sites drill-down brief adopts the rule as sound, and `CollectionPanel`
  inherits the defect.

Its only consumers are `abstraction-manager.tsx` and `collection-panel.tsx`. The style guide never
places an action button in a table, and no `ux/` test renders `UiTable`, so neither exercises it.

**User Manager's table rules** (`user-manager.css`): `table-layout: fixed` at `width: 100%`,
horizontal overflow clipped, a fixed status-column width, and an actions-column width calculated
from the action count. That count once read 3 after an action was removed, stranding 42px. The
status pill hand-copies `UiBadge`'s variant colors, and its icons are hard-coded mask URLs
(`check.svg`, `minus.svg`) rather than the icon catalog.

**Customer Manager** has none of this: its table takes `UiTable`'s default `width: max-content`,
under which no cell wraps.

**Workbench proportions.** The Abstraction Manager and the Wizard share floors (aside 280, main
`--sa-size-min` 380) and a 676 container collapse point, with mirrored weights: the manager 1.7/1.3,
the Wizard 1.3/1.7. Weights distribute surplus only, so they do not affect the collapse point. Under
1.7/1.3 the manager's main panel is pinned at its floor for every container from 677 to 893. The
container (`panel-container.css`, "Shared geometry for the container, its panel roles") is used
only by these two surfaces. No document records the weights.

**The manager contract** (`abstraction-manager-contract.ts`) splits each list column in two:
`listColumns: string[]` for header labels, rendered by the shell, and `renderListCells` for a
fragment of `UiTableCell`s, rendered by the manager. They correspond by position only. No document
describes the contract.

## Decisions

1. **Row actions stay in the row.** One-tap action and the same form on every device are why the
   design has an actions column. The alternatives were weighed and rejected (Design history).
2. **In a manager's list, actions are always visible.** The list fits its aside and wraps rather
   than scrolling. `UiTable`'s horizontal-scroll fallback is unchanged everywhere else.
3. **The action cell stays a table cell, in `ux/ui`.** The defect lives in the control, and every
   consumer is broken by it or overrides it. User Manager has proven the fix since July.
4. **One Aside/Main proportion.** `minmax(280px, 1fr) minmax(var(--sa-size-min), 1fr)`, owned by
   the panel container, for the Abstraction Manager and the Wizard. A fitted, wrapping list is what
   lets the manager accept a narrower aside.
5. **Columns keep their labels.** A header labels its column as a label does a field, and dropping
   one breaks the header bar's geometry. Where a header is wider than its content, the header sets
   the column's width.
6. **Interior narrow columns are centered; outer columns align to the table's edges.** When a
   header is wider than its content, centering puts both on one axis. The first column is
   start-aligned and the last end-aligned, framing the table. Header and cells always share an
   alignment.
7. **One definition per list column.** `AbstractionListColumn<T> = { label, align?, render }`
   replaces `listColumns` and `renderListCells`; the shell renders each column's header and body
   cells from it. Alignment is declared once, positional matching goes, and providers render cell
   content only.
8. **Status is an icon, on `UiBadge`.** A shared status badge in `front/app/`: `UiBadge` with
   variant and an icon from the existing catalog. Customer status: `check`/success (active),
   `minus`/warning (inactive), `target`/info (prospect). User status keeps `check`/success and
   `minus`/warning.
9. **Customer Manager's contact moves under the name.** Customer and Status remain columns. Status
   is not merged into the identity cell.

## Production scope

Operating mode: **Foundation** (a `ux/ui` control rule, `ux/shell` layout, and a shared shell
contract; `ux/` is under strict scrutiny).

1. **`ux/ui/css/ui.css`.** The rule for a cell holding an action button, whatever its alignment,
   keeps the cell a table cell: `vertical-align: middle` and `white-space: nowrap`; the
   `display: flex`, `align-items`, `justify-content`, and `gap` declarations go. Adjacent action
   buttons in a cell are spaced with `margin-inline-start: var(--sa-rhythm-gap-tight)`.
2. **`ux/ui/components/ui-table.tsx`.** Export `UiTableAlign` (`'start' | 'center' | 'end'`) and
   use it for `UiTableCell`'s `align`. Type-only.
3. **`ux/shell/panel/panel-container.css`.** _[Revised by the amendment "ACE review resolved",
   Decision 2: a zero-specificity default.]_ A container with an aside panel takes
   `grid-template-columns: minmax(280px, 1fr) minmax(var(--sa-size-min), 1fr)`.
   `abstraction-manager.css` and `wizard.css` drop their `grid-template-columns` (the Wizard's
   `single` mode override stays). Both 676 `@container` blocks stay. Their comments are rewritten
   to cite the container's floors and drop the weight reasoning.
4. **`ux/shell/workbench/abstraction-manager.css`.** _[Revised by the amendment "ACE review
   resolved", Decision 3: section rows are excluded.]_ In the aside list: the table is
   `width: 100%`; body cells take `overflow-wrap: anywhere`; the last cell takes `width: 1%`, so
   the actions column shrinks to its buttons or its header, whichever is wider.
5. **`ux/shell/workbench/abstraction-manager-contract.ts` and `abstraction-manager.tsx`.** Add
   `AbstractionListColumn<T>` (`label: string`, `align?: UiTableAlign`,
   `render: (item: T) => JSX.Element`) to the header's PUBLIC block. `listColumns` becomes
   `AbstractionListColumn<T>[]`; `renderListCells` is removed. The shell renders each column's
   header cell and body cells with the column's alignment, then the Actions column, end-aligned.
6. **Shared status badge in `front/app/`.** _[Placed by the amendment "ACE review resolved",
   Decision 1.]_ A component and its colocated stylesheet: `UiBadge`
   with variant, an icon from the catalog, and an accessible name (`aria-label`, `title`). It takes
   the variant, icon, and label from its caller. Placement within `front/app/` is the ACE's to
   propose at review.
7. **`front/app-admin/customers/customer-manager.tsx` and `.css`.** Columns: Customer (name, then
   contact as a second line) and Status (centered, the shared badge).
8. **`front/app-admin/users/user-manager.tsx` and `.css`.** _[Corrected by the amendment "Sticky header
   restored": the overflow clip was load-bearing.]_ Columns: User (unchanged content) and
   Active (centered, the shared badge). Remove what items 1, 4, and 6 replace: the fixed layout and
   width, the overflow clip, both column widths, the action-cell override, the action-button
   margin, the status pill and its masks, and the email `overflow-wrap`. Identity text styling
   stays.

**Out of scope:** removing the header row from drill-down tables (the CA is considering it
separately); hover and selected row state (control-state backlog entry); any new icon; any change
to `UiBadge`; the drill-down's layout beyond what item 1 changes; User Manager's
`cursor: default` on rows.

## Checks

- `deno task check` (guards, types, lint) and `deno task fmt:check`.
- `deno task test`, with `users-api-test.ts`'s bootstrap failure reported as known.
- `STYLE_AUDIT` per `AGENTS.md` §2.2.

## Verification

_[Refined by the amendment "ACE review resolved", Decision 4.]_

- The AI Architect re-derives the report against the diff and the check output (EFFORT §6).
- The CA's walkthrough, between viewport 759 and about 893, and at desktop width:
  - User and Customer Manager lists: actions visible without scrolling; a long name wraps;
    status badges centered under centered headers.
  - Sites step Notes drill-down: a wrapping note keeps the Delete cell's border on the row's
    bottom.
  - Onboarding Wizard and both managers: the even Aside/Main proportion; collapse unchanged.

## Escalation boundaries

Stop and report if:

- item 1 changes the rendering of any `UiTable` consumer other than the two shell surfaces;
- the shrink-to-fit actions column cannot hold under the fitted table;
- the status badge needs a `ux/ui` change, or the icon catalog cannot be used from `front/` within
  the CSS guard (no hard-coded icon URLs).

## Design history

- **Fit versus scroll.** The AI Architect first proposed fitting every list to its aside. The CA
  reframed: scrolling is the table doing its job; the defect is actions out of view in this
  context. Pinning the actions column with `position: sticky` kept the fallback and was the
  leaning, until the CA's layout changes (contact under the name, status as an icon) made the
  list fit by content, and a fitted, wrapping table turned "fits today" into "always fits."
- **Where row actions live.** Surveyed: an actions column (current); an overflow menu (Material,
  GitHub); reveal on hover (desktop only); swipe to reveal (touch only); a context menu (hidden);
  actions in the detail header (Mail, Contacts). The last was recommended by locus of attention.
  The CA kept the row actions for one-tap action and the same form on every device, which is how
  the current design came to be.
- **Changing `ux/ui`.** The CA questioned changing a low-level control with numerous consumers
  when the style guide showed no defect. The census and history above answered it: the style guide
  never exercised the rule.
- **Where the proportion lives.** A new `ux/shell/workbench/workbench.css` was proposed, then
  dropped: every stylesheet in `ux/shell` and `front/` pairs with a component, and the panel
  container already owns the Aside/Main geometry.
- **Headers wider than content.** Options: let the header set the width; hide the header text of
  self-describing columns; hide the header row in the aside. The CA rejected hiding: a header is a
  label, and a missing one breaks the bar's geometry.
- **Alignment.** Centering narrow columns was the CA's; the AI Architect added that header and
  cells must share an alignment. The CA refined it: the last column never looks good centered.
- **The contract.** Extending only the labels (`{ label, align }`) would declare alignment twice;
  one definition per column was chosen.

## Amendment — 2026-10-08 — ACE review resolved

The AI Coding Engine reviewed the brief against the source on 2026-10-08. It confirmed the defect
diagnosis, the consumer census, that only User and Customer Manager implement the contract being
replaced, that `UiTableAlign` reaches the `ux/ui` barrel, and that `check`, `minus`, and `target`
are in the icon catalog and can be consumed from scoped app CSS through `var(--sa-icon)` without
hard-coded URLs or a `UiBadge` change. It raised one conflict and one implementation trap, and
refined verification.

### Decisions

1. **The status badge lives in `front/app/shell/status-badge.tsx`,** with its colocated
   stylesheet. The review noted that `architecture-front.md` §10.1.5 moves a component to
   `front/app/` only when a second swarmAg app needs it, and both consumers are in Admin. The CA
   ruled `front/app/`: its relationship to each `app-{name}/` is far closer than an app's to
   `ux/`. This is a recorded exception; §10.1.5 is unchanged. It goes in `shell/`, where the shared Notes Editor is planned, not a new
   `app/components/` as the review proposed: the CA reserves that for components that will
   obviously move to `ux/` eventually, and this badge is not one. The
   badge's graphic carries explicit accessible semantics (`role='img'`, `aria-label`, `title`).
2. **The shared proportion is a zero-specificity default.** _[Superseded by the amendment "Guard
   correction": the selector must start with `[data-shell`.]_ The selector in item 3,
   `[data-shell-panel='container']:has(> [data-shell-panel='aside'])`, has specificity (0,2,0). It
   would override both surfaces' (0,1,0) collapse rules and tie with the Wizard's `single` mode
   rule; the original item 3 was wrong that the `single` override would simply stay. The review
   proposed `[data-shell-panel='container']:where(:has(…))`, which is (0,1,0) and still ties the
   collapse rules on source order. The whole selector is wrapped instead:
   `:where([data-shell-panel='container']:has(> [data-shell-panel='aside']))`, specificity
   (0,0,0), so every surface rule wins regardless of stylesheet order.
3. **The shrink-to-fit rule skips section rows.** An empty list renders one section row whose
   single cell is also its last; item 4's `:last-child { width: 1% }` would squeeze
   "No … found." to a sliver. The rule applies to the header row and to rows that are not
   `data-ui-variant='section'`.
4. **Verification is refined.** "Even proportion" means equal flexible weights subject to the
   floors: near collapse, Main holds 380 and the Aside is narrower; equal widths are expected only
   once both floors are satisfied (container 776 and up). The walkthrough adds:
   - containers just below, at, and just above the 676 threshold;
   - a single-step Wizard;
   - an empty manager list;
   - long unbroken names and email addresses;
   - both User actions (Delete, Eject) in one row.

## Amendment — 2026-10-08 — Guard correction

The AI Coding Engine checked the first amendment against the guards. Its Decision 2 fails
`guard-css.ts`, which requires every shell selector to start with `[data-shell`;
`:where([data-shell-panel='container']…)` does not.

### Decision

**Surface rules outrank the shared default by one attribute.** `PanelContainer` renders
`data-shell={feature}` and `data-shell-panel='container'` on one element, so:

- The shared default in `panel-container.css` is
  `[data-shell-panel='container']:where(:has(> [data-shell-panel='aside']))`, specificity (0,1,0).
- The two collapse rules that set `grid-template-columns: 1fr` add the container attribute:
  `[data-shell='abstraction-manager'][data-shell-panel='container']` and
  `[data-shell='wizard'][data-shell-panel='container']`, specificity (0,2,0). The panel-visibility
  rules in the manager's collapse block are unaffected.
- The Wizard's `single` mode rule, `[data-shell='wizard'][data-shell-mode='single']`, is already
  (0,2,0).

Every surface rule wins regardless of stylesheet order, and no guard changes.

## Amendment — 2026-10-08 — Guard scope extension

Recorded under EFFORT §8: an escalation boundary was crossed on the CA's approval in conversation.

**Why.** AI Architect verification asked for the list rules in `abstraction-manager.css` to use a
shell hook (`data-shell='abstraction-manager-list'`) instead of bare `aside`, `td`, and `tr`
selectors. The hooked row selector is too long for one line, and `guard-css.ts` read only the line
holding the opening brace, so it missed the hook on the lines above. The AI Coding Engine stopped
at the boundary (AGENTS §3.3) and asked; the CA approved extending scope to the guard.

**What changed in `source/devops/guards/guard-css.ts`.**

- A selector split across lines is read back to the preceding declaration or block and checked
  whole.
- A selector list is split at top-level commas (not inside parentheses, brackets, or quotes), and
  each selector is checked for its root; the AI Architect's review of the first patch found that
  checking only the joined list let an unrooted second selector pass.
- Icon catalog rules check each selector of a list, and check declarations only inside a
  recognized icon rule.

**Verified** by the AI Architect with a scratch fixture, since removed: an unrooted second selector
is rejected; commas inside `:is()` and `:not()` and a three-line selector pass.

## Amendment — 2026-10-08 — Sticky header restored

The CA's walkthrough found the manager list's header scrolling away with its rows.

**Cause.** `UiTable`'s header is sticky within its nearest scroll container. The table container
defaults to `overflow-x: clip` so that the scrolling panel body is that container (`ui.css`,
"`clip` (not `hidden`)…"). The manager list used `overflow='scroll'`, whose `overflow-x: auto`
makes the table container a scroll container in both axes and traps the header in a box that never
scrolls vertically. User Manager's header stuck only through a local `overflow-x: clip` override,
which item 8 listed for removal as part of the fixed layout. It was not: it kept the header in
place. Customer Manager's header never stuck.

**Decision.** The manager list drops `overflow='scroll'` (`abstraction-manager.tsx`). A fitted list
never scrolls horizontally, so the default `clip` applies and both managers' headers stick to the
panel body. Applied by the AI Architect on the CA's approval; `deno task check` and
`deno task fmt:check` pass.

**Not fixed here.** In `UiTable`, `overflow='scroll'` and the sticky header cannot coexist unless
the table container also has a bounded height. Recorded on `UiTableOverflow` in `ui-table.tsx`;
no backlog entry, since every swarmAg panel is bounded and the fix moves that bound to the table
when a wide table first needs it.

_End of Brief_
