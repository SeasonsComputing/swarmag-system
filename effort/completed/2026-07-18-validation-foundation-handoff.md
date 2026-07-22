# Validation Foundation — Session Handoff

**Date:** 2026-07-18
**Mode:** Foundation
**Status:** CLOSED — committed 2026-07-19 as `03a7214` after CA feel test
and acceptance. Post-handoff work folded into the same commit: Enter gate,
collapse push animation, manager-owned autofocus, roles-as-accent-text,
actions-width fix, sticky table headers, `AbstractionFormValidation`
interface correction. See the task ledger for details.
**Source design:** `effort/completed/2026-07-18-foundation-game-plan-design.md`
**Task ledger:** `effort/completed/2026-07-18-validation-foundation-tasks.md`

---

## 1. What landed today (all uncommitted)

Phase 1 (D1–D11) per the design doc, then CA review refinements:

**Round 1:** `--sa-dialog-pad` rhythm token (once in shared `[data-theme]`);
Enter-advance keyboard hook + first-field autofocus; phone typography
breakpoint 425px → 480px in `roles.css` (NOT tokens.css — that 350px block is
the ultra-small floor; `--sa-size-xs: 425px` is a layout width token,
untouched); collapse animation parked → then unparked in round 2.

**Round 2:**

- **Enter gate** — `blurField` returns validity;
  `useAbstractionFormKeyboard(formRef, advanceGuard)` holds focus on an
  invalid field (ring lights, no advance).
- **Collapse animation** — directional push (list exits left, editor enters
  from right, 200ms fade+slide, reduced-motion respected). New tokens
  `--sa-transition-panel` / `--sa-transition-panel-active` in `tokens.css`
  (CSS guard forbids raw transition values — that's why tokens).
- **Autofocus rearchitected** — moved from editor effect into
  `AbstractionManager` itself (`createEffect` on mode/selected →
  `focusFirstField(panelRef)`). Editor-level autofocus was wrong-layer: the
  entity effect never fires on New User (null→null) and the panel is
  `visibility:hidden` at mount so focus dies silently. `focusFirstField` is
  now a standalone export in `use-abstraction-form-keyboard.ts` with a
  motion-settle re-assert (reads `--sa-motion-page-fade`, +50ms buffer).

## 2. Files changed (whole session, uncommitted)

core: `core/std/validators.ts` (+tests) — isEmail/expectEmail (WHATWG
verbatim), toTrimmed/toEmail.
ui: `ui-field.tsx` (required `*`), `ui-layout.tsx` (`cluster` variant),
`ui-dialog.tsx` untouched (escape audit: Kobalte default already correct),
`ui.css`, `themes.css`, `tokens.css`, `roles.css`.
shell: `use-abstraction-form-validation.ts` (new),
`use-abstraction-form-keyboard.ts` (new), `use-abstraction-form-feedback.ts`
(copy → "Correct the highlighted fields."), `abstraction-manager.tsx`
(autofocus effect + panelRef), `abstraction-manager.css` (push animation).
app-admin: `users/user-manager.tsx` (rules, wiring, normalization, cluster
cells). Also `.claude/launch.json` (+app-admin-stage-local entry),
`effort/completed/` (design, tasks, this handoff) and
`documentation/project/project-feature-parking-lot.md` (parking lot entry).

## 3. Verification state

Automated: guards+types+lint green; 25 tests pass (10 new); pre-existing
unrelated failure in `users-api-test.ts` (Deno.exit env issue, fails on clean
tree too). Live pass round 1 fully verified through CA's authenticated
Chrome session (rings, timing, copy, escape/outside-click). Round 2
(animation + autofocus + Enter gate) is code-verified and CSS-probe-verified
but **NOT motion-verified**: CA's Chrome window was occluded during probes
and Chrome freezes transitions/focus in throttled tabs. 30-second CA feel
test pending: Users → New User (slide + cursor in Name) → bad email + Enter
(held with ring) → fix → Enter advances → Escape.

## 4. Open decisions

1. **Roles nesting (CA ruling pending):** list crops ~640px. CA leans
   roles-as-nested-row beneath email in collapsed mode; AA recommends doing
   it at ALL widths — drop the Roles column (list = User/Active/Actions),
   single presentation, no responsive cell-relocation fork. Awaiting CA
   choice: all-widths vs collapsed-only.
2. **Boundary normalization follow-up:** wire `toEmail`/`expectEmail` into
   domain user-validator / edge path (design D11 deferral).
3. **Phase 2 (`front/` migration)** ready for scope declaration on CA go —
   see game-plan design doc. Before Phase 3 commits: does onboarding wizard
   need inline note capture (Notes swaps ahead if yes)?

## 5. Session protocol notes

- CA requires independent explicit go before any production. Design
  questions get analysis + proposal first.
- CA's dev server runs on :5173 (do not spawn a second); CA's Chrome is
  authenticated (OTP) — agent drives it via browser tools for live passes;
  window must be foregrounded for motion/focus verification.
- Free-tier (haiku) subagents for delegable well-specified work.
