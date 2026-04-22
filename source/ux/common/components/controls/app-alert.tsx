/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ App alert control                                                            ║
║ Semantic alert primitive.                                                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Emits alert control semantics without styling concerns.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AppAlert  Alert control with declared states.
*/

import { type JSX, splitProps } from '@solid-js'
import { controlState } from './controls-helpers.ts'

/** Alert variants declared by the design language. */
export type AppAlertVariant = 'success' | 'warning' | 'danger' | 'info'

/** Alert control props. */
export type AppAlertProps =
  & Omit<
    JSX.HTMLAttributes<HTMLDivElement>,
    'class' | 'classList' | 'style' | 'data-ui' | 'data-ui-state'
  >
  & {
    variant?: AppAlertVariant
    error?: boolean
    loading?: boolean
    disabled?: boolean
    class?: never
    classList?: never
    style?: never
    'data-ui'?: never
    'data-ui-state'?: never
  }

/** Alert control with declared states. */
export const AppAlert = (props: AppAlertProps): JSX.Element => {
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
    <div
      {...others}
      role='alert'
      data-ui='alert'
      data-ui-variant={local.variant}
      data-ui-state={controlState(local)}
    />
  )
}
