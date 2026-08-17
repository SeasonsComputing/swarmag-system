# Helm Button Boundary Repair — Production Brief

## What triggered this

The immediate symptom was observed in the dashboard header's terminal HelmWidget
field. When the header wrapped into its short subrow while the terminal field was
still wide enough for labeled actions, hovering a Helm action caused its label to
disappear and reappear until the cursor was repositioned.

The cause was not the dashboard responsive architecture. The architecture still
holds:

- The dashboard shell owns ordered placement, row rhythm, allocated fields,
  containment, and responsive row expansion.
- The terminal field is sized by the shell, not by HelmWidget's contents.
- HelmWidget adapts to the inline measure of its allocated field.
- The stacked-header threshold governs header row structure only.
- HelmWidget's labeled-action threshold governs labeled versus icon-only action
  presentation.

The defect came from implementation boundary drift: Helm/Dashboard specialization
leaked into the shared `ux/ui` action-button primitive and then Helm carried
compensating CSS for abandoned hover-reveal behavior.

## Current repair patch

A small repair patch to `helm-widget.css` is being committed separately. That
patch removes the immediate hover flash and color weirdness from HelmWidget.

That patch is not the final architectural repair. It only stabilizes the current
surface while this boundary cleanup is prepared.

## The boundary problem

`UiActionButton` is a cross-project UI primitive. It is used by shell surfaces,
tables, forms, collection panels, wizard controls, probes, and widgets. It should
remain boring and stable:

- `label` is the accessible name.
- `icon` selects the glyph.
- `labelMode` controls whether the label is drawn.
- `align` controls label/icon ordering.
- `density` controls compact sizing.
- `variant` controls semantic treatment such as danger.
- hover and focus provide affordance without changing layout semantics.

HelmWidget is not a primitive. It is a dashboard terminal-field widget with its
own responsive presentation rules. It may legitimately optimize its labels away
at narrower field widths, but that behavior belongs to Helm, not to `ux/ui`.

The current implementation crossed that line in two ways:

1. `ui.css` contains action-button commentary about not reasserting label display
   on hover/focus because a consumer may hide labels for space.
2. HelmWidget CSS has selected internal action-button label parts to implement
   responsive label collapse.

The comment in `ui.css` is the clearest smell. It documents a specificity
workaround and preserves the idea that a primitive stylesheet must avoid future
rules because a consumer is overriding an internal part.

That is not acceptable foundational debt in a greenfield system.

## Principle

Dashboard and Helm specialization must not live in `ux/ui`.

`UiActionButton` must expose general primitive state. Helm must own Helm
presentation. If Helm needs a distinct action control, name it as such:
`HelmButton`.

## Recommended production

Introduce a widget-local Helm button:

- `source/front/ux/widgets/helm-button.tsx`
- `source/front/ux/widgets/helm-button.css`

Then rework HelmWidget to use `HelmButton` rather than relying on
`UiActionButton` internals for responsive presentation.

`HelmButton` should carry only Helm-specific behavior:

- route-action presentation inside the dashboard terminal field;
- labeled presentation above HelmWidget's labeled-action threshold;
- dense icon-only presentation at or below HelmWidget's labeled-action threshold;
- stable accessible label in both presentations;
- no hover/focus behavior that changes inline size;
- no dependency on the dashboard stacked-header threshold for label visibility.

`UiActionButton` should remain available for general action surfaces, including
tables, dialogs, collection panels, and ordinary shell controls.

## `UiActionButton` cleanup

Prune dashboard/Helm specialization from:

- `source/front/ux/ui/components/ui-action-button.tsx`
- `source/front/ux/ui/css/ui.css`

Keep the primitive API:

```ts
icon: string
label: string
labelMode?: 'visible' | 'hidden'
align?: 'start' | 'end'
density?: 'standard' | 'dense'
variant?: 'default' | 'danger'
```

Remove stale or workaround-oriented language from the file header and CSS
comments. In particular, `ui.css` must not contain commentary about consumer
specificity strategy or dashboard/Helm label suppression.

The desired primitive invariant:

- `labelMode='visible'` displays the label at rest, hover, and focus.
- `labelMode='hidden'` hides the label at rest, hover, and focus.
- hover/focus may change color, frame, border, background, shadow, or focus ring.
- hover/focus must not change whether the label participates in layout.
- density changes sizing, not semantic behavior.
- alignment changes ordering, not semantic behavior.

