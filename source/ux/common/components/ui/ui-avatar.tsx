/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Ui avatar control                                                           ║
║ Semantic avatar primitive.                                                   ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Emits avatar control semantics without styling concerns.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
UiAvatar  Avatar control with declared states.
*/

import { type JSX, splitProps } from '@solid-js'
import { controlState, type UiComponent, type UiComponentProps } from './ui-helpers.ts'

/** Avatar control props. */
export type UiAvatarProps =
  & UiComponentProps
  & Omit<
    JSX.HTMLAttributes<HTMLSpanElement>,
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
    disabled?: boolean
    class?: never
    classList?: never
    style?: never
    'data-ui'?: never
    'data-ui-state'?: never
  }

/** Avatar control with declared states. */
export const UiAvatar = (props: UiAvatarProps): UiComponent => {
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
  return <span {...others} data-ui='avatar' data-ui-state={controlState(local)} />
}
