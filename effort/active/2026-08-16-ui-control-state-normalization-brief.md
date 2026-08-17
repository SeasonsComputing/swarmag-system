# UI Control State Normalization — Production Brief

## What triggered this

While inspecting the onboarding Job Sites panel and Helm action behavior, the
shared UI control layer showed a deeper inconsistency: controls do not share one
state model.

`UiActionButton` currently distinguishes visible-label and hidden-label actions
by resting color. Hidden-label action buttons rest in primary color, while
visible-label action buttons inherit surrounding text color. `UiCollectionCursor`
shows the problem clearly: navigation action-buttons rest in primary color while
life-cycle action-buttons rest in text-primary. Hover then makes labeled
action-button icons primary, so icon-only action buttons often have no visible
hover color change.

The inconsistency is broader than action buttons:

- checkbox and radio use primary to indicate checked state and also have hover
  text-primary behavior;
- toggle, tab, and accordion use primary to indicate selected/open state but do
  not share the same unselected-hover cue;
- button is the unique case and does not change text color on hover;
- single-select and multi-select have selected-hover background cues but do not
  change selected text to text-primary;
- hover, selected, active, checked, and resting affordance are not expressed as a
  single design-language state matrix.

This is not a feature defect. It is design-language drift in the shared control
foundation.

## Principle

Primary color must have a stable meaning.

It should not simultaneously mean:

- resting icon affordance;
- hover affordance;
- selected state;
- checked state;
- active tab state;
- open accordion state;
- random emphasis because a control has no visible label.

The UI primitive layer must define state roles once and map each control shape to
those roles consistently.

## Desired state model

The production should establish a shared state matrix for UI controls.

Required states:

- rest;
- hover;
- focus-visible;
- disabled;
- selected / checked / active / open;
- selected / checked / active / open + hover;
- danger / destructive where applicable.

Recommended semantic direction:

- Resting text and icons should generally inherit context or use a neutral text
  token.
- Hover should provide an affordance through background, border, frame, shadow,
  or similarly non-layout-changing treatment.
- Focus-visible should use a consistent focus ring.
- Primary should indicate selected, checked, active, open, or another explicit
  semantic state — not arbitrary resting affordance.
- Danger should use danger tokens consistently and should override ordinary
  primary treatment.
- Disabled should remain visually diminished and non-interactive.
- Hover and focus must not change whether labels participate in layout.
- State changes must not cause layout oscillation.

The exact token choices remain a Chief Architect/design-language decision. The
production is not authorized to invent a new color theory ad hoc while editing.

## Required audit

Before production, inspect the current implementation and produce a concise
state matrix for at least:

- `UiButton`
- `UiActionButton`
- `UiCheckbox`
- `UiRadioGroup`
- `UiToggle`
- `UiTabs`
- `UiAccordion`
- `UiSingleSelect`
- `UiMultiSelect`
- `UiCollectionCursor`

For each, identify current treatment for:

- rest;
- hover;
- focus-visible;
- disabled;
- selected / checked / active / open, where applicable;
- selected / checked / active / open + hover, where applicable;
- danger / destructive, where applicable.

Report inconsistencies before mutating files. If the state model requires Chief
Architect decisions, stop and ask rather than encoding assumptions.

## Recommended production

Normalize shared control-state styling primarily in:

- `source/front/ux/ui/css/ui.css`

Update component comments only where stale or misleading:

- `source/front/ux/ui/components/ui-action-button.tsx`
- other `source/front/ux/ui/components/ui-*.tsx` files only if their comments
  misstate the normalized state contract.

The production should prefer deleting inconsistent special-case rules over adding
new compensating rules.

Do not add new props unless the audit proves an actual missing state concept.
The expected repair is CSS/token-state normalization, not API expansion.

## Specific concerns to address

### `UiActionButton`

Resolve the visible-label versus hidden-label resting-color distinction.

The likely target:

- base action-button color inherits context or uses neutral text;
- visible and hidden labels do not imply different semantic color;
- danger variant remains danger;
- hover/focus affordance remains visible without label display changes;
- icon-only actions do not rest in primary solely because they are icon-only.

