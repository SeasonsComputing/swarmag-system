/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ App skeleton control                                                         ║
║ Semantic skeleton primitive.                                                 ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Emits skeleton control semantics without styling concerns.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AppSkeleton  Skeleton control with declared states.
*/

import { type JSX, splitProps } from '@solid-js'
import { controlState } from './controls-helpers.ts'

/** Skeleton control props. */
export type AppSkeletonProps =
  & Omit<
    JSX.HTMLAttributes<HTMLDivElement>,
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

/** Skeleton control with declared states. */
export const AppSkeleton = (props: AppSkeletonProps): JSX.Element => {
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
