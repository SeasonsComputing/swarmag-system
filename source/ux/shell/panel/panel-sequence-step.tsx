/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Panel sequence step                                                          ║
║ Current-step rendering and directional motion.                               ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Remounts step content on traversal; state lifetime belongs to the host.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
PanelSequenceStep  Render the current step.
*/

import { Show } from '@solid-js'
import type { UiComponent } from '@ux/ui'
import type { PanelStepContext } from './panel-sequence-contract.ts'
import type { PanelSequenceControl } from './panel-sequence.tsx'
import './panel-sequence-step.css'

/** Render one step, with motion derived from cursor travel. */
export const PanelSequenceStep = (props: {
  sequence: PanelSequenceControl
  context: PanelStepContext
}): UiComponent => {
  let previous = props.sequence.index()
  return (
    <Show when={props.sequence.current()} keyed>
      {step => {
        const index = props.sequence.index()
        const direction = index < previous ? 'backward' : 'forward'
        previous = index
        return (
          <div
            data-shell='sequence-panel'
            data-shell-direction={direction}
            data-shell-step={step.name}
            inert={props.context.busy()}
          >
            {step.render(props.context)}
          </div>
        )
      }}
    </Show>
  )
}
