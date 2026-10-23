# UI Behavior Tests — Brief

**Pending, not dispatched.** Recorded 2026-10-21 from a CA + AI Architect session, while closing
M-5's enablers: every walkthrough case that day was UI behavior, and the CA ran each one by hand.
Automating UI behavior is settled, the wisdom of smart teams; how is open. It is chosen from the
roadmap when the how is worth deciding.

## What triggered it

The CA is on the critical path for testing. The workbench draft services and fresh editor
feedback briefs ended in walkthroughs of discard prompts, success banners, and field focus across
User Manager, Customer Manager, Onboarding, the Sites step, and the notes editor. M-5 copies those
managers, so each copy repeats the same flows and the same hand checks.

Stage test authorization (`effort/completed/2026-10-13-stage-test-authorization-brief.md`) takes the
API path off the CA: once tests hold a session, a copied manager's create, read, update, and soft
delete run under `deno task test`. It does not reach UI behavior.

## What the repository holds

- **Tests are Deno tests,** in `source/tests/cases/`, run by `deno task test` over
  `source/tests/**/*-test.ts` (CONVENTIONS §18). They exercise contracts, state modules, and stage
  APIs; none renders a component or drives a browser.
- **State-level checks already cover part of the behavior,** in the JSX-free modules a test can
  import: `workbench-draft-test.ts`, `user-state-test.ts`, `customer-state-test.ts`.
- **What stays manual** is behavior only a rendered page shows: whether a prompt opens, what a
  banner says, where focus lands, whether a field is drawn as an error.

## Open

1. **How each layer of the test pyramid fits a Deno toolchain.** The usual shape:
   - **State tests**, the wide base, which the repository already has.
   - **Component tests,** rendering one control or panel without a browser, typically
     `@solidjs/testing-library` over a DOM shim: prompts, banners, and field errors, cheaply.
   - **A thin layer of browser tests,** typically Playwright, driving the real app on stage for
     flows that cross pages, sign-in included.
2. **How a browser test signs in to stage,** and whether it shares the session fixture that stage
   test authorization introduces.
3. **Where the tests live and how they run:** beside `source/tests/cases/` under
   `deno task test`, or as a separate task.
4. **Which flows come first:** the discard prompt, the feedback banner, and New/Save/Delete in
   `AbstractionManager`, which every copied manager inherits, are the likely candidates.

## Production scope

Operating mode: **Foundation** once Open is settled: test tooling, DevOps structure, and possibly
CONVENTIONS §18.

_End of Brief_
