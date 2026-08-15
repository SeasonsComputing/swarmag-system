<img src="../../swarmag-ops-logo.png" title="" alt="swarmAg Operations System" data-align="center">

# swarmAg Operations System — Backlog

Accepted work whose shape is already known. An entry is here because the decision has been
made and only a slot is missing, so picking it up starts with doing it.

Distinct from `documentation/project/project-feature-parking-lot.md`, which holds work
where a decision is still missing and picking it up starts with making that decision. The
test is decided versus undecided — not near-term versus far.

**Format per entry:** the defect or gap stated as a sentence, an `**Observed:**` line
carrying the date and a priority of `high`, `normal`, or `low`, then what it is with its
evidence and where the fix belongs. `##` sections group entries by the layer that owns the
work, and a section appears once a second entry needs it. Cite a selector, symbol, or
document section — never a line number, which rots silently.

## Design Language

### `ux-design-language.md` has no UX archetypes section

**Observed:** 2026-08-14 · high

Composition rules — how an application assembles controls into a user interface — have no
home. `ux-components-guide.md` is a catalog of available components and their intended
usage, and must not prescribe composition. The design language owns normative UX language
and interaction patterns, and carries no archetypes.

The consequence is already in the tree. A composition rule leaked into the components
guide's component-first table as `UiCollectionCursor` versus "ad hoc
list-plus-capture-form", and went stale the moment the job-sites surface adopted a
drill-down instead. A useful test for whoever writes the section: if a design decision can
falsify a row in the catalog, that row was an archetype rule in the wrong document.

Rules currently orphaned, to be captured when the section is written:

- **Collection drill-down** — selecting an item replaces the panel its list lives in, and
  drilling back restores it. Composed from `CollectionPanel`, specified in
  `effort/active/2026-08-14-job-sites-drilldown-brief.md`.
- **Full disclosure versus selective disclosure** — whether a surface shows a list beside
  its subject or swaps between them. This is a property of the surface, not of the list.
  The workbench affords two panes at its scale and carries the size and collapse rules
  that make that work; nested frames do not inherit that machinery.
- **A list is a list at every level** — depth changes nothing about a list's appearance or
  behaviour, which is what lets a user who has learned one list predict every other.
- **Columnar layout of the manager edit panel.**
- **Form actions at the top of a form**, never trailing it.

`AGENTS.md` §1.1 now lists `ux-design-language.md` as seed context for the Application
features category, so the section reaches feature work as soon as it is written.

## Controls

### Full-disclosure surfaces do not indicate the selected row

**Observed:** 2026-08-14 · normal

`AbstractionManager` shows its index and subject panels together above its 676px container
threshold, so a user editing the fourth record has the entire list on screen with nothing
marking which row is open. Below the threshold `mode` swaps the panels and the question
does not arise. Above it, the reader loses their place in a long list.

There is no state to style. `UiTableRow` takes `onActivate` and emits
`data-ui-interactive` when a row is clickable, but nothing expresses selection, and
`data-ui`, `data-ui-variant`, and `data-ui-interactive` are all `never` in its props, so a
consumer cannot supply one. The fix belongs in the catalog rather than in the manager — a
selected state on `UiTableRow` that any surface showing a list beside its subject opts
into.

One note for whoever builds it: this is a property of full-disclosure surfaces, not of
lists. `CollectionPanel` exhibited the same defect while it rendered its editor inline,
and the drill-down rework removes it structurally by never showing a row beside its own
editor. Selective-disclosure surfaces need nothing here.

## Shell / Auth

### A stale session survives genesis and is not ejected

**Observed:** 2026-08-04 · high

Supabase persists the session in `localStorage`, so a browser holding a session keeps it
after a genesis run wipes `auth.users`. The signed-in user is left holding a token for a
principal that no longer exists, and the app does not detect this or return them to login.

The session is structurally valid — correct signature, unexpired — so detection has to key
on the principal being unresolvable rather than on token validity. Related: genesis became
total on 2026-08-04, so this state is now reachable every time the database is regenerated
rather than only when auth happened to be cleared by hand.

### Login needs an "Already have a code?" action

**Observed:** 2026-08-04 · normal

The login flow requests a one-time code and then advances to code entry. A user who
already holds a code — from an earlier request, a reload, or navigating away — has no way
back to the verify step without requesting a new one.

Requesting again is rate limited: `supabase/auth/stage.jsonc` sets
`smtp_max_frequency: 60` and `rate_limit_email_sent: 60`, so a user in this state waits a
minute for a code they already have.

Needs an affordance on the request step that jumps straight to code entry for an already
issued code.

## Guards

### `guard:css` does not verify that a referenced token resolves

**Observed:** 2026-08-06 · normal

`guard:css` forbids raw literals but never checks that a `var(--sa-*)` reference is
actually declared. An unresolvable custom property is not an error: the browser drops the
whole declaration silently, so the rule simply does not apply and nothing reports it.
Thirteen guards and a passing `deno task check` see nothing.

Two specimens so far. The first produced square site tiles for weeks. The second was found
by hand on 2026-08-06 and fixed the same day: `ui.css` referenced
`--sa-control-ring-error` where the declared token is `--sa-control-shadow-error`, so
checkbox and radio error states rendered their border with no ring.

The check is mechanical: collect every `var(--sa-*)` reference across the CSS files and
assert each is declared in `tokens.css`, `roles.css`, `themes.css` or `icons.css`.

One trap for whoever builds it: `--sa-icon` is declared in `icons.css` and is a glyph
binding rather than a provider token, so a guard that scans only the three provider files
reports it as undefined. It is legitimate and must be included.

### No guard enforces conformity to established conventions

**Observed:** 2026-08-14 · low

Convention documented in a governing document reaches a human reviewer. It reaches a
generative implementer only if the alternative is unavailable, because a model reaches for
its prior rather than for the last instance in the tree. `guard-bare-html` does this for
native elements that have control replacements; nothing does it for anything established
in review.

Full component-first enforcement over compositions is probably not mechanizable. Two
narrower checks are, and both have specimens from the 2026-08-13 job-sites production:

**Dataset key against stylesheet rule, bidirectionally.** Every `data-{layer}='name'`
emitted in TSX should have a rule in the owning stylesheet, and every such rule should
have an emitter. `CollectionPanel` emitted `data-shell-selected` on every row with no
rule anywhere in the tree, so a selected state was plumbed and invisible. The reverse also
occurs: a `data-app` cascade outliving the markup it styled. Neither condition is an error
to any current check.

**A local type structurally shadowing a domain abstraction.** `OnboardingSite` restated
`CustomerSite` with `Location[]` and `Note[]` in place of `CompositionOne` and
`CompositionMany`, discarding cardinality — a domain-invariant violation
(`domain-model.md` §3.9). Mutable arrays are assignable to readonly ones, so the fork
type-checked and all thirteen guards passed. The check is mechanical: compare the
member-name set of every type declared under `source/front` or `source/back` against the
exported abstractions in `source/domain`, and fail on an exact match.

_End of Backlog Document_
