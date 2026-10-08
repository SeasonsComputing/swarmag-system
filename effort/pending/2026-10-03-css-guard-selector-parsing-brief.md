# CSS Guard — Complete Selector Parsing

**Backlog, not dispatched.** Recorded 2026-10-03 following CA review of the Helm widget's
`visible-no-icon` production. Writing this brief and its backlog entry is authorized; guard
implementation and the subsequent Helm correction require their own production authorization.

## What triggered it

The Helm widget gained a local `visible-no-icon` configuration mode. Its initial CSS preserved
containment within the widget and selected the underlying `UiActionButton` parts:

<!-- dprint-ignore -->
```css
[data-widget='helm-widget'] [data-widget-label-mode='visible-no-icon'] [data-ui='action-button-label']::after {
  content: none;
}
```

Dprint wrapped the long selector. The formatted selector was valid CSS:

```css
[data-widget='helm-widget']
  [data-widget-label-mode='visible-no-icon']
  [data-ui='action-button-label']::after {
  content: none;
}
```

`guard-css.ts` audits physical lines containing `{`. Its `extractSelector` therefore saw only
`[data-ui='action-button-label']::after` and rejected it as not rooted at `[data-widget`.
The guard discarded the ancestor that established the selector's ownership.

The production worked around this by emitting `data-widget-helm-label-mode` on each button and
rooting the selectors directly at that attribute. The shorter selectors survived dprint on one
line and passed checks. CA rejected this as an information-hiding violation: a Helm-local
implementation marker became sufficient to activate styling outside Helm's ancestor boundary.
Naming the marker after Helm did not preserve containment.

This was a defective defect correction: the component changed to accommodate the guard's
misreading. The repair belongs in the guard, followed by restoration of Helm containment.

## Governing principle

`ux-design-language.md`'s Layer Boundaries permit widget-rooted selectors to descend into Ui
controls in an owned composition. Formatting must not change whether that boundary passes.

The guard must evaluate complete selectors and each branch of a selector list. Existing namespace,
attribute, token, and value policies remain unchanged. This repairs their enforcement; it does
not grant new styling authority or require components to accommodate physical-line parsing.

## Production scope

Operating mode: **Foundation**, because guard enforcement is foundational under CONSTITUTION §4.2.

Goal: make selector audits independent of dprint's physical-line layout while retaining useful
source locations and all existing policy checks.

| File                                   | Intended change                                                                                                                                                              |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `source/devops/guards/guard-css.ts`    | Parse complete selectors, reuse that representation across selector audits, and expose a pure audit entry point for regression tests while retaining command-line execution. |
| `source/tests/cases/css-guard-test.ts` | New focused regression tests for selector extraction, enforcement, and source locations.                                                                                     |

No files are deleted. No new dependency, parser package, task, or configuration change is proposed.
The test file and its pure audit entry point are part of the explicit Foundation dispatch scope;
they must not be introduced through an unrelated feature production.

## Implementation requirements

1. Collect complete rule selectors through the opening `{`, retaining the originating source
   line for diagnostics. Physical lines are not selector boundaries.
2. Audit every comma-separated selector branch independently. A valid branch must not mask an
   invalid branch, regardless of its position or formatting.
3. Respect comments, quoted strings, escapes, brackets, and parentheses. Commas inside attribute
   strings or functional pseudo-classes do not separate top-level selector branches; braces in
   comments or strings do not open rules.
4. Preserve traversal into rules inside container and media queries. At-rule preludes and
   declaration blocks must not be mistaken for selectors.
5. Share complete-selector extraction across feature, control, base, token-provider, and
   icon-catalog selector audits. Preserve icon-catalog declaration association and duplicate
   detection.
6. Keep declaration/token/value checks and allowed namespace/attribute lists unchanged. The new
   parser must not lose declarations or weaken enforcement through skipped selector branches.
7. Keep script behavior: `deno task guard:css` audits the repository, reports violations, and
   exits nonzero on failure. Importing the pure audit entry point must not launch the repository
   sweep or terminate the test process.

This is bounded parsing for the guard's checks, not a general CSS parser project. If reliable
support requires a dependency or broader restructuring, stop and escalate before expanding scope.

## Regression cases and acceptance

- The original ancestor-rooted Helm selectors pass in both single-line and dprint-wrapped forms,
  including the icon frame and both separator pseudo-elements.
- Equivalent single-line and multiline inputs produce identical policy outcomes.
- An invalid namespace root fails in either format.
- Mixed valid/invalid selector lists fail with the invalid branch first, middle, or last, on one
  line or several lines.
- Forbidden data attributes and non-kebab-case identity/modifier values fail when they occur on
  continuation lines.
