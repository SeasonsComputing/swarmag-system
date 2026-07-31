/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Panel stepflow                                                               ║
║ Read-only stage index for a panel container's index role.                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Renders a compact, read-only stepflow from ordered stage labels and their
workflow state.
*/

import { UiCard, type UiComponent, UiList, UiListItem } from '@front/ux/ui'
import { For } from '@solid-js'
import type { PanelHeaderProps } from './panel-contract.ts'
import { PanelHeader } from './panel-header.tsx'

import './panel-stepflow.css'

type PanelStepflowState = 'done' | 'current' | 'upcoming'

type PanelStepflowItem = {
  state: PanelStepflowState
  title: string
}

type PanelStepflowProps = {
  header?: PanelHeaderProps
  items: PanelStepflowItem[]
}

/** Renders a card-backed, read-only stepflow panel. */
export const PanelStepflow = (props: PanelStepflowProps): UiComponent => (
  <section data-feat-panel='stepflow'>
    <UiCard elevation='raised'>
      {props.header && <PanelHeader {...props.header} />}
      <div data-feat-panel='body' data-feat-panel-kind='stepflow'>
        <UiList data-feat-panel='stepflow-list'>
          <For each={props.items}>
            {item => (
              <UiListItem data-feat-panel='stepflow-item' data-feat-state={item.state}>
                <span aria-hidden='true' data-feat-panel='stepflow-node' />
                <span data-feat-panel='stepflow-title'>{item.title}</span>
              </UiListItem>
            )}
          </For>
        </UiList>
      </div>
    </UiCard>
  </section>
)
