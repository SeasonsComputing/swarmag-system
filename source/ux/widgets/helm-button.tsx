/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Helm button                                                                  ║
║ Local toolbar commands and shared glyph content for popover triggers.        ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Owns the Helm's icon-button presentation and accessible naming. UiButton
supplies button semantics; Helm owns its dimensions and interaction styling.
Popover triggers consume the same glyph without nesting another button.
Disabled and loading buttons cannot activate; loading also exposes aria-busy.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
HelmButtonProps       Local button input.
├ extends             Filtered native button attributes and HelmButtonGlyphProps.
└ loading             Busy state; disables activation.
HelmButtonGlyphProps  Glyph input shared by commands and popover triggers.
├ icon                Glyph name.
└ label               Accessible name for the containing trigger.
HelmButton            Local Helm command button.
HelmButtonGlyph       Glyph content for a Helm button or popover trigger.
*/

import { splitProps } from '@solid-js'
import type { JSX } from '@solid-js'
import { UiButton } from '@ux/ui'
import type { UiComponent } from '@ux/ui'

import './helm-button.css'

/** Glyph content, named for accessibility when used in a popover trigger. */
export type HelmButtonGlyphProps = { icon: string; label: string }

/** Local button inputs; presentation, content, naming, and semantic state are component-owned. */
export type HelmButtonProps =
  & Omit<
    JSX.ButtonHTMLAttributes<HTMLButtonElement>,
    'children' | 'aria-label' | 'aria-busy' | 'type' | 'class' | 'classList' | 'style'
  >
  & HelmButtonGlyphProps
  & {
    loading?: boolean
    children?: never
    'aria-label'?: never
    'aria-busy'?: never
    type?: never
    class?: never
    classList?: never
    style?: never
    'data-ui'?: never
    'data-ui-state'?: never
    'data-ui-variant'?: never
    'data-widget'?: never
    'data-widget-state'?: never
  }

/** A Helm-owned toolbar command, forwarding native refs, events, and ARIA attributes. */
export const HelmButton = (props: HelmButtonProps): UiComponent => {
  const [local, others] = splitProps(props, ['icon', 'label', 'loading'])
  return (
    <UiButton
      {...others}
      type='button'
      aria-label={local.label}
      aria-busy={local.loading || undefined}
      loading={local.loading}
      data-widget='helm-button'
    >
      <HelmButtonGlyph icon={local.icon} label={local.label} />
    </UiButton>
  )
}

/** One glyph; its containing command or popover provides the semantic button. */
export const HelmButtonGlyph = (props: HelmButtonGlyphProps): UiComponent => (
  <span role='img' aria-label={props.label} data-widget='helm-button-glyph' data-ui-icon={props.icon} />
)
