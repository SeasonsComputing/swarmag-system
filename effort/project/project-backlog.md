<img src="../../swarmag-ops-logo.png" title="" alt="swarmAg Operations System" data-align="center">

# swarmAg Operations System — Backlog

Accepted work whose shape is already known. An entry is here because the decision has been
made and only a slot is missing, so picking it up starts with doing it.

Distinct from `effort/project/project-feature-parking-lot.md`, which holds work
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

**Recurrence, 2026-08-28:** During an unrelated UX session, ACE tried to start a local dev
server twice (`app-admin-stage-local`, then `app-stage-local admin`) before CA interrupted
to explain there is no separate local frontend/backend environment — this is a greenfield,
single-developer project, and `localhost:5173` is local serving of the stage-bound
frontend, not an independent local dev permutation. CA's own words: "ACE went down the dev
server hole again," implying this is not the first time. This is a live specimen of the
exact failure this entry already describes — the constraint a session needed
("stage is the only environment") wasn't reached before the session acted on procedure it
shouldn't have. Also noted in
`effort/active/2026-08-23-devops-style-error-handling-brief.md`, since that brief's step 2
already touches this file.

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

### `STYLE-GUIDE.md` should be `CONVENTIONS.md`, and governing-doc tables need `EFFORT.md`

**Observed:** 2026-09-04 · normal

`STYLE-GUIDE.md` covers more than style — §8.6/§8.7 (adapter and maker shape) and §12
(testing) are structural pattern conventions, not aesthetics, and the name has undersold
the document's actual scope since before this entry. Decided in conversation: rename to
`CONVENTIONS.md`.

Separately, `EFFORT.md` (root, same tier as `CONSTITUTION.md`/`AGENTS.md`) shipped
2026-09-04, governing the lifecycle of tracked work — this document you're reading is
itself an instance of what it describes. No governing-doc table yet references it:
`README.md` §1.2's documentation table and `AGENTS.md` §1.1's ingestion table both still
list only `CONSTITUTION.md`/`AGENTS.md`/`STYLE-GUIDE.md`.

Both are decided, both are real, and neither is urgent enough to interrupt the current
roadmap for. Bundled into the refactoring milestone (`ux/shell`→`ux/shell`+`front/app`
split, UI control-state normalization, devops-style retrofit — third in the M1 → Notes
editor → Refactor sequence) so the tables get updated once, when `CONVENTIONS.md` and
`EFFORT.md` are both in their final state, not twice.

**Fix:** rename `STYLE-GUIDE.md` to `CONVENTIONS.md`, updating every citation (`AGENTS.md`,
`CONSTITUTION.md`, `documentation/`, `effort/`) — a real rename, not a same-night one, since
the name is heavily cross-referenced. Then update `README.md` and `AGENTS.md`'s governing-
doc tables to reference both `EFFORT.md` and the renamed `CONVENTIONS.md`.

## Controls

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

## Auth

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

## Shell

### DrillDown's onReturnControl prop is both a data channel and a UI-takeover switch

**Observed:** 2026-08-29 · low

`drill-down.tsx`'s internal return button is gated by
`<Show when={!props.onReturnControl && frame().returnTo !== undefined}>` — passing
`onReturnControl` for any reason (e.g. logging drill depth) also silently suppresses
`DrillDown`'s own return UI, with no type-level hint that the prop does double duty.

A future consumer wanting both — notification and the built-in button — gets a working build
with the back-navigation control silently missing, discoverable only by clicking through the
UI. Splitting the two concerns (a separate `hideOwnReturn?: boolean`, or always rendering and
letting layout hide it) would make the tradeoff visible in the type.

### PanelHeaderTitle's heading-depth mapping is already at its hardcoded ceiling

**Observed:** 2026-08-29 · normal

`TitleSegment` (`panel-header-title.tsx`) picks `h2`/`h3`/`h4` via nested `Show`/fallback
rather than a level-to-tag mapping, so a 4th path segment would collapse onto the same `h4`
as the 3rd, losing the depth cue. Not speculative: `onboarding-stage-sites.tsx` already nests
Sites → Site → Notes → Note, a 3-segment path that's already at this ceiling today, and the
project's own game plan (Phase 4: Notes+attachments+buckets) points at one more nesting
level. `--sa-text-h5`/`--sa-heading-font-size-h5` already exist in `roles.css`/`themes.css`,
unused here — generalizing to a small `h2`-through-`h5` lookup (or `solid-js/web`'s
`Dynamic`) uses infrastructure the codebase already ships rather than adding a nesting layer
each time depth grows.

