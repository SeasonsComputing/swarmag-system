# Background Tasks — Brief

**Active, approved Foundation production; refreshed 2026-11-11.** Foundation mode: generic work
reporting and one-level Helm command menus in locked `ux/`. The CA authorized production and the named locked-namespace
crossings, including the optional bootstrap mount fitting. The main text is the implementation target; trailing
records preserve decisions and replaced proposals.

## Purpose and dependencies

Applications need to expose delivery/preparation work and command failures. The Helm needs a
button that opens a configured command popover, independent of its existing overflow menu.

The task store reports work; it does not execute, persist, cancel, or schedule it. The menu fitting
binds application commands; it does not import application APIs. Uploads remains a storage-neutral
class with separate instances for separate inbox/server pairs.

`effort/completed/2026-11-11-upload-brief.md` Unit A supplies `api.AttachmentsUploads`, the first
reporting consumer. This effort does not require the Supabase root change or a completed Binder.
`effort/active/2026-11-04-field-binder-brief.md` supplies Binder menu bindings and preparation reports
under its own feature scope.

## Helm command/menu contract

Existing route commands, @theme, label modes, and default HelmWidget remain compatible. Add a
`makeHelmWidget` maker whose result is registered under the existing HelmWidget key by app.tsx.
The widget receives configured data through settings and executable behavior through bindings:

```ts
export type HelmCommandBinding = {
  execute: () => void | Promise<void>
  disabled?: () => boolean
}
export type HelmBindings = {
  commands?: Dictionary<HelmCommandBinding>
  status?: Dictionary<() => string>
}
export const makeHelmWidget = (bindings: HelmBindings): WidgetComponent
```

Contracts and configuration parsing live in `ux/widgets/helm-widget-contract.ts`; the maker lives
in `ux/widgets/make-helm-widget.tsx`. `ux/widgets/helm-widget.tsx` exports the default
`makeHelmWidget({})` component. The default uses empty bindings. No mutable global command registry
or dashboard/route-runtime contract change is needed. Reserved @theme/@tasks cannot be overridden.
Application command names are adorned, such as @sync-field-binder; route paths remain route paths.

A configured top-level item is an existing command record or a menu record
`{ label, icon, items }`, with no command or labelMode of its own. Menus are always inline icon
triggers with accessible labels. A menu item is a command record
`{ command, label, icon }` or a status record `{ status: bindingName }`. Reject both/neither
operations, missing bindings, empty menus, and nested menus. JSON contains no callbacks.

UiPopover and labelled UiActionButtons supply the existing control composition. Status text is
neither clickable nor focusable. Commands close the popover before execution. Keyboard/focus
return, icon-only layout, and allocated-width overflow retain their existing behavior. Competing
popovers are not kept open together. Async command execution is observed; bound commands report
expected failures themselves. An unexpected rejection reaching Helm surfaces as a programming
error rather than producing a generic task report.

## Task and failure reporting

`BackgroundTasks` is a reactive store module in `ux/shell/runtime/background-tasks.ts`, following
CONVENTIONS §16.3. It exposes read-only `store` and intent-named `publish(key, task)`, `clear(key)`,
and `clearAll()`. State machinery and setters remain private. Keys are stable caller-owned strings.

```ts
export type BackgroundTask = {
  label: string
  phase: 'running' | 'waiting' | 'failed'
  blocksExit: boolean
  remaining?: { count: number; unit: string }
  progress?: { completed: number; total: number; unit: string }
  error?: string
}
```

Validate nonnegative integer counts and completed <= total. Failed reports require error copy;
other phases omit it. Missing counts mean unknown, never zero. Each task supplies its own units;
there is no sum across unrelated workloads and no invented percentage for an unbounded drain.
Use const-enum runtime declarations for validated phases in implementation, per CONVENTIONS.

`blocksExit` is supplied by the operation owner. It means this tab has work whose interruption
warrants a warning. A failed command with no unfinished work sets false. Running, waiting, failed,
and remaining counts do not independently imply exit-blocking responsibility.

The reserved @tasks action uses the existing update glyph and opens a popover of labels, phase,
known counts/progress, and error text. Its configured trigger stays visible and is disabled while
the store is empty. Any report, including a non-blocking command failure, enables the trigger. Resolved work is explicitly cleared by
its owner; zero count does not silently clear a running operation. Reports are transient; a reload
reconstructs work state from the inbox or feature, not from persisted task history.

