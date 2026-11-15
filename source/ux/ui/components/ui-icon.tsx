/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Ui icon control                                                              ║
║ A glyph from the icon catalog, painted in the current color.                 ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Renders one icon catalog glyph. The catalog maps the name to --sa-icon; this
control's rule in ui.css paints it as a mask in the current color, so a host
colors an icon from its own container.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
UiIcon       Catalog glyph with declared size and accessibility.

COMPONENT PROPERTIES
───────────────────────────────────────────────────────────────────────────────
UiIconProps  Icon props; extends UiComponentProps and filtered HTML attributes.
├ name       Icon catalog name.
├ size       Square size from --sa-space-{size}; default md.
└ label      Names the icon for assistive technology; unset, it is hidden.
*/

import { type JSX, splitProps } from '@solid-js'
import type { UiComponent, UiComponentProps } from './ui-helpers.ts'

/** Icon sizes, each the matching --sa-space-* token. */
export type UiIconSize = 'sm' | 'md' | 'lg' | 'xl'

/** Icon props. */
export type UiIconProps =
  & UiComponentProps
  & Omit<
    JSX.HTMLAttributes<HTMLSpanElement>,
    | 'children'
    | 'class'
    | 'classList'
    | 'style'
    | 'role'
    | 'aria-label'
    | 'aria-hidden'
    | 'data-ui'
    | 'data-ui-icon'
    | 'data-ui-size'
  >
  & {
    name: string
    size?: UiIconSize
    label?: string
    class?: never
    classList?: never
    style?: never
    'data-ui'?: never
    'data-ui-icon'?: never
    'data-ui-size'?: never
  }

/** Catalog glyph with declared size and accessibility. */
export const UiIcon = (props: UiIconProps): UiComponent => {
  const [local, others] = splitProps(props, [
    'name',
    'size',
    'label',
    'class',
    'classList',
    'style',
    'data-ui',
    'data-ui-icon',
    'data-ui-size'
  ])
  return (
    <span
      {...others}
      data-ui='icon'
      data-ui-icon={local.name}
      data-ui-size={local.size ?? 'md'}
      role={local.label ? 'img' : undefined}
      aria-label={local.label}
      aria-hidden={local.label ? undefined : true}
    />
  )
}
