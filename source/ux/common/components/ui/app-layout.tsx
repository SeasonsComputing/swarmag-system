/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ App layout control                                                           ║
║ Unified API surface for block and inline layout primitives.                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Single layout primitive covering block and inline arrangements.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AppLayout  Layout container with declared variant and gap density.
*/

import { type JSX, splitProps } from '@solid-js'
import { type AppComponent, type AppComponentProps } from './ui-helpers.ts'

/** Layout variant. Omit for block (default full-width grid). */
export type AppLayoutVariant = 'block-fit' | 'inline' | 'inline-fill'

/** Layout gap density. Omit for standard spacing. */
export type AppLayoutGap = 'loose' | 'tight' | 'none'

/** Layout control props. */
export type AppLayoutProps =
  & AppComponentProps
  & Omit<
    JSX.HTMLAttributes<HTMLDivElement>,
    | 'children'
    | 'class'
    | 'classList'
    | 'style'
    | 'data-ui'
    | 'data-ui-variant'
    | 'data-ui-gap'
  >
  & {
    gap?: AppLayoutGap
    variant?: AppLayoutVariant
    class?: never
    classList?: never
    style?: never
    'data-ui'?: never
    'data-ui-variant'?: never
    'data-ui-gap'?: never
  }

/** Layout container with declared variant and gap density. */
export const AppLayout = (props: AppLayoutProps): AppComponent => {
  const [local, others] = splitProps(props, [
    'gap',
    'variant',
    'class',
    'classList',
    'style',
    'data-ui',
    'data-ui-variant',
    'data-ui-gap'
  ])

  return (
    <div
      {...others}
      data-ui='layout'
      data-ui-gap={local.gap}
      data-ui-variant={local.variant}
    />
  )
}