### Command failures

Bound commands own expected-failure reporting, report keys, and retry semantics. Helm does not
create, retain, or clear reports on their behalf. Features keep user-facing failures visible in
the task surface after the command popover closes. Unexpected command rejections surface as
programming errors. The task list lives in `ux/widgets/background-task-list.tsx` with its own CSS;
Helm owns the reserved @tasks trigger and popover.

A non-blocking failed report has an explicit Dismiss control. A blocking failed report is cleared
by its operation when resolved or responsibility is released. The generic store offers no Retry or
Cancel execution callbacks. The feature's command remains the execution entry point. Worker loops
retain their own reporting and rethrow/stop rules.

## First consumer: Admin attachment delivery

`DocumentDrain` calls `api.AttachmentsUploads.drain()`. It retains the existing one-minute
schedule, capped retry backoff, prepared-session predicate, and Web Lock. It owns the attachment
pair only; Field Binder's app-owned delivery/preparation binding is separate. No global drain
walks multiple inboxes and no feature routing is added to Uploads.

- Acquire the existing attachment drain lock before claiming work. Publish running before a pass,
  with unknown count unless a known observation exists; blocksExit is true while the pass owns it.
- On success, remaining zero clears the report. Nonzero remaining publishes waiting with that
  count and blocksExit true while this tab retains responsibility for retrying it.
- ApiError/AggregateError publishes failed and retains expected backoff. An aggregate failure
  supplies no fresh remaining count. Omit the count or label a retained observation correctly.
  Unexpected failures are reported and rethrown, preserving the loop's stop behavior.
- Failure to acquire the lock clears this tab's attachment report and exit responsibility. A
  follower does not retain a stale waiting/failed report about work another tab may have finished.
  Cross-tab aggregation is outside scope; this UI reports locally observed responsibility.
- When the session clears, clear reports and warning participation without deleting inbox bytes.
  Recheck SessionState.isPrepared() before publishing after an awaited pass. A pass spanning
  sign-out/sign-in may report into the prepared session because it describes the device inbox.
  Repeated start/sign-in does not create duplicate loops or listeners.

The report starts when a pass observes work; immediate placement notifications are not part of
this contract. Generic Uploads does not publish UI state or depend on BackgroundTasks.

## Exit warning lifecycle

Implement `startBackgroundTaskWarnings` in `ux/shell/runtime/background-task-warnings.ts`, returning
a cleanup callback. Admin passes this function as the optional second argument to bootstrap.
Bootstrap invokes it under the application mount owner after session initialization and registers
the returned cleanup for root disposal. No session-coordinator wrapper, reporting-lifetime counter,
or drain teardown is introduced. Its predicate is whether any current report has blocksExit true. Session clearing removes
reports, so no stale session warning survives. Repeated setup/cleanup has explicit tests.

Use browser-supported beforeunload cancellation/returnValue. The browser controls whether a prompt
appears and its wording. The popover explains pending delivery and durable capture; custom prompt
text and guaranteed warnings on mobile process termination are not promised. No logout veto or
workbench Close guard is introduced.

## Field Binder integration fitting

A backpack icon opens Manager/Binder/Sync/status in Admin, or Binder/Sync/status in a reader-only
registration. Route registration and command selection belong to each app.tsx. Sync publishes the
preparation task under its bound command key. Reader content remains local regardless of task state.
This brief implements the menu fitting and attachment reporting; it does not register binder routes
or presume reader rollout into Ops/Portal. Feature code binds those through the existing registry.

## Production scope

Implementation paths below are under `source/`. Documentation changes are limited to this brief
and architecture-front §9.1 (mount fitting), §9.6 (state row), and §10.3 (binding seam).

