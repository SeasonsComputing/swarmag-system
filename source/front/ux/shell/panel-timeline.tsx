/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Panel timeline                                                               ║
║ Read-only stage index for a panel container's index role.                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Renders a compact, read-only timeline from ordered stage labels and their
workflow state.
*/

import { UiCard, type UiComponent, UiList, UiListItem } from '@front/ux/ui'
import { For } from '@solid-js'
import type { PanelHeaderProps } from './panel-contract.ts'
import { PanelHeader } from './panel-header.tsx'

import './panel-timeline.css'

type PanelTimelineState = 'done' | 'current' | 'upcoming'

type PanelTimelineItem = {
  state: PanelTimelineState
  title: string
}

type PanelTimelineProps = {
  header?: PanelHeaderProps
  items: PanelTimelineItem[]
}

/** Renders a card-backed, read-only timeline panel. */
export const PanelTimeline = (props: PanelTimelineProps): UiComponent => (
  <section data-feat-panel='timeline'>
    <UiCard elevation='raised'>
      {props.header && <PanelHeader {...props.header} />}
      <div data-feat-panel='body' data-feat-panel-kind='timeline'>
        <UiList data-feat-panel='timeline-list'>
          <For each={props.items}>
            {item => (
              <UiListItem data-feat-panel='timeline-item' data-feat-state={item.state}>
                <span aria-hidden='true' data-feat-panel='timeline-node' />
                <span data-feat-panel='timeline-title'>{item.title}</span>
              </UiListItem>
            )}
          </For>
        </UiList>
      </div>
    </UiCard>
  </section>
)