### `UiCollectionCursor`

Reassess navigation and life-cycle action treatment after action-button
normalization. The cursor should not demonstrate two unrelated action-button
state models in one component.

### Selection controls

Checkbox, radio, toggle, tab, accordion, single-select, and multi-select should
share a coherent meaning for selected/checked/active/open state.

Primary may remain the selected-state signal, but unselected hover and
selected-hover must be consistent enough that users can predict the treatment.

### Buttons

Buttons may remain distinct where their surface model requires it, but the
distinction must be intentional. If buttons never change text color on hover,
that should be consistent with the wider hover model rather than an accident.

## Files likely in scope

In:

- `source/front/ux/ui/css/ui.css`

Possibly in:

- `source/front/ux/ui/components/ui-action-button.tsx`
- `source/front/ux/ui/components/ui-button.tsx`
- `source/front/ux/ui/components/ui-checkbox.tsx`
- `source/front/ux/ui/components/ui-radio-group.tsx`
- `source/front/ux/ui/components/ui-toggle.tsx`
- `source/front/ux/ui/components/ui-tabs.tsx`
- `source/front/ux/ui/components/ui-accordion.tsx`
- `source/front/ux/ui/components/ui-single-select.tsx`
- `source/front/ux/ui/components/ui-multi-select.tsx`
- `source/front/ux/ui/components/ui-collection-cursor.tsx`

Only touch component files if their comments, emitted state attributes, or
contracts are stale or insufficient for the normalized state model.

Out:

- Domain, persistence, protocols, migrations, and API contracts.
- Dashboard schema, widget registry, seeds, or app state.
- Helm-specific boundary repair beyond what is necessary to keep shared control
  states coherent. The HelmButton boundary repair has its own brief.
- Application feature styling outside `ux/ui`, unless the normalized UI state
  reveals an app-local override that must be removed and the Chief Architect
  explicitly expands scope.
- Guard rule changes.
- Git operations; the Chief Architect commits.

## Checks

Run:

```sh
deno task fmt
deno task check
deno task guard:namespaces
```

If full `deno task check` is blocked by unrelated existing guard failures, report
the unrelated failures and run targeted checks on all changed TypeScript files
plus the relevant guards that can run.

## Behavioural verification

Manual browser verification is required. Report each item:

1. `UiButton` rest, hover, focus-visible, disabled, primary, secondary, and
   danger treatments are coherent.
2. `UiActionButton` visible-label and hidden-label modes share the same semantic
   color model.
3. `UiActionButton` hover/focus does not change label display or layout width.
4. `UiActionButton` danger variant remains visually destructive at rest and on
   hover/focus.
5. `UiCollectionCursor` navigation and life-cycle actions no longer demonstrate
   conflicting action-button state models.
6. Checkbox rest, hover, focus-visible, checked, checked-hover, and disabled
   states are coherent.
7. Radio rest, hover, focus-visible, checked, checked-hover, and disabled states
   are coherent.
8. Toggle rest, hover, focus-visible, selected, selected-hover, and disabled
   states are coherent.
9. Tabs rest, hover, focus-visible, selected, selected-hover, and disabled states
   are coherent.
10. Accordion trigger rest, hover, focus-visible, open, open-hover, and disabled
    states are coherent.
11. Single-select rest, hover, focus-visible, selected option, selected-hover,
    and disabled states are coherent.
12. Multi-select rest, hover, focus-visible, selected option, selected-hover, and
    disabled states are coherent.
13. No control changes label display on hover/focus.
14. No control has hover-induced layout oscillation.

## Escalation

Stop and report if the repair appears to require:

- new semantic token definitions;
- changing design-language documentation;
- changing guard rules;
- adding state props to multiple primitives;
- changing app-local feature behavior outside the shared UI control layer;
- resolving Helm-specific boundary work that belongs to the separate HelmButton
  brief;
- accepting an inconsistency because it is difficult to normalize.

_End of Brief_