| Files                                                                                                                           | Work                                                       |
| ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| New `ux/shell/runtime/background-tasks.ts`                                                                                      | Reporting state, validation, intent operations             |
| New `ux/shell/runtime/background-task-warnings.ts`                                                                              | Explicit warning lifecycle                                 |
| New `ux/widgets/helm-widget-contract.ts`                                                                                        | Binding/configuration contract                             |
| New `ux/widgets/make-helm-widget.tsx`; `ux/widgets/helm-widget.tsx`, `helm-widget.css`                                          | Menus, reserved @tasks, default compatibility              |
| New `ux/widgets/background-task-list.tsx`, `background-task-list.css`                                                           | Report presentation and non-blocking failure dismissal     |
| `ux/shell/runtime/bootstrap.tsx`; new `tests/cases/bootstrap-lifecycle-test.ts`                                                 | Optional root mount setup/cleanup and focused verification |
| `front/app-admin/document-drain.ts`                                                                                             | Attachment-instance reporting with existing scheduling     |
| `front/app-admin/app.tsx`, `dashboard-admin.json`                                                                               | Warning lifecycle and configured @tasks action             |
| `front/app/shell/session-coordinator.ts`                                                                                        | Report cleanup on session clear only                       |
| New `tests/cases/background-tasks-test.ts`, `background-task-warnings-test.ts`, `helm-widget-test.ts`; `document-drain-test.ts` | State, parser/bindings, warning, and drain coverage        |

The generic widget registry keeps its default binding. Registry, route, and dashboard contracts
remain unchanged. Architecture documentation leads implementation; module headers own detailed
store and widget contracts. No CONVENTIONS amendment is required. Escalate any actual convention
conflict rather than silently extending governance scope.

Out of scope: provider/core changes, new primitives/glyphs, execution engine, persistent task history,
cross-tab reporting, upload scheduling changes, binder implementation, Ops/Portal rollout, per-file
failure surfaces, and new logout policy. CA explicitly approves additive changes to locked ux/ and
the task/menu contracts before production.

## Acceptance

Cover old configuration compatibility, malformed/ambiguous bindings, default maker, menu/status
reactivity, disabled command execution, and observed async programming errors without Helm-created
reports. Cover non-blocking failure dismissal and operation-owned retry. Verify focus, keyboard
use, theme action, inline menus, and existing overflow within narrow Helm layouts.

Test unknown count, waiting/failed responsibility, lock-not-acquired clearing, prepared-session
changes, complete clearing, partial-failure backoff, unexpected-error stop, session clearing during a deferred pass, and repeated
start. Verify bootstrap mount setup/cleanup and warning teardown independently of drain scheduling. Non-blocking command failure must not trigger beforeunload; an owned pending operation does.
CA verifies real Admin attachment delivery and Helm behavior. Browser warning tests acknowledge
browser limitations instead of asserting universal prompt display.

Run `deno task check`, `deno task fmt:check`, `deno task test` excluding `users-api-test.ts` and
`session-coordinator-test.ts`, and STYLE_AUDIT; state exclusions. No passing unit test substitutes
for visual/focus verification or authorizes locked-namespace changes.

## Records

- **2026-11-11 — CA design review; revised target pending lifecycle resolution.** The CA selected
  inline icon-only configured menu triggers; existing command label modes and overflow behavior
  remain compatible. Bound commands own expected-failure reporting and retry semantics; Helm
  observes execution and surfaces unexpected rejections as programming errors without creating
  task reports. The task list and its styles move to separate component files while Helm retains
  the reserved @tasks trigger and popover. The maker lives in `ux/widgets/make-helm-widget.tsx`;
  `helm-widget.tsx` supplies the default `makeHelmWidget({})` export. This production supplies menu
  fitting, @tasks, and attachment reporting; Field Binder owns backpack configuration and bindings.
  These decisions supersede the corresponding menu, command-failure, placement, and acceptance
  text above; the main target has not yet been rewritten for dispatch.
- **2026-11-11 — Lifecycle alternatives and scope self-review.** The CA initially approved an
  Admin-local coordinator wrapper for mount-owned warnings and an application reporting-lifetime
  counter, after reviewing illustrative code; neither was implemented. Subsequent review favored
  removing lifetime tracking because attachment reports describe the device inbox. A readiness
  check before publication suppresses reports while signed out; a pass spanning sign-out/sign-in
  may report into the prepared session. The proposed page-lifetime warning alternative would
  remove automatic root cleanup and therefore weaken the original acceptance requirement.
  ACE withdrew its recommendation to treat that as an adequate substitute and recommended a
  focused application-lifecycle review instead. The CA directed recording this history and
  proceeding with implementation only if the resulting scope passes self-review.
