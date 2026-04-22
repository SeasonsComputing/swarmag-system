/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ App icon button control                                                      ║
║ Semantic wrapper for the Kobalte Button primitive.                           ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Emits icon-button control semantics without styling concerns.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AppIconButton  Icon-only button control with declared states.
*/

import { Button } from '@kobalte/core/button'
import { type JSX, splitProps } from '@solid-js'
import { controlState } from './controls-helpers.ts'

/** Icon button control props. */
export type AppIconButtonProps =
  & Omit<
    JSX.ButtonHTMLAttributes<HTMLButtonElement>,
    'class' | 'classList' | 'style' | 'data-ui' | 'data-ui-state'
  >
  & {
    error?: boolean
    loading?: boolean
    class?: never
    classList?: never
    style?: never
    'data-ui'?: never
    'data-ui-state'?: never
  }

/** Icon-only button control with declared states. */
export const AppIconButton = (props: AppIconButtonProps): JSX.Element => {
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

  return (
    <Button
      {...others}
      data-ui='icon-button'
      data-ui-state={controlState(local)}
      disabled={local.disabled || local.loading}
    />
  )
}
