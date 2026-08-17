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

## Documentation

### `architecture-devops.md` buries what an agent scan needs

**Observed:** 2026-08-16 · normal

Fourteen sections across 929 lines, ordered as a manual rather than as context. The map
is §2 Directory Structure, but the two sections a session actually reaches for —
Architectural Guards and the `deno.jsonc` task surface — sit six hundred lines below it,
behind packaging, environment files, the secret registry, and the secret scripts. A
reader that stops early gets procedure it may not act on and never reaches the rules it
must obey.

The document left the Application features context on 2026-08-15, because Feature Mode is
forbidden from acting on most of what it describes and a session that genuinely needs it
reclassifies as DevOps. It is still seeded for DevOps sessions, where the ordering problem
is live and unaddressed.

The fix is ordering, not deletion: lead with the map and the constraints, let procedure
follow. Nothing needs to be removed.

### `architecture-core.md` is base context and has never been measured for scan cost

**Observed:** 2026-08-16 · high

At 1031 lines it is the largest document in the base context, which `AGENTS.md` §1.1
combines into every topic context — Domain internals, UX internals, Application features,
and DevOps alike. Base is roughly 1,888 lines and this document is more than half of it,
so whatever cost it carries is paid by every session in the system.

Nothing establishes which parts of it a session actually reaches for, whether its map is
front-loaded, or how much is reference bulk that belongs in a document consulted on demand
rather than seeded.

**This is an analysis task, not a refactor.** Classify the content — what constrains, what
maps, and what is reference — then decide whether the document reorders, decomposes, or
gains a compact companion the way `ux-components-guide.md` gained
`ux-components-guide-lite.md`. That companion is the proven precedent here and names
itself an AI-ingestion companion in its own opening.

Do not restructure before the analysis is reviewed. This is base context for every
session, so a wrong cut is felt everywhere at once.

### Retiring an effort document leaves its cross-references dangling

**Observed:** 2026-08-17 · low

`effort/completed/` carries roughly twenty references to `effort/active/` paths for documents that have since been retired — `2026-08-05-abstraction-manager-handoff.md` still cites `effort/active/2026-08-05-abstraction-manager-brief.md`, for one. The 2026-08-16 retirement of six documents added its own.

This is the same failure class as the `ui.css:554–558` citation that rotted: a path is a location, and locations move. It is deliberate today only by default, not by decision.

Two ways to settle it, and either is fine as long as it is chosen. Retirement rewrites the moved document's own forward references, which keeps links live at the cost of editing a historical record. Or historical links are frozen by design, and the parking lot and backlog say so once so a reader stops treating a dangling path as a defect.

## Controls

### HelmWidget action presentation leaks into the action-button primitive

**Observed:** 2026-08-16 · high

HelmWidget has a legitimate responsive behavior: above its labeled-action threshold it
shows labeled route actions, and at or below that threshold it optimizes the terminal
field to dense icon actions while retaining accessible labels. That behavior belongs to
the dashboard terminal widget, because `architecture-front.md` §7.3 makes HelmWidget the
owner of action presentation within its allocated terminal field.

The current implementation lets that specialization leak into the shared action-button
foundation. `ui.css` carries action-button commentary about consumer specificity and label
display, while HelmWidget has depended on action-button internals to collapse labels. That
couples a cross-project primitive to one dashboard widget's responsive needs and makes
future action-button changes preserve a workaround rather than a contract.

The fix is a boundary repair. Keep `UiActionButton` as a boring primitive with explicit
`label`, `icon`, `labelMode`, `align`, `density`, and `variant` semantics. Move the
dashboard terminal presentation into widget space with a `HelmButton` owned under
`source/front/ux/widgets`. The stacked-header threshold must control row structure only;
HelmWidget's labeled-action threshold alone controls labeled versus icon-only
presentation.

### Shared UI controls do not use one state model

**Observed:** 2026-08-16 · high

The shared control layer does not assign one stable meaning to rest, hover, focus,
selected, checked, active, open, and disabled states. `UiActionButton` distinguishes
visible-label and hidden-label actions by resting color. `UiCollectionCursor` demonstrates
the split in one surface: navigation action-buttons rest in primary color while
life-cycle action-buttons rest closer to text color. Checkbox and radio, toggle, tabs,
accordion, buttons, single-select, and multi-select each answer selected and hover states
with different combinations of primary color, text color, border, background, and frame.

This is design-language drift, not a feature defect. Primary color is currently doing too
many jobs: resting affordance, hover affordance, checked state, selected state, active tab
state, and open accordion state. A user cannot infer the state model from one control and
apply it to another.

The fix belongs in the shared UI control foundation. Audit `UiButton`, `UiActionButton`,
`UiCheckbox`, `UiRadioGroup`, `UiToggle`, `UiTabs`, `UiAccordion`, `UiSingleSelect`,
`UiMultiSelect`, and `UiCollectionCursor` against a common state matrix: rest, hover,
focus-visible, disabled, selected/checked/active/open, selected-hover, and danger where
applicable. Normalize `ui.css` so primary, text color, background, border, frame, and
focus ring each have stable roles. Prefer deleting inconsistent special-case rules over
adding compensating overrides.

### Collection-Detail surfaces do not draw the Selection

**Observed:** 2026-08-14 · normal

`AbstractionManager` shows its index and subject panels together above its container
threshold, so a user editing the fourth record has the whole Collection on screen with
nothing marking which Item is open. Below the threshold the panels swap and the question
does not arise. Above it, the reader loses their place in a long Collection.

Collection-Detail is the one archetype that owes a Selection treatment.
`ux-design-archetypes.md` §2.4 makes a Selection drawable exactly when the Collection and
the Detail are met together, which is why Index-Detail needs nothing here and this surface
does. Below its threshold the manager becomes Index-Detail and the question dissolves.

There is no state to style. `UiTableRow` takes `onActivate` and emits
`data-ui-interactive` when a row is clickable, but nothing expresses Selection, and
`data-ui`, `data-ui-variant`, and `data-ui-interactive` are all `never` in its props, so a
consumer cannot supply one. The fix belongs in the catalog rather than in the manager — a
selected state on `UiTableRow` that any Collection-Detail surface opts into.

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

### `guard:leaf` does not sweep the repository root

**Observed:** 2026-08-17 · normal

`guard:leaf` scans `source/` and `documentation/`, so an empty directory at the repository root is invisible to it. On 2026-08-15 three empty directories were present, each named after a file that a real refactor had deleted months earlier — `source/core/cfg/runtime-provider.ts`, `source/domain/protocols/common-protocol.ts`, and root `supabase-import-map.json`. The guard caught the first two and could not see the third.

The recurrence is the point. Deleted-file paths reappear as empty directories periodically; the Chief Architect counts two or three occurrences. The cause is unidentified — no live code references those names, and the repository's three `Deno.mkdir` calls all take genuine directory paths — so detection is worth more than a theory. Extending the sweep to the repository root catches all of them the moment they appear rather than whenever someone hits a red check.

`rmdir` is the safe removal: it refuses a non-empty directory, so it cannot take anything real with it.

_End of Backlog Document_
