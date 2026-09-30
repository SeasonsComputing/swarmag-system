/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Panel sequence progress                                                      ║
║ Horizontal orientation for a complete sequence.                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Presents every step and the current position when there is more than one step.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
PanelSequenceProgress  Shared horizontal progress presentation.
*/

import { For, Show } from '@solid-js'
import { UiList, UiListItem } from '@ux/ui'
import type { UiComponent } from '@ux/ui'
import type { PanelSequenceControl } from './panel-sequence.tsx'
import './panel-sequence-progress.css'

/** Progress belongs to the complete sequence supplied by its composer. */
export const PanelSequenceProgress = (props: { sequence: PanelSequenceControl }): UiComponent => (
  <Show when={props.sequence.steps().length > 1}>
    <div data-shell='sequence-indicator'>
      <div aria-hidden='true' data-shell='sequence-bar'>
        <div
          data-shell='sequence-bar-fill'
          style={{
            'inline-size': `${
              ((props.sequence.index() + 0.5) / props.sequence.steps().length * 100).toFixed(3)
            }%`
          }}
        />
      </div>
      <UiList data-shell='sequence-steps'>
        <For each={props.sequence.steps()}>
          {(step, index) => (
            <UiListItem
              data-shell='sequence-step'
              data-shell-state={index() < props.sequence.index()
                ? 'done'
                : index() === props.sequence.index()
                ? 'current'
                : 'upcoming'}
              aria-current={index() === props.sequence.index() ? 'step' : undefined}
            >
              <span data-shell='sequence-step-label'>
                <span data-shell='sequence-step-ordinal'>{index() + 1}</span>
                <span data-shell='sequence-step-title'>{step.title}</span>
              </span>
            </UiListItem>
          )}
        </For>
      </UiList>
    </div>
  </Show>
)
