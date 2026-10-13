# Tooltip Trigger & Secondary Window Examples — Brief

**Backlog, not dispatched.** Recorded 2026-10-13 from a CA + AI Architect session, after the CA
reviewed the style guide's Secondary Windows section. The same review fixed `UiDialog`'s default
to dismissible (no brief).

## What triggered it

The Secondary Windows section shows three overlays. The CA found two of them wrong:

- **UiTooltip** renders as a button labelled "Hover field note" that is pinned open
  (`defaultOpen`). A tooltip in practice explains something beside it: a label with an info icon
  whose hover shows the advice.
- **UiPopover** is a button labelled "Open field menu" opening a paragraph of text. It reads as a
  menu, which it is not.

## What the repository holds

- **`UiTooltip`** (`ux/ui/components/ui-tooltip.tsx`) renders its trigger as a styled button:
  `Tooltip.Trigger as={UiButton}` with a `triggerVariant` prop (default `secondary`). This dates
  from the original control set (`ef2507d`, 2026-04-21, "add semantic control primitives").
- **Kobalte's `Tooltip.Trigger`** is the element that is hovered or focused: by default a plain,
  unstyled `<button>` whose content the caller supplies. Kobalte does not make it a styled button;
  the wrapper does. That is the misreading.
- **Consumers:** none in the applications. The style guide and the components guide (§3.14,
  `trigger='Sync status' triggerVariant='ghost'`, "anchored to a trigger button") are the only
  uses; the lite guide says the trigger props "match `UiDialog`".
- **`UiPopover`** (`ux/ui/components/ui-popover.tsx`) also triggers through `as={UiButton}`. A
  popover opens on click, so a button trigger is right; only its example is wrong.
- **No menu control exists** in `ux/ui`. Kobalte ships `DropdownMenu`.
- **Icons:** `info-circled` is in the catalog (`icons.css`).

## Decisions (CA, 2026-10-13)

1. **`UiTooltip`'s trigger is Kobalte's plain trigger.** It renders unstyled, inline with the text
   around it, with a `data-ui='tooltip-trigger'` hook and no button chrome. It remains a
   `<button>`, so it is keyboard-focusable and Kobalte shows the tooltip on focus as well as
   hover. The caller supplies its content, typically an info icon beside a label:

   ```tsx
   <span>Buffer zone</span>
   <UiTooltip trigger={<span data-ui-icon='info-circled' />} label='About buffer zones'>
     Verify buffer zone before aerial application.
   </UiTooltip>
   ```

   `triggerVariant` is removed; there is no button variant to choose.
2. **The popover example opens a card: an image with words.** A popover holds rich, non-modal
   content anchored to its trigger, content to look at rather than commands to choose. The example
   opens a `UiCard` holding an image and a short passage of text about it, so the catalog shows
   its controls composing. Local to the example, not the control, so it was made directly on
   2026-10-13 (CA) and is not part of this production: `About swarmAg` opens a card with the
   swarmAg wordmark and one line of text.
3. **No `UiMenu`.** The menu question came from the popover example's wording, which Decision 2
   removes.

## Open

1. **The tooltip trigger's accessible name.** An icon-only trigger needs a label for screen
   readers; whether `UiTooltip` takes it as a prop (`label` above) or the caller puts it on the
   icon.

## Production scope

Operating mode: **Foundation** (`ux/ui`, under strict scrutiny).

1. **`ux/ui/components/ui-tooltip.tsx`:** the plain trigger (Decision 1); `triggerVariant`
   removed; the header's PUBLIC updated.
2. **`ux/ui/css/ui.css`:** the `tooltip-trigger` hook: inline, unstyled, a visible focus ring, the
   icon sized to the surrounding text.
3. **`front/app-style-guide/style-guide.tsx`:** the tooltip example as a label with an info icon,
   without `defaultOpen`.
4. **Documentation:** `ux-components-guide.md` §3.14 (description, props, example) and §3.13's
   example if it implies a menu; `ux-components-guide-lite.md` §3.14.

**Out of scope:** `UiPopover`'s and `UiDialog`'s triggers, which stay buttons; any menu control.

## Checks

`deno task check`, `deno task fmt:check`, and `deno task test`; `STYLE_AUDIT`. The CA verifies the
style guide: hover and keyboard focus each show the tooltip.

_End of Brief_
