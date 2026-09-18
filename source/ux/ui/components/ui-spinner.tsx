/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Ui spinner control                                                           ║
║ Semantic spinner primitive.                                                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Emits spinner control semantics without styling concerns.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
UiSpinner  Spinner control with declared states.
*/

import { type JSX, splitProps } from '@solid-js'
import { controlState, type UiComponent, type UiComponentProps } from './ui-helpers.ts'

/** Spinner control props. */
export type UiSpinnerProps =
  & UiComponentProps
  & Omit<
    JSX.HTMLAttributes<HTMLDivElement>,
    | 'children'
    | 'class'
    | 'classList'
    | 'style'
    | 'role'
    | 'data-ui'
    | 'data-ui-state'
  >
  & {
    error?: boolean
    loading?: boolean
    disabled?: boolean
    class?: never
    classList?: never
    style?: never
    role?: never
    'data-ui'?: never
    'data-ui-state'?: never
  }

/** Spinner control with declared states. */
export const UiSpinner = (props: UiSpinnerProps): UiComponent => {
  const [local, others] = splitProps(props, [
    'error',
    'loading',
    'disabled',
    'class',
    'classList',
    'style',
    'role',
    'data-ui',
    'data-ui-state'
  ])
  return <div {...others} role='status' data-ui='spinner' data-ui-state={controlState(local)} />
}
