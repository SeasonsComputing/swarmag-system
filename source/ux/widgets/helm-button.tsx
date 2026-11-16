/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Helm button                                                                  ║
║ Glyph content for the Helm's popover triggers.                               ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Owns the glyph a Helm popover trigger carries and its accessible name. The
popover supplies the button; the glyph fills it without nesting another button.
Helm commands are UiActionButtons.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
HelmButtonGlyphProps  Glyph input for a popover trigger.
├ icon                Glyph name.
└ label               Accessible name for the containing trigger.
HelmButtonGlyph       Glyph content for a Helm popover trigger.
*/

import { UiIcon } from '@ux/ui'
import type { UiComponent } from '@ux/ui'

import './helm-button.css'

/** Glyph content, named for accessibility when used in a popover trigger. */
export type HelmButtonGlyphProps = { icon: string; label: string }

/** One glyph; its containing popover provides the semantic button. */
export const HelmButtonGlyph = (props: HelmButtonGlyphProps): UiComponent => (
  <UiIcon name={props.icon} label={props.label} data-widget='helm-button-glyph' />
)
