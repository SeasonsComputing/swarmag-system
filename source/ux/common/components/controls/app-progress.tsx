/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ App progress control                                                         ║
║ Semantic wrapper for the Kobalte Progress primitive.                         ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Emits progress control semantics without styling concerns.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AppProgress  Progress control with declared states.
*/

import {
  Progress,
  type ProgressTrackProps,
  type ProgressFillProps
} from '@kobalte/core/progress'
import { type JSX, splitProps } from '@solid-js'
import { controlState, withDataUI } from './controls-helpers.ts'

/** Progress control props. */
export type AppProgressProps = {
  children?: JSX.Element
  label?: string
  value?: number
  minValue?: number
  maxValue?: number
  error?: boolean
  loading?: boolean
  disabled?: boolean
  class?: never
  classList?: never
  style?: never
  'data-ui'?: never
  'data-ui-state'?: never
}

const ProgressTrack = withDataUI<ProgressTrackProps>(Progress.Track)
const ProgressFill = withDataUI<ProgressFillProps>(Progress.Fill)

/** Progress control with declared states. */
export const AppProgress = (props: AppProgressProps): JSX.Element => {
  const [local] = splitProps(props, [
    'children',
    'label',
    'value',
    'minValue',
    'maxValue',
    'error',
    'loading',
    'disabled'
  ])

  return (
    <Progress
      data-ui='progress'
      data-ui-state={controlState(local)}
      aria-label={local.label}
      value={local.value}
      minValue={local.minValue}
      maxValue={local.maxValue}
    >
      <ProgressTrack data-ui='progress-track'>
        <ProgressFill data-ui='progress-fill' />
      </ProgressTrack>
      {local.children}
    </Progress>
  )
}
