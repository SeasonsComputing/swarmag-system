# Panel Chrome & Rhythm Tokens — Session Handoff

**Date:** 2026-07-22 (second session of the day)
**Status:** No code milestone closed. The session's product is a **design
decision** (wizard and manager share one chrome), a **corrected token
vocabulary** now written into the docs, and a set of small verified fixes.
**Supersedes:** `2026-07-22-cow-build-handoff.md` for the layout thread.
**Ledger:** `effort/active/2026-07-20-wizard-onboarding-tasks.md`
**Design:** `effort/active/2026-07-20-wizard-onboarding-design.md`

## Worktree

Clean. Everything below is committed in `223c348` ("Expand layout variants and
rhythm docs") and `4f5e8a2` ("Moved panel sizing to outer grid"), plus the
`architecture-front.md` reconciliation folded into `c451f6b`.

## What shipped

**`architecture-front.md` reconciled to the actual tree.** The `common/` → `ux/`
rename had never propagated into the doc. Fixed §2, §10.1, §10.2, §11.2.1 —
including build composition (`front/app-admin + front/ux + front/api +
front/config`), the `ux/ui/` tree shape, and `customer-prospect` → `onboarding`.
Unbuilt directories were deliberately left in place: §2 is a **normative target**
tree and forward declarations are not drift.

**Two inline-rhythm bugs in the wizard.** `[data-feat='wizard-content']` carried
`padding-inline`, giving the wizard a _second_ inline origin on top of the
dialog's own `--sa-dialog-pad` — that is why its title sat left of its progress
rail. Deleted; the host owns the gutter above 480. Separately the root declared
three grid rows against two rendered children, so the content sat in an `auto`
row while an empty `1fr` row absorbed the remaining height (which also defeated
`block-fill`, whose `100%` had nothing definite to resolve against).

**Manager two-column dead band eliminated.** Its grid declared
`minmax(--sa-size-xs, …)` on _both_ tracks — a 866px minimum — while collapse
fired at a 768px container, so viewports 851–947 rendered a manager too wide for
its dialog. The panel rule already declared a 320px minimum that the track was
silently overriding; honoring it (`minmax(--sa-size-min, 1fr)`) drops the
two-column minimum to 761px and closes the gap with 8px to spare. The two
now-redundant `min-inline-size` declarations were removed, leaving the minimums
stated in exactly one place.

**Manager adopts the wizard's max height** — `clamp(32rem, 72dvh, 44rem)`.

**Rhythm token vocabulary documented** in `ux-design-language.md` §5.2 and
mirrored as a comment block in `tokens.css` at the point of use.

## The rhythm token roles — the correction that drove the session

```
--sa-rhythm-gutter →  PAGE padding, and only page padding
--sa-rhythm-pad    →  BOX INTERIORS (--sa-card-panel-pad, --sa-dialog-pad)
--sa-rhythm-gap    →  SPACE BETWEEN siblings
```

`gutter` is **taken**. Its sparse use (dashboard, style guide) is correct use —
there are only two page-level surfaces — and its wide clamp is deliberate
because page margins scale hard while box interiors must not. It was nearly
repurposed as a dialog inline-axis token during this session, which would have
given one token two conflicting meanings; `guard:css` would not have caught it,
because a wrong token is still a legal token reference. **A surface needing an
inline measure distinct from its block measure requires a new token.**

Raising `--sa-rhythm-pad` widens every card and dialog interior in the system at
once. That reach is intended, not a side effect, and it is why the CA's raise
this session improved every surface simultaneously.

## Decisions

**Wizard and manager share one CHROME; their contracts stay separate.**
`WizardFeedback` and `AbstractionManagerFeedback` are byte-identical and both
contracts open with `formTitle` — the chrome is already duplicated, in places
character-for-character. What does _not_ merge is the selector: a manager's list
carries sort key, direction, page index, page size and a search query; a
wizard's rail carries one integer. Merging them yields a contract whose members
are inert for every wizard ever written.

**The wizard is a manager's create path**, and this needs no type change:
`renderForm: (item: T | null, onClose) => UiComponent` already takes `null` to
mean create, and `Wizard` returns a `UiComponent`. The only blocker is that the
wizard renders its own dialog chrome, so nesting double-chromes it. Extracting
the chrome is therefore the _enabler_, not hygiene — and it closes the
create-only/no-readback gap structurally, since Finish returns to the list
containing what was just made. This supersedes D15 "prospect hub" as a separate
surface.

**Responsive behavior is a 2×2, not three states.** Layout axis
(wide | collapsed) is a _container_ question — does my box have room for two
panes. Device axis (normal | full-screen) is a _device_ question — should this
stop being a window. The mixed instruments are load-bearing: two queries of the
same type could not express the off-diagonal.

Gutter contract per state: wide and collapsed → host pads; full-screen → host
pads 0, the surface re-pads its own bare chrome, cards go full-bleed.

**Container thresholds on this dialog are offset from the viewport by 82px** —
`100vw − 40` margin `− 40` padding `− 2` border, because `box-sizing` is
`border-box` globally and a container query measures the content box. The
manager collapses at a 850px viewport, confirmed empirically.

**Stages become a vertical timeline when wide**, the horizontal rail when
collapsed. This makes the wizard structurally identical to the manager in wide —
selector column ‖ panel column, title row spanning — so the grid is shared.

**Chrome owns the mechanism; each surface owns its tracks.** A manager's list is
content-unbounded (a table) and wants a fraction; a wizard's timeline is
content-bounded (N labels known at build) and wants `max-content`, or it sprawls
at 1440px. Each surface declares exactly three things — its
`grid-template-columns`, its own `@container` threshold (conditions cannot take
`var()`), and its collapsed policy. Collapsed policy differs legitimately:
the manager's selector becomes a **mode**, the wizard's becomes a **strip**.

**Orientation: portrait-first as a design rule, never a lock.** Every surface is
designed portrait-first; no surface is designed landscape-first; landscape
remains operable and unoptimized. Landscape is hostile to _forms_ specifically —
the software keyboard takes 45–60% of a landscape viewport. Locking was
considered and rejected: it would blank the mounted-cab map, which is a genuine
use case; it is unenforceable on iOS (manifest `orientation` ignored,
`screen.orientation.lock()` throws); and WCAG 1.3.4 permits it only where an
orientation is essential, which the portrait-idiom argument itself denies.

## Corrections to prior understanding

- The **icon semantic-alias layer was deleted** in the preceding commits — every
  icon name is now identical to its SVG filename, guard-enforced, and
  `UiActionButton.icon` is an open `string` (the `UI_ACTION_BUTTON_ICONS` enum is
  gone tree-wide). The old "catalog = palette, enum = curated subset" model is
  dead.
- **Three hardcoded masks remain**, not one as previously recorded:
  `ui.css:338` (single-select chevron), `user-manager.css:93` and `:100`. The
  latter two also reach across the app→ux boundary via `../../ux/ui/icons/`,
  which `guard-namespaces` catches for TS imports but nothing catches for CSS
  `url()`.
- Effort docs live in `effort/active|completed`, not `documentation/project/`.

## Open / parked

| Item                                                                                     | State                                                                                                 |
| ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Action-bar slot ownership — chrome owns the _slot_ (contract fills it) or the _buttons_? | **Blocks Phase A**                                                                                    |
| wide + full-screen cell (landscape phone)                                                | **Parked.** Unreachable today; candidate fix is `@media (max-width: 480px), (max-height: 480px)`      |
| §5.x doc for the 2×2                                                                     | Held until the timeline shape settles                                                                 |
| `interactive-widget=resizes-content` on the four `index.html`                            | Raised, undecided                                                                                     |
| Dialog width literals (`48rem`/`32rem`/`24rem`/`20rem`) vs `--sa-size-*` in workbench    | Raised, undecided                                                                                     |
| Stage 3 (sites) form                                                                     | CA rejects it wholesale; redesign with the layout rework, do not patch                                |
| `var(--sa-radius-default)` in `onboarding.css:33`                                        | Undefined token, renders square. Fix is `--sa-card-border-radius`. Deferred into the stage-3 redesign |
| Undefined-token guard                                                                    | `guard:css` prohibits raw literals but has no notion of an undeclared token. Not built                |
| Single-select chevron + the two user-manager masks → icon catalog                        | Fast-follow                                                                                           |

## Resume agenda

1. **Answer the action-bar slot question**, then **Phase A of the chrome
   extraction** — the static parts only (block sizing, title row, card shell,
   action-bar slot, feedback slot). Ten of eleven inventory items are already
   duplicated, several character-for-character, so this is mostly deletion.
2. **Phase B — responsive chrome:** the `@container` collapse, the 480
   device-edge block, and the `cqi` question. Needs the timeline shape settled.
3. **Customer manager** — cheap, independent of 1 and 2, and building it first
   tests the chrome assumptions before they are committed to.
4. **COW stage layout rework**, including the stage-3 redesign, after or
   alongside the chrome — the wizard's wide layout becomes a vertical timeline,
   so laying out stages first means laying them against chrome that is about to
   move.
5. **C — Notes-lite**, then **D — verification & close**, unchanged.

## Known blocker for the timeline

`wizard.tsx` writes `style={{ 'inline-size': barFill() }}` on the bar fill — the
host names the _axis_, so CSS cannot flip the rail vertical. The host should
publish the scalar (`--sa-wizard-progress`) and let CSS choose `inline-size` or
`block-size` per state. Host supplies data, CSS supplies presentation.

## Standing session protocol (unchanged)

Independent CA go per production; delegates are haiku and git-read-only; CA dev
server on :5173 — the agent browser reaches only the OTP login and cannot
authenticate, so **live passes are the CA's authenticated Chrome**; budget-lean
delegation; Claude never commits.
