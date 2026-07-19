# Foundation — Validation Task List

**Date:** 2026-07-18
**Mode:** Foundation
**Status:** COMPLETE — production authorized and executed 2026-07-18. All
task groups verified same day, including the live pass driven through the
CA's authenticated browser session. Uncommitted; CA's call on when to commit
and on final acceptance.
**Source design:** `documentation/project/2026-07-18-foundation-game-plan-design.md`

This task list decomposes the approved design (D1–D11) into task groups.
Each group is a logical component of Phase 1.

## Phase 0 — Decisions

- [x] D1–D11 approved by Chief Architect (2026-07-18)
- [x] Production go order issued

## Task Group A — core/std Primitives

All items in `source/core/std/validators.ts` and tests:

- [x] `isEmail` WHATWG-anchored regex + `expectEmail` wrapper
- [x] `toTrimmed` + `toEmail` transform functions
- [x] Unit tests in `source/tests/cases/validators-test.ts` (10 new cases)
- [x] No stricter expressions than WHATWG `input[type=email]`

## Task Group B — UI Primitives

All items in `source/ux/common/components/ui/`:

- [x] `UiField` gains `required` prop, renders `*` (label and caption)
- [x] `ui-layout.tsx` — new `cluster` variant (flex-wrap, intrinsic width)
- [x] `ui.css` rules: required mark styling, multi-select error ring,
      cluster layout
- [x] Semantic token for required mark in `themes.css` (both themes)

## Task Group C — Dialog Behavior

- [x] Audit finding: no code change required. `UiDialog` never gated escape
      (Kobalte default closes on it); `dismissible` gates only
      `onPointerDownOutside`. D9's behavior — escape dismisses, outside-click
      does not — is already shipped. Confirm at live pass.
- [x] Cancel, Close, Escape discard edits without confirmation (existing
      behavior, no confirmation path exists)

## Task Group D — Shell Validation Mechanism

New hook and wiring:

- [x] New `source/ux/common/shell/use-abstraction-form-validation.ts` —
      timing state machine over `ExpectResult` rules; capture-phase `invalid`
      listener lights rings when native validation blocks submit
- [x] `use-abstraction-form-feedback.ts` — copy change to
      "Correct the highlighted fields." (exported as `FORM_FEEDBACK_MESSAGE`)
- [x] Validation timing per D4: text blur + revalidate-as-corrected,
      selects/multi-selects immediate on change

## Task Group E — User Manager Wiring

Field policy + normalization at save:

- [x] Declarative field rules in `user-manager.tsx` built from `@core/std`
      primitives (`expectNonEmptyString`, `expectEmail`, `toEmail`)
- [x] Error wiring: invalid controls light error state; rings reset when the
      editor loads a new entity
- [x] Roles multi-select lights on validation error; rule replaces the old
      banner-only check
- [x] `cluster` layout for roles list cells
- [x] Required `*` mark on Name, Email, Phone, Roles (Preferred Channel and
      Status carry valid defaults and cannot empty — no mark, per D-decisions)
- [x] Email trim + lowercase at save (`toEmail`)
- [x] Display name trim (preserve casing) at save (`toTrimmed`)
- [x] Phone trim at save (`toTrimmed`)
- [x] Notes preserve interior formatting; whitespace-only treated as empty
      (existing behavior retained)

## Task Group F — Verification

Gating checks before Phase 2:

- [x] `deno task check` green (guards + types + lint, 183 files)
- [x] `deno task test` — all 25 relevant tests green incl. 10 new validator
      cases. Pre-existing unrelated failure in `users-api-test.ts`
      (`Deno.exit(1)` outside any test; fails identically on clean tree —
      confirmed via stash)
- [x] `deno task fmt` applied; bundle hot-reloaded clean, no console errors
- [x] Live CSS probe against running dev server: required-mark token
      resolves, cluster / required-mark / multi-select-error rules present
      in served stylesheets
- [x] Live pass: empty create submit → all four rings lit (incl.
      multi-select) + "Correct the highlighted fields." banner
- [x] Live pass: invalid email survives blur; correction clears the ring
      while typing, no blur needed (name and phone likewise)