### `ux/shell/` conflates reusable composition machinery with app orchestration

**Observed:** 2026-09-04 · high

Decided, post-M1: `ux/shell/` splits into `ux/shell/` and a new `front/app/` namespace.
Everything currently under `ux/shell/` is being built and reviewed today as if it will stay
one flat directory indefinitely — this entry exists so that assumption doesn't calcify
before the split actually happens.

The split itself is decided; the boundary is not. The working hypothesis, unconfirmed: truly
reusable, app-agnostic composition machinery (`CollectionPanel`, `DrillDown`, `Wizard`,
`PanelHeader` — the "Supporting Library" rows in `ux-design-archetypes.md` §6) stays in
`ux/shell/`, while app-orchestration concerns that happen to live there today but aren't
really reusable UI primitives (candidates, unconfirmed: `shell.ts`'s six-arm `ShellRoute`
union, `shell-makers.tsx`, `bootstrap.tsx`, `dashboard.tsx`, `login.tsx`) move to
`front/app/`.

**Picking this up:** a Foundation-mode design pass on the actual boundary, once M1 closes.
Until then, new `ux/shell/` work (e.g. the in-flight stock Notes editor) should assume it
may be re-homed rather than be built as if the directory's current shape is permanent.

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

## DevOps

### `source/devops/` is not held to STYLE-GUIDE

**Observed:** 2026-08-23 · normal

STYLE-GUIDE §1 claims to be authoritative "throughout the codebase," but nothing checks
that claim against `source/devops/` — `guard-domain-style.ts` exists for domain, no
equivalent exists for devops. Eleven of twelve TypeScript devops scripts already follow
the box-header/PURPOSE/PUBLIC convention and the `@core/std` primitive-type discipline
(§8.1) correctly; the gap is concentrated almost entirely in §9's "never swallow errors
silently" rule — fifteen-plus bare `catch {}` / `.catch(() => {})` blocks across eight of
the twelve scripts, every one discarding the caught error's type.

Surfaced while investigating the phantom-directory recurrence above — the mechanism was
never pinned down, but the investigation showed devops carries none of the discipline
domain and front get.

Two STYLE-GUIDE additions belong alongside the retrofit, not after it: (1) tooling
namespaces (`devops`, `tests`) may call their host runtime's API directly, unabstracted,
since each runs in one fixed known environment and was never trying to be portable across
deployment targets — §8.5's `Config.get()` mandate currently reads as universal and needs
this carve-out written in; (2) a non-product tooling namespace may have its own local,
topic-free utility `lib/` as a barrel, independently, with no lateral dependency edge to
its peers (`devops/lib` and, later, `tests/lib` if it ever accumulates real duplication —
not today).

Full plan, exact site counts, and sequencing (doc → `architecture-devops.md` → lib →
retrofit → guard-last, so the new guard's first run is green) are in
`effort/active/2026-08-23-devops-style-error-handling-brief.md`.

### `edge-deploy` lacks the target-resolution and verification parity `app-deploy.sh` already has

**Observed:** 2026-09-12 · high

`app-deploy.sh` (UX) accepts `--target {dev|stage|prod}` directly and resolves Netlify site
IDs internally. `edge-deploy` is a one-line shell wrapper — `edge-sync && supabase functions
deploy "$@"` — with no target-resolution logic of its own; the operator must run
`list-supabase-targets` by hand, extract a project ref, and pass `--project-ref` explicitly.
UX also has an automated smoke test (`smoke-ux.ts`, asserts and exits nonzero on failure);
edge has no equivalent — verification is a 40-line manual curl procedure with no asserted
pass/fail, checked in `deno.jsonc` directly: only `edge-sync`, `edge-serve`, and `edge-deploy`
exist, nothing named smoke.

**High, not normal, because this has already cost two separate rounds of documentation-only
fixes.** The original edge-functions-remediation effort (closed 2026-07-14) updated the arch
docs for this territory once already. A 2026-09 core-namespace rename (`core/client` →
`core/cli`, `core/service` → `core/svc`) required redeploying edge functions for validation,
and the same confusion recurred — surfaced as a 44-line addition to `README.md` (62% of its
own section, the largest single addition in the file) plus 84 lines added to
`architecture-devops.md`, both purely descriptive. Writing more prose a third time is not a
plan with a track record here; the two prior attempts already show prose alone doesn't
prevent the misfire.

**Picking this up:** give `edge-deploy` a `--target` flag that resolves the project ref
internally (mirroring `app-deploy.sh`), and build an `edge-smoke` task mirroring
`smoke-ux.ts` — asserted CORS/405/build-header checks, not a copy-pasted curl loop. Once both
exist, `README.md` and `architecture-devops.md`'s edge sections shrink to match their UX
counterparts' brevity, describing what the tooling checks rather than how to check it by hand.

## Testing

### No automated coverage above the domain/API layer — today's manual live pass proved it

**Observed:** 2026-09-07 · normal

Group D's live E2E verification (create a real prospect through the onboarding wizard, ≥2
sites, one address-only and one coordinates) was done entirely by hand: Ted read a table of
field values off screen and typed them into the deployed stage app one field at a time,
losing a site along the way when Finish fired before the second site was added. Nothing
about that pass is repeatable without re-typing the same data by hand again.

