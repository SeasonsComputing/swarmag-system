# Overlay Controls API — Brief

**Backlog, not dispatched.** Recorded 2026-10-13 from a CA + AI Architect session, after the CA
reviewed the style guide's Secondary Windows section. The same review made `UiDialog` dismissible
by default and rewrote the popover example; neither needed a brief.

## What triggered it

Two of the three overlay examples misbehaved:

- **UiTooltip** renders as a button labelled "Hover field note", pinned open. A tooltip in practice
  explains something beside it: a label with an info icon whose hover shows the advice. The
  control cannot express that.
- **UiPopover** moves while open: its trigger is a `UiButton`, whose hover lifts it a pixel
  (`transform: translateY(-1px)`), and Kobalte positions the content against the trigger and
  tracks it. Kobalte behaves as designed; the wrapper chose the moving anchor.

Both trace to one cause: the overlay wrappers over-specify their triggers.

## What the repository holds

- **The settled convention** (the CA's Kobalte API convention; `ux-components-internals.md` §3.5):
  a `Ui*` control mirrors Kobalte's API shape, wires Kobalte's parts internally, never exposes
  Kobalte, and adds only what the design language needs. `UiSingleSelect` and `UiRadioGroup`
  follow it: value, options, change, and identity.
- **The overlays depart from it.** `UiDialog`, `UiPopover`, and `UiTooltip` share one prop
  template: `trigger`, `triggerVariant`, `open`, `defaultOpen`, `onOpenChange`, `error`, `loading`,
  `disabled`, and each renders its trigger `as={UiButton}` with `triggerVariant`. The template dates
  from the original control set (`6b90cb2`, 2026-04-21).
- **Kobalte's triggers** are plain, unstyled buttons whose content the caller supplies; the styled
  button is the wrapper's addition.
- **Consumer census:** across all three controls, the only prop of the template any consumer passes
  is `trigger`, three times, all in the style guide. `triggerVariant`, `error`, `loading`, and
  `disabled` are passed by nobody, and no CSS reads the overlays' `data-ui-state`. Dialogs in the
  applications are controlled (`open`, `onOpenChange`) and have no trigger.
- **Documentation** shows the template: `ux-components-guide.md` §3.12–§3.14 (`triggerVariant` in
  the dialog props table and the popover and tooltip examples) and the lite guide.

## Decisions (CA, 2026-10-13)

1. **One common solution for the overlay controls,** following the select and radio precedent:
   minimal, Kobalte-shaped APIs with parts wired internally.
2. **The template props go.** `triggerVariant`, `error`, `loading`, and `disabled` are removed from
   `UiDialog`, `UiPopover`, and `UiTooltip`. What remains is `trigger`, `children`, `open`,
   `defaultOpen`, and `onOpenChange`, plus each control's own design-language props (`UiDialog`'s
   `size` and `dismissible`).
3. **The dialog and popover triggers stay `UiButton`s.** A trigger that opens a panel reads as a
   button. The popover's movement is fixed instead by an expanded trigger keeping its hover state:
   `ui.css` pairs each button hover rule with `[data-expanded]`, Kobalte's state attribute on an
   open trigger, so the anchor does not move while the popover is open, and the trigger shows as
   engaged. Made directly on 2026-10-13 (CA) with a dead duplicate `box-shadow` removed from the
   hover rule; not part of this production.
4. **The tooltip trigger is unstyled and inline,** its content supplied by the caller, typically an
   info icon beside a label. It remains a `<button>`, so it is keyboard-focusable and Kobalte shows
   the tooltip on focus as well as hover:

   ```tsx
   <span>Buffer zone</span>
   <UiTooltip trigger={<span data-ui-icon='info-circled' />}>
     Verify buffer zone before aerial application.
   </UiTooltip>
   ```

## Open

1. **The tooltip trigger's accessible name.** An icon-only trigger needs a label for screen
   readers; whether `UiTooltip` takes it as a prop or the caller puts it on the icon.

## Production scope

Operating mode: **Foundation** (`ux/ui`, under strict scrutiny).

1. **`ux/ui/components/ui-dialog.tsx`, `ui-popover.tsx`, `ui-tooltip.tsx`:** the reduced props
   (Decision 2); the tooltip's trigger as Kobalte's plain trigger with `data-ui='tooltip-trigger'`
   (Decision 4); headers' PUBLIC updated.
2. **`ux/ui/css/ui.css`:** the tooltip trigger hook: inline, unstyled, a visible focus ring, the
   icon sized to the surrounding text.
3. **`front/app-style-guide/style-guide.tsx`:** the tooltip example as a label with an info icon,
   without `defaultOpen`; the dialog and popover examples unchanged in content.
4. **Documentation:** `ux-components-guide.md` §3.12–§3.14 and `ux-components-guide-lite.md`, the
   removed props and the trigger parts. **Amended 2026-10-19:** the lite guide is retired; only
   `ux-components-guide.md` changes.

**Out of scope:** the overlays' content parts (Kobalte's Title, Description, CloseButton, Arrow);
any menu control.

## Checks

`deno task check`, `deno task fmt:check`, and `deno task test`; `STYLE_AUDIT`. The CA verifies the
style guide: each trigger opens its overlay; the popover holds still while its trigger is hovered;
hover and keyboard focus each show the tooltip; the dialog closes on Escape.

## Design history

- **Tooltip only, then all three.** The brief began as the tooltip's forced button. The popover's
  movement then traced to the same forced `UiButton`; the CA asked for one common solution.
- **Anchor fixes rejected.** The AI Architect proposed anchoring the popover to a stable wrapper
  (`anchorRef`, then Kobalte's `Popover.Anchor`), and a `style-guide.css` rule. The CA judged the
  component over-specified. Replacing the dialog and popover triggers' `UiButton` was then
  weighed; the CA asked instead whether an open trigger could keep its hover state, which fixed
  the movement in three selectors and kept those triggers as buttons.
- **Kobalte's part model.** The AI Architect first called a Title, Description, CloseButton, and
  Arrow "the canonical popover content"; Kobalte lists them as optional parts, and the claim was
  withdrawn.
- **The popover example** was rewritten directly, as local to the example: `About swarmAg` opens a
  `UiCard` holding the swarmAg wordmark and a line of text.
- **No `UiMenu`.** The menu question came from the old popover example's wording.

_End of Brief_