- [x] Live pass: selecting a role clears the roles ring immediately
- [x] Live pass: required `*` on exactly Name, Email, Phone, Roles — red
      mark via `--sa-field-required-mark`
- [x] Live pass: outside-click does not dismiss; escape dismisses and
      discards without confirmation. Note: with focus inside the roles
      listbox, the first Escape is consumed by the listbox and the second
      dismisses — standard layered dismissal, judged correct
- [x] Zero console errors throughout

## Addendum — CA Review Refinements (same day)

CA rulings after hands-on review of the completed Phase 1 build:

- [x] `UiDialog` interior padding moved onto the rhythm system —
      `--sa-dialog-pad: var(--sa-rhythm-pad)` declared once in the shared
      `[data-theme]` block; `ui.css` dialog rule consumes it (was fixed
      `--sa-space-lg`)
- [x] Enter-key policy (CA ruling): Enter in a single-line input advances
      focus to the next form control; textarea keeps newline; Save button
      keeps Enter-to-activate as the deliberate submission path. New shell
      hook `use-abstraction-form-keyboard.ts`; first-field autofocus on
      editor open and entity switch
- [x] Phone typography breakpoint moved 425px → 480px (`roles.css`) —
      modern 430px-wide phones previously fell outside all phone rules.
      (`--sa-size-xs: 425px` is a layout width token, untouched)
- [x] Narrow-screen manager model: CA judged the existing list/editor
      collapse correct; transition animation parked in
      `swarmag-feature-parking-lot.md`
- [ ] CA hands-on pass of Enter-advance feel

## Addendum 2 — CA Review Refinements, Round 2 (same day)

- [x] Enter gate: `blurField` returns validity; keyboard hook's
      `advanceGuard` holds focus on an invalid field (ring lights, no
      advance) instead of walking away from the error
- [x] Collapse animation: directional push (list exits left, editor enters
      from right), 200ms fade+slide via new `--sa-transition-panel` /
      `--sa-transition-panel-active` tokens (CSS guard forbids raw
      transition values); `prefers-reduced-motion` respected
- [x] Autofocus rearchitected to the correct layer: `AbstractionManager`
      owns mode, so it now owns first-field focus (effect on mode/selected →
      standalone `focusFirstField(panelRef)` with motion-settle re-assert).
      Editor-level autofocus never fired on New User (null→null entity) and
      died silently against the hidden panel at mount
- [ ] CA feel test (motion could not be remote-verified — occluded Chrome
      window freezes transitions): Users → New User (slide + cursor in
      Name) → bad email + Enter (held with ring) → fix → Enter advances →
      Escape
- [x] CA ruling: Roles nested beneath email at ALL widths (2026-07-18) —
      Roles column dropped; list is User / Active / Actions; roles render
      inside the User cell beneath the email
- [x] CA taste ruling (2026-07-18): roles are plain comma-separated full
      names in secondary text — no badges, no abbreviations (roles here are
      passive metadata, not status/interactive tokens; same reasoning that
      rejected UiChips). Abbreviation map deleted
- [x] Actions-column width calc corrected while removing the old column
      fudge: counts all 3 button margins + cell inline padding (the old
      74%-sum slack silently hid the 14px undercount). Live-verified: zero
      overflow, no clipped buttons; animation CA-approved ("chef's kiss")
- [x] Role labels wear `--sa-color-accent`; separating commas stay
      secondary (labels are values, commas are sentence punctuation —
      per-role spans, explicit `{', '}` since dprint trims JSX whitespace)
- [x] Sticky table headers as design-language behavior (`ui.css`):
      `position: sticky` on `[data-ui='table-head']` itself (Chromium fixed
      thead-sticky in 2019 — no per-cell voodoo needed, brand gradient
      survives intact). Load-bearing footgun fixes: `border-collapse:
      separate` + `border-spacing: 0` (collapsed-model borders belong to
      the table and stay behind when the head sticks) and `overflow: clip`
      instead of `hidden` on table + container (hidden creates a scroll
      container that traps stickiness). Empirically verified: scrolled a
      constrained list 80px — rows moved 80, header moved 0, gradient
      intact. Caveat: a genuinely h-scrolling table (`overflow-x: auto`
      variant) still defeats vertical stickiness — inherent nested-scroller
      conflict, documented not fought

---

_End of Task List_