This is the live, felt consequence of the gap `[[project_testing_gap_backlog_pending]]`
already named structurally: `STYLE-GUIDE.md` §12's testing convention
(`source/tests/cases/{abstraction}-api-test.ts`) covers domain/adapter/API only —
`ux/shell`'s Wizard host, `DrillDown`, the onboarding stages themselves have no test
mechanism to land in, by convention, not oversight. Today's session is a second, concrete
data point: a JSON fixture (the exact prospect/site field data used for a manual pass could
be captured once as data) plus a driver over it would make this pass repeatable and immune
to the exact slip that happened today (finishing early, losing a site).

Deserves its own scoped brief, not a drive-by fix here — needs a decision on where such a
driver would even run (headless browser against a deployed stage URL, per `smoke-ux.ts`'s
existing pattern? something narrower against the wizard's own state layer?) before scoping
begins.

## Customer

### Customer Manager

**Observed:** 2026-09-10 · normal

There is no surface for editing an existing Customer — `/onboarding` is the only route that
touches `Customer`, and it is create-only. Surfaced live during Group D's E2E verification: a
prospect created with one site by mistake has no way to gain a second one after Finish.

The fix is ordinary `AbstractionManager`, Collection-Detail⇄Index-Detail, the same machinery
User Manager already runs. It reuses the `SiteEditor`/`NoteEditor` Index-Detail panels the
onboarding wizard's Sites stage already built — no new component, per the precedent
`[[project_panel_chrome]]` recorded when the panel-chrome unification first made
Wizard-as-a-Manager's-create-path viable (`renderForm(item: T | null, onClose)` already takes
`null` to mean create; a real `Customer` is the same slot's non-null branch).

### Onboarding — Initial Job Assessment stage

**Observed:** 2026-09-10 · normal

Customer Onboarding's Finish does not belong at Sites. The intended flow continues into initial
job assessment — selecting services and applying initial templates — making the three built
stages (Contact, Customer, Sites) a near-term slice of a four-stage design, not a complete
surface. The fourth stage's own design (service selection UI, template application mechanism)
has not started.

## UX

### Hub widget

**Observed:** 2026-09-10 · normal

A dashboard widget archetype that groups commands by topic — Users Hub, Customers Hub,
Equipment & Chemicals Hub, Workflows/Tasks/Questions Hub, Jobs Hub — full disclosure, bespoke
per-topic content, no fixed visualization (a row of action buttons, a full-bleed artistic
surface with hotspot triggers, and an inline data table are all legitimate presentations of the
same archetype). Distinct from `JobHub` (`source/front/ux/views/job-views.ts`), an existing,
shipped data-projection type for the same underlying idea at the data layer, not the widget
layer.

This is the primary approach, not a coin flip — CA wants it built and proven before falling
back to the alternative: a hierarchical command panel on the dashboard's left side, which
stays the named, ready fallback if Hub doesn't earn its keep. Whichever wins, `Job`'s three
independently-tabled phases (`jobs`/`job_assessments`/`job_plans`/`job_work`) are the clearest
motivating case — `architecture-front.md` §11.7 already names a "colloquial UX hub:
`job: [assessment, plan, work]`," so this connects to existing language rather than inventing
it fresh.

_End of Backlog Document_
