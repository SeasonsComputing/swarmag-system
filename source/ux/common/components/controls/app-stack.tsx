/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ App stack control                                                            ║
║ Semantic wrapper for grid vertical layout primitives.                        ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Emits stack layout semantics without styling concerns.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AppStack  Stack container with declared variant. Renders <div> with data-ui='stack'.
*/

import { type JSX, splitProps } from '@solid-js'

/** Stack variant. Omit for a clean unstyled stack. */
export type AppStackVariant = 'inline'

/** Stack control props. */
export type AppStackProps =
  & Omit<
    JSX.HTMLAttributes<HTMLDivElement>,
    'class' | 'classList' | 'style' | 'data-ui' | 'data-ui-variant'
  >
  & {
    children?: JSX.Element
    variant?: AppStackVariant
    class?: never
    classList?: never
    style?: never
    'data-ui'?: never
    'data-ui-variant'?: never
  }

/** Stack container with declared variant. Renders <div> with data-ui='stack'. */
export const AppStack = (props: AppStackProps): JSX.Element => {
  const [local, others] = splitProps(props, [
    'variant',
    'class',
    'classList',
    'style',
    'data-ui',
    'data-ui-variant'
  ])

  return (
    <div
      {...others}
      data-ui='stack'
      data-ui-variant={local.variant}
    />
  )
}
