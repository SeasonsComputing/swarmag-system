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

/** Card control props. */
export type AppCardProps =
  & Omit<
    JSX.HTMLAttributes<HTMLDivElement>,
    'class' | 'classList' | 'style' | 'data-ui'
  >
  & {
    class?: never
    classList?: never
    style?: never
    'data-ui'?: never
  }

/** Card control. */
export const AppCard = (props: AppCardProps): JSX.Element => {
  const [, others] = splitProps(props, ['class', 'classList', 'style', 'data-ui'])
  return <div {...others} data-ui='card' />
}
