/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Ui skeleton control                                                          ║
║ Semantic skeleton primitive.                                                 ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Emits skeleton control semantics without styling concerns.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
UiSkeleton  Skeleton control with declared states.
*/

import { type JSX, splitProps } from '@solid-js'
import { controlState, type UiComponent, type UiComponentProps } from './ui-helpers.ts'

/** Skeleton control props. */
export type UiSkeletonProps =
  & UiComponentProps
  & Omit<
    JSX.HTMLAttributes<HTMLDivElement>,
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

/** Skeleton control with declared states. */
export const UiSkeleton = (props: UiSkeletonProps): UiComponent => {
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
  return <div {...others} data-ui='skeleton' data-ui-state={controlState(local)} />
}
