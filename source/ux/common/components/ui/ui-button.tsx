/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Ui button control                                                           ║
║ Semantic wrapper for the Kobalte Button primitive.                           ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Emits button control semantics without styling concerns.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
UiButton  Button control with declared variants and states.
*/

import { Button } from '@kobalte/core/button'
import { type JSX, splitProps } from '@solid-js'
import { controlState, type UiComponent, type UiComponentProps } from './ui-helpers.ts'

/** Button variants declared by the design language. */
export type UiButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

/** Button control props. */
export type UiButtonProps =
  & UiComponentProps
  & Omit<
    JSX.ButtonHTMLAttributes<HTMLButtonElement>,
    | 'children'
    | 'class'
    | 'classList'
    | 'style'
    | 'data-ui'
    | 'data-ui-variant'
    | 'data-ui-state'
  >
  & {
    variant?: UiButtonVariant
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
export const UiButton = (props: UiButtonProps): UiComponent => {
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
