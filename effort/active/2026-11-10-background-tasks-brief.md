# Background Tasks — Brief

**Active, draft for dispatch review; refreshed 2026-11-11.** Foundation mode: generic work
reporting and one-level Helm command menus in locked `ux/`. Production and the locked-namespace
crossing require explicit CA authorization. The main text is the implementation target; trailing
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

Contracts live in `ux/widgets/helm-widget-contract.ts`; maker and default component live in
`ux/widgets/helm-widget.tsx`. The default uses empty bindings. No mutable global command registry
or dashboard/route-runtime contract change is needed. Reserved @theme/@tasks cannot be overridden.
Application command names are adorned, such as @sync-field-binder; route paths remain route paths.

A configured top-level item is an existing command record or a menu record
`{ label, icon, labelMode?, items }`, with no command of its own. A menu item is a command record
`{ command, label, icon }` or a status record `{ status: bindingName }`. Reject both/neither
operations, missing bindings, empty menus, and nested menus. JSON contains no callbacks.

UiPopover and labelled UiActionButtons supply the existing control composition. Status text is
neither clickable nor focusable. Commands close the popover before execution. Keyboard/focus
return, icon-only layout, and allocated-width overflow retain their existing behavior. Opening a
configured menu from overflow closes the overflow surface first; competing popovers are not kept
open together. Async command execution is observed; rejections have a visible report, not an
unhandled promise rejection or feedback hidden inside an already-closed popover.

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
known counts/progress, and error text. It appears whenever reports exist, including non-blocking
command failures. It disappears when the store is empty. Resolved work is explicitly cleared by
its owner; zero count does not silently clear a running operation. Reports are transient; a reload
reconstructs work state from the inbox or feature, not from persisted task history.

### Command failures

Helm reports a rejected bound command under that command's name, using its configured label. If
the operation already published a failed report under that key, retain its detailed report. If
not, publish failed with error copy and blocksExit false, preserving an existing operation-owned
blocksExit value when present. A command's retry clears its previous report before executing;
operation publishers use the same command key to avoid duplicate failure entries. A new execution
must reestablish its actual exit responsibility rather than inheriting it blindly.

A non-blocking failed report has an explicit Dismiss control. A blocking failed report is cleared
by its operation when resolved or responsibility is released. The generic store offers no Retry or
Cancel execution callbacks. The feature's command remains the execution entry point. Unexpected
errors remain observable through their failure reports; worker loops retain their own rethrow/stop
rules. No error is hidden merely because its popover closed.

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
  Repeated start/sign-in does not create duplicate loops, listeners, or report lifetimes.

The report starts when a pass observes work; immediate placement notifications are not part of
this contract. Generic Uploads does not publish UI state or depend on BackgroundTasks.

## Exit warning lifecycle

Implement `startBackgroundTaskWarnings` in `ux/shell/runtime/background-task-warnings.ts`, returning
a cleanup callback. The application mounts it once for its root lifetime and releases it on
teardown. Its predicate is whether any current report has blocksExit true. Session clearing removes
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

All implementation paths are under `source/`.

| Files                                                                                                                           | Work                                                            |
| ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| New `ux/shell/runtime/background-tasks.ts`                                                                                      | Reporting state, validation, intent operations                  |
| New `ux/shell/runtime/background-task-warnings.ts`                                                                              | Explicit warning lifecycle                                      |
| New `ux/widgets/helm-widget-contract.ts`                                                                                        | Binding/configuration contract                                  |
| `ux/widgets/helm-widget.tsx`, `helm-widget.css`                                                                                 | Menus, reserved @tasks, command failures, default compatibility |
| `front/app-admin/document-drain.ts`                                                                                             | Attachment-instance reporting with existing scheduling          |
| `front/app-admin/app.tsx`, `dashboard-admin.json`                                                                               | Warning lifecycle and configured @tasks action                  |
| `front/app/shell/session-coordinator.ts`                                                                                        | Report cleanup on session clear only                            |
| New `tests/cases/background-tasks-test.ts`, `background-task-warnings-test.ts`, `helm-widget-test.ts`; `document-drain-test.ts` | State, parser/bindings, warning, and drain coverage             |

The public maker lives in helm-widget.tsx; the generic widget registry keeps its default binding.
Do not alter registry, route, or dashboard contracts by implication. Before implementation approve
present-tense architecture-front §8.3, §9.6 State Management, and §10.3 Dashboard Layout Contract
patches plus current module headers. No CONVENTIONS amendment is required by this design; escalate
any actual convention conflict rather than silently extending governance scope.

Out of scope: provider/core changes, new primitives/glyphs, execution engine, persistent task history,
cross-tab reporting, upload scheduling changes, binder implementation, Ops/Portal rollout, per-file
failure surfaces, and new logout policy. CA explicitly approves additive changes to locked ux/ and
the task/menu contracts before production.

## Acceptance

Cover old configuration compatibility, malformed/ambiguous bindings, default maker, menu/status
reactivity, disabled command execution, observed async rejection, one failure report per command,
non-blocking failure dismissal, and retry. Verify focus, keyboard use, theme action, and menus
within narrow Helm overflow.

Test unknown count, waiting/failed responsibility, lock-not-acquired clearing, prepared-session
changes, complete clearing, partial-failure backoff, unexpected-error stop, teardown, and repeated
start. Non-blocking command failure must not trigger beforeunload; an owned pending operation does.
CA verifies real Admin attachment delivery and Helm behavior. Browser warning tests acknowledge
browser limitations instead of asserting universal prompt display.

Run `deno task check`, `deno task fmt:check`, `deno task test` excluding `users-api-test.ts` and
`session-coordinator-test.ts`, and STYLE_AUDIT; state exclusions. No passing unit test substitutes
for visual/focus verification or authorizes locked-namespace changes.

## Records

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
