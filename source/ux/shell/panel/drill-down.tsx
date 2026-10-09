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

import {
  createEffect,
  createRoot,
  createSignal,
  getOwner,
  onCleanup,
  runWithOwner,
  Show
} from '@solid-js'
import { UiActionButton, UiButton, UiDialog, UiFormActions, UiLayout } from '@ux/ui'
import type { UiActionButtonProps, UiComponent } from '@ux/ui'
import type { DrillContract, DrillPanelContext, DrillReturnControl } from './drill-contract.ts'
import type { PanelStepContext } from './panel-sequence-contract.ts'

import './drill-down.css'

/** Props for the drill-down host and its optional workbench services. */
export type DrillDownProps = {
  rootTitle: string
  root: (drill: DrillContract) => UiComponent
  context?: PanelStepContext
  onReturnControl?: (control: DrillReturnControl | null) => void
}

/** Direction of the current drill panel transition. */
type DrillDirection = 'descend' | 'ascend'

/** Retained panel state with a distinct close lifetime. */
type DrillFrame = {
  title: string
  path: readonly string[]
  panel: UiComponent
  parent?: DrillFrame
  dispose: () => void
  dirty: Set<() => boolean>
  save: () => (() => UiActionButtonProps | undefined) | null
}

/** Renders retained nested drafts with active Save and contextual discard protection. */
export const DrillDown = (props: DrillDownProps): UiComponent => {
  const owner = getOwner()
  if (!owner) throw new Error('DrillDown requires a Solid owner.')
  let hostRef: HTMLElement | undefined
  const [direction, setDirection] = createSignal<DrillDirection | null>(null)
  const [pendingDiscard, setPendingDiscard] = createSignal<DrillFrame | null>(null)
  const rootFrame: DrillFrame = {
    title: props.rootTitle,
    path: [],
    panel: null,
    dispose: () => undefined,
    dirty: new Set(),
    save: () => null
  }
  const [frame, setFrame] = createSignal(rootFrame)
  const returnToParent = (current: DrillFrame): void => {
    if (frame() !== current || !current.parent) return
    setPendingDiscard(null)
    setDirection('ascend')
    setFrame(current.parent)
    current.dispose()
    requestAnimationFrame(() => hostRef?.scrollIntoView({ block: 'nearest' }))
  }
  const requestReturn = (): void => {
    const current = frame()
    if ([...current.dirty].some(check => check())) setPendingDiscard(current)
    else returnToParent(current)
  }
  const open = (
    panel: (context: DrillPanelContext) => UiComponent,
    title: string,
    pathSegment = title
  ): void => {
    const parent = frame()
    runWithOwner(owner, () =>
      createRoot(dispose => {
        const [isOpen, setOpen] = createSignal(true)
        onCleanup(() => setOpen(false))
        const [save, setSave] = createSignal<(() => UiActionButtonProps | undefined) | null>(null)
        const current: DrillFrame = {
          title,
          path: [...parent.path, pathSegment],
          panel: null,
          parent,
          dispose,
          dirty: new Set(),
          save
        }
        const context: DrillPanelContext = {
          isActive: () => isOpen() && frame() === current,
          registerDirty: check => {
            current.dirty.add(check)
            const unregister = props.context?.registerDirty(check)
            const cleanup = (): void => {
              current.dirty.delete(check)
              unregister?.()
            }
            onCleanup(cleanup)
            return cleanup
          },
          registerSave: action => {
            setSave(() => action)
            const cleanup = (): void => {
              setSave(active => active === action ? null : active)
            }
            onCleanup(cleanup)
            return cleanup
          },
          returnToParent: () => {
            if (isOpen()) returnToParent(current)
          }
        }
        current.panel = panel(context)
        setDirection('descend')
        setFrame(current)
      }))
  }
  const drill: DrillContract = { open }
  rootFrame.panel = props.root(drill)

  createEffect(() => {
    const current = frame()
    const control: DrillReturnControl | null = current.parent
      ? {
        path: () => frame().path,
        returnTitle: () => frame().parent?.title ?? props.rootTitle,
        returnToIndex: requestReturn
      }
      : null
    props.context?.registerDrillReturn(control)
    props.onReturnControl?.(control)
    props.context?.registerTrailingAction(current.save())
  })
  onCleanup(() => {
    let current = frame()
    while (current.parent) {
      current.dispose()
      current = current.parent
    }
    props.context?.registerDrillReturn(null)
    props.context?.registerTrailingAction(null)
    props.onReturnControl?.(null)
  })

  return (
    <section ref={hostRef} data-shell='drill-down' data-shell-direction={direction() ?? undefined}>
      <Show when={!props.context && !props.onReturnControl && frame().parent !== undefined}>
        <div data-shell='drill-down-return'>
          <UiActionButton
            icon='corner-top-left'
            label={frame().parent?.title ?? props.rootTitle}
            labelMode='visible'
            align='start'
            density='dense'
            onClick={requestReturn}
          />
        </div>
      </Show>
      <Show when={frame()} keyed>
        {current => <div data-shell='drill-down-panel'>{current.panel}</div>}
      </Show>
      <Show when={pendingDiscard()}>
        {target => (
          <UiDialog
            open
            size='content'
            onOpenChange={open => {
              if (!open) setPendingDiscard(null)
            }}
          >
            <UiLayout>
              <h2>Discard unsaved changes?</h2>
              <p>Changes to this item will be discarded.</p>
              <UiFormActions>
                <UiButton variant='ghost' onClick={() => setPendingDiscard(null)}>Cancel</UiButton>
                <UiButton variant='danger' onClick={() => returnToParent(target())}>Discard</UiButton>
              </UiFormActions>
            </UiLayout>
          </UiDialog>
        )}
      </Show>
    </section>
  )
}
