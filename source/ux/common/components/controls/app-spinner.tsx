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
import { type AppComponent, type AppComponentProps, controlState } from './controls-helpers.ts'

/** Spinner control props. */
export type AppSpinnerProps =
  & AppComponentProps
  & Omit<
    JSX.HTMLAttributes<HTMLDivElement>,
    'children' | 'class' | 'classList' | 'style' | 'data-ui' | 'data-ui-state'
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
export const AppSpinner = (props: AppSpinnerProps): AppComponent => {
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
