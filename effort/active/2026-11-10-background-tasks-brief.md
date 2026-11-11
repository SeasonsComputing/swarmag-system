# Background Tasks — Brief

**Active, draft for CA dispatch review; selected 2026-11-11.** Captured 2026-11-10. Foundation
mode: generic task state and an additive Helm menu fitting in locked `ux/`. Selection authorizes
exploration; implementation still requires explicit CA authorization of that crossing and scope.

## Purpose

Admin already uploads placed documents in the background, but people cannot see pending work or
failures. The Field Binder adds a user-invoked sync and needs a Helm button whose popover contains
Manager/Binder/Sync or Binder/Sync. These are related needs with distinct responsibilities:

- A generic Helm menu presents configured commands and status.
- A generic task store reports work owned and executed by applications.

Neither becomes an upload service, binder API, job scheduler, or persistence engine. The menu
fitting is useful even when no task is running. It is not the Helm's existing overflow menu.

## Dependencies and recommended production order

Upload (`effort/active/2026-11-11-upload-brief.md`) first; this brief then proves task visibility
against the real Admin drain. Field Binder (`effort/active/2026-11-04-field-binder-brief.md`) then
uses the menu fitting and publishes sync work. This brief must not require a finished binder.

## Recommendations requiring CA approval at dispatch

1. Add one level of configured Helm command menus, with code bindings supplied through a
   `makeHelmWidget` maker at the application composition root. No nested menu tree or mutable
   global command registry. Existing HelmWidget and JSON actions remain compatible.
2. Keep a reserved `@tasks` entry, using `update` from the existing glyph catalog. It appears
   while tasks are running, waiting with work remaining, or failed. Its popover lists task
   labels, known counts, and failures. Do not sum counts with different meanings into one number.
3. Warn on page exit for running work or queued work that this tab is responsible for progressing.
   Durably queued work can survive closing, so explain it as pending delivery, not data loss.
   The browser controls whether/how a beforeunload warning appears; it is not a guaranteed prompt.

## Helm menu fitting

A configured action is either an existing command or a menu with a label, icon, labelMode, and
items. A menu item is a command action or a named status line. No JSON contains callbacks.
Configuration parsing rejects ambiguous entries, empty/unknown command bindings, and nested menus.
Ordinary route commands and @theme keep their existing interpretation.

An application binds named executable commands and reactive status readers when it constructs a
Helm widget implementation, then supplies that implementation under the existing HelmWidget key
in its widget registry. Bindings are injected callbacks, not discoveries or imports from front/.
The shell stays closed to concrete widget catalogs and feature implementations.

For example, Field Binder later configures one icon-only backpack menu with route items Manager
and Binder, a bound Sync command, and a bound status line. Reader-only apps omit Manager. This
brief supplies the fitting only; it does not install binder commands before that feature exists.

The maker binds a `HelmBindings` data shape; its callbacks are application code:

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

Keep those contracts in `ux/widgets/helm-widget-contract.ts`. The maker and existing HelmWidget
live beside it in `helm-widget.tsx`; the default component uses empty bindings. Keep command
names adorned (for example `@sync-field-binder`), distinct from route paths and reserved commands.
An app cannot override @theme or @tasks. Registering the maker under HelmWidget in an app's widget
registry needs no dashboard or route-runtime contract change.

A menu setting uses `{ label, icon, labelMode?, items }`, with no command of its own. Items are
existing `{ command, label, icon }` records or `{ status: bindingName }` records. Reject records
with both/neither operation; a status key must resolve to a bound reader. Labels and icon modes
remain existing Helm vocabulary, not a second presentation system.

Menu presentation reuses UiPopover and labelled UiActionButtons, as Helm overflow does today.
A command closes its popover before execution. Async failures must be observed and presented;
no unhandled promise rejection. Commands that start background work publish failures through the
task store; other bound async commands need menu-local feedback. Status is not focusable or
clickable. Preserve accessible names, focus return, theme cycling, icon-only distribution, and
existing overflow behavior at narrow allocated widths. If a configured menu itself enters the
existing overflow surface, open its popover without leaving two competing popovers open.

## Task reporting contract

`BackgroundTasks` is a reactive store module in `ux/shell/runtime/background-tasks.ts`, following
CONVENTIONS §16.3. It exposes read-only task state and intent-named publish/clear operations;
setters and Solid state machinery remain private. Entries use stable caller-owned string keys.

The published task data shape is:

```ts
export type BackgroundTask = {
  label: string
  phase: 'running' | 'waiting' | 'failed'
  remaining?: { count: number; unit: string }
  progress?: { completed: number; total: number; unit: string }
  error?: string
}
```

`BackgroundTasks` exposes `store` for reads, `publish(key, task)`, `clear(key)`, and `clearAll()`.
Count values are nonnegative integers; completed cannot exceed total. Failed tasks require error
copy; other phases omit it. Unknown count is explicit absence, never zero. Progress is optional
and describes only a known finite batch. Validate the supplied state at this boundary.

Applications publish; the store does not run callbacks, retry work, infer progress from elapsed
time, or clear a task just because count is zero. The publisher clears only after verified
completion, or explicitly dismisses a non-pending result. Failure remains visible until retry,
resolution, or an explicit application-owned clear. Tasks are transient reports, not durable jobs;
a reload reconstructs reports from the underlying inbox or feature state.