- **2026-11-11 — Lifecycle fitting inspection.** Shared bootstrap mounts `ApplicationRuntime`,
  invokes session initialization under its Solid owner, and returns `Promise<void>`; it exposes
  neither an application mount callback nor a root disposer. Shell initializers run before
  rendering and are not mount-owner lifecycle hooks. Warning cleanup therefore cannot be attached
  to the root from Admin's current post-bootstrap continuation. A root lifecycle fitting requires
  an explicitly scoped shared bootstrap/composition change, retention of the coordinator wrapper,
  or an explicit reduction to page-lifetime semantics. No such replacement fitting has yet been
  selected. The reduced architecture changes are the §9.6 state row and §10.3 binding paragraph;
  any lifecycle fitting may require a separately named architecture change. Source production
  remains pending resolution of this boundary. No wrapper, lifetime module, or drain teardown is
  authorized by this record.

- **2026-11-10, captured from upload work.** A shared running-task indicator and exit warning
  were proposed because Admin's drain was invisible. The original label/count model cleared at
  zero and relied on a pass's remaining count; it did not describe running work or partial failure.
- **2026-11-11, selected and expanded for dispatch review.** The CA's backpack command-menu
  direction establishes a reusable menu fitting, independent of task reporting. Replaced
  sum-of-all-counts and guaranteed-exit-prompt assumptions with per-task units, explicit unknown
  counts, and browser-limited warning behavior. Source-site fetch is no longer a binder task.

- **2026-11-11 — Separate upload instances.** The first reporting consumer is attachment delivery
  through AttachmentsUploads, not a universal Uploads singleton. Binder delivery/preparation has
  its own pair and app-owned execution. The task store and menu fitting remain feature-independent.
- **2026-11-11 — Review issues made explicit in the target draft.** Closed-popover command errors
  use the task/failure surface; blocksExit separates error visibility from unfinished work. A tab
  failing to acquire the drain lock clears its report. User-facing pending-work explanations live
  in the popover, not browser prompt text. These contract refinements remain subject to dispatch
  approval and do not imply implementation authorization.

- **2026-11-11 — Final lifecycle fitting approved.** After reviewing illustrative code, the CA
  approved an optional bootstrap application mount callback returning cleanup. Admin supplies
  startBackgroundTaskWarnings directly; bootstrap registers cleanup under its Solid mount owner.
  This replaces both the coordinator wrapper and page-lifetime-only alternative. Reporting-lifetime
  tracking is omitted; drain completion rechecks prepared state. The scope adds bootstrap.tsx,
  bootstrap-lifecycle-test.ts, and architecture-front's mount-fitting description. All selected
  Helm changes above are incorporated into the main target. Root warning cleanup does not add
  drain teardown or change its scheduling. Source production is authorized within this scope.

## Production record — 2026-11-11

**Foundation production implemented; CA review and real Admin acceptance remain open.**
Architecture-front now describes the optional bootstrap mount fitting, task state row, and
app-root Helm binding seam. Detailed contracts live in current module headers. The CA-selected
inline menus, operation-owned failures, separate task list, and maker placement are implemented.
The default Helm is `makeHelmWidget({})`; the generic registry is unchanged. Admin configures @tasks,
not a Binder backpack. No reporting-lifetime counter, coordinator wrapper, or drain teardown was
introduced. The requested drain-function comment documents pass ownership, scheduling, backoff,
and unexpected-error stop behavior.

### Files

Created, relative to `source/`:

- `ux/shell/runtime/background-tasks.ts`
- `ux/shell/runtime/background-task-warnings.ts`
- `ux/widgets/helm-widget-contract.ts`
- `ux/widgets/make-helm-widget.tsx`
- `ux/widgets/background-task-list.tsx`
- `ux/widgets/background-task-list.css`
- `tests/cases/background-tasks-test.ts`
- `tests/cases/background-task-warnings-test.ts`
- `tests/cases/helm-widget-test.ts`
- `tests/cases/bootstrap-lifecycle-test.ts`

Modified:

- `documentation/architecture/architecture-front.md`
- `effort/active/2026-11-10-background-tasks-brief.md`
- `source/ux/shell/runtime/bootstrap.tsx`
- `source/ux/widgets/helm-widget.tsx`
- `source/ux/widgets/helm-widget.css`
- `source/front/app-admin/app.tsx`
- `source/front/app-admin/dashboard-admin.json`
- `source/front/app-admin/document-drain.ts`
- `source/front/app/shell/session-coordinator.ts`
- `source/tests/cases/document-drain-test.ts`

