/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Ui toggle control                                                            ║
║ Semantic wrapper for the Kobalte ToggleButton primitive.                     ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Emits toggle control semantics without styling concerns.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
UiToggle  Toggle control with declared states.
*/

import { ToggleButton } from '@kobalte/core/toggle-button'
import { type JSX, splitProps } from '@solid-js'
import { controlState, type UiComponent, type UiComponentProps } from './ui-helpers.ts'

/** Toggle control props. */
export type UiToggleProps =
  & UiComponentProps
  & Omit<
    JSX.ButtonHTMLAttributes<HTMLButtonElement>,
    | 'children'
    | 'class'
    | 'classList'
    | 'style'
    | 'data-ui'
    | 'data-ui-state'
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
export const UiToggle = (props: UiToggleProps): UiComponent => {
  let toggleElement!: HTMLButtonElement
  const [local, others] = splitProps(props, [
    'error',
    'loading',
    'disabled',
    'pressed',
    'defaultPressed',
    'onChange',
    'onClick'
  ])
  return (
    <ToggleButton
      {...others}
      ref={toggleElement}
      data-ui='toggle'
      data-ui-state={controlState(local)}
      disabled={local.disabled || local.loading}
      pressed={local.pressed}
      defaultPressed={local.defaultPressed}
      onChange={local.onChange}
      onClick={event => {
        toggleElement.focus()
        if (typeof local.onClick === 'function') local.onClick(event)
      }}
    />
  )
}