- Comments, quoted punctuation, escapes, and functional pseudo-classes do not corrupt selector
  extraction or list splitting.
- Container/media nesting preserves enforcement of inner rules.
- Token-provider, base, control, and icon-catalog selector rules retain their existing semantics.
- Diagnostics identify the originating line of the offending selector branch.
- Existing token, declaration, and value violations continue to fail.

Exercise the actual dprint output of the triggering selectors as well as representative inputs.
The acceptance condition is formatting-independent enforcement, with no loss of existing checks.

Required production checks:

- `deno test source/tests/cases/css-guard-test.ts`
- `deno task guard:css`
- `deno task check`
- `deno task fmt:check`
- `git diff --check`
- CONVENTIONS audit and `STYLE_AUDIT` in the production report.

## Sequencing and boundaries

1. Dispatch the two-file Foundation scope explicitly.
2. Add regression coverage and repair complete-selector extraction and its audit consumers.
3. Run the regression cases against formatted CSS, then all required repository checks.
4. Report results for CA review and independent verification.
5. Separately authorize the Helm correction: restore ancestor-rooted containment in
   `helm-widget.tsx` and `helm-widget.css`, remove the workaround marker, and rerun formatting and
   checks against the repaired guard.

Out of scope for the guard production: Helm modifications; dashboard configuration; shared Ui
controls; formatter settings; namespace-policy changes; token-resolution checks from the separate
backlog entry; unrelated guards; core/domain/backend files; governance-document changes;
dependency or lockfile changes; roadmap placement; and completed efforts.

## Risks and escalation

Complete selector/list inspection may expose existing violations previously missed by the guard.
Report each with its file, selector, and governing rule. Remediation outside the two-file scope
requires CA authorization; do not weaken the guard or silently modify the affected components.

Escalate policy ambiguities, unsupported syntax requiring broader parsing, any need to change
declaration/value enforcement, or a required dependency/task/configuration change. Preserve
unrelated working-tree changes.

Closure requires shipped production, CA review, and independent verification under EFFORT §4.
The current Helm workaround remains pending its separate correction; passing this guard repair
alone does not close that component issue.

## Amendment — 2026-10-03 sample correction

At CA direction, restored the first triggering selector sample to one line. Dprint had formatted
both samples identically during brief production, erasing the before/after evidence. The first
sample now carries a formatter-ignore directive; the second retains the wrapped form.

## Amendment — 2026-10-08 — Partly delivered by the workbench list layout production

`effort/completed/2026-10-08-workbench-list-layout-brief.md` hit the same defect: a shell-hooked
row selector wrapped by dprint failed `guard-css.ts`. The CA approved extending that production to
the guard (its amendment "Guard scope extension"); the AI Architect then found the first patch let
an unrooted second selector pass, and it was corrected. This brief was not consulted at the time.
Shipped in `fc54364`.

**Delivered, against the implementation requirements:**

- **1, partly.** `extractSelector` reads back from the `{` line to the preceding declaration or
  block, skipping comment lines, so a wrapped selector is audited whole. Diagnostics still report
  the `{` line, not the line of the offending branch.
- **2, partly.** `splitSelectors` splits at top-level commas, and each branch is checked for its
  root in the feature audit and for its form in the icon-catalog audit. The control audit
  (`[data-ui` root) and the token-provider audit (`:root`, `[data-theme…]`) still check the joined
  list as one selector.
- **3, partly.** List splitting respects quotes, escapes, brackets, and parentheses. Braces inside
  comments or strings on a selector's own lines are not handled.
- **5, partly.** Every audit uses the shared extraction; only the two audits above split branches.
  Icon-catalog declarations are now checked only inside a recognized icon rule.
- **4, 6, and 7** were not changed deliberately and were not regression-tested.

**Verified** with scratch fixtures, since removed: an unrooted second selector in a wrapped list
fails; commas inside `:is()` and `:not()` and a three-line rooted selector pass.

**Remaining scope:**

1. `source/tests/cases/css-guard-test.ts` and a pure audit entry point. Not started; the regression
   cases above remain the acceptance criteria.
2. Branch splitting in the control and token-provider audits.
3. Branch-line diagnostics, and braces in comments or strings.
4. **The Helm correction, to be re-examined.** The committed Helm CSS (`5fe8c4b`) does not match
   the workaround described above: its selectors are already rooted at
   `[data-widget='helm-widget']` and descend through a per-button marker,
   `data-widget-icon='hidden'`, emitted in `helm-widget.tsx`. Whether that per-button marker still
   needs replacing with ancestor-level label-mode selection is the CA's decision.

_End of Backlog Brief_
