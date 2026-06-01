/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ App separator control                                                        ║
║ Semantic wrapper for the Kobalte Separator primitive.                        ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Emits separator control semantics without styling concerns.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AppSeparator  Separator control with declared states.
*/

import { Separator } from '@kobalte/core/separator'
import { type JSX, splitProps } from '@solid-js'
import { type AppComponent, type AppComponentProps, controlState } from './ui-helpers.ts'

/** Separator control props. */
export type AppSeparatorProps =
  & AppComponentProps
  & Omit<
    JSX.HTMLAttributes<HTMLElement>,
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

/** Separator control with declared states. */
export const AppSeparator = (props: AppSeparatorProps): AppComponent => {
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

  return <Separator {...others} data-ui='separator' data-ui-state={controlState(local)} />
}
