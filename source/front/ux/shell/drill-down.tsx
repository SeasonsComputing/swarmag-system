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
import { createEffect, createSignal, getOwner, onCleanup, runWithOwner, Show } from '@solid-js'
import type { DrillContract, DrillReturnControl } from './drill-contract.ts'

import './drill-down.css'

/** Props for the drill-down host. */
export type DrillDownProps = {
  rootTitle: string
  root: (drill: DrillContract) => UiComponent
  onReturnControl?: (control: DrillReturnControl | null) => void
}

/** Direction of the current drill panel transition. */
type DrillDirection = 'descend' | 'ascend'

/** Current panel and optional closure returning to the panel it replaced. */
type DrillFrame = {
  title: string
  path: readonly string[]
  panel: UiComponent
  returnTitle?: string
  returnTo?: () => void
}

/** Renders a one-panel drill-down host with host-owned return navigation. */
export const DrillDown = (props: DrillDownProps): UiComponent => {
  const owner = getOwner()
  let hostRef: HTMLElement | undefined
  // No direction until a real navigation happens — a fresh mount (landing on
  // this stage, not drilling within it) must not claim descend/ascend, or the
  // CSS plays an entry animation for a panel that was never drilled into.
  const [direction, setDirection] = createSignal<DrillDirection | null>(null)
  // getOwner() is non-null inside a component body, so the fallback is
  // unreachable. It still renders rather than throwing: losing disposal is a
  // better outcome for the user than an empty panel.
  const renderPanel = (panel: () => UiComponent): UiComponent =>
    owner ? runWithOwner(owner, panel) : panel()
  const open = (panel: () => UiComponent, title: string, pathSegment = title): void => {
    const parent = frame()
    setDirection('descend')
    setFrame({
      title,
      path: [...parent.path, pathSegment],
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
    path: [props.rootTitle],
    panel: props.root(drill)
  }
  const [frame, setFrame] = createSignal<DrillFrame>(rootFrame)
  const returnToIndex = (): void => {
    frame().returnTo?.()
    requestAnimationFrame(() => hostRef?.scrollIntoView({ block: 'nearest' }))
  }

  createEffect(() => {
    const current = frame()
    props.onReturnControl?.(
      current.returnTo
        ? {
          path: () => frame().path.slice(1),
          returnTitle: () => frame().returnTitle ?? props.rootTitle,
          returnToIndex
        }
        : null
    )
  })
  onCleanup(() => props.onReturnControl?.(null))

  return (
    <section ref={hostRef} data-shell='drill-down' data-shell-direction={direction() ?? undefined}>
      <Show when={!props.onReturnControl && frame().returnTo !== undefined}>
        <div data-shell='drill-down-return'>
          <UiActionButton
            icon='corner-top-left'
            label={frame().returnTitle ?? props.rootTitle}
            labelMode='visible'
            align='start'
            density='dense'
            onClick={returnToIndex}
          />
        </div>
      </Show>
      <Show when={frame()} keyed>
        {current => <div data-shell='drill-down-panel'>{current.panel}</div>}
      </Show>
    </section>
  )
}
