# Panel Decomposition — Production Brief

**Date:** 2026-07-22 (third session of the day)
**Supersedes:** the Phase A agenda in `2026-07-22B-panel-chrome-handoff.md`
**Ledger:** `effort/active/2026-07-20-wizard-onboarding-tasks.md`
**Design:** `effort/active/2026-07-20-wizard-onboarding-design.md`

The prior session decided that the wizard and the manager share one chrome and
left "action-bar slot ownership" as the blocker. This session resolved it by
building the object model instead of arguing the slot: the two surfaces are the
same container filled with different panel kinds, and the header is one object
appearing at two levels.

## The object model

```
Container ─┬─ Header      (1)    title · cancel
           ├─ Accessory   (0..1) progress | empty
           ├─ Index       (0..1) ← left · aside
           │     ├─ List ─────┬─ Header  (1)    title · new (0..1)
           │     │            ├─ Toolbar (0..1) search · paging
           │     │            └─ Body    (1)
           │     └─ Timeline ─┬─ Header  (0..1)
           │                  └─ Body    (1)
           └─ Subject     (1)    ← right · main
                 └─ Form ─────┬─ Header   (1)
                              ├─ Feedback (0..1)
                              └─ Body     (1)
```

**Index and Subject are roles, not positions.** Manager fills Index with a List,
wizard fills it with a Timeline. Collapse policy attaches to the role: the
manager turns Index into a _mode_, the wizard _drops_ it. Same role, two
policies, one place to declare each.

**Header is one object used at both levels** — a two-zone bar, leading and
trailing. Container header is `[title] ··· [cancel]`; a Form header is
`[← Back] ··· [Next →]` or `[← Customers │ Edit user] ··· [Save]`. Identical
mechanism, contract-supplied fill. This is the answer to the parked slot
question: **the chrome owns the bar and its zones; each surface fills them.**
Nothing inert is forced on any caller.

**Footer exists nowhere.** Paging moves up beside search into the List's
Toolbar, per the locus-of-attention principle. The dashboard's end-of-virtual-
space marker is not a counterexample — it lives inside Body as a terminator for
scrolled content, and was never chrome.

## Ratified decisions this brief depends on

- Back / Next stay **top**, in the Subject panel's header. Not a footer. The
  governing principle is locus of attention and the ergonomics of head shifting:
  controls belong where the eye already is, and title / progress / stage /
  controls are one cluster.
- The Accessory (progress) is **container level and spanning**, read-only — one
  bar plus one text line for the current stage. Not clickable, ever. Its width
  is correct because progress governs the whole flow, not one panel.
- The Accessory **serves as the stage's header**, so the wizard's Form panel
  carries no title of its own.
- Panels **span vertically until content is 100% visible; leftover negative
  space is fine.** Do not shrink-wrap and do not add scroll to avoid empty space.
