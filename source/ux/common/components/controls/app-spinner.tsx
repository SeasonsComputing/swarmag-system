/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ App spinner control                                                          ║
║ Semantic spinner primitive.                                                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Emits spinner control semantics without styling concerns.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AppSpinner  Spinner control with declared states.
*/

import { type JSX, splitProps } from '@solid-js'
import { controlState } from './controls-helpers.ts'

/** Spinner control props. */
export type AppSpinnerProps =
  & Omit<
    JSX.HTMLAttributes<HTMLDivElement>,
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

/** Spinner control with declared states. */
export const AppSpinner = (props: AppSpinnerProps): JSX.Element => {
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

  return <div {...others} role='status' data-ui='spinner' data-ui-state={controlState(local)} />
}
