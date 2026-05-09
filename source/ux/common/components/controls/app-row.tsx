/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ App row control                                                              ║
║ Semantic wrapper for inline-flex horizontal layout primitives.               ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Emits row layout semantics without styling concerns.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AppRow  Row container with declared variant. Renders <div> with data-ui='row'.
*/

import { type JSX, splitProps } from '@solid-js'

/** Row variant. Omit for a clean unstyled row. */
export type AppRowVariant = 'fill'

/** Row control props. */
export type AppRowProps =
  & Omit<
    JSX.HTMLAttributes<HTMLDivElement>,
    'class' | 'classList' | 'style' | 'data-ui' | 'data-ui-variant'
  >
  & {
    children?: JSX.Element
    variant?: AppRowVariant
    class?: never
    classList?: never
    style?: never
    'data-ui'?: never
    'data-ui-variant'?: never
  }

/** Row container with declared variant. Renders <div> with data-ui='row'. */
export const AppRow = (props: AppRowProps): JSX.Element => {
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
      data-ui='row'
      data-ui-variant={local.variant}
    />
  )
}
