/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Ui layout control                                                            ║
║ Unified API surface for block and inline layout primitives.                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Single layout primitive covering block and inline arrangements.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
UiLayout  Layout container with declared variant and gap density.
*/

import { type JSX, splitProps } from '@solid-js'
import { type UiComponent, type UiComponentProps } from './ui-helpers.ts'

/** Layout variant. Omit for block-fill stack. */
export type UiLayoutVariant = 'block-fit' | 'cluster' | 'inline' | 'inline-fill' | 'inline-wrap'

/** Layout gap density. Omit for standard spacing. */
export type UiLayoutGap = 'loose' | 'tight' | 'none'

/** Layout control props. */
export type UiLayoutProps =
  & UiComponentProps
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
    gap?: UiLayoutGap
    variant?: UiLayoutVariant
    class?: never
    classList?: never
    style?: never
    'data-ui'?: never
    'data-ui-variant'?: never
    'data-ui-gap'?: never
  }

/** Layout container with declared variant and gap density. */
export const UiLayout = (props: UiLayoutProps): UiComponent => {
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