- Feedback sits **under the header bar** (the manager's current placement). The
  wizard moves its feedback out of the card body to match.
- Index is `<aside>`, Subject is `<main>`. `abstraction-manager.tsx` currently
  uses `<section>` for both, which wrongly states they are peers.
- `PanelTimeline` is **hand-built** — Kobalte 0.13.11 has no timeline or stepper,
  and this adds **no new `Ui{Control}`**; the Ui layer stays closed. Compose from
  `UiList` + `data-feat`, as the current step list already does.

## Names

| Object               | Type             | File                           |
| -------------------- | ---------------- | ------------------------------ |
| Container            | `PanelContainer` | `ux/shell/panel-container.tsx` |
| Header (both levels) | `PanelHeader`    | `ux/shell/panel-header.tsx`    |
| List kind            | `PanelList`      | `ux/shell/panel-list.tsx`      |
| Timeline kind        | `PanelTimeline`  | `ux/shell/panel-timeline.tsx`  |
| Form kind            | `PanelForm`      | `ux/shell/panel-form.tsx`      |
| Shared types         | —                | `ux/shell/panel-contract.ts`   |

`panel-contract.ts` exports `PanelContainerProps`, `PanelHeaderProps`
(`leading` / `trailing`), `PanelRole = 'index' | 'subject'`, and `PanelFeedback`.

`PanelFeedback` **replaces** `WizardFeedback` and `AbstractionManagerFeedback`,
which are byte-identical today. This is a deletion, not a new type.

Index and Subject are **slots on `PanelContainer`**, not components — making them
components adds two wrappers that only ever hold one child.

`WizardProgress` stays **wizard-owned** and is passed into the accessory slot.
The manager has no progress; putting it in the shared family would be exactly the
inert member this decomposition exists to avoid.

## Layering

```
app-admin/onboarding   Onboarding     supplies WizardContract
app-admin/users        UserManager    supplies AbstractionManagerContract
                              ↓
ux/shell    Wizard  |  AbstractionManager      sequencing · selection · own contracts
                              ↓
ux/shell    PanelContainer + List/Timeline/Form   geometry · chrome · roles · collapse
                              ↓
ux/ui       UiCard · UiDialog · UiTable · UiActionButton
```

`Wizard` keeps `stepIndex`, the `canAdvance` gate, commit orchestration and
hold-on-throw, Back/Next semantics, and `WizardContract` / `WizardStage`
unchanged. `AbstractionManager` keeps `selected`, `mode`, the pending-action
confirmation dialog, `listColumns` / `renderListCells` / `renderForm`, and
`AbstractionManagerContract` unchanged.

**The two contracts stay separate.** That is what stops a wizard from inheriting
sort keys and page indices it can never use.

The panel family has **no provider contract** — pure composition, props and
children. Pages may compose it directly to build a surface that is neither a
manager nor a wizard; that is intended, and is the same relationship feature
styles already have to `data-ui`, one stratum up. `Wizard` and
`AbstractionManager` are therefore two compositions of the layer, not the layer
itself.

## What is duplicated today (the deletion inventory)

| Rule                                                             | wizard.css | abstraction-manager.css |
| ---------------------------------------------------------------- | ---------- | ----------------------- |
| root block sizing, `max-block-size`, `display:grid`, `gap`, rows | 8–14       | 8–15                    |
| title row                                                        | 16–21      | 17–23                   |
| title                                                            | 28–32      | 25–30                   |
| card shell                                                       | 122–127    | 46–53                   |
| card header                                                      | 129–134    | 55–62                   |
| card body (scroll inset)                                         | 136–146    | 125–132                 |
| 480 full-screen block                                            | 165–179    | 208–223                 |

In TSX the title row is the same five lines in both files.

After extraction each surface's CSS retains roughly three things: its
`grid-template-columns`, its own `@container` threshold literal, and its
collapsed policy. The threshold must stay surface-side — container query
conditions cannot take `var()`.

## The UiDialog seam

Two defects, both to be fixed in this production.

**Two owners on the block axis.** `UiDialog` declares
`max-block-size: calc(100dvh - pad * 2)` (`ui.css:1240`); the shell root declares
`max-block-size: calc(100dvh - pad * 4)` _and_
`block-size: clamp(32rem, 72dvh, 44rem)`. The inner is always stricter, so the
dialog's ceiling is dead code — and because the dialog sets no `block-size`, the
dialog's height is decided by its child reaching around it to `dvh`.

**~~The container query measures the wrong box.~~ WITHDRAWN — this was wrong, and
acting on it broke P1.** The original text claimed `container-type: inline-size`
belonged on `PanelContainer` rather than the dialog, on the theory that the shell
was "querying geometry it does not own."

**Containment must stay on `[data-ui='dialog']`.** `PanelContainer` renders the
surface's own feature hook and the container role on **one element**
(`panel-container.tsx:14`), and **an element is never its own query container** —
container queries resolve against ancestors only. Declaring `container-type`
there silently kills every `@container` rule a surface writes against itself,
including `abstraction-manager.css`'s
`[data-feat='abstraction-manager'] { grid-template-columns: 1fr }`. Collapse then
never fires, the two-column grid keeps its ~866px track floor inside a narrower
dialog, and the panels overflow. Worse, it fails _half_-dead: rules targeting
`> [data-feat-panel='index']` still match, because those subjects are descendants.

The 82px figure was never evidence of the wrong box. The dialog's content box
_is_ the box the container fills; the offset is just that number expressed
relative to the viewport, and it is a property of dialog padding and margin.

If thresholds must ever be decoupled from dialog padding, the only sound route is
splitting `PanelContainer` into an outer containment element and an inner grid —
which moves `grid-template-columns` off the surface's feature hook and changes the
contract. Do not attempt it as a side effect of anything else.

Fix that stands — **as actually shipped and verified 2026-07-22** across wide,
collapsed and full-screen. All four parts are load-bearing; removing any one
reproduces the overflow.

1. The block clamp lives on `[data-ui='dialog'][data-ui-size='workbench']`.
2. That dialog is `display: grid` with **`grid-template-rows: minmax(0, 1fr)`**.
   Plain `1fr` is `minmax(auto, 1fr)`, and the `auto` minimum floors the row at
   its content's min-content height — measured live at 1185px inside a 623px
   dialog. The row must be released to 0.
3. `[data-ui='dialog'][data-ui-size='workbench'] > * { min-block-size: 0 }`.
   Grid items default to `min-block-size: auto`, so content can floor the _item_
   above an already-bounded row.
4. `PanelContainer` fills `block-size: 100%` — **not**
   `calc(100% - dialog-pad * 2)`. Under the global `border-box`, `100%` already
   resolves against the dialog's content box, which has the padding removed;
   subtracting it again leaves the container 2×pad short.

**Why 2 and 3 exist:** a page-level wrapper sits between the dialog and the
container (`data-feat='users-page'`, `data-feat='onboarding-page'`), so the
container's percentage does not resolve against the dialog directly. The grid row
stretches that wrapper to a definite height, making it transparent to sizing.
Without it the percentage silently degrades to `auto` and the surface grows to
content.

**Known fragility — flagged, not fixed.** Dialog-owns-block means the percentage
chain must survive every wrapper between dialog and container. It survives one.
A second nested wrapper would break it again, silently. The sturdier alternative
is to put the absolute clamp back on `PanelContainer` and take it off the dialog
— still single-owner, no percentage chain. Not done, because the current form is
verified working; revisit if a third breakage appears.

The inline axis is already clean — `workbench` uses `--sa-size-*`. The
`48rem`/`32rem`/`24rem`/`20rem` literals are on the `default` and `content`
sizes and are not in play.

**Raised, not decided:** once the block clamp lands in `ui.css` it sits as raw
`32rem`/`44rem` beside a tokenized inline axis. Block-axis `--sa-size-*`
equivalents are a token decision for the CA. The delegate must not invent token
names.

## The gutter contract — carry it deliberately

The seam fixes above change only _which box owns sizing_ and _which box queries
measure_. Device-edge padding and radius are separate rules and must be carried
across on purpose.

**This keys on the device axis alone.** Collapsed changes topology and nothing
else — it never touches padding. At ≤480 both fire together only because a
sub-480 viewport is always a sub-768 container.

Per state:

| State       | Gutter                                                                           |
| ----------- | -------------------------------------------------------------------------------- |
| wide        | host pads (`--sa-dialog-pad`)                                                    |
| collapsed   | host pads — unchanged                                                            |
| full-screen | host pads **0**; the container re-pads its own bare chrome; panels go full-bleed |

At `@media (max-width: 480px)`:

1. The dialog already drops to `padding: 0` (`ui.css:1273`). Unchanged.
2. `PanelContainer` re-pads its bare chrome — **both the Header and the
   Accessory**, not just the header. Today each surface re-pads only its title
   row, which is why the wizard's progress rail currently sits flush to the
   viewport edge at full-screen: it lives inside `wizard-content`, whose
   `padding-inline` was deleted last session, and nothing re-pads it. Doing this
   once in the container closes that bug.
3. Panels go full-bleed — `border-radius: 0`, currently duplicated in both
   surface files, moves into the panel CSS.

Bonus from fix 1 above: with `container-type` on `PanelContainer`, its content
box at full-screen is exactly `100vw`, so thresholds measure true width. The 82px
offset disappears where it was most confusing.

## Productions

Gated. Scope declared, go received, checks run, results reported.

### P1 — Panel family + manager migration

1. Create `panel-contract.ts`, `panel-container.tsx`, `panel-header.tsx`,
   `panel-list.tsx`, `panel-form.tsx` and their CSS.
2. Migrate `AbstractionManager` onto them. Delete the duplicated rules from
   `abstraction-manager.css`, leaving columns / threshold / collapsed policy.
3. Apply the `UiDialog` seam fixes.
4. `<aside>` / `<main>` correction.

The manager goes first deliberately — two panels, both header shapes, the
collapse mode. If `PanelHeader`'s zones survive it, the wizard is a formality.
Doing it in the other order tests nothing.

**Gate: CA revalidates User Manager closely before P2 starts.** This is a
regression-sensitive migration of committed, working code.

### P2 — Wizard migration + Timeline

5. Migrate `Wizard` onto the family; feedback moves under the header bar; the
   `wizard-content` wrapper and its `UiLayout block-fill` disappear as panels
   become direct grid children.
6. Build `PanelTimeline` and wire it into the wizard's Index.
7. Fix the known blocker: `wizard.tsx:108` writes
   `style={{ 'inline-size': barFill() }}`, so the host names the _axis_ and CSS
   cannot flip the rail. The host must publish the scalar
   (`--sa-wizard-progress`); CSS chooses `inline-size` or `block-size` per state.

### P3 — Customer sites

**Design pending — the CA is holding his own thinking and will supply it.** He
has stated only that it follows the same principles as the rest of this session.
Do not design it, and do not infer it from the analysis below.

What is recorded so far, as defects observed in the built stage 3, not as a
proposed fix:

- The added-sites list renders _above_ the capture form (`onboarding.tsx:363`),
  so every successful add grows the list and pushes the form further down. The
  work surface moves away from the user as a direct consequence of succeeding.
- Eleven inputs and two buttons in one column, against stage 1's four. The
  stages are not balanced.
- Nested fieldsets, three legends — "Add Job Site (optional)" wrapping
  "Address (optional)", beside "Added Sites".
- "(optional)" appears five times, in three distinct misuses: redundant at field
  level where `required` markers already carry it inversely; standing in for a
  _stage_-level truth in "Add Job Site (optional)"; and outright **false** on
  "Address (optional)" / "Coordinates (optional)", where `canAddSite`
  (`onboarding.tsx:335`) requires one of the two.
- A 4-row textarea buried mid-form between acreage and the add button.
- `--sa-radius-default` (`onboarding.css:33`) is an undefined token; those site
  cards render square.
- Twelve signals hand-reset in `addSite` — the code-shaped symptom of a record
  editor smuggled into a stage.

## Out of scope for P1 and P2 — do not touch

- **Stage 3 / sites.** Deferred to P3 above. No changes to `onboarding.tsx`
  stage content in P1 or P2.
- **The `abstraction-manager` → `manager` rename — dropped.** Names and
  `data-feat` strings stay. The `use-abstraction-form-*` hooks keep their names.
- **Toolbar contents.** Search, sort and paging do not exist in
  `abstraction-manager.tsx` today. Build the _slot_; do not invent the controls.
- **Timeline header contents.** Probably none — the container header names the
  flow and the accessory names the stage, so a third label is the redundancy this
  session has been cutting. Decide when the geometry is visible.
- **COW stage layout rework.** Separate thread.

## Delegate constraints

- Model **haiku**. Budget-lean.
- **Git read-only.** No `checkout`, `restore`, `add`, `commit`, `mv`, `stash`.
  A prior delegate reverted four files outside its scope and made a guard
  vacuously green.
- **Claude never commits.** The CA commits everything himself.
- CSS: no class names. `data-ui` is the Ui layer's; features target `data-feat`.
  Two-layer tokens (`--sa-p-*` → semantic). No raw literals in feature CSS.
  `@keyframes` in feature files must root at `[data-feat` — promote reusable
  ones to `base.css` (see `sa-fade-in`).
- Rhythm tokens: `gutter` = page padding only and is **taken**; `pad` = box
  interiors; `gap` = space between siblings. A surface needing an inline measure
  distinct from its block measure requires a **new** token — do not repurpose.
- Do not propose the guards as future work; twelve already ship.

## Verification

```
deno task fmt
deno task check
deno task test
```

`check` runs twelve guards, then types, then lint. Run `fmt` first — dprint
stability has bitten this work before. Report results verbatim; do not
characterize a run as green without the output.

Live passes are the CA's authenticated Chrome — the agent browser reaches only
the OTP login and cannot authenticate.

---

_End of Brief_
