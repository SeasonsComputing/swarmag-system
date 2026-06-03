/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Ui progress control                                                         ║
║ Semantic wrapper for the Kobalte Progress primitive.                         ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Emits progress control semantics without styling concerns.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
UiProgress  Progress control with declared states.
*/

import { Progress } from '@kobalte/core/progress'
import { splitProps } from '@solid-js'
import { controlState, type UiComponent, type UiComponentProps } from './ui-helpers.ts'

/** Progress control props. */
export type UiProgressProps = UiComponentProps & {
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

const ProgressTrack = Progress.Track as unknown as typeof Progress.Track
const ProgressFill = Progress.Fill as unknown as typeof Progress.Fill

/** Progress control with declared states. */
export const UiProgress = (props: UiProgressProps): UiComponent => {
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