The @tasks popover renders state with text as well as glyphs. An empty store hides its trigger.
A failure is visible even when its count is unknown. Do not add cancel/retry controls whose
underlying operations do not support them. The publisher continues to own that behavior.

## First consumer: Admin delivery

DocumentDrain continues to own the existing one-minute schedule, capped backoff, prepared-session
check, and cross-tab Web Lock. It calls api.Uploads.drain after the Upload extraction.

- Publish running before the pass, with unknown count unless a known value exists. A drain's
  returned `remaining` is measured after a pass; it cannot describe progress before that pass.
- Success with remaining zero clears the report. Success with remaining nonzero publishes waiting
  and that count. The next pass publishes running again.
- Expected ApiError/AggregateError publishes failed with useful display copy and retains backoff.
  An aggregate failure returns no reliable remaining count; omit it or explicitly retain the last
  known observation, never invent a fresh count. Unexpected errors are reported and then rethrown
  under the existing stop behavior, not swallowed into endless retry.
- A tab that did not acquire the drain lock does not announce that it performed the work.
  Cross-tab reporting is not added; this version reports the current tab's work. A previously
  waiting/failed report in a follower tab may therefore be stale until its next owned pass.
- On session clear, remove session reports and beforeunload participation without deleting durable
  inbox data. Preserve one loop and one event-listener lifetime; reconnect the reporting to the
  next prepared session. Do not duplicate timers on sign-in.

Queued reports appear only once work is observed by a pass. Immediate notification when a new file
is placed is not promised by this production. Increasing reporting precision later must not force
binder-specific callbacks into Uploads.

## Page exit

Install beforeunload handling once through an explicit runtime lifecycle helper. Its predicate is
reactive task state: running or unresolved waiting/failed work, including unknown counts. A retained
failed report does not imply zero pending work. Clear listener state when the session clears. Use the browser-supported event cancellation/returnValue pattern; do not
supply custom prompt wording or promise a warning on mobile process termination. There is no new
logout veto or workbench Close guard in this scope.

## Production scope

All implementation paths below are under `source/`.

| Area              | Expected files and changes                                                                                                  |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Task state        | New `ux/shell/runtime/background-tasks.ts`; new explicit exit-warning lifecycle helper if separated                         |
| Helm contract     | New `ux/widgets/helm-widget-contract.ts`; modify `helm-widget.tsx` and colocated `helm-widget.css`                          |
| Generic binding   | `ux/widgets/widget-registry.ts` only if needed to preserve the default HelmWidget export                                    |
| Admin integration | `front/app-admin/document-drain.ts`, `dashboard-admin.json` for @tasks, `app.tsx` for lifecycle setup if needed             |
| Session lifecycle | `front/app/shell/session-coordinator.ts` only for explicit report/listener cleanup; no authorization changes                |
| Tests             | New background-task state/exit-warning tests, Helm menu contract tests, and updates to `tests/cases/document-drain-test.ts` |

Before code, authorize architecture-front's state management/extension-binding documentation,
CONVENTIONS §16.3 reporting guidance if needed, and current Helm header/contract documentation.
Any governance amendment requires its own explicit scope and separate commit. Do not assume
architecture-front §9.6 is the correct location without checking the current section names.

Out of scope: docstore/core changes, new primitives or glyphs, upload scheduling changes, binder
implementation, Ops/Portal wiring, persistent task history, cross-tab task aggregation, task
execution/cancellation, per-document failure UI, and a new logout authorization flow.

## Verification and acceptance

- Existing action configuration remains valid. Test malformed/unknown bindings, one-level menu
  parsing, route/theme actions, disabled execution, observed async failures, and reactive status.
- Cover unknown counts, waiting work, partial failures, retry clearing, beforeunload predicate,
  session clear, repeat start, and lock-not-acquired behavior. Preserve drain backoff tests.
- CA checks Helm at wide and narrow allocated widths: existing commands, configured popovers,
  focus/keyboard behavior, task visibility, failed delivery, successful retry, and exit warning
  where the browser permits it. Field Binder later supplies the second real menu/task consumer.
- `deno task check`, `deno task fmt:check`, `deno task test` excluding
  `users-api-test.ts` and `session-coordinator-test.ts`; `STYLE_AUDIT`. Report exclusions.

## Dispatch decisions

CA approval is needed for the three recommendations and the additive crossing into locked ux/.
The explicit command/task contracts above need CA/ACE review before production. No additional generic framework
or new primitive is authorized by this draft.

## Design history

- **2026-11-10, captured from upload work.** A shared running-task indicator and exit warning
  were proposed because Admin's drain was invisible. The original label/count model cleared at
  zero and relied on a pass's remaining count; it did not describe running work or partial failure.
- **2026-11-11, selected and expanded for dispatch review.** The CA's backpack command-menu
  direction establishes a reusable menu fitting, independent of task reporting. Replaced
  sum-of-all-counts and guaranteed-exit-prompt assumptions with per-task units, explicit unknown
  counts, and browser-limited warning behavior. Source-site fetch is no longer a binder task.
