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
UiCard  Card control.
*/

import { type JSX, splitProps } from '@solid-js'
import { type UiComponent, type UiComponentProps } from './ui-helpers.ts'

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
  >
  & {
    decoration?: UiCardDecoration
    elevation?: UiCardElevation
    class?: never
    classList?: never
    style?: never
    'data-ui'?: never
    'data-ui-decoration'?: never
    'data-ui-elevation'?: never
  }

/** Card control. */
export const UiCard = (props: UiCardProps): UiComponent => {
  const [local, others] = splitProps(props, [
    'decoration',
    'elevation',
    'class',
    'classList',
    'style',
    'data-ui',
    'data-ui-decoration',
    'data-ui-elevation'
  ])
  return (
    <div
      {...others}
      data-ui='card'
      data-ui-decoration={local.decoration === 'gradient' ? 'gradient' : undefined}
      data-ui-elevation={local.elevation && local.elevation !== 'none' ? local.elevation : undefined}
    />
  )
}
