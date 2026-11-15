/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Ui card control                                                              ║
║ Semantic card primitive.                                                     ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Emits card control semantics without styling concerns.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
UiCardDecoration      Card decoration values declared by the design language.
UiCardElevation       Card elevation values declared by the design language.
UiCard                Card control.

COMPONENT PROPERTIES
───────────────────────────────────────────────────────────────────────────────
UiCardProps           Card control props; extends UiComponentProps and filtered div attributes.
├ decoration          Card decoration treatment.
├ elevation           Framed card elevation treatment.
└ variant             Light or dark tonal surface treatment.
*/

import { type JSX, splitProps } from '@solid-js'
import type { UiComponent, UiComponentProps } from './ui-helpers.ts'

/** Card decoration values declared by the design language. */
export type UiCardDecoration = 'gradient' | 'none'

/** Card elevation values declared by the design language. */
export type UiCardElevation = 'none' | 'raised' | 'floating'

/** Card control props. */
export type UiCardProps =
  & UiComponentProps
  & Omit<
    JSX.HTMLAttributes<HTMLDivElement>,
    | 'children'
    | 'class'
    | 'classList'
    | 'style'
    | 'data-ui'
    | 'data-ui-decoration'
    | 'data-ui-elevation'
    | 'data-ui-variant'
  >
  & {
    decoration?: UiCardDecoration
    class?: never
    classList?: never
    style?: never
    'data-ui'?: never
    'data-ui-decoration'?: never
    'data-ui-elevation'?: never
    'data-ui-variant'?: never
  }
  & (
    | { variant?: never; elevation?: UiCardElevation }
    | { variant: 'tonal-light' | 'tonal-dark'; elevation?: never }
  )

/** Card control. */
export const UiCard = (props: UiCardProps): UiComponent => {
  const [local, others] = splitProps(props, [
    'decoration',
    'elevation',
    'variant',
    'class',
    'classList',
    'style',
    'data-ui',
    'data-ui-decoration',
    'data-ui-elevation',
    'data-ui-variant'
  ])
  return (
    <div
      {...others}
      data-ui='card'
      data-ui-variant={local.variant}
      data-ui-decoration={local.decoration === 'gradient' ? 'gradient' : undefined}
      data-ui-elevation={local.elevation && local.elevation !== 'none' ? local.elevation : undefined}
    />
  )
}