Deleted: none.

### Verification

- `deno task check`: PASS (guards, full source types, lint).
- `deno task fmt:check`: PASS; the subsequent drain comment also passes the formatter check.
- `deno task test --ignore=source/tests/cases/users-api-test.ts,source/tests/cases/session-coordinator-test.ts`:
  PASS — 212 tests, 13 steps, zero failures, two ignored. The named excluded files are not claimed
  as passed. The ignored tests are opt-in live storage and opt-in local browser verification.
- `deno test --allow-env --allow-read --allow-run=node source/tests/cases/bootstrap-lifecycle-test.ts -- --browser`:
  PASS — one local Chrome integration test. Covers actual bootstrap setup order, repeated root
  disposal/remount, warning release, one-argument/default widget compatibility, reactive status and
  disabled commands, close-before-execute, operation-owned failure/retry, observed programming
  errors without Helm-created reports, dismissal/focus fallback, counts, Enter/Escape focus return,
  theme, route navigation, and narrow overflow/popover switching. Its intentional unexpected Sync
  error is asserted as a programming error; it is not a remaining test failure.
- Task/drain tests cover replacement without stale optional fields, copied counts, unknown counts,
  invalid input, explicit zero-count retention, exit responsibility, lock loss, prepared-state
  changes, deferred success/failure after session clear, publication after sign-out/sign-in,
  complete clearing, existing backoff, repeated start, and unexpected-error stop.
- `git diff --check`: PASS.
- `STYLE_AUDIT: PASS` — all 17 created/modified TypeScript, TSX, and CSS files audited for headers,
  exported contracts, imports, naming, validation, state ownership, component composition, token
  use, and formatting. JSON and documentation formatting also checked.

In-scope verification issues fixed: global listener naming for Deno lint, browser-test opt-in
without direct environment access, test-only disposer capture after JSX transformation, and
concurrent drain comment/syntax edits. No known implementation or automated-check failures remain.

### Remaining acceptance and boundaries

CA reviews the production and checks real Admin attachment delivery and on-screen Helm behavior.
Local browser automation does not establish real attachment delivery, full application visual
acceptance, or universal beforeunload prompt display. No hosted storage action, deployment,
commit, Binder configuration, Ops/Portal integration, scheduling-policy change, or new logout
policy was performed. This record does not close the effort.

## Amendment — 2026-11-11 — Disable Tasks when empty

The CA directed “disable dont hide” after observing an unchanged Helm with no active reports.
The configured @tasks action remains visible in its inline position and is disabled while the
report store is empty. Reports enable it; clearing the last report disables it and closes its
popover. This supersedes the earlier hide-when-empty behavior. The same empty-state rule applies
to an @tasks command inside a configured menu. This changes no task reporting, warning predicate,
or drain scheduling. Production scope is limited to make-helm-widget.tsx, its browser test, and
this brief. No other assets are created, modified, or deleted for this amendment.

Verification for this amendment: `deno task check`, `deno task fmt:check`, and `git diff --check`
passed. The permitted unit suite passed 212 tests and 13 steps, with zero failures and two opt-in
tests ignored; users-api-test.ts and session-coordinator-test.ts remain excluded. The opt-in local
Chrome integration test passed separately, including visible/disabled empty state, reactive enable,
dismissal back to disabled, closed-popover focus return, and existing lifecycle/menu checks.
`STYLE_AUDIT: PASS` for make-helm-widget.tsx and bootstrap-lifecycle-test.ts. No verification
failures remain. No new files or deletions; only the two named source/test files and this brief
changed for the amendment. Real Admin acceptance remains with the CA; no deployment was performed.

## Amendment — 2026-11-11 — Tasks trigger frame

The CA requested the circular action frame after observing that Tasks appeared as a bare glyph.
The cause was the popover trigger composition, not disabled-state styling. The Tasks trigger
retains the popover's single semantic button and uses a widget-owned decorative frame with the
existing dense action dimensions, border, radius, and state tokens. Disabled state dims the whole
control and preserves its frame. Overflow keeps its existing bare glyph. This repair changes
make-helm-widget.tsx, helm-widget.css, the browser integration test, and this brief; no primitive,
public contract, task behavior, or scheduling change is introduced. Browser checks compare frame
geometry and borders with the neighboring Theme action in both disabled and enabled states.

