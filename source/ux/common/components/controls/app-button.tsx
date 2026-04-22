/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ App button control                                                           ║
║ Semantic wrapper for the Kobalte Button primitive.                           ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Emits button control semantics without styling concerns.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AppButton  Button control with declared variants and states.
*/

import { Button } from '@kobalte/core/button'
import { type JSX, splitProps } from '@solid-js'
import { controlState } from './controls-helpers.ts'

/** Button variants declared by the design language. */
export type AppButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

/** Button control props. */
export type AppButtonProps =
  & Omit<
    JSX.ButtonHTMLAttributes<HTMLButtonElement>,
    'class' | 'classList' | 'style' | 'data-ui' | 'data-ui-variant' | 'data-ui-state'
  >
  & {
    variant?: AppButtonVariant
    error?: boolean
    loading?: boolean
    class?: never
    classList?: never
    style?: never
    'data-ui'?: never
    'data-ui-variant'?: never
    'data-ui-state'?: never
  }

/** Button control with declared variants and states. */
export const AppButton = (props: AppButtonProps): JSX.Element => {
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
    <Button
      {...others}
      data-ui='button'
      data-ui-variant={local.variant}
      data-ui-state={controlState(local)}
      disabled={local.disabled || local.loading}
    />
  )
}
