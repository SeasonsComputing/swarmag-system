/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ App toggle control                                                           ║
║ Semantic wrapper for the Kobalte ToggleButton primitive.                     ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Emits toggle control semantics without styling concerns.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AppToggle  Toggle control with declared states.
*/

import { ToggleButton } from '@kobalte/core/toggle-button'
import { type JSX, splitProps } from '@solid-js'
import { controlState } from './controls-helpers.ts'

/** Toggle control props. */
export type AppToggleProps =
  & Omit<
    JSX.ButtonHTMLAttributes<HTMLButtonElement>,
    'class' | 'classList' | 'style' | 'data-ui' | 'data-ui-state'
  >
  & {
    error?: boolean
    loading?: boolean
    pressed?: boolean
    defaultPressed?: boolean
    onChange?: (pressed: boolean) => void
    class?: never
    classList?: never
    style?: never
    'data-ui'?: never
    'data-ui-state'?: never
  }

/** Toggle control with declared states. */
export const AppToggle = (props: AppToggleProps): JSX.Element => {
  const [local, others] = splitProps(props, [
    'error',
    'loading',
    'disabled',
    'pressed',
    'defaultPressed',
    'onChange',
    'class',
    'classList',
    'style',
    'data-ui',
    'data-ui-state'
  ])

  return (
    <ToggleButton
      {...others}
      data-ui='toggle'
      data-ui-state={controlState(local)}
      disabled={local.disabled || local.loading}
      pressed={local.pressed}
      defaultPressed={local.defaultPressed}
      onChange={local.onChange}
    />
  )
}
