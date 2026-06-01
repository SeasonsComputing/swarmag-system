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
import { type AppComponent, type AppComponentProps } from './controls-helpers.ts'

/** Card variants declared by the design language. */
export type AppCardVariant = 'widget' | 'workflow'

/** Card control props. */
export type AppCardProps =
  & AppComponentProps
  & Omit<
    JSX.HTMLAttributes<HTMLDivElement>,
    'children' | 'class' | 'classList' | 'style' | 'data-ui' | 'data-ui-variant'
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
export const AppCard = (props: AppCardProps): AppComponent => {
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