Frame repair verification: local Chrome integration PASS, including computed equality of frame
width, height, border width/style, and radius against Theme while Tasks is disabled and enabled.
Existing lifecycle, interaction, and focus checks also passed. `deno task check`,
`deno task fmt:check`, and `git diff --check` passed. `STYLE_AUDIT: PASS` for the maker, widget CSS,
and browser test; existing design tokens supply the frame styling. No files created/deleted for
this repair, no remaining verification failure, and no deployment performed.

## Amendment — 2026-11-12 — Frameless Helm toolbar icons

The CA selected bare glyphs for all Helm toolbar icon buttons. This supersedes the circular
Tasks frame amendment above. Toolbar action frames have transparent backgrounds and no border
at rest, on hover, and during keyboard focus. The Tasks popover uses a single glyph inside its
existing semantic button; its dense action target dimensions are retained on the button.
Existing spacing, accessible names, keyboard focus indication, disabled dimming, and empty-state
behavior remain. Backpack and overflow retain their bare-glyph presentation. Styling is scoped
to the Helm toolbar; the shared UiActionButton primitive is unchanged.
The CA clarified that every enabled toolbar button retains the existing hover glow. Both
popover triggers and action buttons use the shared button-shadow token; disabled buttons do
not glow, and keyboard focus retains the focus ring.

Foundation production modifies make-helm-widget.tsx, helm-widget.css,
bootstrap-lifecycle-test.ts, and this brief. No files are created or deleted. Local Chrome
integration passes, including frameless rest/hover/focus states, retained Tasks target dimensions
while disabled and enabled, disabled dimming, focus indication, and the existing lifecycle,
menu, navigation, theme, and narrow-layout checks. The browser check also verifies hover glow
on Theme, Tasks, Backpack, and overflow, and no hover glow on disabled Tasks.

Verification: `deno task check`, `deno task fmt:check`, and `git diff --check` pass. The permitted
unit suite passes 218 tests and 14 steps, with zero failures and three opt-in tests ignored;
users-api-test.ts and session-coordinator-test.ts remain excluded. The local Chrome integration
test passes separately. `STYLE_AUDIT: PASS` for the maker, widget CSS, and browser test. No
verification failures remain. No deployment was performed, and this amendment does not close the effort.

## Amendment — 2026-11-12 — Local Helm button

The CA approved a Helm-owned button and glyph in helm-button.tsx with local styling in
helm-button.css. This replaces toolbar UiActionButton composition and the frame/label-part
overrides in helm-widget.css. UiButton supplies the semantic button required by the existing
bare-HTML guard; the local component owns accessible naming, button type, glyph content,
dimensions, and presentation. Popovers retain their existing trigger host and receive the same
HelmButtonGlyph content. There are no nested buttons or changes to shared primitives or guards.

The resting appearance is frameless. Enabled buttons retain the circular hover halo and primary
color cue; keyboard focus retains its ring. Disabled/loading buttons suppress activation and
hover effects. Loading exposes aria-busy. Component-owned naming, content, type, styling, and
state attributes cannot be supplied through HelmButtonProps; native refs, events, and other ARIA
attributes pass through. Labelled menu actions retain UiActionButton.

Foundation production creates source/ux/widgets/helm-button.tsx and helm-button.css and modifies
make-helm-widget.tsx, helm-widget.css, bootstrap-lifecycle-test.ts, and this brief. No files are
deleted. The browser coverage compares command and popover hosts across themes and narrow
layouts and exercises loading, disabled state, keyboard activation, focus return, and ref/event
forwarding. Luna ran the final verification: `deno task check`, `deno task fmt:check`, the
permitted unit suite, and `git diff --check` pass. The suite passes 218 tests with zero failures
and three opt-in tests ignored; users-api-test.ts and session-coordinator-test.ts remain excluded.
The separate local Chrome integration passes, including both button hosts, light/dark hover
halo and color, responsive target sizing, glyph alignment, loading, disabled activation,
Enter/Space/Escape, focus return, and ref/event forwarding. `STYLE_AUDIT: PASS` for the local
component, CSS, maker, and browser test. No verification failures remain. No deployment or
effort closure is included.

_End of Brief_
