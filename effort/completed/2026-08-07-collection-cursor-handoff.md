# Collection Cursor & Responsive Foundation — Session Handoff

**Date:** 2026-08-07
**Mode:** Foundation
**Milestone:** M1 Customer Onboarding
**Prior handoff:** `effort/completed/2026-08-05-abstraction-manager-handoff.md`
**Briefs, both executed:** `effort/completed/2026-08-06-collection-cursor-brief.md`,
`effort/completed/2026-08-06-collection-cursor-catalog-brief.md`

Working tree clean, `deno task check` green, all work pushed.

## What shipped

**Abstraction manager ownership correction** — `0109dbc`, `de74f12`, `462e3d0`.
Save, New, Cancel and their consequences are manager commands; the provider
supplies domain parts. Editor registers a per-instance handle; the manager owns
save policy, feedback and its clearing, refresh timing, and post-save editor
state. `renderForm` lost `onClose`; `cancel` and `editorFeedback` left the
provider contract. Also fixed: validation now focuses the first invalid control,
which stopped happening when the manager began short-circuiting native
submission.

**`UiCollectionCursor`** — `7974113`, `55bb0f6`, `f657679`, `4189a5c`.
A `ui` control, generic over `T[]`, value-in / value-out, owning only the cursor.
Published into the harness and both component guides. **`PIP_SLOTS` shipped at 6,
not the 8 in the brief.**

**Action button label modes inverted** — `6f70ae2`. `labelMode` is now
`'visible' | 'hidden'`, defaulting to `hidden`. See §"The reveal finding" below —
this was not cosmetic.

**Rhythm tokens recalibrated** — `f4fe4fc`. `gap` was pinned at maximum on every
real viewport; see §"Rhythm" below.

**`UiLayout` variants renamed** — `8c40d2b`, `8d173da`. `inline` → `inline-fit`,
`cluster` → `cluster-wrap`. Docs updated, no stale call sites.

## Resume agenda (CA + AA)

### 1. Responsive adjustments

- **`panel-container` side-by-side** — manager and wizard both overflow the
  container roughly 100px _before_ the panel collapse fires.
- **Job sites panel overflows at ~500px.** Proposed resolution: collapse the pip
  readout to the label, or drop the labels from Delete + New. Both device and
  container can trigger it — **device 500px collapses all cursor navbars;
  container 500px collapses nested cursor navbars.**

### 2. Collection cursor API surface

The current approach makes it impossible to style the cursor navbar.

### 3. Job sites

Design the job-sites panel using the cursor navbar, with a notes placeholder.

### 4. Notes deck component

Design its look and feel including attachments. A mockup exists; current thinking
is a tab bar with two tabs — **Note**, a text area; **Attachments**, a list or
table or thumbnails of files, with camera and upload buttons and its own add and
delete.

## Findings that live nowhere else

### The reveal finding

What everyone called "reveal" was **an accident of CSS specificity across two
files.** `helm-widget.css` hid labels for density at `0,3,0`; a `ui.css` hover
rule intended to brighten the label colour also re-asserted `display` at `0,4,0`
and won. So hovering forced a hidden label back inline, widening the button and
shoving its neighbours. The patch at `helm-widget.css:53-58` re-hid it, but only
inside `@container dashboard-header (max-width: 610px)` and only for
`density='dense'`, so it leaked back everywhere else.

Separately, the prop named `reveal` rendered a **tooltip**, not a reveal — an
absolutely positioned popup, clipped by any `overflow: hidden` ancestor, and
invisible on touch where there is no hover and `:focus-visible` does not fire on
tap.

Both are gone. The invariant now recorded in `ui.css` and in the component
header: **no control-layer rule may re-assert `display` on the label part**,
because it outranks any consumer hiding labels for space. Label presence is the
consumer's decision at every viewport.

**`helm-widget.css:53-58` is now dead** — it fights a rule that no longer exists,
and the default is `hidden` besides. Safe to delete.

### Rhythm

All rhythm tokens shared one slope, so each token's fluid window equalled its
travel divided by that slope. `gap` had 3.5px of travel, giving it a 71px window
that sat _below_ the minimum supported width — it was a constant everywhere real,
then stepped once at the collapse. Each token now has its own slope matched to
its own travel, and the bands run between named breakpoints.

**Annotation convention introduced.** Each clamp bound carries its value and the
width at which it obtains. This does not violate the never-restate-a-value rule:
a `clamp()` with a `vw` slope is a **post-calculation outcome**, unrecoverable by
reading the declaration. Both halves are required so the claim is falsifiable —
an edit that changes a slope without re-solving contradicts a comment beside it.

`pad`'s early ceiling is **deliberate and not the same defect**: a box interior is
sized by the legibility of its contents, not by the window. Past its ceiling more
padding is only a bigger empty box. Do not "fix" it to match `gutter`.

### Carried from the prior handoff

**Phase 3 — dirty/pristine primitive.** Does not exist anywhere in
`source/front`. Starting constraint: **array length cannot carry dirty-state** —
new-then-delete restores the length with different content, and editing a field
changes no length at all. A differing length is a sufficient positive test and
never a necessary one. Dirty needs a baseline snapshot compared structurally,
which is cheap here because these are pure value objects with no identity.

**`front/app` layer.** `ux` is the general-purpose library; `app` holds
swarmAg-specific material — `components` (login, logout, about, notes), `stores`,
`views`, `assets`, and domain `widgets`. `ux` keeps `shell`, `ui`, `stores` and
chrome `widgets`. The widget catalog splits chrome from domain; app composition
roots import both registries and join them.

Layering is downward-only: `app-{product} → app → ux → domain/core`. Shared app
features use `data-app`; no new dataset key needed.

**The move-down judgment rule.** Access is free, validation is not. Everything
above could already reach it, so moving code down buys one definition and costs a
wider re-validation on every future change. Move down when a thing is _settled_,
not merely when it is _shared_. A component general **by nature** goes to the
general layer at one consumer — the second-consumer test applies to components
generalized _from_ a specific case.

## Open

- **`architecture-front.md` §2** — the shell section is one clause covering 27
  files, `PanelStepflow` appears in no document, and §10.1.4 states a
  second-consumer test the CA does not practice. Rewrite §2 **once**, after the
  `ux` / `app` shuffle, not per move.
- **`ux` / `app` refactor** — agreed in shape, unscheduled.
- **Undefined-token guard** — now recorded in
  `effort/project/project-backlog.md` under Guards, with both specimens
  and the `--sa-icon` trap for whoever builds it.
- **Session close-out procedure** — parked for a dedicated discussion.
- **The 500px directive is not written.** What shipped removes the override that
  made local hiding unreliable; it does not yet give one global threshold
  replacing 464, 610 and whatever each new surface picks.

## Standing protocol

Independent CA go per production; the CA concludes topic conversation with a
scope or production directive, not the agent. The CA seeds the session with the
document he chooses — an agent should not scan `effort/` and build its own theory
of the work. Delegates are read-only on git. Final behavioural verification is
the CA's authenticated browser. **Claude never commits.**

Checks are `deno task fmt && deno task check`; `check` chains thirteen guards,
types and lint.

**A note on measuring in the preview harness:** the agent browser pane reports
`innerWidth: 0` when hidden, which floors every `vw` term and leaves the ≤380px
media block permanently active. Any pixel figure measured there is in the
collapsed-base regime and is not the real value. Solve from the declarations
instead, or verify in the CA's browser.

_End of Handoff_
