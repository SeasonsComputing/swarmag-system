/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Ui badge control                                                             ║
║ Semantic badge primitive.                                                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Emits badge control semantics without styling concerns.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
UiBadge  Badge control with declared states.
*/

import { type JSX, splitProps } from '@solid-js'
import { controlState, type UiComponent, type UiComponentProps } from './ui-helpers.ts'

/** Badge variants declared by the design language. */
export type UiBadgeVariant = 'success' | 'warning' | 'danger' | 'info'

/** Badge control props. */
export type UiBadgeProps =
  & UiComponentProps
  & Omit<
    JSX.HTMLAttributes<HTMLSpanElement>,
    | 'children'
    | 'class'
    | 'classList'
    | 'style'
    | 'data-ui'
    | 'data-ui-variant'
    | 'data-ui-state'
  >
  & {
    variant?: UiBadgeVariant
    error?: boolean
    loading?: boolean
    disabled?: boolean
    class?: never
    classList?: never
    style?: never
    'data-ui'?: never
    'data-ui-variant'?: never
    'data-ui-state'?: never
  }

/** Badge control with declared states. */
export const UiBadge = (props: UiBadgeProps): UiComponent => {
  const [local, others] = splitProps(props, [
    'variant',
    'error',
    'loading',
    'disabled',
    'class',
    'classList',
    'style',
    'data-ui',
    'data-ui-variant',
    'data-ui-state'
  ])
  return (
    <span
      {...others}
      data-ui='badge'
      data-ui-variant={local.variant}
      data-ui-state={controlState(local)}
    />
  )
}
