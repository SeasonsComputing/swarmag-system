/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Drill-down host                                                              ║
║ Shared shell surface for one-panel-at-a-time nested navigation.              ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Hosts a root panel and lets descendants replace it with a child panel while the
host owns the return control and directional transition.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
DrillDownProps  Props for the drill-down host.
DrillDown       Render the drill-down host surface.
*/

import { UiActionButton, type UiComponent } from '@front/ux/ui'
import { createSignal, getOwner, runWithOwner, Show } from '@solid-js'
import type { DrillContract } from './drill-contract.ts'

import './drill-down.css'

/** Props for the drill-down host. */
export type DrillDownProps = {
  rootTitle: string
  root: (drill: DrillContract) => UiComponent
}

/** Direction of the current drill panel transition. */
type DrillDirection = 'descend' | 'ascend'

/** Current panel and optional closure returning to the panel it replaced. */
type DrillFrame = {
  title: string
  panel: UiComponent
  returnTitle?: string
  returnTo?: () => void
}

/** Renders a one-panel drill-down host with host-owned return navigation. */
export const DrillDown = (props: DrillDownProps): UiComponent => {
  const owner = getOwner()
  const [direction, setDirection] = createSignal<DrillDirection>('descend')
  // getOwner() is non-null inside a component body, so the fallback is
  // unreachable. It still renders rather than throwing: losing disposal is a
  // better outcome for the user than an empty panel.
  const renderPanel = (panel: () => UiComponent): UiComponent =>
    owner ? runWithOwner(owner, panel) : panel()
  const open = (panel: () => UiComponent, title: string): void => {
    const parent = frame()
    setDirection('descend')
    setFrame({
      title,
      panel: renderPanel(panel),
      returnTitle: parent.title,
      returnTo: () => {
        setDirection('ascend')
        setFrame(parent)
      }
    })
  }
  const drill: DrillContract = { open }
  const rootFrame: DrillFrame = {
    title: props.rootTitle,
    panel: props.root(drill)
  }
  const [frame, setFrame] = createSignal<DrillFrame>(rootFrame)

  return (
    <section data-shell='drill-down' data-shell-direction={direction()}>
      <Show when={frame().returnTo !== undefined}>
        <div data-shell='drill-down-return'>
          <UiActionButton
            icon='corner-top-left'
            label={frame().returnTitle ?? props.rootTitle}
            labelMode='visible'
            align='start'
            onClick={() => frame().returnTo?.()}
          />
        </div>
      </Show>
      <Show when={frame()} keyed>
        {current => <div data-shell='drill-down-panel'>{current.panel}</div>}
      </Show>
    </section>
  )
}
