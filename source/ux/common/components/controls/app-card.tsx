/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ App card control                                                             ║
║ Semantic card primitive.                                                     ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Emits card control semantics without styling concerns.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AppCard  Card control.
*/

import { type JSX, splitProps } from '@solid-js'

/** Card variants declared by the design language. */
export type AppCardVariant = 'widget' | 'panel' | 'workflow'

/** Card control props. */
export type AppCardProps =
  & Omit<
    JSX.HTMLAttributes<HTMLDivElement>,
    'class' | 'classList' | 'style' | 'data-ui' | 'data-ui-variant'
  >
  & {
    variant?: AppCardVariant
    class?: never
    classList?: never
    style?: never
    'data-ui'?: never
    'data-ui-variant'?: never
  }

/** Card control. */
export const AppCard = (props: AppCardProps): JSX.Element => {
  const [local, others] = splitProps(props, [
    'variant',
    'class',
    'classList',
    'style',
    'data-ui',
    'data-ui-variant'
  ])

  return <div {...others} data-ui='card' data-ui-variant={local.variant ?? 'widget'} />
}
