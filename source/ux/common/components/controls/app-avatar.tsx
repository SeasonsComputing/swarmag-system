/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ App avatar control                                                           ║
║ Semantic avatar primitive.                                                   ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Emits avatar control semantics without styling concerns.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AppAvatar  Avatar control with declared states.
*/

import { type JSX, splitProps } from '@solid-js'
import { controlState } from './controls-helpers.ts'

/** Avatar control props. */
export type AppAvatarProps =
  & Omit<
    JSX.HTMLAttributes<HTMLSpanElement>,
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

/** Avatar control with declared states. */
export const AppAvatar = (props: AppAvatarProps): JSX.Element => {
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
