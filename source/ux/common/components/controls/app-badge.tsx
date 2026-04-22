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

/** Badge control props. */
export type AppBadgeProps =
  & Omit<
    JSX.HTMLAttributes<HTMLSpanElement>,
    'class' | 'classList' | 'style' | 'data-ui' | 'data-ui-state'
  >
  & {
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
    'error',
    'loading',
    'disabled',
    'class',
    'classList',
    'style',
    'data-ui',
    'data-ui-state'
  ])

  return <span {...others} data-ui='badge' data-ui-state={controlState(local)} />
}
