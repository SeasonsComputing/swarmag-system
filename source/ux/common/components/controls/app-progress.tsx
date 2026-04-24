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

import { Progress } from '@kobalte/core/progress'
import { type JSX, splitProps } from '@solid-js'
import { controlState } from './controls-helpers.ts'

/** Progress control props. */
export type AppProgressProps = {
  children?: JSX.Element
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

type AppProgressTrackProps = {
  children?: JSX.Element
  'data-ui': 'progress-track'
}

type AppProgressFillProps = {
  'data-ui': 'progress-fill'
}

const ProgressTrack = Progress.Track as unknown as (
  props: AppProgressTrackProps
) => JSX.Element
const ProgressFill = Progress.Fill as unknown as (props: AppProgressFillProps) => JSX.Element

/** Progress control with declared states. */
export const AppProgress = (props: AppProgressProps): JSX.Element => {
  const [local] = splitProps(props, [
    'children',
    'value',
    'minValue',
    'maxValue',
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
    <Progress
      data-ui='progress'
      data-ui-state={controlState(local)}
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