## HelmWidget cleanup

Rework:

- `source/front/ux/widgets/helm-widget.tsx`
- `source/front/ux/widgets/helm-widget.css`

Expected outcome:

- HelmWidget renders configured route actions through `HelmButton`.
- HelmWidget continues to validate `actions`, `labels`, and `icons` as equal
  non-empty string arrays.
- HelmWidget owns action placement within its allocated terminal field.
- HelmWidget adapts to its field container, not the viewport.
- HelmWidget's labeled-action threshold controls labeled versus icon-only
  presentation.
- The dashboard stacked-header threshold controls row placement only.
- No stacked-header rule targets action-button labels or HelmButton labels.
- No hover/focus rule changes label display.

## Acceptable implementation shapes

Two implementation paths are acceptable. Prefer the one that leaves the cleanest
boundary after inspection.

### Option A — HelmButton owns markup

`HelmButton` renders its own button structure and CSS under `data-widget` or
another widget-owned selector. It does not reuse `UiActionButton`.

Use this if Helm's behavior is sufficiently distinct that reusing
`UiActionButton` would keep leaking widget concerns into `ux/ui`.

### Option B — HelmButton wraps explicit UiActionButton presentations

`HelmButton` may use `UiActionButton` internally if it renders explicit
presentations rather than overriding internal parts:

- labeled presentation uses `labelMode='visible'`;
- icon-only presentation uses `labelMode='hidden'`;
- Helm CSS switches between the two at Helm's labeled-action threshold.

This duplicates a small amount of markup but keeps `UiActionButton` honest:
`labelMode` means exactly what it says, and no consumer mutates internal label
parts.

Do not use JavaScript measurement or post-mount layout mutation. The existing
container-query architecture is the correct mechanism.

## Do not repeat

Do not add:

- a dashboard-specific prop to `UiActionButton`;
- viewport-driven Helm behavior;
- hover/focus label reveal;
- hover/focus label hiding;
- `ui.css` comments that preserve consumer specificity workarounds;
- selectors in HelmWidget that depend on private `UiActionButton` internals;
- guard changes;
- dashboard schema, widget SPI, registry, seed, or state changes.

## Files likely in scope

In:

- `source/front/ux/widgets/helm-button.tsx` _(new)_
- `source/front/ux/widgets/helm-button.css` _(new)_
- `source/front/ux/widgets/helm-widget.tsx`
- `source/front/ux/widgets/helm-widget.css`
- `source/front/ux/ui/components/ui-action-button.tsx`
- `source/front/ux/ui/css/ui.css`

Possibly in:

- `source/front/ux/ui/components/ui.ts` only if a new export is required. Prefer
  no `ux/ui` export for `HelmButton`; it is widget-local, not a UI primitive.

Out:

- Dashboard schema, widget registry shape, seeds, state, and shell allocation
  metadata.
- `source/front/ux/ui/**` files other than `ui-action-button.tsx` and `ui.css`.
- Domain, persistence, protocols, migrations, and API contracts.
- Documentation updates unless the Chief Architect explicitly expands scope.
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

Verify manually in a browser and report each item:

1. Wide header: Helm actions display labels.
2. Wide header: hovering a Helm action does not change whether its label is
   displayed.
3. Wide header: focus-visible on a Helm action does not change whether its label
   is displayed.
4. Stacked header with terminal field still wide enough for labels: Helm actions
   display labels.
5. Stacked header with terminal field still wide enough for labels: hovering a
   Helm action does not cause label disappearance, reappearance, or cursor
   oscillation.
6. Stacked header with terminal field still wide enough for labels: focus-visible
   does not hide labels.
7. Terminal field at or below Helm labeled-action threshold: Helm actions render
   icon-only dense controls.
8. Icon-only Helm controls retain accessible labels.
9. Stacked-header threshold changes row placement only; it does not independently
   decide label visibility.
10. Hover/focus affordance remains visible without changing action label layout.

## Escalation

Stop and report if the repair appears to require:

- changing dashboard allocation architecture;
- adding a dashboard-specific prop to `UiActionButton`;
- adding JavaScript measurement for Helm layout;
- changing widget registry, dashboard schema, seed data, or app state;
- changing guard rules;
- altering action-button behavior for unrelated consumers beyond removing
  Helm/Dashboard specialization and stale hover-reveal residue.

_End of Brief_
