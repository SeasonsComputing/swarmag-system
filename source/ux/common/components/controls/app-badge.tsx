/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ App badge control                                                            ║
║ Semantic badge primitive.                                                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Emits badge control semantics without styling concerns.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AppBadge  Badge control with declared states.
*/

import { type JSX, splitProps } from '@solid-js'
import { controlState } from './controls-helpers.ts'

/** Badge variants declared by the design language. */
export type AppBadgeVariant = 'success' | 'warning' | 'danger' | 'info'

/** Badge control props. */
export type AppBadgeProps =
  & Omit<
    JSX.HTMLAttributes<HTMLSpanElement>,
    'class' | 'classList' | 'style' | 'data-ui' | 'data-ui-state'
  >
  & {
    variant?: AppBadgeVariant
    error?: boolean
    loading?: boolean
    disabled?: boolean
    class?: never
    classList?: never
    style?: never
    'data-ui'?: never
    'data-ui-state'?: never
  }

/** Badge control with declared states. */
export const AppBadge = (props: AppBadgeProps): JSX.Element => {
  const [local, others] = splitProps(props, [
    'variant',
    'error',
    'loading',
    'disabled',
    'class',
    'classList',
    'style',
    'data-ui',
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
