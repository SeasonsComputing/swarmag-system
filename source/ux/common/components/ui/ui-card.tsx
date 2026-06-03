/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Ui card control                                                             ║
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

/** Card variants declared by the design language. */
export type UiCardVariant = 'widget' | 'workflow'

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
    | 'data-ui-variant'
  >
  & {
    variant?: UiCardVariant
    class?: never
    classList?: never
    style?: never
    'data-ui'?: never
    'data-ui-variant'?: never
  }

/** Card control. */
export const UiCard = (props: UiCardProps): UiComponent => {
  const [local, others] = splitProps(props, [
    'variant',
    'class',
    'classList',
    'style',
    'data-ui',
    'data-ui-variant'
  ])
  return <div {...others} data-ui='card' data-ui-variant={local.variant} />
}
